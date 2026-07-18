library map_markers;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class UserMapPin extends StatelessWidget {
  const UserMapPin({super.key, required this.avatarPath});

  final String avatarPath;

  @override
  Widget build(BuildContext context) => Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 52,
            height: 52,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: surakshaForeground, width: 3),
              boxShadow: [
                BoxShadow(
                  color: surakshaBlack.withValues(alpha: 0.5),
                  blurRadius: 8,
                ),
              ],
            ),
            child: ClipOval(
              child: Image.asset(
                avatarPath,
                fit: BoxFit.cover,
                errorBuilder: (_, __, ___) => const Icon(
                  Icons.person,
                  color: surakshaForeground,
                ),
              ),
            ),
          ),
          CustomPaint(
            size: const Size(16, 10),
            painter: _PinTailPainter(),
          ),
        ],
      );
}

class _PinTailPainter extends CustomPainter {
  @override
  void paint(Canvas canvas, Size size) {
    final path = Path()
      ..moveTo(size.width / 2, size.height)
      ..lineTo(0, 0)
      ..lineTo(size.width, 0)
      ..close();
    canvas.drawPath(path, Paint()..color = surakshaForeground);
  }

  @override
  bool shouldRepaint(covariant CustomPainter oldDelegate) => false;
}

class DestinationMapMarker extends StatelessWidget {
  const DestinationMapMarker({super.key});

  @override
  Widget build(BuildContext context) => Container(
        width: 36,
        height: 36,
        decoration: BoxDecoration(
          shape: BoxShape.circle,
          color: dashboardCard,
          border: Border.all(color: surakshaForeground, width: 1.5),
        ),
        child: const Icon(
          Icons.work_outline,
          color: surakshaForeground,
          size: 18,
        ),
      );
}
