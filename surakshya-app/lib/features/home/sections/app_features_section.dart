library app_features_section;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class AppFeaturesSection extends StatelessWidget {
  const AppFeaturesSection({super.key});

  static const _cards = [
    ('01', Icons.shield_outlined, CopyConstants.featureSos, '< 2s', 'ALERT TIME'),
    (
      '02',
      Icons.location_on_outlined,
      CopyConstants.featureTracking,
      '24/7',
      'ALWAYS ACTIVE',
    ),
  ];

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: S.sectionV),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: S.sectionH),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('The App', style: SurakshaTypography.sectionLabel),
                  const SizedBox(height: S.sm),
                  Text(
                    CopyConstants.twoPillarsTitle,
                    style: SurakshaTypography.sectionHeadline,
                  ),
                ],
              ),
            ),
            const SizedBox(height: S.xl),
            SizedBox(
              height: 400,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: S.sectionH),
                itemCount: _cards.length,
                itemBuilder: (context, i) {
                  final c = _cards[i];
                  return Container(
                    width: 320,
                    margin: const EdgeInsets.only(right: S.md),
                    padding: const EdgeInsets.all(28),
                    decoration: BoxDecoration(
                      color: surakshaCard,
                      borderRadius: BorderRadius.circular(S.radius),
                      border: Border.all(color: surakshaCrimsonCard),
                    ),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          mainAxisAlignment: MainAxisAlignment.spaceBetween,
                          children: [
                            Icon(c.$2, color: surakshaCrimson, size: 28),
                            Text(c.$1, style: SurakshaTypography.monoLabel),
                          ],
                        ),
                        const Spacer(),
                        Text(
                          c.$4,
                          style: SurakshaTypography.dashStat.copyWith(
                            color: surakshaCrimson,
                          ),
                        ),
                        Text(c.$5, style: SurakshaTypography.featureCardStat),
                        const SizedBox(height: 12),
                        Text(c.$3, style: SurakshaTypography.featureCardTitle),
                      ],
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      );
}
