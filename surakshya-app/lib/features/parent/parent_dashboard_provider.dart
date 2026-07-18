library parent_dashboard_provider;

import 'dart:async';

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/models/parent_models.dart';
import 'package:suraksha/services/surakshya_api_service.dart';

enum ParentTab { home, profile }

class ParentDashboardState {
  const ParentDashboardState({
    this.wards = const [],
    this.selectedWardId,
    this.pendingRequests = const [],
    this.activeSos,
    this.loading = false,
    this.error,
    this.currentTab = ParentTab.home,
  });

  final List<LinkedWard> wards;
  final String? selectedWardId;
  final List<GuardianPendingRequest> pendingRequests;
  final WardSosEvent? activeSos;
  final bool loading;
  final String? error;
  final ParentTab currentTab;

  LinkedWard? get selectedWard {
    final id = selectedWardId;
    if (id == null) return null;
    for (final ward in wards) {
      if (ward.id == id) return ward;
    }
    return null;
  }

  ParentDashboardState copyWith({
    List<LinkedWard>? wards,
    String? selectedWardId,
    List<GuardianPendingRequest>? pendingRequests,
    WardSosEvent? activeSos,
    bool? loading,
    String? error,
    ParentTab? currentTab,
    bool clearError = false,
    bool clearSelectedWard = false,
    bool clearActiveSos = false,
  }) =>
      ParentDashboardState(
        wards: wards ?? this.wards,
        selectedWardId: clearSelectedWard
            ? null
            : (selectedWardId ?? this.selectedWardId),
        pendingRequests: pendingRequests ?? this.pendingRequests,
        activeSos:
            clearActiveSos ? null : (activeSos ?? this.activeSos),
        loading: loading ?? this.loading,
        error: clearError ? null : (error ?? this.error),
        currentTab: currentTab ?? this.currentTab,
      );
}

class ParentDashboardNotifier extends StateNotifier<ParentDashboardState> {
  ParentDashboardNotifier(this._api) : super(const ParentDashboardState());

  final SurakshyaApiService _api;
  Timer? _sosPollTimer;
  bool _sosPolling = false;
  bool _sosPollInFlight = false;

  static const _sosPollInterval = Duration(seconds: 30);

  @override
  void dispose() {
    stopSosPolling();
    super.dispose();
  }

  Future<void> refresh() async {
    state = state.copyWith(loading: true, clearError: true);
    try {
      final results = await Future.wait([
        _api.fetchMyWards(),
        _api.fetchGuardianPendingRequests(),
      ]);
      final wards = results[0] as List<LinkedWard>;
      final pendingRequests = results[1] as List<GuardianPendingRequest>;

      final previousSelectedId = state.selectedWardId;
      String? selectedId = previousSelectedId;
      if (wards.isEmpty) {
        selectedId = null;
      } else if (selectedId == null ||
          !wards.any((ward) => ward.id == selectedId)) {
        selectedId = wards.first.id;
      }

      state = ParentDashboardState(
        wards: wards,
        selectedWardId: selectedId,
        pendingRequests: pendingRequests,
        activeSos: selectedId == previousSelectedId ? state.activeSos : null,
        currentTab: state.currentTab,
      );

      if (selectedId != null) {
        await pollSos();
      }
    } on SurakshyaApiException catch (e) {
      state = state.copyWith(loading: false, error: e.message);
    } catch (_) {
      state = state.copyWith(
        loading: false,
        error: 'Could not load parent dashboard data',
      );
    }
  }

  void setTab(ParentTab tab) => state = state.copyWith(currentTab: tab);

  void selectWard(String wardId) {
    if (state.selectedWardId == wardId) return;
    state = state.copyWith(
      selectedWardId: wardId,
      clearActiveSos: true,
      clearError: true,
    );
    unawaited(pollSos());
  }

  Future<void> pollSos() async {
    final wardId = state.selectedWardId;
    if (wardId == null) {
      state = state.copyWith(clearActiveSos: true);
      return;
    }
    if (_sosPollInFlight) return;

    _sosPollInFlight = true;
    try {
      final events = await _api.fetchWardSos(wardId);
      if (!mounted || state.selectedWardId != wardId) return;

      WardSosEvent? active;
      for (final event in events) {
        if (event.isActive) {
          active = event;
          break;
        }
      }
      active ??= events.isNotEmpty ? events.first : null;

      state = state.copyWith(
        activeSos: active,
        clearActiveSos: active == null,
      );
    } on SurakshyaApiException {
      // Silent retry on the next poll tick.
    } finally {
      _sosPollInFlight = false;
    }
  }

  void startSosPolling() {
    if (_sosPolling) return;
    _sosPolling = true;
    unawaited(pollSos());
    _scheduleNextSosPoll();
  }

  void stopSosPolling() {
    _sosPolling = false;
    _sosPollTimer?.cancel();
    _sosPollTimer = null;
  }

  void _scheduleNextSosPoll() {
    if (!_sosPolling) return;
    _sosPollTimer?.cancel();
    _sosPollTimer = Timer(_sosPollInterval, () async {
      await pollSos();
      _scheduleNextSosPoll();
    });
  }

  Future<String> acceptRequest(String requestId) async {
    final previous = state.pendingRequests;
    state = state.copyWith(
      pendingRequests:
          previous.where((r) => r.id != requestId).toList(growable: false),
      clearError: true,
    );
    try {
      final message = await _api.acceptGuardianRequest(requestId);
      await refresh();
      return message;
    } catch (e) {
      state = state.copyWith(pendingRequests: previous);
      rethrow;
    }
  }

  Future<String> rejectRequest(String requestId) async {
    final previous = state.pendingRequests;
    state = state.copyWith(
      pendingRequests:
          previous.where((r) => r.id != requestId).toList(growable: false),
      clearError: true,
    );
    try {
      final message = await _api.rejectGuardianRequest(requestId);
      await refresh();
      return message;
    } catch (e) {
      state = state.copyWith(pendingRequests: previous);
      rethrow;
    }
  }

  Future<String> inviteWard(String childEmail) async {
    final message = await _api.inviteWard(childEmail: childEmail);
    await refresh();
    return message;
  }
}

final parentDashboardProvider =
    StateNotifierProvider<ParentDashboardNotifier, ParentDashboardState>(
  (ref) => ParentDashboardNotifier(ref.read(surakshyaApiServiceProvider)),
);
