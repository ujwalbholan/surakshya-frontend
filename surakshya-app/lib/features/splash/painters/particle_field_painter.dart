library particle_field_painter;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:suraksha/features/splash/models/splash_particle.dart';

class ParticleFieldPainter extends CustomPainter {
  ParticleFieldPainter({
    required this.particles,
    required this.tick,
    required this.centerX,
    required this.centerY,
    this.exitProgress = 0,
  });

  final List<SplashParticle> particles;
  final double tick;
  final double centerX;
  final double centerY;
  final double exitProgress;

  @override
  void paint(Canvas canvas, Size size) {
    for (final p in particles) {
      final fadeProgress =
          ((tick - p.fadeDelay * 8) / 14.0).clamp(0.0, 1.0);
      if (fadeProgress <= 0) continue;

      final angle = p.orbitAngle + tick * 2 * math.pi * p.speed;
      var x = centerX + math.cos(angle) * p.orbitRadius;
      var y = centerY + math.sin(angle) * p.orbitRadius * p.orbitRadiusY;

      if (exitProgress > 0) {
        x = x + (centerX - x) * exitProgress;
        y = y + (centerY - y) * exitProgress;
      }

      final alpha = (p.color.a * p.targetOpacity * fadeProgress).clamp(0.0, 1.0);
      if (alpha <= 0) continue;

      canvas.drawCircle(
        Offset(x, y),
        p.size * (1 - exitProgress * 0.5),
        Paint()
          ..color = p.color.withValues(alpha: alpha)
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 1.5),
      );
    }
  }

  @override
  bool shouldRepaint(ParticleFieldPainter old) =>
      old.tick != tick || old.exitProgress != exitProgress;
}
