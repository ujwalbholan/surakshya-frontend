library social_wall_section;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class SocialWallSection extends StatelessWidget {
  const SocialWallSection({super.key});

  static const _quotes = [
    ('Priya Sharma', 'Felt safe walking alone for the first time.'),
    ('Ananya Reddy', 'Live tracking gave my family peace of mind.'),
    ('Kavya Nair', 'Best decision before college.'),
  ];

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: S.sectionH,
          vertical: S.sectionV,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('#StayWithSuraksha', style: SurakshaTypography.sectionLabel),
            const SizedBox(height: S.xl),
            ..._quotes.map(
              (q) => Container(
                width: double.infinity,
                margin: const EdgeInsets.only(bottom: S.md),
                padding: const EdgeInsets.all(S.lg),
                decoration: BoxDecoration(
                  color: surakshaCard,
                  borderRadius: BorderRadius.circular(S.radius),
                  border: Border.all(color: surakshaCrimsonCard),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(q.$1, style: SurakshaTypography.featureCardTitle),
                    const SizedBox(height: S.sm),
                    Text(q.$2, style: SurakshaTypography.bodyMedium),
                  ],
                ),
              ),
            ),
          ],
        ),
      );
}
