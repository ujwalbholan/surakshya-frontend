library active_sos_sync;

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/services/surakshya_api_service.dart';

/// Polls GET /sos/active so band/MQTT SOS shows on the user SOS tab.
class ActiveSosSync {
  ActiveSosSync(this._ref);

  final Ref _ref;
  Timer? _timer;
  bool _started = false;
  bool _inFlight = false;

  static const _interval = Duration(seconds: 4);

  void start() {
    if (_started) return;
    _started = true;
    unawaited(refresh());
    _timer = Timer.periodic(_interval, (_) => unawaited(refresh()));
  }

  void stop() {
    _timer?.cancel();
    _timer = null;
    _started = false;
  }

  Future<void> refresh() async {
    if (_inFlight) return;
    _inFlight = true;
    try {
      final active = await _ref.read(surakshyaApiServiceProvider).fetchActiveSos();
      final dash = _ref.read(dashboardProvider);
      final notifier = _ref.read(dashboardProvider.notifier);

      if (active != null && active.isActive) {
        // Don't interrupt an in-progress countdown / local dispatch animation.
        if (dash.sosPhase == SosPhase.idle ||
            dash.sosPhase == SosPhase.resolved ||
            dash.sosPhase == SosPhase.active) {
          if (dash.sosPhase != SosPhase.active ||
              dash.activeSosId != active.id) {
            notifier.markSosActive(sosId: active.id);
          }
        } else if (dash.activeSosId == null) {
          notifier.setActiveSosId(active.id);
        }
        return;
      }

      // Server no longer has an active SOS — clear UI if we were mirroring it.
      if (dash.sosPhase == SosPhase.active) {
        notifier.resolveSos();
        Future<void>.delayed(const Duration(seconds: 4), () {
          if (_ref.read(dashboardProvider).sosPhase == SosPhase.resolved) {
            _ref.read(dashboardProvider.notifier).resetSos();
          }
        });
      }
    } catch (_) {
      // Ignore transient network errors while polling.
    } finally {
      _inFlight = false;
    }
  }
}

final activeSosSyncProvider = Provider<ActiveSosSync>((ref) {
  final sync = ActiveSosSync(ref);
  sync.start();
  ref.onDispose(sync.stop);
  return sync;
});
