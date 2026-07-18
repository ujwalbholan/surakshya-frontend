library splash_timeline;

import 'dart:math' as math;

import 'package:flutter/animation.dart';

/// Single source of truth for the ~5.2s Guardian Awakening splash.
class SplashTimeline {
  SplashTimeline._();

  static const double totalMs = 5200;
  static const Duration totalDuration = Duration(milliseconds: 5200);
  /// Skip appears after wristband + brand copy have finished their intro.
  static const Duration skipAfter = Duration(milliseconds: 3000);
  static const double skipRevealStartMs = 3000;
  static const double skipRevealEndMs = 3600;
  static const Duration reducedMotionHold = Duration(milliseconds: 1200);
  static const Duration exitDuration = Duration(milliseconds: 400);

  static const double layoutBreakpoint = 600;

  /// Linear phase in [0, 1] between [startMs] and [endMs] for master [t] in [0, 1].
  static double phase(double t, double startMs, double endMs) {
    final elapsed = t * totalMs;
    if (elapsed <= startMs) return 0;
    if (elapsed >= endMs) return 1;
    return ((elapsed - startMs) / (endMs - startMs)).clamp(0.0, 1.0);
  }

  static double curved(
    double t,
    double startMs,
    double endMs,
    Curve curve,
  ) =>
      curve.transform(phase(t, startMs, endMs));
}

/// All layer intensities derived from master progress [t] (0→1).
class SplashPhases {
  const SplashPhases(this.t);

  final double t;

  double get atmosphere =>
      SplashTimeline.curved(t, 0, 800, Curves.easeOut);

  double get particles =>
      SplashTimeline.curved(t, 200, 1200, Curves.easeOut);

  double get ambientTime => t;

  double get shieldDraw =>
      SplashTimeline.curved(t, 500, 1400, Curves.easeInOut);

  double get shieldFill =>
      SplashTimeline.curved(t, 900, 1800, Curves.easeOut);

  double get shieldGlow =>
      SplashTimeline.curved(t, 1200, 2200, Curves.easeInOut);

  double get wristbandScale {
    final v = SplashTimeline.curved(t, 900, 2500, Curves.easeOutExpo);
    return 0.78 + v.clamp(0.0, 1.0) * 0.50;
  }

  double get wristbandOpacity =>
      SplashTimeline.curved(t, 900, 1600, Curves.easeOut);

  /// 0.003 rad/frame @ 60fps × 5.2s ≈ 0.15 turns.
  double get wristbandRotation => t * 6.28318 * 0.15;

  /// 0.5 Hz sine breathe — ~6.7% of major radius.
  double get wristbandBreathe =>
      1.0 + 0.067 * math.sin(t * SplashTimeline.totalMs * 0.001 * 0.5 * 6.28318);

  double get eyebrow =>
      SplashTimeline.curved(t, 1200, 1600, Curves.easeOut);

  double get headline1 =>
      SplashTimeline.curved(t, 1400, 1900, Curves.easeOut);

  double get headline2 =>
      SplashTimeline.curved(t, 1700, 2200, Curves.easeOut);

  double get bodyCopy =>
      SplashTimeline.curved(t, 2000, 2500, Curves.easeOut);

  /// Fades in once hero + copy intro are on screen.
  double get skipButton => SplashTimeline.curved(
        t,
        SplashTimeline.skipRevealStartMs,
        SplashTimeline.skipRevealEndMs,
        Curves.easeOut,
      );

  double get statusHint =>
      SplashTimeline.curved(t, 2800, 3400, Curves.easeOut);

  double get progress =>
      SplashTimeline.curved(t, 2800, 4200, Curves.easeInOut);

  double get progressBurst {
    final p = progress;
    if (p < 0.98) return 0;
    return ((p - 0.98) / 0.02).clamp(0.0, 1.0);
  }

  double get holdBreath {
    final hold = SplashTimeline.phase(t, 4200, 4800);
    if (hold <= 0) return 1;
    return 1 + 0.03 * Curves.easeInOut.transform(hold);
  }

  double get exitProgress =>
      SplashTimeline.curved(t, 4800, 5200, Curves.easeIn);

  double get uiOpacity => 1 - exitProgress;

  double get exitScale => 1 + exitProgress * 0.08;

  double get exitFlash => exitProgress < 0.35
      ? (exitProgress / 0.35).clamp(0.0, 1.0)
      : (1 - ((exitProgress - 0.35) / 0.65)).clamp(0.0, 1.0);

  bool get progressComplete => progress >= 0.99;
}
