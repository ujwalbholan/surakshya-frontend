library dashboard_shell;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/features/guardians/guardian_provider.dart';
import 'package:suraksha/features/dashboard/active_sos_sync.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/features/dashboard/device_status_sync.dart';
import 'package:suraksha/features/dashboard/live_location_tracker.dart';
import 'package:suraksha/features/dashboard/tabs/profile_tab.dart';
import 'package:suraksha/features/dashboard/tabs/sos_tab.dart';
import 'package:suraksha/features/dashboard/tabs/tracking_tab.dart';
import 'package:suraksha/features/dashboard/tracking/widgets/dashboard_bottom_nav.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class DashboardShell extends ConsumerStatefulWidget {
  const DashboardShell({super.key});

  @override
  ConsumerState<DashboardShell> createState() => _DashboardShellState();
}

class _DashboardShellState extends ConsumerState<DashboardShell>
    with WidgetsBindingObserver {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addObserver(this);
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(authProvider).isLoggedIn) {
        ref.read(guardianLinkingProvider.notifier).refresh();
      }
    });
  }

  @override
  void dispose() {
    WidgetsBinding.instance.removeObserver(this);
    super.dispose();
  }

  @override
  void didChangeAppLifecycleState(AppLifecycleState state) {
    ref.read(liveLocationTrackerProvider).onAppLifecycleChanged(state);
  }

  @override
  Widget build(BuildContext context) {
    ref.watch(liveLocationTrackerProvider);
    ref.watch(deviceStatusSyncProvider);
    ref.watch(activeSosSyncProvider);

    final state = ref.watch(dashboardProvider);
    final notifier = ref.read(dashboardProvider.notifier);
    final tabIndex = DashboardTab.values.indexOf(state.currentTab);

    return Scaffold(
      backgroundColor: dashboardBg,
      body: Stack(
        children: [
          IndexedStack(
            index: tabIndex,
            children: const [
              TrackingTab(),
              SosTab(),
              ProfileTab(),
            ],
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: DashboardBottomNav(
              currentTab: state.currentTab,
              sosPhase: state.sosPhase,
              onTabChanged: notifier.setTab,
            ),
          ),
        ],
      ),
    );
  }
}
