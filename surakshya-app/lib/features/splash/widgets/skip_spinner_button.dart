library skip_spinner_button;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

/// Skip control with a white 6-bar orbiting spinner and centered label.
class SkipSpinnerButton extends StatefulWidget {
  const SkipSpinnerButton({
    super.key,
    required this.onTap,
    this.disabled = false,
  });

  final VoidCallback onTap;
  final bool disabled;

  @override
  State<SkipSpinnerButton> createState() => _SkipSpinnerButtonState();
}

class _SkipSpinnerButtonState extends State<SkipSpinnerButton>
    with SingleTickerProviderStateMixin {
  static const _spinDuration = Duration(milliseconds: 1200);
  static const _textPadding = 8.0;
  static const _minSize = 56.0;
  static const _maxSize = 68.0;

  static final TextStyle _labelStyle = GoogleFonts.inter(
    fontSize: 11,
    fontWeight: FontWeight.w500,
    letterSpacing: 0.5,
    color: surakshaForeground,
  );

  late final AnimationController _controller;
  late final double _size;

  @override
  void initState() {
    super.initState();
    _size = _computeSize();
    _controller = AnimationController(vsync: this, duration: _spinDuration)
      ..repeat();
  }

  double _computeSize() {
    final painter = TextPainter(
      text: TextSpan(text: 'Skip', style: _labelStyle),
      textDirection: TextDirection.ltr,
    )..layout();

    final innerDiameter = painter.width + _textPadding * 2;
    final barHeight = innerDiameter * 0.075;
    final computed = innerDiameter + barHeight * 4;
    return computed.clamp(_minSize, _maxSize);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (widget.disabled) return const SizedBox.shrink();

    return Semantics(
      button: true,
      label: 'Skip',
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: widget.onTap,
        child: SizedBox(
          width: _size,
          height: _size,
          child: Stack(
            alignment: Alignment.center,
            children: [
              AnimatedBuilder(
                animation: _controller,
                builder: (context, child) {
                  return CustomPaint(
                    size: Size(_size, _size),
                    painter: _SpinnerRingPainter(
                      progress: _controller.value,
                      size: _size,
                    ),
                  );
                },
              ),
              Text('Skip', style: _labelStyle),
            ],
          ),
        ),
      ),
    );
  }
}

class _SpinnerRingPainter extends CustomPainter {
  _SpinnerRingPainter({
    required this.progress,
    required this.size,
  });

  final double progress;
  final double size;

  static const _barCount = 6;
  static const _staggerMs = 100.0;
  static const _spinMs = 1200.0;

  @override
  void paint(Canvas canvas, Size canvasSize) {
    final barWidth = size * 0.2;
    final barHeight = size * 0.075;
    final radius = size / 2 - barHeight;
    final center = Offset(canvasSize.width / 2, canvasSize.height / 2);
    final paint = Paint()
      ..color = surakshaForeground
      ..style = PaintingStyle.fill;

    final rrect = RRect.fromRectAndRadius(
      Rect.fromCenter(
        center: Offset.zero,
        width: barWidth,
        height: barHeight,
      ),
      Radius.circular(barHeight / 2),
    );

    for (var i = 0; i < _barCount; i++) {
      final stagger = i * _staggerMs / _spinMs;
      final angle = (progress + stagger) * 2 * math.pi - math.pi / 2;
      final x = center.dx + math.cos(angle) * radius;
      final y = center.dy + math.sin(angle) * radius;

      canvas.save();
      canvas.translate(x, y);
      canvas.rotate(angle + math.pi / 2);
      canvas.drawRRect(rrect, paint);
      canvas.restore();
    }
  }

  @override
  bool shouldRepaint(_SpinnerRingPainter old) =>
      old.progress != progress || old.size != size;
}
