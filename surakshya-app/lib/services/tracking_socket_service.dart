library tracking_socket_service;

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:socket_io_client/socket_io_client.dart' as io;
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/services/token_storage.dart';
import 'package:shared_preferences/shared_preferences.dart';

typedef SosSocketHandler = void Function(Map<String, dynamic> payload);

/// Single connection manager for the Surakshya `/tracking` Socket.IO gateway.
///
/// Widgets must not call connect/disconnect directly — go through this service.
class TrackingSocketService {
  TrackingSocketService({
    required TokenStorage tokenStorage,
    required SurakshyaApiService api,
  })  : _tokenStorage = tokenStorage,
        _api = api;

  final TokenStorage _tokenStorage;
  final SurakshyaApiService _api;

  io.Socket? _socket;
  final Set<String> _subscribedDeviceIds = {};
  final List<SosSocketHandler> _sosHandlers = [];

  bool _started = false;
  bool _fallbackActive = false;
  int _failedAttempts = 0;

  /// Fired once when reconnect attempts are exhausted — callers should
  /// enable HTTP polling. Cleared automatically if the socket later connects.
  final StreamController<void> _fallbackController =
      StreamController<void>.broadcast();
  final StreamController<void> _connectedController =
      StreamController<void>.broadcast();

  Stream<void> get onFallbackToPolling => _fallbackController.stream;
  Stream<void> get onConnected => _connectedController.stream;

  bool get isConnected => _socket?.connected == true;
  bool get isFallbackActive => _fallbackActive;

  Future<void> start() async {
    if (_started) return;
    _started = true;
    await _connect();
  }

  void stop() {
    _started = false;
    _fallbackActive = false;
    _failedAttempts = 0;
    _tearDownSocket();
  }

  void addSosHandler(SosSocketHandler handler) {
    _sosHandlers.add(handler);
  }

  void removeSosHandler(SosSocketHandler handler) {
    _sosHandlers.remove(handler);
  }

  Future<void> _connect() async {
    final token = await _tokenStorage.getAccessToken();
    if (token == null || token.isEmpty) {
      _triggerFallback();
      return;
    }

    _tearDownSocket();

    final url =
        '${AppConstants.surakshyaBaseUrl}${AppConstants.trackingNamespace}';
    final socket = io.io(
      url,
      io.OptionBuilder()
          .setTransports(['websocket', 'polling'])
          .setAuth({'token': token})
          .enableReconnection()
          .setReconnectionAttempts(AppConstants.socketReconnectMaxAttempts)
          .setReconnectionDelay(AppConstants.socketReconnectDelayMs)
          .setReconnectionDelayMax(AppConstants.socketReconnectDelayMaxMs)
          .disableAutoConnect()
          .build(),
    );
    _socket = socket;

    socket.onConnect((_) {
      _failedAttempts = 0;
      if (_fallbackActive) {
        _fallbackActive = false;
      }
      unawaited(_subscribeDevices());
      if (!_connectedController.isClosed) {
        _connectedController.add(null);
      }
    });

    socket.on(AppConstants.socketEventSos, (data) {
      final payload = _asMap(data);
      if (payload == null) return;
      for (final handler in List<SosSocketHandler>.from(_sosHandlers)) {
        handler(payload);
      }
    });

    socket.onDisconnect((_) {
      // Built-in reconnection handles backoff; see onReconnectFailed.
    });

    socket.onReconnectFailed((_) {
      _triggerFallback();
    });

    socket.onConnectError((_) {
      _failedAttempts += 1;
      if (_failedAttempts >= AppConstants.socketReconnectMaxAttempts) {
        _triggerFallback();
      }
    });

    socket.connect();
  }

  Future<void> _subscribeDevices() async {
    final socket = _socket;
    if (socket == null || !socket.connected) return;

    final deviceIds = <String>{};

    final prefs = await SharedPreferences.getInstance();
    final userId = prefs.getString(AppConstants.prefsUserId);
    if (userId != null && userId.isNotEmpty) {
      deviceIds.add('${AppConstants.phoneDeviceIdPrefix}$userId');
    }

    try {
      final status = await _api.fetchMyDeviceStatus();
      final imei = status?.imei;
      if (imei != null && imei.isNotEmpty) {
        deviceIds.add(imei);
      }
    } catch (_) {
      // Wearable may be unlinked; phone device subscription is enough for app SOS.
    }

    for (final deviceId in deviceIds) {
      if (_subscribedDeviceIds.contains(deviceId)) continue;
      socket.emit(AppConstants.socketSubscribeDevice, {'deviceId': deviceId});
      _subscribedDeviceIds.add(deviceId);
    }
  }

  void _triggerFallback() {
    if (_fallbackActive) return;
    _fallbackActive = true;
    if (!_fallbackController.isClosed) {
      _fallbackController.add(null);
    }
  }

  void _tearDownSocket() {
    final socket = _socket;
    _socket = null;
    _subscribedDeviceIds.clear();
    if (socket == null) return;
    socket.clearListeners();
    socket.dispose();
  }

  Map<String, dynamic>? _asMap(dynamic data) {
    if (data is Map<String, dynamic>) return data;
    if (data is Map) {
      return data.map((key, value) => MapEntry(key.toString(), value));
    }
    return null;
  }

  void dispose() {
    stop();
    _fallbackController.close();
    _connectedController.close();
  }
}

final trackingSocketServiceProvider = Provider<TrackingSocketService>((ref) {
  final service = TrackingSocketService(
    tokenStorage: ref.read(tokenStorageProvider),
    api: ref.read(surakshyaApiServiceProvider),
  );
  ref.onDispose(service.dispose);
  return service;
});
