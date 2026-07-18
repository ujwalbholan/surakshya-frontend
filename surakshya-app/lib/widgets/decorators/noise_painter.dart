library noise_painter;

import 'dart:math' as math;

import 'package:flutter/material.dart';

class NoisePainter extends CustomPainter {
  NoisePainter({required this.seed, required this.opacity});

  final int seed;
  final double opacity;

  @override
  void paint(Canvas canvas, Size size) {
    final random = math.Random(seed);
    final paint = Paint();
    for (var i = 0; i < 2000; i++) {
      final x = random.nextDouble() * size.width;
      final y = random.nextDouble() * size.height;
      final w = 1 + random.nextDouble() * 2;
      final alpha = random.nextDouble() * opacity;
      paint.color = Colors.white.withValues(alpha: alpha);
      canvas.drawRect(Rect.fromLTWH(x, y, w, w), paint);
    }
  }

  @override
  bool shouldRepaint(NoisePainter old) => old.seed != seed || old.opacity != opacity;
}
