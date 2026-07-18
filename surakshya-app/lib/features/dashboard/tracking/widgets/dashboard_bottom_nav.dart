library dashboard_bottom_nav;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

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
    final navColor = sosActive
        ? Color.lerp(surakshaNavBg, surakshaCrimsonFaint, 0.3)!
        : surakshaNavBg;

    return Container(
      height: S.bottomNavHeight,
      decoration: BoxDecoration(
        color: navColor,
        border: const Border(top: BorderSide(color: dashboardBorder, width: 0.5)),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceAround,
        children: [
          _NavItem(
            icon: Icons.map_outlined,
            label: CopyConstants.tracking,
            active: currentTab == DashboardTab.tracking,
            onTap: () => onTabChanged(DashboardTab.tracking),
          ),
          _SosNavButton(
            pulseFast: sosActive,
            onTap: () => onTabChanged(DashboardTab.sos),
          ),
          _NavItem(
            icon: Icons.person_outlined,
            label: CopyConstants.profile,
            active: currentTab == DashboardTab.profile,
            onTap: () => onTabChanged(DashboardTab.profile),
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

class _SosNavButton extends StatefulWidget {
  const _SosNavButton({
    required this.onTap,
    this.pulseFast = false,
  });

  final VoidCallback onTap;
  final bool pulseFast;

  @override
  State<_SosNavButton> createState() => _SosNavButtonState();
}

class _SosNavButtonState extends State<_SosNavButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void didUpdateWidget(_SosNavButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    _pulse.duration = widget.pulseFast
        ? const Duration(milliseconds: 800)
        : const Duration(seconds: 2);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Semantics(
        label: 'SOS emergency button',
        button: true,
        child: GestureDetector(
          onTap: widget.onTap,
          child: SizedBox(
            width: 72,
            height: 72,
            child: Stack(
              alignment: Alignment.center,
              children: [
                AnimatedBuilder(
                  animation: _pulse,
                  builder: (_, __) => Container(
                    width: 62 + _pulse.value * 16,
                    height: 62 + _pulse.value * 16,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: surakshaCrimsonRing,
                    ),
                  ),
                ),
                Container(
                  width: 62,
                  height: 62,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: surakshaCrimson,
                    boxShadow: [
                      BoxShadow(
                        color: surakshaCrimson.withValues(alpha: 0.45),
                        blurRadius: 16,
                        spreadRadius: 2,
                      ),
                    ],
                  ),
                  child: Center(
                    child: Text(
                      CopyConstants.sos,
                      style: SurakshaTypography.dashTitle.copyWith(
                        color: surakshaForeground,
                        fontWeight: FontWeight.w800,
                        fontSize: 14,
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
