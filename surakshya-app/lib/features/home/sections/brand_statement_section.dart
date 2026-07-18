library brand_statement_section;

import 'package:flutter/material.dart';
import 'package:suraksha/core/extensions/context_extensions.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class BrandStatementSection extends StatelessWidget {
  const BrandStatementSection({super.key});

  @override
  Widget build(BuildContext context) => SizedBox(
        height: context.screenHeight * 0.7,
        child: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [
                surakshaBlack,
                surakshaCrimsonFaint,
                surakshaBlack,
              ],
            ),
          ),
          child: Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Suraksha', style: SurakshaTypography.brandWordmark),
                const SizedBox(height: S.lg),
                Text(
                  'SAFETY IS NOT A FEATURE.\nIT IS A RIGHT.',
                  textAlign: TextAlign.center,
                  style: SurakshaTypography.heroHeadline(size: 24),
                ),
              ],
            ),
          ),
        ),
      );
}
