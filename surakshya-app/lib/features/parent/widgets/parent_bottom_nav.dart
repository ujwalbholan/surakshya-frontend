library parent_bottom_nav;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/parent/parent_dashboard_provider.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class ParentBottomNav extends StatelessWidget {
  const ParentBottomNav({
    super.key,
    required this.currentTab,
    required this.onTabChanged,
  });

  final ParentTab currentTab;
  final ValueChanged<ParentTab> onTabChanged;

  @override
  Widget build(BuildContext context) {
    return Container(
      height: S.bottomNavHeight,
      decoration: const BoxDecoration(
        color: surakshaNavBg,
        border: Border(top: BorderSide(color: dashboardBorder, width: 0.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _NavItem(
            icon: Icons.home_outlined,
            label: CopyConstants.home,
            active: currentTab == ParentTab.home,
            onTap: () => onTabChanged(ParentTab.home),
          ),
          _NavItem(
            icon: Icons.person_outlined,
            label: CopyConstants.profile,
            active: currentTab == ParentTab.profile,
            onTap: () => onTabChanged(ParentTab.profile),
          ),
        ],
      ),
    );
  }
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.icon,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final IconData icon;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: SizedBox(
          width: 80,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(
                icon,
                color: active ? surakshaForeground : surakshaMuted,
                size: 24,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: SurakshaTypography.monoLabel.copyWith(
                  color: active ? surakshaForeground : surakshaMuted,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      );
}
