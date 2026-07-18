library sos_center_display;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/features/dashboard/sos/widgets/sos_oval_countdown.dart';
import 'package:suraksha/features/dashboard/sos/widgets/wristband_sos_target.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class SosCenterDisplay extends StatelessWidget {
  const SosCenterDisplay({
    super.key,
    required this.phase,
    required this.seconds,
    required this.totalSeconds,
    required this.onBandDoubleTap,
    required this.onCancelTap,
  });

  final SosPhase phase;
  final int seconds;
  final int totalSeconds;
  final VoidCallback onBandDoubleTap;
  final VoidCallback onCancelTap;

  @override
  Widget build(BuildContext context) {
    switch (phase) {
      case SosPhase.idle:
        return WristbandSosTarget(onDoubleTap: onBandDoubleTap);
      case SosPhase.counting:
        return SosOvalCountdown(
          seconds: seconds,
          totalSeconds: totalSeconds,
        );
      case SosPhase.dispatching:
        return const _DispatchDots();
      case SosPhase.active:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: surakshaCrimson.withValues(alpha: 0.2),
                border: Border.all(color: surakshaCrimson, width: 3),
              ),
              child: const Icon(
                Icons.sos_rounded,
                size: 48,
                color: surakshaCrimson,
              ),
            ),
            const SizedBox(height: 16),
            Text(
              CopyConstants.sosActivatedTitle,
              style: SurakshaTypography.dashTitle.copyWith(
                color: surakshaForeground,
              ),
            ),
          ],
        );
      case SosPhase.resolved:
        return Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Container(
              width: 100,
              height: 100,
              decoration: const BoxDecoration(
                shape: BoxShape.circle,
                color: surakshaSuccess,
              ),
              child: const Icon(
                Icons.check_rounded,
                size: 56,
                color: surakshaForeground,
              ),
            ),
            const SizedBox(height: 16),
            TextButton(
              onPressed: onCancelTap,
              child: Text(
                CopyConstants.cancelSos,
                style: SurakshaTypography.dashTitle.copyWith(
                  color: surakshaMuted,
                ),
              ),
            ),
          ],
        );
    }
  }
}

class _DispatchDots extends StatefulWidget {
  const _DispatchDots();

  @override
  State<_DispatchDots> createState() => _DispatchDotsState();
}

class _DispatchDotsState extends State<_DispatchDots>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _controller,
        builder: (_, __) {
          return Row(
            mainAxisSize: MainAxisSize.min,
            children: List.generate(3, (i) {
              final delay = i * 0.2;
              final t = (_controller.value + delay) % 1.0;
              final scale = 0.6 + 0.4 * (t < 0.5 ? t * 2 : (1 - t) * 2);
              return Padding(
                padding: const EdgeInsets.symmetric(horizontal: 6),
                child: Transform.scale(
                  scale: scale,
                  child: Container(
                    width: 14,
                    height: 14,
                    decoration: const BoxDecoration(
                      color: surakshaCrimson,
                      shape: BoxShape.circle,
                    ),
                  ),
                ),
              );
            }),
          );
        },
      );
}
