library splash_scene;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:suraksha/features/splash/layers/splash_atmosphere.dart';
import 'package:suraksha/features/splash/layers/splash_brand_panel.dart';
import 'package:suraksha/features/splash/layers/splash_particle_layer.dart';
import 'package:suraksha/features/splash/layers/splash_wristband.dart';
import 'package:suraksha/features/splash/models/splash_particle.dart';
import 'package:suraksha/features/splash/splash_timeline.dart';

/// Composes all splash visual layers with z-index contract and RepaintBoundary.
class SplashScene extends StatefulWidget {
  const SplashScene({
    super.key,
    required this.phases,
    this.disableAnimations = false,
    this.showBrandPanel = true,
    this.wristbandScaleMultiplier = 1.0,
    this.wristbandRingFactor = 0.34,
    this.heroSlotHalfExtent = 160,
    this.heroSlotHeight = 320,
  });

  final SplashPhases phases;
  final bool disableAnimations;
  final bool showBrandPanel;
  final double wristbandScaleMultiplier;
  final double wristbandRingFactor;
  final double heroSlotHalfExtent;
  final double heroSlotHeight;

  @override
  State<SplashScene> createState() => _SplashSceneState();
}

class _SplashSceneState extends State<SplashScene> {
  late final List<SplashParticle> _particles;
  late final List<SplashEmberParticle> _embers;

  @override
  void initState() {
    super.initState();
    final rng = math.Random(42);
    _particles = createSplashParticles(120, rng);
    _embers = createSplashEmbers(24, rng);
  }

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final landscape =
            constraints.maxWidth >= SplashTimeline.layoutBreakpoint &&
                constraints.maxWidth > constraints.maxHeight;
        final isTablet = constraints.maxWidth >= 600;
        final particleCount = isTablet ? 120 : 80;

        final heroCenterX = landscape
            ? constraints.maxWidth * 0.68
            : constraints.maxWidth * 0.5;
        final heroCenterY = landscape
            ? constraints.maxHeight * 0.5
            : constraints.maxHeight * 0.38;

        final scale = widget.phases.exitScale;
        final uiOpacity = widget.phases.uiOpacity;

        return Transform.scale(
          scale: scale,
          child: Opacity(
            opacity: uiOpacity.clamp(0.0, 1.0),
            child: Stack(
              fit: StackFit.expand,
              children: [
                RepaintBoundary(
                  child: SplashAtmosphere(
                    phases: widget.phases,
                    centerX: heroCenterX,
                    centerY: heroCenterY,
                    disableAnimations: widget.disableAnimations,
                  ),
                ),
                RepaintBoundary(
                  child: SplashParticleLayer(
                    phases: widget.phases,
                    particles: _particles.take(particleCount).toList(),
                    embers: _embers,
                    centerX: heroCenterX,
                    centerY: heroCenterY,
                    disableAnimations: widget.disableAnimations,
                  ),
                ),
                if (landscape)
                  _LandscapeLayout(
                    phases: widget.phases,
                    disableAnimations: widget.disableAnimations,
                    showBrandPanel: widget.showBrandPanel,
                    wristbandScaleMultiplier: widget.wristbandScaleMultiplier,
                    wristbandRingFactor: widget.wristbandRingFactor,
                  )
                else
                  _PortraitLayout(
                    phases: widget.phases,
                    heroCenterY: heroCenterY,
                    disableAnimations: widget.disableAnimations,
                    showBrandPanel: widget.showBrandPanel,
                    wristbandScaleMultiplier: widget.wristbandScaleMultiplier,
                    wristbandRingFactor: widget.wristbandRingFactor,
                    heroSlotHalfExtent: widget.heroSlotHalfExtent,
                    heroSlotHeight: widget.heroSlotHeight,
                  ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _HeroCenter extends StatelessWidget {
  const _HeroCenter({
    required this.phases,
    required this.disableAnimations,
    this.wristbandScaleMultiplier = 1.0,
    this.wristbandRingFactor = 0.34,
  });

  final SplashPhases phases;
  final bool disableAnimations;
  final double wristbandScaleMultiplier;
  final double wristbandRingFactor;

  @override
  Widget build(BuildContext context) {
    return RepaintBoundary(
      child: SplashWristband(
        phases: phases,
        disableAnimations: disableAnimations,
        scaleMultiplier: wristbandScaleMultiplier,
        ringSizeFactor: wristbandRingFactor,
      ),
    );
  }
}

class _PortraitLayout extends StatelessWidget {
  const _PortraitLayout({
    required this.phases,
    required this.heroCenterY,
    required this.disableAnimations,
    required this.showBrandPanel,
    this.wristbandScaleMultiplier = 1.0,
    this.wristbandRingFactor = 0.34,
    this.heroSlotHalfExtent = 160,
    this.heroSlotHeight = 320,
  });

  final SplashPhases phases;
  final double heroCenterY;
  final bool disableAnimations;
  final bool showBrandPanel;
  final double wristbandScaleMultiplier;
  final double wristbandRingFactor;
  final double heroSlotHalfExtent;
  final double heroSlotHeight;

  @override
  Widget build(BuildContext context) {
    return Stack(
      fit: StackFit.expand,
      children: [
        Positioned(
          top: heroCenterY - heroSlotHalfExtent,
          left: 0,
          right: 0,
          height: heroSlotHeight,
          child: RepaintBoundary(
            child: _HeroCenter(
              phases: phases,
              disableAnimations: disableAnimations,
              wristbandScaleMultiplier: wristbandScaleMultiplier,
              wristbandRingFactor: wristbandRingFactor,
            ),
          ),
        ),
        if (showBrandPanel)
          Positioned.fill(
            child: RepaintBoundary(
              child: SplashBrandPanel(
                phases: phases,
                landscape: false,
                disableAnimations: disableAnimations,
              ),
            ),
          ),
      ],
    );
  }
}

class _LandscapeLayout extends StatelessWidget {
  const _LandscapeLayout({
    required this.phases,
    required this.disableAnimations,
    required this.showBrandPanel,
    this.wristbandScaleMultiplier = 1.0,
    this.wristbandRingFactor = 0.34,
  });

  final SplashPhases phases;
  final bool disableAnimations;
  final bool showBrandPanel;
  final double wristbandScaleMultiplier;
  final double wristbandRingFactor;

  @override
  Widget build(BuildContext context) {
    if (!showBrandPanel) {
      return RepaintBoundary(
        child: _HeroCenter(
          phases: phases,
          disableAnimations: disableAnimations,
          wristbandScaleMultiplier: wristbandScaleMultiplier,
          wristbandRingFactor: wristbandRingFactor,
        ),
      );
    }

    return Row(
      children: [
        Expanded(
          flex: 5,
          child: RepaintBoundary(
            child: SplashBrandPanel(
              phases: phases,
              landscape: true,
              disableAnimations: disableAnimations,
            ),
          ),
        ),
        Expanded(
          flex: 6,
          child: RepaintBoundary(
            child: _HeroCenter(
              phases: phases,
              disableAnimations: disableAnimations,
              wristbandScaleMultiplier: wristbandScaleMultiplier,
              wristbandRingFactor: wristbandRingFactor,
            ),
          ),
        ),
      ],
    );
  }
}
