library innovation_section;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/animations/text_reveal_animator.dart';
import 'package:suraksha/widgets/decorators/crimson_accent_line.dart';

class InnovationSection extends StatefulWidget {
  const InnovationSection({super.key});

  @override
  State<InnovationSection> createState() => _InnovationSectionState();
}

class _InnovationSectionState extends State<InnovationSection> {
  bool _triggered = false;

  @override
  Widget build(BuildContext context) {
    if (!_triggered) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) setState(() => _triggered = true);
      });
    }
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(
        horizontal: S.sectionH,
        vertical: S.sectionV,
      ),
      color: surakshaDarkSurface,
      child: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 680),
          child: Column(
            children: [
              Text('Innovation', style: SurakshaTypography.sectionLabel),
              const SizedBox(height: S.lg),
              TextRevealAnimator(
                text: 'One Tap. Instant Alert.',
                style: SurakshaTypography.sectionHeadline,
                triggered: _triggered,
              ),
              const SizedBox(height: S.md),
              const CrimsonAccentLine(),
              const SizedBox(height: S.xl),
              const Wrap(
                spacing: S.md,
                runSpacing: S.md,
                alignment: WrapAlignment.center,
                children: [
                  _InnovationPill(
                    value: '< 2s',
                    label: 'SOS RESPONSE',
                  ),
                  _InnovationPill(
                    value: '24/7',
                    label: 'GPS TRACKING',
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _InnovationPill extends StatelessWidget {
  const _InnovationPill({required this.value, required this.label});

  final String value;
  final String label;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.symmetric(
          horizontal: S.xl,
          vertical: S.lg,
        ),
        decoration: BoxDecoration(
          color: surakshaCard,
          borderRadius: BorderRadius.circular(S.radius),
          border: Border.all(color: surakshaCrimsonCard),
        ),
        child: Column(
          children: [
            Text(
              value,
              style: SurakshaTypography.dashStat.copyWith(
                color: surakshaCrimson,
                fontSize: 40,
              ),
            ),
            Text(label, style: SurakshaTypography.featureCardStat),
          ],
        ),
      );
}
