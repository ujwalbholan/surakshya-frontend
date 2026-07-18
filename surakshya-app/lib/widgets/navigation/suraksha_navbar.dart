library suraksha_navbar;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class SurakshaNavbar extends StatelessWidget {
  const SurakshaNavbar({super.key});

  @override
  Widget build(BuildContext context) => LayoutBuilder(
        builder: (context, constraints) {
          final isMobile = constraints.maxWidth < 768;
          return Container(
            height: S.navHeight,
            color: surakshaNavBg.withValues(alpha: 0.9),
            padding: const EdgeInsets.symmetric(horizontal: S.sectionH),
            child: Row(
              children: [
                Text('Suraksha', style: SurakshaTypography.playfairLogo),
                const Spacer(),
                if (!isMobile) ...[
                  _NavLink('Features', () {}),
                  _NavLink('Technology', () {}),
                  _NavLink('About', () {}),
                  const SizedBox(width: S.md),
                ],
                TextButton(
                  onPressed: () => context.push(AppRoutes.login),
                  child: const Text('Login'),
                ),
                if (isMobile)
                  IconButton(
                    icon: const Icon(Icons.menu_rounded),
                    onPressed: () {},
                  ),
              ],
            ),
          );
        },
      );
}

class _NavLink extends StatelessWidget {
  const _NavLink(this.label, this.onTap);

  final String label;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: S.sm),
        child: TextButton(
          onPressed: onTap,
          child: Text(label, style: SurakshaTypography.navLink),
        ),
      );
}
