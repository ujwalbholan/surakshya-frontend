library ember_painter;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:suraksha/features/splash/models/splash_particle.dart';

class EmberPainter extends CustomPainter {
  EmberPainter({
    required this.embers,
    required this.tick,
    required this.screenW,
    required this.screenH,
    this.enabled = true,
  });

  final List<SplashEmberParticle> embers;
  final double tick;
  final double screenW;
  final double screenH;
  final bool enabled;

  @override
  void paint(Canvas canvas, Size size) {
    if (!enabled) return;

    for (final e in embers) {
      if (tick < e.delay) continue;

      final life = (tick - e.delay).clamp(0.0, 2.0);
      final fadeIn = (life / 0.4).clamp(0.0, 1.0);
      final fadeOut = life > 1.4 ? (2.0 - life) / 0.6 : 1.0;
      final opacity = (fadeIn * fadeOut).clamp(0.0, 1.0);
      if (opacity <= 0) continue;

      final x = e.x * screenW + math.sin(tick * 8 + e.wobble * 100) * 12;
      final y = e.y * screenH - life * 80;

      final paint = Paint()
        ..shader = RadialGradient(
          colors: [
            const Color(0x25C0392B).withValues(alpha: opacity),
            const Color(0x08C0392B).withValues(alpha: opacity * 0.3),
            Colors.transparent,
          ],
        ).createShader(Rect.fromCircle(
          center: Offset(x, y),
          radius: e.size,
        ));

      canvas.drawCircle(Offset(x, y), e.size, paint);
    }
  }

  @override
  bool shouldRepaint(EmberPainter old) =>
      old.tick != tick || old.enabled != enabled;
}
