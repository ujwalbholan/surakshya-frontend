library wristband_sos_service;

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Receives SOS double-tap events from the Suraksha wristband (BLE).
/// Call [notifyBandDoubleTap] when the band reports a double-tap.
class WristbandSosService {
  final _doubleTapController = StreamController<void>.broadcast();

  Stream<void> get onBandDoubleTap => _doubleTapController.stream;

  void notifyBandDoubleTap() {
    if (!_doubleTapController.isClosed) {
      _doubleTapController.add(null);
    }
  }

  void dispose() {
    _doubleTapController.close();
  }
}

final wristbandSosServiceProvider = Provider<WristbandSosService>((ref) {
  final service = WristbandSosService();
  ref.onDispose(service.dispose);
  return service;
});
