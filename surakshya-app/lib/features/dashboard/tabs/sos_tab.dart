library sos_tab;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/core/utils/haptics.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/services/ams_api_service.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/features/dashboard/sos/widgets/sos_app_bar.dart';
import 'package:suraksha/features/dashboard/sos/widgets/sos_center_display.dart';
import 'package:suraksha/features/dashboard/sos/widgets/sos_contact_orbit.dart';
import 'package:suraksha/features/dashboard/sos/widgets/sos_countdown_tip_card.dart';
import 'package:suraksha/features/dashboard/sos/widgets/sos_oval_countdown.dart';
import 'package:suraksha/features/dashboard/sos/widgets/sos_radar_painter.dart';
import 'package:suraksha/features/dashboard/sos/widgets/sos_swipe_cancel_bar.dart';
import 'package:suraksha/features/dashboard/sos/widgets/sos_text_section.dart';
import 'package:suraksha/features/dashboard/sos/widgets/sos_tip_card.dart';
import 'package:suraksha/models/contact_model.dart';
import 'package:suraksha/models/location_model.dart';
import 'package:suraksha/models/user_model.dart';
import 'package:suraksha/services/notification_service.dart';
import 'package:suraksha/services/wristband_sos_service.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';

class SosTab extends ConsumerStatefulWidget {
  const SosTab({super.key});

  @override
  ConsumerState<SosTab> createState() => _SosTabState();
}

