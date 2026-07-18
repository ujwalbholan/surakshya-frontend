library splash_ambient_painter;

import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Slow-moving light streaks and pulse rings for depth on splash.
class SplashAmbientPainter extends CustomPainter {
  SplashAmbientPainter({
    required this.time,
    required this.centerX,
    required this.centerY,
    required this.intensity,
  });

  final double time;
  final double centerX;
  final double centerY;
  final double intensity;

  @override
  void paint(Canvas canvas, Size size) {
    if (intensity <= 0) return;

    final sweep = time * 2 * math.pi;
    for (var i = 0; i < 5; i++) {
      final angle = sweep + i * math.pi * 0.4;
      final len = size.longestSide * 0.9;
      final start = Offset(
        centerX + math.cos(angle) * 40,
        centerY + math.sin(angle) * 40,
      );
      final end = Offset(
        centerX + math.cos(angle) * len,
        centerY + math.sin(angle) * len,
      );
      canvas.drawLine(
        start,
        end,
        Paint()
          ..shader = LinearGradient(
            colors: [
              const Color(0x00E74C3C),
              const Color(0x18C0392B).withValues(alpha: 0.12 * intensity),
              const Color(0x00C0392B),
            ],
          ).createShader(Rect.fromPoints(start, end))
          ..strokeWidth = 1.2 + i * 0.3
          ..strokeCap = StrokeCap.round,
      );
    }

  }

  @override
  bool shouldRepaint(SplashAmbientPainter old) =>
      old.time != time || old.intensity != intensity;
}
