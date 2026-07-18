library ams_api_service;

import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/models/contact_model.dart';
import 'package:suraksha/models/location_model.dart';
import 'package:suraksha/models/user_model.dart';

class AmsApiService {
  AmsApiService({http.Client? client}) : _client = client ?? http.Client();

  final http.Client _client;

  /// Dispatches SOS to the police dashboard with live location and family roster.
  Future<void> sendSosToPoliceDashboard({
    required UserModel user,
    required LocationModel location,
    required List<ContactModel> familyMembers,
    String source = 'wristband_double_tap',
  }) async {
    final body = {
      'user': user.toMap(),
      'location': {
        'latitude': location.latitude,
        'longitude': location.longitude,
        'label': location.label,
      },
      'familyMembers': familyMembers
          .where((c) => c.id != 'me')
          .map(
            (c) => {
              'name': c.name,
              'role': c.role,
              'phone': c.phone,
            },
          )
          .toList(),
      'timestamp': DateTime.now().toIso8601String(),
      'source': source,
    };

    try {
      await _client.post(
        Uri.parse('${AppConstants.amsBaseUrl}${AppConstants.policeSosEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(body),
      );
    } catch (_) {
      // Demo: also post to legacy endpoint so dispatch is not silent.
      await _client.post(
        Uri.parse('${AppConstants.amsBaseUrl}/sos/alert'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'latitude': location.latitude,
          'longitude': location.longitude,
          'userId': user.email,
          'timestamp': body['timestamp'],
          'familyMembers': body['familyMembers'],
        }),
      );
    }
  }

  void dispose() => _client.close();
}

class AmsApiException implements Exception {
  AmsApiException(this.message);
  final String message;
  @override
  String toString() => message;
}

final amsApiServiceProvider = Provider<AmsApiService>((ref) {
  final service = AmsApiService();
  ref.onDispose(service.dispose);
  return service;
});
