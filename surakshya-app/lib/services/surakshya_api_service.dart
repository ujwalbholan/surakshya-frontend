library surakshya_api_service;

import 'dart:async';
import 'dart:convert';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:http/http.dart' as http;
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/models/active_sos_summary.dart';
import 'package:suraksha/models/band_device_status.dart';
import 'package:suraksha/models/guardian_activation_models.dart';
import 'package:suraksha/models/guardian_models.dart';
import 'package:suraksha/models/parent_models.dart';
import 'package:suraksha/models/user_model.dart';
import 'package:suraksha/services/token_storage.dart';

export 'package:suraksha/models/active_sos_summary.dart';
export 'package:suraksha/models/band_device_status.dart';

class SurakshyaApiException implements Exception {
  SurakshyaApiException(this.message, {this.statusCode});
  final String message;
  final int? statusCode;

  @override
  String toString() => message;
}

const Duration kApiRequestTimeout = Duration(seconds: 15);

const String kApiNetworkErrorMessage =
    'Unable to reach the server. Check your connection and try again.';

const String kSessionExpiredMessage =
    'Your session has expired. Please sign in again.';

class AuthSession {
  const AuthSession({
    required this.user,
    required this.accessToken,
    required this.refreshToken,
  });

  final UserModel user;
  final String accessToken;
  final String refreshToken;

  String get role => user.role;
  String get email => user.email;
}

class LoginAttemptResult {
  const LoginAttemptResult._({this.session, this.challenge});

  final AuthSession? session;
  final GuardianLoginChallenge? challenge;

  bool get isChallenge => challenge != null;

  factory LoginAttemptResult.session(AuthSession session) =>
      LoginAttemptResult._(session: session);

  factory LoginAttemptResult.challenge(GuardianLoginChallenge challenge) =>
      LoginAttemptResult._(challenge: challenge);
}

class SurakshyaApiService {
  SurakshyaApiService({
    http.Client? client,
    TokenStorage? tokenStorage,
  })  : _client = client ?? http.Client(),
        _tokenStorage = tokenStorage ?? TokenStorage();

  final http.Client _client;
  final TokenStorage _tokenStorage;

  /// Set by the auth layer so an expired session reuses the existing
  /// logout flow instead of the service owning navigation.
  Future<void> Function()? onSessionExpired;

  Future<bool>? _refreshInFlight;

  String get _base => AppConstants.surakshyaBaseUrl;

  /// Maps timeouts / socket failures to [SurakshyaApiException] for UI handling.
  Future<T> _guardNetwork<T>(Future<T> Function() action) async {
    try {
      return await action().timeout(kApiRequestTimeout);
    } on SurakshyaApiException {
      rethrow;
    } on TimeoutException {
      throw SurakshyaApiException(kApiNetworkErrorMessage);
    } catch (_) {
      throw SurakshyaApiException(kApiNetworkErrorMessage);
    }
  }

  Future<LoginAttemptResult> attemptLogin(String email, String password) {
    return _guardNetwork(() async {
      final response = await _client.post(
        Uri.parse('$_base/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email.trim(), 'password': password}),
      );
      final data = _decode(response);
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw SurakshyaApiException(
          _errorMessage(response, data, fallback: 'Login failed'),
          statusCode: response.statusCode,
        );
      }

      final requiresPasswordChange = data['requiresPasswordChange'] == true;
      final requiresActivationOtp = data['requiresActivationOtp'] == true;
      if (requiresPasswordChange || requiresActivationOtp) {
        final challengeToken = data['challengeToken'] as String? ?? '';
        if (challengeToken.isEmpty) {
          throw SurakshyaApiException(
            'Guardian activation could not be started. Try again.',
          );
        }
        return LoginAttemptResult.challenge(
          GuardianLoginChallenge(
            email: email.trim(),
            challengeToken: challengeToken,
            message: data['message'] as String? ??
                'Complete guardian activation to continue.',
            requiresPasswordChange: requiresPasswordChange,
            requiresActivationOtp: requiresActivationOtp,
          ),
        );
      }

      final userJson = data['user'] as Map<String, dynamic>? ?? {};
      final accessToken = data['accessToken'] as String? ?? '';
      final refreshToken = data['refreshToken'] as String? ?? '';
      if (accessToken.isEmpty) {
        throw SurakshyaApiException('Login response missing access token');
      }
      await _tokenStorage.saveTokens(
        accessToken: accessToken,
        refreshToken: refreshToken,
      );
      final user = UserModel.fromSurakshyaJson(userJson);
      return LoginAttemptResult.session(
        AuthSession(
          user: user,
          accessToken: accessToken,
          refreshToken: refreshToken,
        ),
      );
    });
  }

