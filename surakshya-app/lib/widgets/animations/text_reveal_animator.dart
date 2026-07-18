library text_reveal_animator;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_animations.dart';

class TextRevealAnimator extends StatefulWidget {
  const TextRevealAnimator({
    super.key,
    required this.text,
    required this.style,
    required this.triggered,
    this.perWordDelay = const Duration(milliseconds: 70),
  });

  final String text;
  final TextStyle style;
  final bool triggered;
  final Duration perWordDelay;

  @override
  State<TextRevealAnimator> createState() => _TextRevealAnimatorState();
}

class _TextRevealAnimatorState extends State<TextRevealAnimator>
    with TickerProviderStateMixin {
  late final List<AnimationController> _controllers;
  late final List<Animation<double>> _opacities;
  late final List<Animation<Offset>> _slides;
  late final List<String> _words;

  @override
  void initState() {
    super.initState();
    _words = widget.text.split(' ');
    _controllers = List.generate(
      _words.length,
      (i) => AnimationController(
        vsync: this,
        duration: SurakshaAnimations.textReveal,
      ),
    );
    _opacities = _controllers
        .map(
          (c) => CurvedAnimation(
            parent: c,
            curve: SurakshaAnimations.heroText,
          ),
        )
        .toList();
    _slides = _controllers
        .map(
          (c) => Tween<Offset>(
            begin: const Offset(0, 0.3),
            end: Offset.zero,
          ).animate(
            CurvedAnimation(
              parent: c,
              curve: SurakshaAnimations.easeOutExpo,
            ),
          ),
        )
        .toList();
    if (widget.triggered) _playStaggered();
  }

  @override
  void didUpdateWidget(TextRevealAnimator old) {
    super.didUpdateWidget(old);
    if (widget.triggered && !old.triggered) _playStaggered();
  }

  Future<void> _playStaggered() async {
    for (var i = 0; i < _controllers.length; i++) {
      await Future<void>.delayed(widget.perWordDelay * i);
      if (mounted) await _controllers[i].forward();
    }
  }

  @override
  void dispose() {
    for (final c in _controllers) {
      c.dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Wrap(
        children: List.generate(
          _words.length,
          (i) => Padding(
            padding: const EdgeInsets.only(right: 6),
            child: FadeTransition(
              opacity: _opacities[i],
              child: SlideTransition(
                position: _slides[i],
                child: Text(_words[i], style: widget.style),
              ),
            ),
          ),
        ),
      );
}
