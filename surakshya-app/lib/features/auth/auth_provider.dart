library auth_provider;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/models/user_model.dart';
import 'package:suraksha/models/guardian_activation_models.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/services/token_storage.dart';
import 'package:suraksha/theme/suraksha_animations.dart';

class AuthData {
  const AuthData({required this.isLoggedIn, this.user});

  final bool isLoggedIn;
  final UserModel? user;

  AuthData copyWith({bool? isLoggedIn, UserModel? user}) => AuthData(
        isLoggedIn: isLoggedIn ?? this.isLoggedIn,
        user: user ?? this.user,
      );
}

class AuthNotifier extends StateNotifier<AuthData> {
  AuthNotifier(this._api, this._tokens)
      : super(const AuthData(isLoggedIn: false)) {
    // Token refresh failure signs the user out through the existing
    // logout flow; app.dart routes to login on the state change.
    _api.onSessionExpired = logout;
  }

  final SurakshyaApiService _api;
  final TokenStorage _tokens;

  Future<void> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final loggedIn = prefs.getBool(AppConstants.prefsLoggedIn) ?? false;
    final token = await _tokens.getAccessToken();
    if (!loggedIn || token == null || token.isEmpty) return;

    final name = prefs.getString('user_name') ?? 'User';
    final email = prefs.getString('user_email') ?? '';
    final phone = prefs.getString('user_phone');
    final role = prefs.getString(AppConstants.prefsUserRole) ?? 'USER';
    final id = prefs.getString(AppConstants.prefsUserId);

    state = AuthData(
      isLoggedIn: true,
      user: UserModel(
        id: id,
        name: name,
        email: email,
        phone: phone,
        bloodType: prefs.getString('user_blood'),
        age: prefs.getInt('user_age'),
        // No photo upload exists yet; null keeps the initials fallback honest.
        avatarPath: prefs.getString('user_avatar_path'),
        role: role,
      ),
    );
  }

  Future<void> registerAccount({
    required String name,
    required String email,
    required String phone,
    required String password,
  }) async {
    await _api.register(
      fullName: name,
      email: email,
      phone: phone,
      password: password,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('pending_signup_email', email.trim());
    await prefs.setString('pending_signup_name', name.trim());
  }

  Future<GuardianLoginChallenge?> attemptLogin(
    String email,
    String password,
  ) async {
    await Future<void>.delayed(SurakshaAnimations.authLoad);
    final result = await _api.attemptLogin(email, password);
    if (result.isChallenge) {
      return result.challenge;
    }
    await _persistSession(result.session!);
    return null;
  }

  Future<void> login(String email, String password) async {
    final challenge = await attemptLogin(email, password);
    if (challenge != null) {
      throw SurakshyaApiException(
        challenge.message,
      );
    }
  }

  Future<void> _persistSession(AuthSession session) async {
    const mobileRoles = {'USER', 'GUARDIAN'};
    if (!mobileRoles.contains(session.user.role)) {
      await _api.clearSession();
      throw SurakshyaApiException(
        'This account requires the web portal. Sign in at the Suraksha website.',
      );
    }

    final user = session.user;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConstants.prefsLoggedIn, true);
    await prefs.setString('user_name', user.name);
    await prefs.setString('user_email', user.email);
    if (user.id != null) {
      await prefs.setString(AppConstants.prefsUserId, user.id!);
    }
    if (user.phone != null) await prefs.setString('user_phone', user.phone!);
    if (user.bloodType != null) {
      await prefs.setString('user_blood', user.bloodType!);
    }
    if (user.age != null) await prefs.setInt('user_age', user.age!);
    await prefs.setString(AppConstants.prefsUserRole, user.role);
    await prefs.setBool(AppConstants.prefsOnboardingDone, true);

    state = AuthData(isLoggedIn: true, user: user);
  }

  Future<void> updateMedicalProfile({
    required int age,
    required String bloodType,
  }) async {
    final updated = await _api.updateMedicalProfile(
      age: age,
      bloodType: bloodType,
    );
    final prefs = await SharedPreferences.getInstance();
    await prefs.setInt('user_age', age);
    await prefs.setString('user_blood', bloodType);
    state = state.copyWith(user: updated);
  }

  Future<void> logout() async {
    // Best-effort server invalidation first (needs the still-stored token);
    // local sign-out below completes even if the server call fails.
    await _api.serverLogout();
    await _api.clearSession();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConstants.prefsLoggedIn, false);
    state = const AuthData(isLoggedIn: false);
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthData>(
  (ref) => AuthNotifier(
    ref.read(surakshyaApiServiceProvider),
    ref.read(tokenStorageProvider),
  ),
);
