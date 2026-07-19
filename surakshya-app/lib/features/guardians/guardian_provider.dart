library guardian_provider;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/models/guardian_models.dart';
import 'package:suraksha/services/surakshya_api_service.dart';

class GuardianLinkingState {
  const GuardianLinkingState({
    this.guardians = const [],
    this.pendingRequests = const [],
    this.loading = false,
    this.error,
  });

  final List<LinkedGuardian> guardians;
  final List<ChildPendingRequest> pendingRequests;
  final bool loading;
  final String? error;

  GuardianLinkingState copyWith({
    List<LinkedGuardian>? guardians,
    List<ChildPendingRequest>? pendingRequests,
    bool? loading,
    String? error,
    bool clearError = false,
  }) =>
      GuardianLinkingState(
        guardians: guardians ?? this.guardians,
        pendingRequests: pendingRequests ?? this.pendingRequests,
        loading: loading ?? this.loading,
        error: clearError ? null : (error ?? this.error),
      );
}

class GuardianLinkingNotifier extends StateNotifier<GuardianLinkingState> {
  GuardianLinkingNotifier(this._api) : super(const GuardianLinkingState());

  final SurakshyaApiService _api;

  Future<void> refresh() async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final results = await Future.wait([
        _api.fetchMyGuardians(),
        _api.fetchChildPendingRequests(),
      ]);
      state = GuardianLinkingState(
        guardians: results[0] as List<LinkedGuardian>,
        pendingRequests: results[1] as List<ChildPendingRequest>,
      );
    } on SurakshyaApiException catch (e) {
      state = state.copyWith(loading: false, error: e.message);
    } catch (_) {
      state = state.copyWith(
        loading: false,
        error: 'Could not load guardian data',
      );
    }
  }

  Future<String> inviteGuardian({
    required String fullName,
    required String email,
    required String phone,
  }) async {
    final message = await _api.inviteGuardian(
      fullName: fullName,
      email: email,
      phone: phone,
    );
    await refresh();
    return message;
  }

  Future<String> acceptRequest(String requestId) async {
    final previous = state.pendingRequests;
    state = state.copyWith(
      pendingRequests:
          previous.where((r) => r.id != requestId).toList(growable: false),
      clearError: true,
    );
    try {
      final message = await _api.acceptChildRequest(requestId);
      await refresh();
      return message;
    } catch (e) {
      state = state.copyWith(pendingRequests: previous);
      rethrow;
    }
  }

  Future<String> rejectRequest(String requestId) async {
    final previous = state.pendingRequests;
    state = state.copyWith(
      pendingRequests:
          previous.where((r) => r.id != requestId).toList(growable: false),
      clearError: true,
    );
    try {
      final message = await _api.rejectChildRequest(requestId);
      return message;
    } catch (e) {
      state = state.copyWith(pendingRequests: previous);
      rethrow;
    }
  }

  Future<String> setEmergencyContact({
    required String guardianId,
    required bool isEmergencyContact,
  }) async {
    final message = await _api.setGuardianEmergencyContact(
      guardianId: guardianId,
      isEmergencyContact: isEmergencyContact,
    );
    // Optimistic local update so the star flips immediately.
    state = state.copyWith(
      guardians: state.guardians
          .map(
            (g) => g.copyWith(
              isEmergencyContact:
                  g.id == guardianId ? isEmergencyContact : null,
            ),
          )
          .toList(growable: false),
      clearError: true,
    );
    await refresh();
    return message;
  }

  Future<String> updateGuardianPhone({
    required String guardianId,
    required String phone,
  }) async {
    final message = await _api.updateGuardianPhone(
      guardianId: guardianId,
      phone: phone,
    );
    final normalized = phone.trim();
    state = state.copyWith(
      guardians: state.guardians
          .map(
            (g) => g.id == guardianId ? g.copyWith(phone: normalized) : g,
          )
          .toList(growable: false),
      clearError: true,
    );
    await refresh();
    return message;
  }
}

final guardianLinkingProvider =
    StateNotifierProvider<GuardianLinkingNotifier, GuardianLinkingState>(
  (ref) => GuardianLinkingNotifier(ref.read(surakshyaApiServiceProvider)),
);
