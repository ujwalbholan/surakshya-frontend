library sos_text_section;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class SosTextSection extends StatelessWidget {
  const SosTextSection({super.key, required this.seconds});

  final int seconds;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(20, 32, 20, 0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              CopyConstants.sosCountingTitle,
              style: SurakshaTypography.dashGreeting.copyWith(
                fontSize: 22,
                fontWeight: FontWeight.w700,
              ),
            ),
            const SizedBox(height: 8),
            Text(
              CopyConstants.sosCountingBody.replaceAll(
                '{seconds}',
                '$seconds',
              ),
              style: SurakshaTypography.bodyMedium.copyWith(
                fontSize: 14,
                color: surakshaMuted,
                height: 1.6,
              ),
            ),
          ],
        ),
      );
}
