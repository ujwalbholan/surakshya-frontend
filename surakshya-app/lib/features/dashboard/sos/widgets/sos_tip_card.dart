library sos_tip_card;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class SosTipCard extends StatelessWidget {
  const SosTipCard({
    super.key,
    required this.phase,
    this.countdownSeconds = 5,
  });

  final SosPhase phase;
  final int countdownSeconds;

  @override
  Widget build(BuildContext context) {
    final (icon, title, body) = switch (phase) {
      SosPhase.idle => (
          Icons.watch_outlined,
          CopyConstants.sosIdleTitle,
          CopyConstants.sosIdleBody,
        ),
      SosPhase.counting => (
          Icons.timer_outlined,
          CopyConstants.sosCountingTitle,
          CopyConstants.sosCountingBody,
        ),
      SosPhase.dispatching => (
          Icons.send_outlined,
          CopyConstants.sosDispatchTitle,
          CopyConstants.sosDispatchBody,
        ),
      SosPhase.active => (
          Icons.warning_amber_rounded,
          CopyConstants.sosActiveTitle,
          CopyConstants.sosActiveBody,
        ),
      SosPhase.resolved => (
          Icons.check_circle_outline,
          CopyConstants.sosResolvedTitle,
          CopyConstants.sosResolvedBody,
        ),
    };

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: S.lg),
      child: Column(
        children: [
          Icon(icon, color: surakshaCrimson, size: 28),
          const SizedBox(height: S.sm),
          Text(
            title,
            textAlign: TextAlign.center,
            style: SurakshaTypography.dashGreeting.copyWith(fontSize: 20),
          ),
          const SizedBox(height: S.sm),
          Text(
            body,
            textAlign: TextAlign.center,
            style: SurakshaTypography.bodyMedium.copyWith(color: surakshaMuted),
          ),
        ],
      ),
    );
  }
}
