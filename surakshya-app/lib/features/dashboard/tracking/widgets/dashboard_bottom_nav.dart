library dashboard_bottom_nav;

import 'package:flutter/material.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/widgets/navigation/notched_sos_bottom_nav.dart';

/// User dashboard bottom nav — thin wrapper over the shared
/// [NotchedSosBottomNav] chrome (also used by the guardian dashboard).
class DashboardBottomNav extends StatelessWidget {
  const DashboardBottomNav({
    super.key,
    required this.currentTab,
    required this.sosPhase,
    required this.onTabChanged,
  });

  final DashboardTab currentTab;
  final SosPhase sosPhase;
  final ValueChanged<DashboardTab> onTabChanged;

  @override
  Widget build(BuildContext context) {
    final sosActive = sosPhase == SosPhase.counting ||
        sosPhase == SosPhase.dispatching ||
        sosPhase == SosPhase.active;

    return NotchedSosBottomNav(
      homeActive: currentTab == DashboardTab.tracking,
      profileActive: currentTab == DashboardTab.profile,
      sosPulseFast: sosActive,
      onHomeTap: () => onTabChanged(DashboardTab.tracking),
      onSosTap: () => onTabChanged(DashboardTab.sos),
      onProfileTap: () => onTabChanged(DashboardTab.profile),
    );
  }
}
