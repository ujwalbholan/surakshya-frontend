library sos_radar_painter;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/app_constants.dart';

class SosRadarPainter extends CustomPainter {
  SosRadarPainter({
    required this.pulse,
    this.ringIndex = 0,
    this.ringOpacity = 1.0,
  });

  final double pulse;
  final int ringIndex;
  final double ringOpacity;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.55);
    final baseRadius = size.width * 0.12 * (ringIndex + 1);
    final radius = baseRadius + pulse * 12;

    final paint = Paint()
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1
      ..strokeCap = StrokeCap.butt
      ..color = Color.lerp(
        const Color(0xFF1E1E1E),
        const Color(0xFF2A2A2A),
        ringIndex / AppConstants.sosRadarRingCount,
      )!
          .withValues(alpha: (0.2 + ringIndex * 0.08) * ringOpacity);

    canvas.drawArc(
      Rect.fromCircle(center: center, radius: radius),
      math.pi,
      math.pi,
      false,
      paint,
    );
  }

  @override
  bool shouldRepaint(SosRadarPainter old) =>
      old.pulse != pulse ||
      old.ringIndex != ringIndex ||
      old.ringOpacity != ringOpacity;
}

/// Five semicircular radar arcs with sequential sonar pulse.
class SosRadarRings extends StatefulWidget {
  const SosRadarRings({super.key});

  @override
  State<SosRadarRings> createState() => _SosRadarRingsState();
}

class _SosRadarRingsState extends State<SosRadarRings>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 900),
    )..repeat();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _controller,
        builder: (context, _) => LayoutBuilder(
          builder: (context, constraints) {
            return CustomPaint(
              size: Size(constraints.maxWidth, constraints.maxHeight),
              painter: _SonarRadarPainter(
                t: _controller.value,
                ringCount: AppConstants.sosRadarRingCount,
              ),
            );
          },
        ),
      );
}

class _SonarRadarPainter extends CustomPainter {
  _SonarRadarPainter({required this.t, required this.ringCount});

  final double t;
  final int ringCount;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height * 0.55);
    const stagger = 0.18;

    for (var i = 0; i < ringCount; i++) {
      final phase = (t + i * stagger) % 1.0;
      final opacity = (1.0 - phase).clamp(0.0, 1.0);
      final baseRadius = size.width * 0.12 * (i + 1);
      final radius = baseRadius + phase * 8;

      final paint = Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = 1
        ..strokeCap = StrokeCap.butt
        ..color = Color.lerp(
          const Color(0xFF1E1E1E),
          const Color(0xFF2A2A2A),
          i / ringCount,
        )!
            .withValues(alpha: (0.15 + i * 0.06) * opacity);

      canvas.drawArc(
        Rect.fromCircle(center: center, radius: radius),
        math.pi,
        math.pi,
        false,
        paint,
      );
    }
  }

  @override
  bool shouldRepaint(_SonarRadarPainter old) => old.t != t;
}

class SosRadarWithAvatars extends StatelessWidget {
  const SosRadarWithAvatars({
    super.key,
    required this.avatarPaths,
  });

  final List<String> avatarPaths;

  @override
  Widget build(BuildContext context) => Stack(
        alignment: Alignment.center,
        children: [
          const Positioned.fill(child: SosRadarRings()),
          ...avatarPaths.asMap().entries.map((e) {
            final positions = [
              const Offset(0, -115),
              const Offset(85, -55),
              const Offset(-95, -20),
            ];
            final pos = positions[e.key % positions.length];
            return Transform.translate(
              offset: pos,
              child: CircleAvatar(
                radius: 21,
                backgroundImage: AssetImage(e.value),
                onBackgroundImageError: (_, __) {},
              ),
            );
          }),
        ],
      );
}
