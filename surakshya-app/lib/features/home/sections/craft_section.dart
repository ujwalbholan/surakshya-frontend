library craft_section;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/decorators/crimson_accent_line.dart';

class CraftSection extends StatelessWidget {
  const CraftSection({super.key});

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: S.sectionH,
          vertical: S.sectionV,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Craft', style: SurakshaTypography.sectionLabel),
            const SizedBox(height: S.md),
            const CrimsonAccentLine(),
            const SizedBox(height: S.lg),
            Text('Jewellery-Grade Engineering', style: SurakshaTypography.sectionHeadline),
            const SizedBox(height: S.md),
            Wrap(
              spacing: S.sm,
              children: ['BLE 5.0', 'IPX4 Waterproof', 'Jewellery-Grade']
                  .map(
                    (l) => Chip(
                      label: Text(l, style: SurakshaTypography.monoLabel),
                      side: const BorderSide(color: Color(0xFF333333)),
                    ),
                  )
                  .toList(),
            ),
          ],
        ),
      );
}
