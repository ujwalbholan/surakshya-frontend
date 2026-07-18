library app_constants;

import 'dart:io' show Platform;

import 'package:flutter/foundation.dart' show kIsWeb;

class AppConstants {
  AppConstants._();

  static const double tabletBreakpoint = 768.0;
  static const double desktopBreakpoint = 1024.0;

  static const String amsBaseUrl = 'https://ams-omwj.onrender.com';

  /// Surakshya backend for auth + guardian linking.
  /// Override at build/run time: `--dart-define=SURAKSHYA_API_URL=http://192.168.x.x:3000`
  static String get surakshyaBaseUrl {
    const fromEnv = String.fromEnvironment('SURAKSHYA_API_URL');
    if (fromEnv.isNotEmpty) return fromEnv;
    if (kIsWeb) return 'http://localhost:3000';
    if (Platform.isAndroid) return 'http://10.0.2.2:3000';
    return 'http://localhost:3000';
  }

  static const String prefsAccessToken = 'surakshya_access_token';
  static const String prefsRefreshToken = 'surakshya_refresh_token';
  static const String prefsUserRole = 'surakshya_user_role';
  static const String prefsUserId = 'surakshya_user_id';
  static const String prefsOnboardingDone = 'onboarding_done';
  static const String prefsLoggedIn = 'logged_in';
  static const String prefsMarketingSeen = 'marketing_seen';
  static const String policeSosEndpoint = '/police/sos';
  static const String authRefreshEndpoint = '/auth/refresh';
  static const String authLogoutEndpoint = '/auth/logout';
  static const String authForgotPasswordEndpoint = '/auth/forgot-password';
  static const String authVerifyResetOtpEndpoint = '/auth/verify-reset-otp';
  static const String authResetPasswordEndpoint = '/auth/reset-password';

  /// Socket.IO tracking namespace on the Surakshya backend.
  static const String trackingNamespace = '/tracking';
  static const String socketEventSos = 'sos_event';
  static const String socketEventLocationUpdate = 'location_update';
  static const String socketSubscribeDevice = 'subscribe_device';
  static const String socketUnsubscribeDevice = 'unsubscribe_device';

  /// App-created SOS devices use IMEI `phone-{userId}` (backend resolveDeviceForUser).
  static const String phoneDeviceIdPrefix = 'phone-';

  /// After this many failed reconnect attempts, fall back to HTTP SOS polling.
  /// Chosen to match ~30s of backoff before accepting that the socket is down.
  static const int socketReconnectMaxAttempts = 5;
  static const int socketReconnectDelayMs = 1000;
  static const int socketReconnectDelayMaxMs = 10000;

  /// Legacy HTTP poll interval used only when the tracking socket is unavailable.
  static const Duration activeSosPollInterval = Duration(seconds: 4);

  /// When true, also fire AMS `sendSosToPoliceDashboard` as non-blocking dual-write.
  static const bool sosDualWriteToAmsEnabled = true;

  /// How often live location syncs to Surakshya while an SOS is active.
  static const int locationPushIntervalSeconds = 15;

  static const double mapDefaultZoom = 15.0;
  static const double mapDefaultLat = 27.7172;
  static const double mapDefaultLng = 85.3240;
  static const Duration liveLocationPollInterval = Duration(minutes: 1);
  static const Duration locationFetchTimeout = Duration(seconds: 15);
  static const double locationGeocodeMinDistanceMeters = 80;

  static const int sosCountdownSeconds = 5;
  static const double sosOvalWidth = 110;
  static const double sosOvalHeight = 145;
  static const double sosOvalRadius = 55;
  static const int sosOvalDotCount = 30;
  static const double sosOvalDotRadius = 3.0;
  static const double sosOvalPainterPad = 12.0;
  static const double sosOvalDotStartOffset = 0.62;
  static const int sosRadarRingCount = 5;
  static const double sosAvatarSize = 42;
  static const double sosOrbitRadiusX = 105;
  static const double sosOrbitRadiusY = 85;
  static const Duration bandDoubleTapWindow = Duration(milliseconds: 450);
  static const double sheetInitialSize = 0.38;
  static const double sheetMinSize = 0.22;
  static const double sheetMaxSize = 0.72;
}
