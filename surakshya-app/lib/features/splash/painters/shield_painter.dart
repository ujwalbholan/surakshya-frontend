library shield_painter;

import 'package:flutter/material.dart';

class ShieldPainter extends CustomPainter {
  ShieldPainter({
    required this.drawProgress,
    required this.fillProgress,
    required this.glowIntensity,
    required this.crimson,
  });

  final double drawProgress;
  final double fillProgress;
  final double glowIntensity;
  final Color crimson;

  @override
  void paint(Canvas canvas, Size size) {
    final path = buildShieldPath(size);

    if (fillProgress > 0) {
      canvas.save();
      canvas.clipPath(path);
      final fillPaint = Paint()
        ..shader = RadialGradient(
          colors: [
            crimson.withValues(alpha: 0.22 * fillProgress),
            crimson.withValues(alpha: 0.05 * fillProgress),
            Colors.transparent,
          ],
          stops: const [0.0, 0.5, 1.0],
        ).createShader(Rect.fromLTWH(0, 0, size.width, size.height));
      canvas.drawPath(path, fillPaint);
      canvas.restore();
    }

    if (drawProgress > 0) {
      final metric = path.computeMetrics().first;
      final drawn =
          metric.extractPath(0, metric.length * drawProgress.clamp(0, 1));

      canvas.drawPath(
        drawn,
        Paint()
          ..color = crimson.withValues(alpha: 0.08 + glowIntensity * 0.12)
          ..strokeWidth = 10
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 4),
      );

      canvas.drawPath(
        drawn,
        Paint()
          ..color = crimson.withValues(alpha: 0.20 + glowIntensity * 0.25)
          ..strokeWidth = 5
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round
          ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 2),
      );

      canvas.drawPath(
        drawn,
        Paint()
          ..color = crimson.withValues(alpha: 0.85 + glowIntensity * 0.15)
          ..strokeWidth = 2.0 - (drawProgress * 0.5)
          ..style = PaintingStyle.stroke
          ..strokeCap = StrokeCap.round,
      );
    }
  }

  static Path buildShieldPath(Size s) {
    final cx = s.width / 2;
    final cy = s.height / 2;
    return Path()
      ..moveTo(cx, cy - s.height * 0.46)
      ..lineTo(cx + s.width * 0.38, cy - s.height * 0.30)
      ..cubicTo(
        cx + s.width * 0.44,
        cy - s.height * 0.10,
        cx + s.width * 0.44,
        cy + s.height * 0.10,
        cx + s.width * 0.38,
        cy + s.height * 0.26,
      )
      ..cubicTo(
        cx + s.width * 0.25,
        cy + s.height * 0.38,
        cx + s.width * 0.10,
        cy + s.height * 0.44,
        cx,
        cy + s.height * 0.48,
      )
      ..cubicTo(
        cx - s.width * 0.10,
        cy + s.height * 0.44,
        cx - s.width * 0.25,
        cy + s.height * 0.38,
        cx - s.width * 0.38,
        cy + s.height * 0.26,
      )
      ..cubicTo(
        cx - s.width * 0.44,
        cy + s.height * 0.10,
        cx - s.width * 0.44,
        cy - s.height * 0.10,
        cx - s.width * 0.38,
        cy - s.height * 0.30,
      )
      ..close();
  }

  @override
  bool shouldRepaint(ShieldPainter old) =>
      old.drawProgress != drawProgress ||
      old.fillProgress != fillProgress ||
      old.glowIntensity != glowIntensity;
}