class _SosTabState extends ConsumerState<SosTab> {
  Timer? _countdownTimer;
  Timer? _resetTimer;
  Timer? _locationPushTimer;
  StreamSubscription<void>? _bandSub;
  int _dispatchIndex = -1;
  bool _cancelling = false;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _bandSub = ref.read(wristbandSosServiceProvider).onBandDoubleTap.listen(
        (_) => _onBandDoubleTap(),
      );
    });
  }

  @override
  void dispose() {
    _countdownTimer?.cancel();
    _resetTimer?.cancel();
    _stopLocationPush();
    _bandSub?.cancel();
    super.dispose();
  }

  void _onBandDoubleTap() {
    final state = ref.read(dashboardProvider);
    if (state.sosPhase != SosPhase.idle) return;
    if (!state.bandConnected) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text(CopyConstants.bandNotConnected)),
        );
      }
      return;
    }
    Future.microtask(() {
      ref.read(dashboardProvider.notifier).startSosCountdown();
      _startCountdownTimer();
    });
  }

  void _startCountdownTimer() {
    _countdownTimer?.cancel();
    _countdownTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      final state = ref.read(dashboardProvider);
      if (state.sosPhase != SosPhase.counting) {
        _countdownTimer?.cancel();
        return;
      }
      final next = state.sosCountdownSeconds - 1;
      if (next <= 0) {
        _countdownTimer?.cancel();
        Future.microtask(_completeCountdown);
        return;
      }
      triggerHaptic(HapticPattern.light);
      Future.microtask(() {
        ref.read(dashboardProvider.notifier).updateCountdown(next);
      });
    });
  }

  /// Real linked guardians for SOS UI / police dual-write.
  /// Prefer starred emergency contacts; fall back to the full guardian list.
  List<ContactModel> _sosContacts() {
    final family =
        ref.read(familyMembersProvider).where((c) => c.id != 'me').toList();
    final emergency = family.where((c) => c.isEmergency).toList();
    return (emergency.isNotEmpty ? emergency : family).take(3).toList();
  }

  Future<void> _completeCountdown() async {
    ref.read(dashboardProvider.notifier).startDispatching();
    await ref.read(notificationServiceProvider).showSosOngoing();

    final auth = ref.read(authProvider);
    final dash = ref.read(dashboardProvider);
    final user = auth.user;
    if (user != null && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text(CopyConstants.sosPoliceDispatchBody)),
      );
      await _dispatchSosPrimaryAndDualWrite(
        user: user,
        location: dash.currentLocation,
        familyMembers: _sosContacts(),
      );
    }

    _runDispatchSequence();
  }

  /// Surakshya REST is primary. AMS dual-write is fire-and-forget and must
  /// never fail or block the in-app countdown/confirmation UX.
  Future<void> _dispatchSosPrimaryAndDualWrite({
    required UserModel user,
    required LocationModel location,
    required List<ContactModel> familyMembers,
  }) async {
    try {
      final sosId = await ref.read(surakshyaApiServiceProvider).createSos(
            latitude: location.latitude,
            longitude: location.longitude,
            label: location.label,
            source: 'wristband_double_tap',
          );
      if (!mounted) return;
      ref.read(dashboardProvider.notifier).setActiveSosId(sosId);
      _startLocationPushLoop(sosId);
    } catch (_) {
      // Primary create failed — still continue UX; dual-write may still help.
    }

    if (AppConstants.sosDualWriteToAmsEnabled) {
      unawaited(
        () async {
          try {
            await ref.read(amsApiServiceProvider).sendSosToPoliceDashboard(
                  user: user,
                  location: location,
                  familyMembers: familyMembers,
                  source: 'wristband_double_tap',
                );
          } catch (_) {}
        }(),
      );
    }
  }

  void _stopLocationPush() {
    _locationPushTimer?.cancel();
    _locationPushTimer = null;
  }

  void _startLocationPushLoop(String sosId) {
    _stopLocationPush();
    _pushLocationOnce(sosId);
    _locationPushTimer = Timer.periodic(
      const Duration(seconds: AppConstants.locationPushIntervalSeconds),
      (_) => _pushLocationOnce(sosId),
    );
  }

  void _pushLocationOnce(String sosId) {
    final dash = ref.read(dashboardProvider);
    if (dash.sosPhase == SosPhase.idle || dash.sosPhase == SosPhase.resolved) {
      _locationPushTimer?.cancel();
      return;
    }
    unawaited(
      () async {
        try {
          await ref.read(surakshyaApiServiceProvider).pushSosLocation(
                sosId: sosId,
                latitude: dash.currentLocation.latitude,
                longitude: dash.currentLocation.longitude,
              );
        } catch (_) {}
      }(),
    );
  }

  Future<void> _runDispatchSequence() async {
    final contacts = _sosContacts();
    for (var i = 0; i < contacts.length; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 400));
      if (!mounted) return;
      if (ref.read(dashboardProvider).sosPhase != SosPhase.dispatching) return;
      setState(() => _dispatchIndex = i);
    }
    await Future<void>.delayed(const Duration(milliseconds: 600));
    if (!mounted) return;
    await ref.read(notificationServiceProvider).showSosSent();
    Future.microtask(() {
      final dash = ref.read(dashboardProvider);
      final sosId = dash.activeSosId;
      if (sosId != null && sosId.isNotEmpty) {
        ref.read(dashboardProvider.notifier).markSosActive(sosId: sosId);
      } else {
        // Create failed — treat as cancelled locally.
        ref.read(dashboardProvider.notifier).resolveSos();
        _scheduleReset();
      }
    });
  }

  Future<void> _cancelSos() async {
    if (_cancelling) return;
    _cancelling = true;
    _countdownTimer?.cancel();
    _stopLocationPush();
    await ref.read(notificationServiceProvider).cancelSosNotification();

    final sosId = ref.read(dashboardProvider).activeSosId;
    final phase = ref.read(dashboardProvider).sosPhase;

    // Countdown only — nothing was sent to the backend yet.
    if (phase == SosPhase.counting || sosId == null || sosId.isEmpty) {
      if (!mounted) return;
      Future.microtask(() {
        ref.read(dashboardProvider.notifier).resolveSos();
        _scheduleReset();
      });
      _cancelling = false;
      return;
    }

    try {
      await ref.read(surakshyaApiServiceProvider).cancelSos(sosId);
    } on SurakshyaApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
      _cancelling = false;
      return;
    } catch (_) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not cancel SOS. Try again.')),
        );
      }
      _cancelling = false;
      return;
    }

    if (!mounted) return;
    Future.microtask(() {
      ref.read(dashboardProvider.notifier).resolveSos();
      _scheduleReset();
    });
    _cancelling = false;
  }

  void _scheduleReset() {
    _resetTimer?.cancel();
    _resetTimer = Timer(const Duration(seconds: 5), () {
      if (!mounted) return;
      _stopLocationPush();
      Future.microtask(() {
        ref.read(dashboardProvider.notifier).resetSos();
        setState(() {
          _dispatchIndex = -1;
          _cancelling = false;
        });
      });
    });
  }

  void _goBack() {
    ref.read(dashboardProvider.notifier).setTab(DashboardTab.tracking);
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(dashboardProvider);
    // Watch so the orbit refreshes when guardians / emergency stars change.
    final contacts = ref.watch(familyMembersProvider).where((c) => c.id != 'me');
    final emergency = contacts.where((c) => c.isEmergency).toList();
    final orbitContacts =
        (emergency.isNotEmpty ? emergency : contacts.toList()).take(3).toList();
    final bottomPad = S.bottomNavHeight + MediaQuery.paddingOf(context).bottom;

    // Keep contact checkmarks filled when mirroring a live band SOS.
    ref.listen<DashboardStateData>(dashboardProvider, (prev, next) {
      if (next.sosPhase == SosPhase.active &&
          prev?.sosPhase != SosPhase.active &&
          _dispatchIndex < 2) {
        setState(() => _dispatchIndex = 2);
      }
      if (next.sosPhase == SosPhase.active &&
          next.activeSosId != null &&
          next.activeSosId != prev?.activeSosId &&
          _locationPushTimer == null) {
        _startLocationPushLoop(next.activeSosId!);
      }
    });

    if (state.sosPhase == SosPhase.counting) {
      return _CountingLayout(
        seconds: state.sosCountdownSeconds,
        contacts: orbitContacts,
        bottomPad: bottomPad,
        onCancelled: _cancelSos,
      );
    }

    if (state.sosPhase == SosPhase.active) {
      return _ActiveLayout(
        contacts: orbitContacts,
        dispatchIndex: _dispatchIndex,
        bottomPad: bottomPad,
        onCancelled: _cancelSos,
      );
    }

    return Scaffold(
      backgroundColor: surakshaCard,
      appBar: SosAppBar(
        backEnabled: state.sosPhase == SosPhase.idle,
        onBack: _goBack,
      ),
      body: SafeArea(
        bottom: false,
        child: Column(
          children: [
            const SizedBox(height: S.md),
            SosTipCard(
              phase: state.sosPhase,
              countdownSeconds: state.sosCountdownSeconds,
            ),
            Expanded(
              child: Stack(
                alignment: Alignment.center,
                children: [
                  if (state.sosPhase != SosPhase.resolved)
                    const Positioned.fill(child: SosRadarRings()),
                  SizedBox(
                    height: 320,
                    child: SosContactOrbit(
                      phase: state.sosPhase,
                      contacts: orbitContacts,
                      dispatchIndex: _dispatchIndex,
                    ),
                  ),
                  SosCenterDisplay(
                    phase: state.sosPhase,
                    seconds: state.sosCountdownSeconds,
                    totalSeconds: AppConstants.sosCountdownSeconds,
                    onBandDoubleTap: _onBandDoubleTap,
                    onCancelTap: () => Future.microtask(
                      ref.read(dashboardProvider.notifier).resetSos,
                    ),
                  ),
                ],
              ),
            ),
            SizedBox(height: bottomPad + S.lg),
          ],
        ),
      ),
    );
  }
}

