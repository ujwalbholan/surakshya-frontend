library token_storage;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:suraksha/core/constants/app_constants.dart';

class TokenStorage {
  TokenStorage({FlutterSecureStorage? storage})
      : _storage = storage ??
            const FlutterSecureStorage(
              aOptions: AndroidOptions(encryptedSharedPreferences: true),
            );

  final FlutterSecureStorage _storage;

  Future<String?> getAccessToken() =>
      _storage.read(key: AppConstants.prefsAccessToken);

  Future<String?> getRefreshToken() =>
      _storage.read(key: AppConstants.prefsRefreshToken);

  Future<void> saveTokens({
    required String accessToken,
    required String refreshToken,
  }) async {
    await _storage.write(
      key: AppConstants.prefsAccessToken,
      value: accessToken,
    );
    await _storage.write(
      key: AppConstants.prefsRefreshToken,
      value: refreshToken,
    );
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: AppConstants.prefsAccessToken);
    await _storage.delete(key: AppConstants.prefsRefreshToken);
  }
}

final tokenStorageProvider = Provider<TokenStorage>((ref) => TokenStorage());
