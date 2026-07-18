library live_location_tracker;

import 'dart:async';

import 'package:flutter/widgets.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/services/location_service.dart';

/// Polls device GPS every [AppConstants.liveLocationPollInterval] while
/// [DashboardStateData.locationSharingActive] is true.
class LiveLocationTracker {
  LiveLocationTracker(this._ref);

  final Ref _ref;
  Timer? _timer;
  bool _running = false;
  bool _pollInFlight = false;

  Future<void> start() async {
    if (_running) return;
    _running = true;
    await _poll();
    _scheduleNextPoll();
  }

  void stop() {
    _running = false;
    _timer?.cancel();
    _timer = null;
  }

  void dispose() => stop();

  void onAppLifecycleChanged(AppLifecycleState state) {
    if (!_ref.read(dashboardProvider).locationSharingActive) return;

    switch (state) {
      case AppLifecycleState.resumed:
        if (_running) {
          unawaited(_poll());
          _scheduleNextPoll();
        }
      case AppLifecycleState.paused:
      case AppLifecycleState.detached:
      case AppLifecycleState.hidden:
        _timer?.cancel();
        _timer = null;
      case AppLifecycleState.inactive:
        break;
    }
  }

  void _scheduleNextPoll() {
    if (!_running) return;
    _timer?.cancel();
    _timer = Timer(AppConstants.liveLocationPollInterval, () async {
      await _poll();
      _scheduleNextPoll();
    });
  }

  Future<void> _poll() async {
    if (!_running || _pollInFlight) return;
    if (!_ref.read(dashboardProvider).locationSharingActive) return;

    _pollInFlight = true;
    try {
      final result =
          await _ref.read(locationServiceProvider).fetchLiveLocation();
      if (!_running) return;

      switch (result) {
        case LocationFetchSuccess(:final location):
          _ref.read(dashboardProvider.notifier).updateLocation(location);
        case LocationFetchError(:final failure):
          _handleFailure(failure);
      }
    } finally {
      _pollInFlight = false;
    }
  }

  void _handleFailure(LocationFetchFailure failure) {
    switch (failure) {
      case LocationFetchFailure.permissionDenied:
      case LocationFetchFailure.permissionDeniedForever:
      case LocationFetchFailure.serviceDisabled:
        _ref.read(dashboardProvider.notifier).setLocationSharingActive(false);
        stop();
      case LocationFetchFailure.timeout:
      case LocationFetchFailure.unknown:
        break;
    }
  }
}

final liveLocationTrackerProvider = Provider<LiveLocationTracker>((ref) {
  final tracker = LiveLocationTracker(ref);
  ref.onDispose(tracker.dispose);

  ref.listen<bool>(
    dashboardProvider.select((s) => s.locationSharingActive),
    (previous, enabled) {
      if (enabled) {
        unawaited(tracker.start());
      } else {
        tracker.stop();
      }
    },
    fireImmediately: true,
  );

  return tracker;
});
