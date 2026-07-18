library auth_reveal_transition;

import 'package:flutter/material.dart';

const _slideOffsetFraction = 0.12;
const _revealDuration = Duration(milliseconds: 650);
const _revealDelay = Duration(milliseconds: 100);
const _revealCurve = Curves.easeOutCubic;

/// Bottom-to-up reveal for auth form content.
///
/// Runs a one-shot slide-and-fade on first mount. When [disableAnimations] is
/// true, or when [MediaQuery.disableAnimationsOf] reports reduced motion, the
/// child is shown immediately at full opacity with no offset.
class AuthRevealTransition extends StatefulWidget {
  const AuthRevealTransition({
    super.key,
    required this.child,
    this.disableAnimations = false,
  });

  final Widget child;
  final bool disableAnimations;

  @override
  State<AuthRevealTransition> createState() => _AuthRevealTransitionState();
}

class _AuthRevealTransitionState extends State<AuthRevealTransition>
    with SingleTickerProviderStateMixin {
  AnimationController? _controller;
  Animation<Offset>? _slideAnimation;
  Animation<double>? _fadeAnimation;
  bool _animationScheduled = false;

  bool _shouldAnimate(BuildContext context) {
    return !widget.disableAnimations &&
        !MediaQuery.disableAnimationsOf(context);
  }

  @override
  void didChangeDependencies() {
    super.didChangeDependencies();
    if (_animationScheduled || !_shouldAnimate(context)) return;
    _animationScheduled = true;

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted || !_shouldAnimate(context)) return;
      _initAnimation();
      Future<void>.delayed(_revealDelay, () {
        if (mounted && _controller != null) {
          _controller!.forward();
        }
      });
    });
  }

  void _initAnimation() {
    if (_controller != null) return;

    final controller = AnimationController(
      vsync: this,
      duration: _revealDuration,
    );
    _controller = controller;

    final curved = CurvedAnimation(parent: controller, curve: _revealCurve);
    _slideAnimation = Tween<Offset>(
      begin: const Offset(0, _slideOffsetFraction),
      end: Offset.zero,
    ).animate(curved);
    _fadeAnimation = Tween<double>(begin: 0, end: 1).animate(curved);
    setState(() {});
  }

  @override
  void dispose() {
    _controller?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (!_shouldAnimate(context)) {
      return widget.child;
    }

    final slide = _slideAnimation;
    final fade = _fadeAnimation;
    if (slide == null || fade == null) {
      return Opacity(opacity: 0, child: widget.child);
    }

    return FadeTransition(
      opacity: fade,
      child: SlideTransition(
        position: slide,
        child: widget.child,
      ),
    );
  }
}
