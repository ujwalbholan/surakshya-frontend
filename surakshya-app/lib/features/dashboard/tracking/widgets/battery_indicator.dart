library battery_indicator;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class BatteryIndicator extends StatelessWidget {
  const BatteryIndicator({super.key, required this.percent});

  final int percent;

  Color get _color {
    if (percent <= 20) return statusRed;
    if (percent <= 50) return statusAmber;
    return statusGreen;
  }

  @override
  Widget build(BuildContext context) => CustomPaint(
        size: const Size(22, 12),
        painter: _BatteryPainter(percent: percent, color: _color),
      );
}

class _BatteryPainter extends CustomPainter {
  _BatteryPainter({required this.percent, required this.color});

  final int percent;
  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final body = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 1, size.width - 4, size.height - 2),
      const Radius.circular(2),
    );
    canvas.drawRRect(
      body,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1.2
        ..color = color,
    );
    canvas.drawRect(
      Rect.fromLTWH(size.width - 3, size.height * 0.3, 2, size.height * 0.4),
      Paint()..color = color,
    );
    final fillW = (size.width - 8) * (percent / 100);
    if (fillW > 0) {
      canvas.drawRRect(
        RRect.fromRectAndRadius(
          Rect.fromLTWH(2, 3, fillW, size.height - 6),
          const Radius.circular(1),
        ),
        Paint()..color = color,
      );
    }
  }

  @override
  bool shouldRepaint(_BatteryPainter old) =>
      old.percent != percent || old.color != color;
}
