library splash_atmosphere;

import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:suraksha/features/splash/painters/splash_ambient_painter.dart';
import 'package:suraksha/features/splash/splash_timeline.dart';

class SplashAtmosphere extends StatelessWidget {
  const SplashAtmosphere({
    super.key,
    required this.phases,
    required this.centerX,
    required this.centerY,
    this.disableAnimations = false,
  });

  final SplashPhases phases;
  final double centerX;
  final double centerY;
  final bool disableAnimations;

  @override
  Widget build(BuildContext context) {
    final intensity = disableAnimations ? 0.65 : phases.atmosphere;
    final size = MediaQuery.sizeOf(context);
    final bloomSize = (size.shortestSide * 0.72).clamp(200.0, 640.0);
    final bloomScale = disableAnimations ? 1.0 : 0.6 + intensity * 0.4;

    return Stack(
      fit: StackFit.expand,
      children: [
        const ColoredBox(color: Color(0xFF000000)),
        Positioned(
          left: centerX - bloomSize / 2,
          top: centerY - bloomSize / 2,
          child: Transform.scale(
            scale: bloomScale,
            child: ImageFiltered(
              imageFilter: ImageFilter.blur(sigmaX: 56, sigmaY: 56),
              child: Opacity(
                opacity: intensity,
                child: Container(
                  width: bloomSize,
                  height: bloomSize,
                  decoration: const BoxDecoration(
                    shape: BoxShape.circle,
                    gradient: RadialGradient(
                      colors: [
                        Color(0x3D8B1A1A),
                        Color(0x1AC0392B),
                        Color(0x00000000),
                      ],
                      stops: [0.0, 0.38, 0.72],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ),
        CustomPaint(
          painter: SplashAmbientPainter(
            time: disableAnimations ? 0.5 : phases.ambientTime * 3,
            centerX: centerX,
            centerY: centerY,
            intensity: intensity,
          ),
          child: const SizedBox.expand(),
        ),
        Positioned.fill(
          child: Opacity(
            opacity: 0.85 + intensity * 0.15,
            child: const DecoratedBox(
              decoration: BoxDecoration(
                gradient: RadialGradient(
                  center: Alignment.center,
                  radius: 1.0,
                  colors: [
                    Color(0x00000000),
                    Color(0xB3000000),
                  ],
                  stops: [0.34, 1.0],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
