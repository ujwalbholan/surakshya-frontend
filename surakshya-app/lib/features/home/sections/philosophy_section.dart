library philosophy_section;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/animations/text_reveal_animator.dart';
import 'package:suraksha/widgets/decorators/crimson_accent_line.dart';

class PhilosophySection extends StatefulWidget {
  const PhilosophySection({super.key});

  @override
  State<PhilosophySection> createState() => _PhilosophySectionState();
}

class _PhilosophySectionState extends State<PhilosophySection> {
  bool _triggered = false;

  @override
  Widget build(BuildContext context) {
    if (!_triggered) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _triggered = true);
      });
    }
    return Padding(
      padding: const EdgeInsets.symmetric(
        horizontal: S.sectionH,
        vertical: S.sectionV,
      ),
      child: LayoutBuilder(
        builder: (context, constraints) {
          final isWide = constraints.maxWidth >= 768;
          final content = Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Philosophy', style: SurakshaTypography.sectionLabel),
              const SizedBox(height: S.md),
              const CrimsonAccentLine(),
              const SizedBox(height: S.lg),
              TextRevealAnimator(
                text: 'Safety Engineered',
                style: SurakshaTypography.sectionHeadline,
                triggered: _triggered,
              ),
              const SizedBox(height: S.md),
              Text(
                'Suraksha is built for women in Nepal who need passive protection — '
                'a wristband that works when your phone cannot. Every component is '
                'designed for instant SOS and live GPS shared with your trusted circle.',
                style: SurakshaTypography.bodyLarge,
              ),
            ],
          );
          if (!isWide) return content;
          return Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Container(
                  height: 320,
                  decoration: BoxDecoration(
                    color: surakshaCard,
                    borderRadius: BorderRadius.circular(S.radius),
                    border: Border.all(color: surakshaBorder),
                  ),
                  child: const Icon(Icons.shield_outlined, size: 80, color: surakshaMuted),
                ),
              ),
              const SizedBox(width: S.xl2),
              Expanded(child: content),
            ],
          );
        },
      ),
    );
  }
}
