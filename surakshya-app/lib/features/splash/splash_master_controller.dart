library splash_master_controller;

import 'package:flutter/animation.dart';
import 'package:suraksha/features/splash/splash_timeline.dart';

/// One master clock (0→1 over 5200ms) exposing synchronized phase values.
class SplashMasterController {
  SplashMasterController({
    required TickerProvider vsync,
    VoidCallback? onTick,
  }) : _controller = AnimationController(
          vsync: vsync,
          duration: SplashTimeline.totalDuration,
        ) {
    if (onTick != null) {
      _controller.addListener(onTick);
    }
  }

  final AnimationController _controller;
  bool _hapticFired = false;

  AnimationController get raw => _controller;

  double get t => _controller.value;

  SplashPhases get phases => SplashPhases(t);

  bool get isComplete => _controller.isCompleted;

  bool get canSkip => t * SplashTimeline.totalMs >= SplashTimeline.skipAfter.inMilliseconds;

  /// Whether progress hit 100% and haptic should fire once.
  bool consumeProgressHaptic() {
    if (_hapticFired || !phases.progressComplete) return false;
    _hapticFired = true;
    return true;
  }

  void resetHaptic() => _hapticFired = false;

  /// Peak cinematic frame — end of hold, before exit fade (4800ms).
  static const double holdT = 4800 / SplashTimeline.totalMs;

  Future<void> play() => _controller.forward(from: 0);

  /// Play intro then hold on the final frame (no exit fade).
  Future<void> playToHold() =>
      _controller.animateTo(holdT, duration: const Duration(milliseconds: 4800));

  void skipToExit() {
    const exitStart = 4800 / SplashTimeline.totalMs;
    _controller.forward(from: exitStart);
  }

  /// Static final frame for reduced-motion path.
  void setComplete() {
    _controller.value = 1;
  }

  void dispose() => _controller.dispose();
}
