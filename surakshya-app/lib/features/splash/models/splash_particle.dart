library splash_particle;

import 'dart:math' as math;
import 'dart:ui';

class SplashParticle {
  SplashParticle({
    required this.orbitRadius,
    required this.orbitAngle,
    required this.orbitRadiusY,
    required this.speed,
    required this.size,
    required this.targetOpacity,
    required this.color,
    required this.fadeDelay,
  });

  final double orbitRadius;
  double orbitAngle;
  final double orbitRadiusY;
  final double speed;
  final double size;
  final double targetOpacity;
  final Color color;
  final double fadeDelay;
}

class SplashEmberParticle {
  SplashEmberParticle({
    required this.x,
    required this.y,
    required this.size,
    required this.speed,
    required this.wobble,
    required this.delay,
    this.opacity = 0,
  });

  final double x;
  double y;
  final double size;
  final double speed;
  final double wobble;
  final double delay;
  double opacity;
}

class SplashConvergenceParticle {
  SplashConvergenceParticle({
    required this.startX,
    required this.startY,
    required this.angle,
  });

  final double startX;
  final double startY;
  final double angle;
}

Color splashParticleColor(math.Random rng) {
  final roll = rng.nextDouble();
  if (roll < 0.60) return const Color(0x30C0392B);
  if (roll < 0.85) return const Color(0x20FFFFFF);
  return const Color(0x40E74C3C);
}
