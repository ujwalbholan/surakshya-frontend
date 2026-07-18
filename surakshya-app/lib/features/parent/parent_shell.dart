library parent_shell;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/features/parent/parent_dashboard_provider.dart';
import 'package:suraksha/features/parent/tabs/parent_home_tab.dart';
import 'package:suraksha/features/parent/tabs/parent_profile_tab.dart';
import 'package:suraksha/features/parent/tabs/parent_sos_tab.dart';
import 'package:suraksha/features/parent/widgets/parent_bottom_nav.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class ParentShell extends ConsumerStatefulWidget {
  const ParentShell({super.key});

  @override
  ConsumerState<ParentShell> createState() => _ParentShellState();
}

class _ParentShellState extends ConsumerState<ParentShell> {
  ParentDashboardNotifier? _notifier;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _notifier = ref.read(parentDashboardProvider.notifier);
      _notifier!.refresh();
      _notifier!.startSosPolling();
    });
  }

  @override
  void dispose() {
    _notifier?.stopSosPolling();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(parentDashboardProvider);
    final notifier = ref.read(parentDashboardProvider.notifier);
    final tabIndex = ParentTab.values.indexOf(state.currentTab);

    return Scaffold(
      backgroundColor: dashboardBg,
      body: Stack(
        children: [
          IndexedStack(
            index: tabIndex,
            children: const [
              ParentHomeTab(),
              ParentSosTab(),
              ParentProfileTab(),
            ],
          ),
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            child: ParentBottomNav(
              currentTab: state.currentTab,
              sosActive: state.activeSos?.isActive ?? false,
              onTabChanged: notifier.setTab,
            ),
          ),
        ],
      ),
    );
  }
}
