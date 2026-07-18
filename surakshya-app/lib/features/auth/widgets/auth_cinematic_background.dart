library auth_cinematic_background;

import 'package:flutter/material.dart';
import 'package:suraksha/features/splash/layers/splash_scene.dart';
import 'package:suraksha/features/splash/splash_master_controller.dart';
import 'package:suraksha/features/splash/splash_timeline.dart';

/// Opacity of the black scrim layered over the cinematic background for form readability.
const authScrimOpacity = 0.5;

/// Wristband scale boost on auth screens (splash default is 1.0).
const authWristbandScaleMultiplier = 1.15;

/// Ring radius factor vs shortest screen side (splash default is 0.34).
const authWristbandRingFactor = 0.38;

/// Portrait hero slot size for the auth wristband.
const authHeroSlotHalfExtent = 180.0;
const authHeroSlotHeight = 360.0;

/// Shared cinematic background for auth screens.
///
/// Renders splash atmosphere and wristband at [SplashMasterController.holdT]
/// without brand copy. When [disableAnimations] is false, wristband idle spin,
/// tumble, float, and particles match the splash hold frame. When true
/// (reduced motion), the scene is fully static.
class AuthCinematicBackground extends StatelessWidget {
  const AuthCinematicBackground({
    super.key,
    this.disableAnimations = false,
  });

  final bool disableAnimations;

  @override
  Widget build(BuildContext context) {
    return SplashScene(
      phases: const SplashPhases(SplashMasterController.holdT),
      disableAnimations: disableAnimations,
      showBrandPanel: false,
      wristbandScaleMultiplier: authWristbandScaleMultiplier,
      wristbandRingFactor: authWristbandRingFactor,
      heroSlotHalfExtent: authHeroSlotHalfExtent,
      heroSlotHeight: authHeroSlotHeight,
    );
  }
}
