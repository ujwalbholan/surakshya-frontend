library parent_bottom_nav;

import 'package:flutter/material.dart';
import 'package:suraksha/features/parent/parent_dashboard_provider.dart';
import 'package:suraksha/widgets/navigation/notched_sos_bottom_nav.dart';

/// Guardian dashboard bottom nav — same notched chrome as the user
/// dashboard. The center SOS button opens the ward's SOS live map (no
/// countdown; guardians only observe).
class ParentBottomNav extends StatelessWidget {
  const ParentBottomNav({
    super.key,
    required this.currentTab,
    required this.onTabChanged,
    this.sosActive = false,
  });

  final ParentTab currentTab;
  final ValueChanged<ParentTab> onTabChanged;

  /// True when the selected ward has an active SOS (speeds up the pulse).
  final bool sosActive;

  @override
  Widget build(BuildContext context) => NotchedSosBottomNav(
        homeActive: currentTab == ParentTab.home,
        profileActive: currentTab == ParentTab.profile,
        sosPulseFast: sosActive,
        onHomeTap: () => onTabChanged(ParentTab.home),
        onSosTap: () => onTabChanged(ParentTab.sos),
        onProfileTap: () => onTabChanged(ParentTab.profile),
      );
}
