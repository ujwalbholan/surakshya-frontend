library onboarding_page;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class OnboardingPage extends StatelessWidget {
  const OnboardingPage({
    super.key,
    required this.title,
    required this.body,
    required this.icon,
  });

  final String title;
  final String body;
  final IconData icon;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(horizontal: S.xl),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 120,
              height: 120,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: surakshaCrimsonFaint,
                border: Border.all(color: surakshaCrimsonCard),
              ),
              child: Icon(icon, size: 56, color: surakshaCrimson),
            ),
            const SizedBox(height: S.xl2),
            Text(title, style: SurakshaTypography.sectionHeadline),
            const SizedBox(height: S.md),
            Text(
              body,
              textAlign: TextAlign.center,
              style: SurakshaTypography.bodyLarge,
            ),
          ],
        ),
      );
}
