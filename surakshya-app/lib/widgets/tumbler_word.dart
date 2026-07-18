library tumbler_word;

import 'dart:async';

import 'package:flutter/material.dart';

/// Letter-drum wordmark: each glyph stacks a duplicate; when [active], the drum
/// slides up (`translateY(-50%)`) with a staggered delay per letter — the
/// Flutter equivalent of CSS `.tumbler-link` / `.letter-drum`.
class TumblerWord extends StatefulWidget {
  const TumblerWord({
    super.key,
    required this.text,
    required this.style,
    required this.active,
    this.stagger = const Duration(milliseconds: 28),
    this.duration = const Duration(milliseconds: 420),
    this.curve = Curves.easeInOutCubic,
    this.letterSpacing = 0,
  });

  final String text;
  final TextStyle style;
  final bool active;
  final Duration stagger;
  final Duration duration;
  final Curve curve;
  final double letterSpacing;

  @override
  State<TumblerWord> createState() => _TumblerWordState();
}

class _TumblerWordState extends State<TumblerWord>
    with TickerProviderStateMixin {
  late final List<String> _letters;
  late final List<AnimationController> _controllers;
  late final List<CurvedAnimation> _curves;
  final List<Timer> _staggerTimers = [];

  @override
  void initState() {
    super.initState();
    _letters = widget.text.characters.map((c) => c).toList();
    _controllers = List.generate(
      _letters.length,
      (_) => AnimationController(vsync: this, duration: widget.duration),
    );
    _curves = _controllers
        .map(
          (c) => CurvedAnimation(parent: c, curve: widget.curve),
        )
        .toList();
    if (widget.active) {
      _run(forward: true);
    }
  }

  @override
  void didUpdateWidget(TumblerWord oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.active != widget.active) {
      _run(forward: widget.active);
    }
  }

  void _clearStaggerTimers() {
    for (final timer in _staggerTimers) {
      timer.cancel();
    }
    _staggerTimers.clear();
  }

  void _run({required bool forward}) {
    _clearStaggerTimers();
    for (var i = 0; i < _controllers.length; i++) {
      final controller = _controllers[i];
      final timer = Timer(widget.stagger * i, () {
        if (!mounted) return;
        if (forward) {
          controller.forward();
        } else {
          controller.reverse();
        }
      });
      _staggerTimers.add(timer);
    }
  }

  @override
  void dispose() {
    _clearStaggerTimers();
    for (final curve in _curves) {
      curve.dispose();
    }
    for (final controller in _controllers) {
      controller.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: [
        for (var i = 0; i < _letters.length; i++) ...[
          if (i > 0 && widget.letterSpacing > 0)
            SizedBox(width: widget.letterSpacing),
          _TumblerLetterDrum(
            letter: _letters[i],
            style: widget.style,
            progress: _curves[i],
          ),
        ],
      ],
    );
  }
}

class _TumblerLetterDrum extends StatelessWidget {
  const _TumblerLetterDrum({
    required this.letter,
    required this.style,
    required this.progress,
  });

  final String letter;
  final TextStyle style;
  final Animation<double> progress;

  @override
  Widget build(BuildContext context) {
    final display = letter == ' ' ? '\u00A0' : letter;
    final painter = TextPainter(
      text: TextSpan(text: display, style: style),
      textDirection: TextDirection.ltr,
      maxLines: 1,
    )..layout();
    final glyphHeight = painter.height;
    final glyphWidth = painter.width.clamp(1.0, double.infinity);

    return SizedBox(
      width: glyphWidth,
      height: glyphHeight,
      child: ClipRect(
        child: AnimatedBuilder(
          animation: progress,
          builder: (context, _) {
            return Transform.translate(
              offset: Offset(0, -glyphHeight * progress.value),
              child: OverflowBox(
                minHeight: glyphHeight * 2,
                maxHeight: glyphHeight * 2,
                alignment: Alignment.topCenter,
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    SizedBox(
                      width: glyphWidth,
                      height: glyphHeight,
                      child: Center(
                        child: Text(
                          display,
                          style: style,
                          maxLines: 1,
                          softWrap: false,
                        ),
                      ),
                    ),
                    SizedBox(
                      width: glyphWidth,
                      height: glyphHeight,
                      child: Center(
                        child: Text(
                          display,
                          style: style,
                          maxLines: 1,
                          softWrap: false,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}
