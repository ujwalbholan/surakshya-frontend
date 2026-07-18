library wristband_sos_target;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

/// Visual stand-in for the band; double-tap forwards to [WristbandSosService]
/// (same event path as a real BLE double-tap).
class WristbandSosTarget extends StatefulWidget {
  const WristbandSosTarget({
    super.key,
    required this.onDoubleTap,
  });

  final VoidCallback onDoubleTap;

  @override
  State<WristbandSosTarget> createState() => _WristbandSosTargetState();
}

class _WristbandSosTargetState extends State<WristbandSosTarget>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulseController;

  @override
  void initState() {
    super.initState();
    _pulseController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1400),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _pulseController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => GestureDetector(
        onDoubleTap: widget.onDoubleTap,
        child: Semantics(
          label: CopyConstants.sosAwaitBandTitle,
          button: true,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              AnimatedBuilder(
                animation: _pulseController,
                builder: (_, child) => Transform.scale(
                  scale: 1.0 + _pulseController.value * 0.06,
                  child: child,
                ),
                child: Container(
                  width: 120,
                  height: 120,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: surakshaSecondary,
                    border: Border.all(
                      color: surakshaYellow.withValues(
                        alpha: 0.4 + _pulseController.value * 0.3,
                      ),
                      width: 2,
                    ),
                    boxShadow: const [
                      BoxShadow(
                        color: surakshaYellowGlow,
                        blurRadius: 24,
                        spreadRadius: 4,
                      ),
                    ],
                  ),
                  child: const Icon(
                    Icons.watch_outlined,
                    size: 56,
                    color: surakshaYellow,
                  ),
                ),
              ),
              const SizedBox(height: S.lg),
              Text(
                CopyConstants.sosAwaitBandTitle,
                textAlign: TextAlign.center,
                style: SurakshaTypography.dashGreeting.copyWith(fontSize: 20),
              ),
              const SizedBox(height: S.sm),
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: S.xl),
                child: Text(
                  CopyConstants.sosAwaitBandBody,
                  textAlign: TextAlign.center,
                  style: SurakshaTypography.bodyMedium.copyWith(
                    color: surakshaMuted,
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}