class _CountingLayout extends StatelessWidget {
  const _CountingLayout({
    required this.seconds,
    required this.contacts,
    required this.bottomPad,
    required this.onCancelled,
  });

  final int seconds;
  final List<ContactModel> contacts;
  final double bottomPad;
  final VoidCallback onCancelled;

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: surakshaCard,
        appBar: const SosAppBar(backEnabled: false),
        body: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SosCountdownTipCard(),
              Expanded(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    const Positioned.fill(child: SosRadarRings()),
                    SizedBox(
                      height: 320,
                      child: SosContactOrbit(
                        phase: SosPhase.counting,
                        contacts: contacts,
                      ),
                    ),
                    SosOvalCountdown(
                      seconds: seconds,
                      totalSeconds: AppConstants.sosCountdownSeconds,
                    ),
                  ],
                ),
              ),
              SosTextSection(seconds: seconds),
              SosSwipeCancelBar(onCancelled: onCancelled),
              SizedBox(height: bottomPad + 16),
            ],
          ),
        ),
      );
}

class _ActiveLayout extends StatelessWidget {
  const _ActiveLayout({
    required this.contacts,
    required this.dispatchIndex,
    required this.bottomPad,
    required this.onCancelled,
  });

  final List<ContactModel> contacts;
  final int dispatchIndex;
  final double bottomPad;
  final VoidCallback onCancelled;

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: surakshaCard,
        appBar: const SosAppBar(backEnabled: false),
        body: SafeArea(
          bottom: false,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: S.md),
              const SosTipCard(phase: SosPhase.active),
              Expanded(
                child: Stack(
                  alignment: Alignment.center,
                  children: [
                    const Positioned.fill(child: SosRadarRings()),
                    SizedBox(
                      height: 320,
                      child: SosContactOrbit(
                        phase: SosPhase.active,
                        contacts: contacts,
                        dispatchIndex: dispatchIndex < 0 ? 2 : dispatchIndex,
                      ),
                    ),
                    SosCenterDisplay(
                      phase: SosPhase.active,
                      seconds: 0,
                      totalSeconds: AppConstants.sosCountdownSeconds,
                      onBandDoubleTap: () {},
                      onCancelTap: () {},
                    ),
                  ],
                ),
              ),
              SosSwipeCancelBar(onCancelled: onCancelled),
              SizedBox(height: bottomPad + 16),
            ],
          ),
        ),
      );
}
