library device_status_sync;

import 'dart:async';

import 'package:battery_plus/battery_plus.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/services/surakshya_api_service.dart';

/// Keeps dashboard battery + band status in sync.
///
/// Band status is MQTT/IoT only for now:
/// Connected = wearable recently signaled the backend
/// Disconnected = IoT not running / no recent signal
class DeviceStatusSync {
  DeviceStatusSync(this._ref);

  final Ref _ref;
  final Battery _battery = Battery();
  StreamSubscription<BatteryState>? _batterySub;
  Timer? _batteryPoll;
  Timer? _bandPoll;
  bool _started = false;
  bool _bandPollInFlight = false;

  static const _bandPollInterval = Duration(seconds: 10);

  Future<void> start() async {
    if (_started) return;
    _started = true;

    await _refreshBattery();
    _batteryPoll = Timer.periodic(const Duration(minutes: 2), (_) {
      unawaited(_refreshBattery());
    });
    _batterySub = _battery.onBatteryStateChanged.listen((_) {
      unawaited(_refreshBattery());
    });

    unawaited(_refreshBandFromBackend());
    _bandPoll = Timer.periodic(_bandPollInterval, (_) {
      unawaited(_refreshBandFromBackend());
    });
  }

  Future<void> _refreshBandFromBackend() async {
    if (_bandPollInFlight) return;
    _bandPollInFlight = true;
    try {
      final status =
          await _ref.read(surakshyaApiServiceProvider).fetchMyDeviceStatus();
      final connected = status != null && status.linked && status.isOnline;
      _ref.read(dashboardProvider.notifier).setBandConnected(connected);
    } catch (_) {
      // On error, treat as disconnected so we don't stick on "Connected".
      _ref.read(dashboardProvider.notifier).setBandConnected(false);
    } finally {
      _bandPollInFlight = false;
    }
  }

  Future<void> _refreshBattery() async {
    try {
      final level = await _battery.batteryLevel;
      _ref.read(dashboardProvider.notifier).setBattery(level.clamp(0, 100));
    } catch (_) {
      // Keep last known level if platform battery is unavailable.
    }
  }

  void dispose() {
    _batterySub?.cancel();
    _batteryPoll?.cancel();
    _bandPoll?.cancel();
  }
}

final deviceStatusSyncProvider = Provider<DeviceStatusSync>((ref) {
  final sync = DeviceStatusSync(ref);
  ref.onDispose(sync.dispose);
  unawaited(sync.start());
  return sync;
});