  Future<AuthSession> login(String email, String password) async {
    final result = await attemptLogin(email, password);
    if (result.isChallenge) {
      throw SurakshyaApiException(
        result.challenge?.message ??
            'Complete guardian activation before signing in.',
      );
    }
    return result.session!;
  }

  Future<GuardianOtpVerifyResult> guardianActivationVerifyOtp({
    required String challengeToken,
    required String otp,
  }) async {
    final response = await _client.post(
      Uri.parse('$_base/guardian/activation/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'challengeToken': challengeToken,
        'otp': otp.trim(),
      }),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'OTP verification failed',
        statusCode: response.statusCode,
      );
    }
    return GuardianOtpVerifyResult(
      message: data['message'] as String? ?? 'OTP verified.',
      requiresPasswordChange: data['requiresPasswordChange'] == true,
    );
  }

  Future<String> guardianActivationSetPassword({
    required String challengeToken,
    required String newPassword,
  }) async {
    final response = await _client.post(
      Uri.parse('$_base/guardian/activation/set-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'challengeToken': challengeToken,
        'newPassword': newPassword,
      }),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Could not update password',
        statusCode: response.statusCode,
      );
    }
    return data['message'] as String? ??
        'Password updated. You can now sign in.';
  }

  Future<String> guardianActivationResendOtp(String challengeToken) async {
    final response = await _client.post(
      Uri.parse('$_base/guardian/activation/resend-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'challengeToken': challengeToken}),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Could not resend OTP',
        statusCode: response.statusCode,
      );
    }
    return data['message'] as String? ?? 'A new verification code was sent.';
  }

  Future<void> register({
    required String fullName,
    required String email,
    required String phone,
    required String password,
  }) {
    return _guardNetwork(() async {
      final response = await _client.post(
        Uri.parse('$_base/auth/register'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'full_name': fullName,
          'email': email.trim().toLowerCase(),
          'phone': phone.trim(),
          'password': password,
          'role': 'USER',
        }),
      );
      final data = _decode(response);
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw SurakshyaApiException(
          _errorMessage(response, data, fallback: 'Registration failed'),
          statusCode: response.statusCode,
        );
      }
    });
  }

  /// POST /auth/forgot-password — emails a 6-digit reset OTP (2-minute TTL).
  Future<String> forgotPassword(String email) {
    return _guardNetwork(() async {
      final response = await _client.post(
        Uri.parse('$_base${AppConstants.authForgotPasswordEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email.trim().toLowerCase()}),
      );
      final data = _decode(response);
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw SurakshyaApiException(
          _errorMessage(response, data, fallback: 'Failed to send reset code'),
          statusCode: response.statusCode,
        );
      }
      return data['message'] as String? ?? 'OTP sent successfully';
    });
  }

  /// POST /auth/verify-reset-otp — exchanges the OTP for a short-lived
  /// reset token (5-minute TTL) used by [resetPassword].
  Future<String> verifyResetOtp({
    required String email,
    required String otp,
  }) {
    return _guardNetwork(() async {
      final response = await _client.post(
        Uri.parse('$_base${AppConstants.authVerifyResetOtpEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email.trim().toLowerCase(),
          'otp': otp.trim(),
        }),
      );
      final data = _decode(response);
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw SurakshyaApiException(
          _errorMessage(response, data, fallback: 'OTP verification failed'),
          statusCode: response.statusCode,
        );
      }
      final resetToken = data['resetToken'] as String? ?? '';
      if (resetToken.isEmpty) {
        throw SurakshyaApiException(
          'Verification response missing reset token',
        );
      }
      return resetToken;
    });
  }

  /// POST /auth/reset-password — sets the new password with the reset token.
  Future<String> resetPassword({
    required String email,
    required String newPassword,
    required String comparePassword,
    required String resetToken,
  }) {
    return _guardNetwork(() async {
      final response = await _client.post(
        Uri.parse('$_base${AppConstants.authResetPasswordEndpoint}'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': email.trim().toLowerCase(),
          'newPassword': newPassword,
          'comparePassword': comparePassword,
          'resetToken': resetToken,
        }),
      );
      final data = _decode(response);
      if (response.statusCode != 200 && response.statusCode != 201) {
        throw SurakshyaApiException(
          _errorMessage(response, data, fallback: 'Failed to reset password'),
          statusCode: response.statusCode,
        );
      }
      return data['message'] as String? ?? 'Password reset successfully';
    });
  }

  Future<Map<String, String>> _authHeaders() async {
    final token = await _tokenStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      throw SurakshyaApiException('Not authenticated');
    }
    return {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': 'Bearer $token',
    };
  }

  /// Sends an authenticated request; on 401 refreshes tokens once and
  /// retries once. A rejected refresh (or a second 401) ends the session.
  Future<http.Response> _authorizedSend(
    Future<http.Response> Function(Map<String, String> headers) send,
  ) async {
    final headers = await _authHeaders();
    final response = await send(headers);
    if (response.statusCode != 401) return response;

    final refreshed = await _refreshTokens();
    if (!refreshed) {
      await _endSession();
      throw SurakshyaApiException(kSessionExpiredMessage, statusCode: 401);
    }
    final retryHeaders = await _authHeaders();
    final retryResponse = await send(retryHeaders);
    if (retryResponse.statusCode == 401) {
      await _endSession();
      throw SurakshyaApiException(kSessionExpiredMessage, statusCode: 401);
    }
    return retryResponse;
  }

  /// Updates the user's display name via `PATCH /user/me`.
  Future<UserModel> updateName(String fullName) {
    return _guardNetwork(() async {
      final response = await _authorizedSend(
        (headers) => _client.patch(
          Uri.parse('$_base/user/me'),
          headers: headers,
          body: jsonEncode({'full_name': fullName}),
        ),
      );
      final data = _decode(response);
      if (response.statusCode != 200) {
        throw SurakshyaApiException(
          _errorMessage(
            response,
            data,
            fallback: 'Could not update profile',
          ),
          statusCode: response.statusCode,
        );
      }
      return UserModel.fromSurakshyaJson(data);
    });
  }

  Future<UserModel> updateMedicalProfile({
    required int age,
    required String bloodType,
  }) {
    return _guardNetwork(() async {
      final response = await _authorizedSend(
        (headers) => _client.patch(
          Uri.parse('$_base/user/me'),
          headers: headers,
          body: jsonEncode({
            'age': age,
            'blood_type': bloodType,
          }),
        ),
      );
      final data = _decode(response);
      if (response.statusCode != 200) {
        throw SurakshyaApiException(
          _errorMessage(
            response,
            data,
            fallback: 'Could not update medical profile',
          ),
          statusCode: response.statusCode,
        );
      }
      return UserModel.fromSurakshyaJson(data);
    });
  }

  /// Single-flight token refresh. Returns false when the refresh token is
  /// missing or rejected (session is over). Network problems surface as
  /// [SurakshyaApiException] so a flaky connection never signs the user out.
  Future<bool> _refreshTokens() {
    return _refreshInFlight ??= _doRefreshTokens().whenComplete(() {
      _refreshInFlight = null;
    });
  }

  Future<bool> _doRefreshTokens() async {
    final refreshToken = await _tokenStorage.getRefreshToken();
    if (refreshToken == null || refreshToken.isEmpty) return false;

    final http.Response response;
    try {
      response = await _client
          .post(
            Uri.parse('$_base${AppConstants.authRefreshEndpoint}'),
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'refreshToken': refreshToken}),
          )
          .timeout(kApiRequestTimeout);
    } catch (_) {
      throw SurakshyaApiException(kApiNetworkErrorMessage);
    }

    // A 401 from the refresh call itself must not trigger another refresh.
    if (response.statusCode != 200 && response.statusCode != 201) {
      return false;
    }
    final data = _decode(response);
    final accessToken = data['accessToken'] as String? ?? '';
    final newRefreshToken = data['refreshToken'] as String? ?? '';
    if (accessToken.isEmpty) return false;
    await _tokenStorage.saveTokens(
      accessToken: accessToken,
      refreshToken: newRefreshToken.isEmpty ? refreshToken : newRefreshToken,
    );
    return true;
  }

  Future<void> _endSession() async {
    await _tokenStorage.clearTokens();
    final handler = onSessionExpired;
    if (handler != null) await handler();
  }

  Future<List<LinkedGuardian>> fetchMyGuardians({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _authorizedSend(
      (headers) => _client.get(
        Uri.parse('$_base/guardians?page=$page&limit=$limit'),
        headers: headers,
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to load guardians',
        statusCode: response.statusCode,
      );
    }
    final list = data['guardians'] as List<dynamic>? ?? [];
    return list
        .map((e) => LinkedGuardian.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<ChildPendingRequest>> fetchChildPendingRequests() async {
    final response = await _authorizedSend(
      (headers) => _client.get(
        Uri.parse('$_base/guardians/requests'),
        headers: headers,
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to load requests',
        statusCode: response.statusCode,
      );
    }
    final list = data['requests'] as List<dynamic>? ?? [];
    return list
        .map((e) => ChildPendingRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<String> inviteGuardian({
    required String fullName,
    required String email,
    required String phone,
  }) async {
    final response = await _authorizedSend(
      (headers) => _client.post(
        Uri.parse('$_base/guardians'),
        headers: headers,
        body: jsonEncode({
          'full_name': fullName,
          'email': email.trim().toLowerCase(),
          'phone': phone.trim(),
        }),
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to send invite',
        statusCode: response.statusCode,
      );
    }
    return data['message'] as String? ?? 'Guardian invite sent';
  }

  /// PATCH /guardians/:id/emergency-contact — designate one SOS emergency contact.
  Future<String> setGuardianEmergencyContact({
    required String guardianId,
    required bool isEmergencyContact,
  }) async {
    final response = await _authorizedSend(
      (headers) => _client.patch(
        Uri.parse('$_base/guardians/$guardianId/emergency-contact'),
        headers: headers,
        body: jsonEncode({'isEmergencyContact': isEmergencyContact}),
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to update emergency contact',
        statusCode: response.statusCode,
      );
    }
    return data['message'] as String? ?? 'Emergency contact updated';
  }

  /// PATCH /guardians/:id/phone — update a linked guardian's dial number.
  Future<String> updateGuardianPhone({
    required String guardianId,
    required String phone,
  }) async {
    final response = await _authorizedSend(
      (headers) => _client.patch(
        Uri.parse('$_base/guardians/$guardianId/phone'),
        headers: headers,
        body: jsonEncode({'phone': phone.trim()}),
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to update phone number',
        statusCode: response.statusCode,
      );
    }
    return data['message'] as String? ?? 'Guardian phone updated';
  }

  Future<String> acceptChildRequest(String requestId) async {
    final response = await _authorizedSend(
      (headers) => _client.post(
        Uri.parse('$_base/guardians/requests/$requestId/accept'),
        headers: headers,
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to accept request',
        statusCode: response.statusCode,
      );
    }
    return data['message'] as String? ?? 'Request accepted';
  }

  Future<String> rejectChildRequest(String requestId) async {
    final response = await _authorizedSend(
      (headers) => _client.post(
        Uri.parse('$_base/guardians/requests/$requestId/reject'),
        headers: headers,
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to reject request',
        statusCode: response.statusCode,
      );
    }
    return data['message'] as String? ?? 'Request rejected';
  }

  Future<List<LinkedWard>> fetchMyWards({
    int page = 1,
    int limit = 20,
  }) async {
    final response = await _authorizedSend(
      (headers) => _client.get(
        Uri.parse('$_base/guardian/me?page=$page&limit=$limit'),
        headers: headers,
      ),
    );
    if (response.statusCode == 404) {
      return [];
    }
    final data = _decode(response);
    if (response.statusCode != 200) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to load wards',
        statusCode: response.statusCode,
      );
    }
    final list = data['wards'] as List<dynamic>? ?? [];
    return list
        .map((e) => LinkedWard.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<List<GuardianPendingRequest>> fetchGuardianPendingRequests() async {
    final response = await _authorizedSend(
      (headers) => _client.get(
        Uri.parse('$_base/guardian/requests'),
        headers: headers,
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to load requests',
        statusCode: response.statusCode,
      );
    }
    final list = data['requests'] as List<dynamic>? ?? [];
    return list
        .map((e) => GuardianPendingRequest.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<String> acceptGuardianRequest(String requestId) async {
    final response = await _authorizedSend(
      (headers) => _client.post(
        Uri.parse('$_base/guardian/requests/$requestId/accept'),
        headers: headers,
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to accept request',
        statusCode: response.statusCode,
      );
    }
    return data['message'] as String? ?? 'Request accepted';
  }

  Future<String> rejectGuardianRequest(String requestId) async {
    final response = await _authorizedSend(
      (headers) => _client.post(
        Uri.parse('$_base/guardian/requests/$requestId/reject'),
        headers: headers,
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to reject request',
        statusCode: response.statusCode,
      );
    }
    return data['message'] as String? ?? 'Request rejected';
  }

  Future<String> inviteWard({required String childEmail}) async {
    final response = await _authorizedSend(
      (headers) => _client.post(
        Uri.parse('$_base/guardian/add-ward'),
        headers: headers,
        body: jsonEncode({'child_email': childEmail.trim().toLowerCase()}),
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to invite ward',
        statusCode: response.statusCode,
      );
    }
    return data['message'] as String? ??
        'Invitation sent. The child must accept before linking completes.';
  }

  /// Public guardian activation (no JWT) — mirrors web /guardian/setup.
  Future<void> guardianSendOtp(String email) async {
    final response = await _client.post(
      Uri.parse('$_base/guardian/send-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email.trim().toLowerCase()}),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to send OTP',
        statusCode: response.statusCode,
      );
    }
  }

  Future<void> guardianVerifyOtp({
    required String email,
    required String otp,
  }) async {
    final response = await _client.post(
      Uri.parse('$_base/guardian/verify-otp'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email.trim().toLowerCase(),
        'otp': otp.trim(),
      }),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'OTP verification failed',
        statusCode: response.statusCode,
      );
    }
  }

  Future<void> guardianSetPassword({
    required String email,
    required String oldPassword,
    required String newPassword,
  }) async {
    final response = await _client.post(
      Uri.parse('$_base/guardian/set-password'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'email': email.trim().toLowerCase(),
        'oldPassword': oldPassword,
        'newPassword': newPassword,
      }),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to set password',
        statusCode: response.statusCode,
      );
    }
  }

  Future<List<WardSosEvent>> fetchWardSos(String wardId) async {
    final response = await _authorizedSend(
      (headers) => _client.get(
        Uri.parse('$_base/guardian/wards/$wardId/sos'),
        headers: headers,
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to load SOS events',
        statusCode: response.statusCode,
      );
    }
    final list = data['data'] as List<dynamic>? ?? [];
    return list
        .map((e) => WardSosEvent.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  /// POST /sos — create citizen SOS (JWT). Returns created event id.
  Future<String> createSos({
    required double latitude,
    required double longitude,
    String? label,
    String source = 'wristband_double_tap',
    String? triggerNotes,
  }) async {
    final body = <String, dynamic>{
      'latitude': latitude,
      'longitude': longitude,
      'source': source,
      if (label != null && label.isNotEmpty) 'label': label,
      if (triggerNotes != null && triggerNotes.isNotEmpty)
        'triggerNotes': triggerNotes,
    };
    final response = await _authorizedSend(
      (headers) => _client.post(
        Uri.parse('$_base/sos'),
        headers: headers,
        body: jsonEncode(body),
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to create SOS',
        statusCode: response.statusCode,
      );
    }
    final id = data['id'] as String? ?? '';
    if (id.isEmpty) {
      throw SurakshyaApiException('SOS create response missing id');
    }
    return id;
  }

  /// GET /sos/active — active SOS for the signed-in citizen (band or app).
  Future<ActiveSosSummary?> fetchActiveSos() async {
    final response = await _authorizedSend(
      (headers) => _client.get(
        Uri.parse('$_base/sos/active'),
        headers: headers,
      ),
    );
    if (response.statusCode == 204 || response.body.trim().isEmpty) {
      return null;
    }
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to load active SOS',
        statusCode: response.statusCode,
      );
    }
    if (data.isEmpty || data['id'] == null) {
      return null;
    }
    return ActiveSosSummary.fromJson(data);
  }

  /// POST /sos/:id/cancel — resolve SOS and tell the wearable to stop.
  Future<void> cancelSos(String sosId) async {
    final response = await _authorizedSend(
      (headers) => _client.post(
        Uri.parse('$_base/sos/$sosId/cancel'),
        headers: headers,
        body: jsonEncode({}),
      ),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      final data = _decode(response);
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to cancel SOS',
        statusCode: response.statusCode,
      );
    }
  }

  /// POST /sos/:id/location — live GPS while SOS is active.
  Future<void> pushSosLocation({
    required String sosId,
    required double latitude,
    required double longitude,
  }) async {
    final response = await _authorizedSend(
      (headers) => _client.post(
        Uri.parse('$_base/sos/$sosId/location'),
        headers: headers,
        body: jsonEncode({
          'latitude': latitude,
          'longitude': longitude,
        }),
      ),
    );
    if (response.statusCode != 200 && response.statusCode != 201) {
      final data = _decode(response);
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to update SOS location',
        statusCode: response.statusCode,
      );
    }
  }

  /// GET /device/mine — linked wearable online status (MQTT / backend).
  Future<BandDeviceStatus?> fetchMyDeviceStatus() async {
    final response = await _authorizedSend(
      (headers) => _client.get(
        Uri.parse('$_base/device/mine'),
        headers: headers,
      ),
    );
    final data = _decode(response);
    if (response.statusCode != 200 && response.statusCode != 201) {
      throw SurakshyaApiException(
        _messageFrom(data) ?? 'Failed to load band status',
        statusCode: response.statusCode,
      );
    }
    if (data.isEmpty) return null;
    return BandDeviceStatus.fromJson(data);
  }

  /// POST /auth/logout — best-effort server session invalidation.
  ///
  /// Deliberately bypasses [_authorizedSend]: a 401 here must not trigger a
  /// token refresh or the session-expired callback (which calls logout and
  /// would recurse). Failures are swallowed so a dead network or an already
  /// expired token can never trap the user in a logged-in-looking state.
  Future<void> serverLogout() async {
    final token = await _tokenStorage.getAccessToken();
    if (token == null || token.isEmpty) return;
    try {
      await _client.post(
        Uri.parse('$_base${AppConstants.authLogoutEndpoint}'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      ).timeout(kApiRequestTimeout);
    } catch (_) {
      // Intentional: local logout proceeds regardless of the server result.
    }
  }

  Future<void> clearSession() => _tokenStorage.clearTokens();

  Map<String, dynamic> _decode(http.Response response) {
    if (response.body.isEmpty) return {};
    try {
      return jsonDecode(response.body) as Map<String, dynamic>;
    } catch (_) {
      return {};
    }
  }

  String? _messageFrom(Map<String, dynamic> data) {
    final message = data['message'];
    if (message is String && message.isNotEmpty) {
      return _humanizeServerMessage(message);
    }
    if (message is List && message.isNotEmpty) {
      return _humanizeServerMessage(message.first.toString());
    }
    return null;
  }

  String _errorMessage(
    http.Response response,
    Map<String, dynamic> data, {
    required String fallback,
  }) {
    if (response.statusCode == 429) {
      return 'Too many attempts. Please wait about a minute, then try again.';
    }
    return _messageFrom(data) ?? fallback;
  }

  String _humanizeServerMessage(String message) {
    if (message.contains('ThrottlerException') ||
        message.toLowerCase().contains('too many requests')) {
      return 'Too many attempts. Please wait about a minute, then try again.';
    }
    if (message == 'email must be an email') {
      return 'That email address looks invalid. Enter only the username (e.g. bikram1), not @gmail.com.';
    }
    return message;
  }

  void dispose() => _client.close();
}

final surakshyaApiServiceProvider = Provider<SurakshyaApiService>((ref) {
  final service = SurakshyaApiService(
    tokenStorage: ref.read(tokenStorageProvider),
  );
  ref.onDispose(service.dispose);
  return service;
});
