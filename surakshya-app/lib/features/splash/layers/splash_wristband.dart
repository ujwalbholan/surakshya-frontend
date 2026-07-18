library splash_wristband;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:suraksha/features/splash/painters/splash_wristband_painter.dart';
import 'package:suraksha/features/splash/splash_timeline.dart';

/// Glossy burgundy torus — timeline entry + continuous float/turn.
class SplashWristband extends StatefulWidget {
  const SplashWristband({
    super.key,
    required this.phases,
    this.disableAnimations = false,
    this.scaleMultiplier = 1.0,
    this.ringSizeFactor = 0.34,
  });

  final SplashPhases phases;
  final bool disableAnimations;
  final double scaleMultiplier;
  final double ringSizeFactor;

  @override
  State<SplashWristband> createState() => _SplashWristbandState();
}

class _SplashWristbandState extends State<SplashWristband>
    with TickerProviderStateMixin {
  static const _idleSpinPeriod = Duration(seconds: 8);
  static const _idleTumblePeriod = Duration(seconds: 12);
  static const _idleFloatPeriod = Duration(milliseconds: 2800);

  late final AnimationController _idleSpin;
  late final AnimationController _idleTumble;
  late final AnimationController _idleFloat;

  @override
  void initState() {
    super.initState();
    _idleSpin = AnimationController(vsync: this, duration: _idleSpinPeriod);
    _idleTumble =
        AnimationController(vsync: this, duration: _idleTumblePeriod);
    _idleFloat = AnimationController(vsync: this, duration: _idleFloatPeriod);

    if (!widget.disableAnimations) {
      _idleSpin.repeat();
      _idleTumble.repeat();
      _idleFloat.repeat();
    }
  }

  @override
  void didUpdateWidget(SplashWristband old) {
    super.didUpdateWidget(old);
    if (widget.disableAnimations && !old.disableAnimations) {
      _idleSpin.stop();
      _idleTumble.stop();
      _idleFloat.stop();
    } else if (!widget.disableAnimations && old.disableAnimations) {
      _idleSpin.repeat();
      _idleTumble.repeat();
      _idleFloat.repeat();
    }
  }

  @override
  void dispose() {
    _idleSpin.dispose();
    _idleTumble.dispose();
    _idleFloat.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final shortestSide = MediaQuery.sizeOf(context).shortestSide;
    final ring = shortestSide * widget.ringSizeFactor;

    final baseScale =
        widget.disableAnimations ? 1.28 : widget.phases.wristbandScale;
    final scale = baseScale * widget.scaleMultiplier;
    final opacity = widget.disableAnimations ? 1.0 : widget.phases.wristbandOpacity;

    final timelineRotation =
        widget.disableAnimations ? 0.0 : widget.phases.wristbandRotation;
    final timelineBreathe = widget.disableAnimations
        ? 0.0
        : (widget.phases.wristbandBreathe - 1.0) * ring;

    return Opacity(
      opacity: opacity.clamp(0.0, 1.0),
      child: AnimatedBuilder(
        animation: Listenable.merge([_idleSpin, _idleTumble, _idleFloat]),
        builder: (context, child) {
          final idleSpinY = widget.disableAnimations
              ? 0.0
              : _idleSpin.value * 2 * math.pi;
          final idleTumbleX = widget.disableAnimations
              ? 0.0
              : _idleTumble.value * 2 * math.pi;
          final idleSpinZ = widget.disableAnimations
              ? 0.0
              : _idleSpin.value * 2 * math.pi * 0.35;
          final idleBreathe = widget.disableAnimations
              ? 0.0
              : math.sin(_idleFloat.value * 2 * math.pi) * ring * 0.09;

          return CustomPaint(
            painter: SplashWristbandPainter(
              rotationY: timelineRotation + idleSpinY,
              rotationX: idleTumbleX,
              rotationZ: idleSpinZ,
              breatheOffset: timelineBreathe + idleBreathe,
              scale: scale,
              animateSpecular: !widget.disableAnimations,
            ),
            child: const SizedBox.expand(),
          );
        },
      ),
    );
  }
}
