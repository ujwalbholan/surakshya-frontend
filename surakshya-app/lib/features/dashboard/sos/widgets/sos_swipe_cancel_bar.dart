library sos_swipe_cancel_bar;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/core/utils/haptics.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

/// Crimson pill swipe-to-cancel bar per SOS countdown reference.
class SosSwipeCancelBar extends StatefulWidget {
  const SosSwipeCancelBar({
    super.key,
    required this.onCancelled,
  });

  final VoidCallback onCancelled;

  @override
  State<SosSwipeCancelBar> createState() => _SosSwipeCancelBarState();
}

class _SosSwipeCancelBarState extends State<SosSwipeCancelBar>
    with TickerProviderStateMixin {
  static const _trackBg = Color(0xFF1E1E1E);
  static const _trackBorder = Color(0xFF2A2A2A);
  static const _barHeight = 52.0;
  static const _horizontalMargin = 16.0;

  /// Shared between the rendered label and [_measureLabelWidth] so the drag
  /// math matches the actual glyph widths.
  static final TextStyle _labelStyle = GoogleFonts.inter(
    color: surakshaForeground,
    fontSize: 14,
    fontWeight: FontWeight.w500,
  );

  double _dragX = 0;
  bool _isDragging = false;

  late final AnimationController _chevronController;

  @override
  void initState() {
    super.initState();
    _chevronController = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 500),
    )..repeat();
  }

  @override
  void dispose() {
    _chevronController.dispose();
    super.dispose();
  }

  void _onDragUpdate(double delta, double maxDrag) {
    setState(() {
      _isDragging = true;
      _dragX = (_dragX + delta).clamp(0, maxDrag);
    });
  }

  void _onDragEnd(double maxDrag) {
    if (_dragX >= maxDrag * 0.8) {
      triggerHaptic(HapticPattern.medium);
      widget.onCancelled();
    }
    setState(() {
      _isDragging = false;
      _dragX = 0;
    });
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final trackWidth = constraints.maxWidth - _horizontalMargin * 2;
        const pillPadH = 20.0;
        const pillPadV = 12.0;
        final labelWidth = _measureLabelWidth(context) + pillPadH * 2;
        final maxDrag = (trackWidth - labelWidth - 8).clamp(0.0, double.infinity);

        return Padding(
          padding: const EdgeInsets.fromLTRB(
            _horizontalMargin,
            12,
            _horizontalMargin,
            0,
          ),
          child: GestureDetector(
            onHorizontalDragUpdate: (d) => _onDragUpdate(d.delta.dx, maxDrag),
            onHorizontalDragEnd: (_) => _onDragEnd(maxDrag),
            child: Container(
              height: _barHeight,
              decoration: BoxDecoration(
                color: _trackBg,
                borderRadius: BorderRadius.circular(100),
                border: Border.all(color: _trackBorder, width: 0.5),
              ),
              child: Stack(
                clipBehavior: Clip.none,
                children: [
                  if (_dragX > 0)
                    Positioned.fill(
                      child: Padding(
                        padding: const EdgeInsets.all(4),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Container(
                            width: _dragX + labelWidth,
                            decoration: BoxDecoration(
                              color: surakshaCrimson.withValues(
                                alpha: 0.15 + 0.1 * (_dragX / maxDrag),
                              ),
                              borderRadius: BorderRadius.circular(100),
                            ),
                          ),
                        ),
                      ),
                    ),
                  AnimatedPositioned(
                    duration: _isDragging
                        ? Duration.zero
                        : const Duration(milliseconds: 300),
                    curve: Curves.easeOutBack,
                    left: 4 + _dragX,
                    top: 4,
                    bottom: 4,
                    child: Container(
                      padding: const EdgeInsets.symmetric(
                        horizontal: pillPadH,
                        vertical: pillPadV,
                      ),
                      decoration: BoxDecoration(
                        color: _dragX >= maxDrag * 0.8
                            ? surakshaCrimsonLight
                            : surakshaCrimson,
                        borderRadius: BorderRadius.circular(100),
                      ),
                      child: Text(
                        CopyConstants.swipeToCancelLabel,
                        style: _labelStyle,
                      ),
                    ),
                  ),
                  Positioned(
                    right: 20,
                    top: 0,
                    bottom: 0,
                    child: _ChevronBlinkRow(animation: _chevronController),
                  ),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  double _measureLabelWidth(BuildContext context) {
    final painter = TextPainter(
      text: TextSpan(
        text: CopyConstants.swipeToCancelLabel,
        style: _labelStyle,
      ),
      textDirection: TextDirection.ltr,
    )..layout();
    return painter.width;
  }
}

class _ChevronBlinkRow extends StatelessWidget {
  const _ChevronBlinkRow({required this.animation});

  final Animation<double> animation;

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: animation,
        builder: (_, __) => Row(
          mainAxisSize: MainAxisSize.min,
          children: List.generate(3, (i) {
            final phase = (animation.value + i * 0.15) % 1.0;
            final opacity = phase < 0.5 ? phase * 2 : (1 - phase) * 2;
            return Padding(
              padding: const EdgeInsets.only(left: 4),
              child: Opacity(
                opacity: 0.3 + opacity * 0.7,
                child: const Text(
                  '›',
                  style: TextStyle(
                    fontSize: 18,
                    color: surakshaMuted,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            );
          }),
        ),
      );
}
