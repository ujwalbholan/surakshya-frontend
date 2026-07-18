library active_sos_sync;

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/services/tracking_socket_service.dart';

/// Keeps the citizen SOS tab in sync with server-side SOS state.
///
/// Prefers the `/tracking` Socket.IO `sos_event` stream (via
/// [TrackingSocketService]). Falls back to GET /sos/active polling only after
/// [AppConstants.socketReconnectMaxAttempts] failed reconnects — never runs
/// both simultaneously.
class ActiveSosSync {
  ActiveSosSync(this._ref);

  final Ref _ref;
  Timer? _pollTimer;
  StreamSubscription<void>? _fallbackSub;
  StreamSubscription<void>? _connectedSub;
  bool _started = false;
  bool _inFlight = false;
  bool _polling = false;

  void start() {
    if (_started) return;
    _started = true;

    final socket = _ref.read(trackingSocketServiceProvider);
    socket.addSosHandler(_onSosEvent);
    _fallbackSub = socket.onFallbackToPolling.listen((_) {
      _startPolling();
    });
    _connectedSub = socket.onConnected.listen((_) {
      _stopPolling();
      unawaited(refresh());
    });

    unawaited(socket.start());
    // One-shot HTTP sync so we don't wait for the next sos_event to learn
    // about an SOS that was already active before connect.
    unawaited(refresh());
  }

  void stop() {
    _stopPolling();
    _fallbackSub?.cancel();
    _fallbackSub = null;
    _connectedSub?.cancel();
    _connectedSub = null;
    final socket = _ref.read(trackingSocketServiceProvider);
    socket.removeSosHandler(_onSosEvent);
    socket.stop();
    _started = false;
  }

  void _startPolling() {
    if (_polling) return;
    _polling = true;
    unawaited(refresh());
    _pollTimer = Timer.periodic(
      AppConstants.activeSosPollInterval,
      (_) => unawaited(refresh()),
    );
  }

  void _stopPolling() {
    _pollTimer?.cancel();
    _pollTimer = null;
    _polling = false;
  }

  void _onSosEvent(Map<String, dynamic> payload) {
    final id = payload['id'] as String? ?? '';
    if (id.isEmpty) return;
    final status = (payload['status'] as String? ?? '').toLowerCase();
    final eventType = (payload['eventType'] as String? ?? '').toLowerCase();

    final isResolved = status == 'resolved' ||
        eventType == 'sos_stopped' ||
        eventType == 'sos_resolved';

    final dash = _ref.read(dashboardProvider);
    final notifier = _ref.read(dashboardProvider.notifier);

    if (isResolved) {
      if (dash.sosPhase == SosPhase.active &&
          (dash.activeSosId == null || dash.activeSosId == id)) {
        notifier.resolveSos();
        Future<void>.delayed(const Duration(seconds: 4), () {
          if (_ref.read(dashboardProvider).sosPhase == SosPhase.resolved) {
            _ref.read(dashboardProvider.notifier).resetSos();
          }
        });
      }
      return;
    }

    // Active / started / location / emergency_call
    if (dash.sosPhase == SosPhase.idle ||
        dash.sosPhase == SosPhase.resolved ||
        dash.sosPhase == SosPhase.active) {
      if (dash.sosPhase != SosPhase.active || dash.activeSosId != id) {
        notifier.markSosActive(sosId: id);
      }
    } else if (dash.activeSosId == null) {
      notifier.setActiveSosId(id);
    }
  }

  Future<void> refresh() async {
    if (_inFlight) return;
    _inFlight = true;
    try {
      final active =
          await _ref.read(surakshyaApiServiceProvider).fetchActiveSos();
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
      // Ignore transient network errors while syncing.
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
