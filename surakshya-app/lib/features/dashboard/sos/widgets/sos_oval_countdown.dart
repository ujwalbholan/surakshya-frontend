library sos_oval_countdown;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

/// Draws ~30 dots evenly spaced on the oval perimeter.
/// [progress] 0.0 = just started (all gray), 1.0 = fully filled (all crimson).
class OvalDotCountdownPainter extends CustomPainter {
  OvalDotCountdownPainter({
    required this.progress,
    this.filledColor = surakshaCrimson,
    this.emptyColor = const Color(0xFF333333),
  });

  final double progress;
  final Color filledColor;
  final Color emptyColor;

  @override
  void paint(Canvas canvas, Size size) {
    final rrect = RRect.fromRectAndRadius(
      Rect.fromLTWH(0, 0, size.width, size.height),
      Radius.circular(size.width / 2),
    );

    final trackPath = Path()..addRRect(rrect);
    final pathMetrics = trackPath.computeMetrics().first;
    final totalLength = pathMetrics.length;

    const totalDots = AppConstants.sosOvalDotCount;
    final segmentLength = totalLength / totalDots;
    final startOffset = totalLength * AppConstants.sosOvalDotStartOffset;
    final filledDots = (progress * totalDots).round();

    for (var i = 0; i < totalDots; i++) {
      final pathOffset = (startOffset + (i * segmentLength)) % totalLength;
      final tangent = pathMetrics.getTangentForOffset(pathOffset);
      if (tangent == null) continue;

      final isFilled = i < filledDots;
      canvas.drawCircle(
        tangent.position,
        AppConstants.sosOvalDotRadius,
        Paint()
          ..color = isFilled ? filledColor : emptyColor
          ..style = PaintingStyle.fill
          ..isAntiAlias = true,
      );
    }
  }

  @override
  bool shouldRepaint(OvalDotCountdownPainter old) =>
      old.progress != progress ||
      old.filledColor != filledColor ||
      old.emptyColor != emptyColor;
}

class SosOvalCountdown extends StatefulWidget {
  const SosOvalCountdown({
    super.key,
    required this.seconds,
    required this.totalSeconds,
  });

  final int seconds;
  final int totalSeconds;

  @override
  State<SosOvalCountdown> createState() => _SosOvalCountdownState();
}

class _SosOvalCountdownState extends State<SosOvalCountdown>
    with SingleTickerProviderStateMixin {
  static const _ovalFill = Color(0xFF1A1A1A);

  late final AnimationController _popController;
  late final Animation<double> _popScale;

  @override
  void initState() {
    super.initState();
    _popController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 250),
    );
    _popScale = TweenSequence<double>([
      TweenSequenceItem(
        tween: Tween(begin: 1.0, end: 1.25)
            .chain(CurveTween(curve: Curves.easeOut)),
        weight: 40,
      ),
      TweenSequenceItem(
        tween: Tween(begin: 1.25, end: 1.0)
            .chain(CurveTween(curve: Curves.easeIn)),
        weight: 60,
      ),
    ]).animate(_popController);
  }

  @override
  void didUpdateWidget(SosOvalCountdown oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.seconds != widget.seconds) {
      _popController.forward(from: 0);
    }
  }

  @override
  void dispose() {
    _popController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final progress = widget.totalSeconds > 0
        ? (widget.totalSeconds - widget.seconds) / widget.totalSeconds
        : 1.0;

    const pad = AppConstants.sosOvalPainterPad;
    const painterW = AppConstants.sosOvalWidth + pad * 2;
    const painterH = AppConstants.sosOvalHeight + pad * 2;

    return SizedBox(
      width: painterW,
      height: painterH,
      child: Stack(
        alignment: Alignment.center,
        children: [
          RepaintBoundary(
            child: CustomPaint(
              size: Size(painterW, painterH),
              painter: OvalDotCountdownPainter(progress: progress),
            ),
          ),
          Container(
            width: AppConstants.sosOvalWidth,
            height: AppConstants.sosOvalHeight,
            decoration: BoxDecoration(
              color: _ovalFill,
              borderRadius: BorderRadius.circular(AppConstants.sosOvalRadius),
            ),
          ),
          AnimatedBuilder(
            animation: _popController,
            builder: (_, child) => Transform.scale(
              scale: _popScale.value,
              child: child,
            ),
            child: Text(
              '${widget.seconds}',
              style: const TextStyle(
                fontSize: 64,
                fontWeight: FontWeight.w900,
                color: surakshaForeground,
                height: 1,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
