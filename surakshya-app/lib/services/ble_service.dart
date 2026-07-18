library ble_service;

import 'dart:async';

import 'package:flutter_blue_plus/flutter_blue_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/services/wristband_sos_service.dart';

class BleService {
  BluetoothDevice? _connectedDevice;
  final _connectionController = StreamController<bool>.broadcast();

  Stream<bool> get isScanning => FlutterBluePlus.isScanning;

  Stream<bool> get connectionState => _connectionController.stream;

  bool get isConnected => _connectedDevice?.isConnected ?? false;

  Future<void> startScan() async {
    if (await FlutterBluePlus.isSupported == false) return;
    await FlutterBluePlus.startScan(timeout: const Duration(seconds: 8));
  }

  Future<void> stopScan() => FlutterBluePlus.stopScan();

  Stream<List<BluetoothDevice>> get scanResults =>
      FlutterBluePlus.scanResults.map(
        (results) => results.map((r) => r.device).toList(),
      );

  Future<bool> connectToBand(BluetoothDevice device) async {
    await device.connect(timeout: const Duration(seconds: 12));
    _connectedDevice = device;
    _connectionController.add(device.isConnected);
    device.connectionState.listen((state) {
      final connected = state == BluetoothConnectionState.connected;
      if (!connected) {
        _connectedDevice = null;
      }
      _connectionController.add(connected);
    });
    return device.isConnected;
  }

  Future<void> disconnect() async {
    final device = _connectedDevice;
    if (device == null) return;
    await device.disconnect();
    _connectedDevice = null;
    _connectionController.add(false);
  }

  /// When BLE SOS characteristic reports a double-tap, forward to the app.
  void forwardBandDoubleTap(WristbandSosService sos) {
    sos.notifyBandDoubleTap();
  }

  void dispose() {
    _connectionController.close();
  }
}

final bleServiceProvider = Provider<BleService>((ref) {
  final service = BleService();
  ref.onDispose(service.dispose);
  return service;
});
