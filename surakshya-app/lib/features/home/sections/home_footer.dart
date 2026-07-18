library home_footer;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class HomeFooter extends StatelessWidget {
  const HomeFooter({super.key});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.all(S.sectionH),
        child: Column(
          children: [
            const Divider(color: surakshaBorder),
            const SizedBox(height: S.xl2),
            Text('Suraksha', style: SurakshaTypography.brandLogo),
            const SizedBox(height: S.sm),
            Text(
              CopyConstants.tagline,
              style: SurakshaTypography.monoLabel,
            ),
            const SizedBox(height: S.lg),
            Wrap(
              alignment: WrapAlignment.center,
              spacing: S.lg,
              children: [
                TextButton(
                  onPressed: () {},
                  child: Text(
                    CopyConstants.featureSos,
                    style: SurakshaTypography.monoLabel.copyWith(
                      color: surakshaCrimson,
                    ),
                  ),
                ),
                TextButton(
                  onPressed: () {},
                  child: Text(
                    CopyConstants.featureTracking,
                    style: SurakshaTypography.monoLabel.copyWith(
                      color: surakshaCrimson,
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: S.xl2),
            const Divider(color: surakshaBorder),
            const SizedBox(height: S.md),
            Text(
              '© 2025 Suraksha Safety Pvt. Ltd.',
              style: SurakshaTypography.monoLabel,
            ),
          ],
        ),
      );
}
