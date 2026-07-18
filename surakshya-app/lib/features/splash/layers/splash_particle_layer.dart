library splash_particle_layer;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:suraksha/features/splash/models/splash_particle.dart';
import 'package:suraksha/features/splash/painters/ember_painter.dart';
import 'package:suraksha/features/splash/painters/particle_field_painter.dart';
import 'package:suraksha/features/splash/splash_timeline.dart';

class SplashParticleLayer extends StatelessWidget {
  const SplashParticleLayer({
    super.key,
    required this.phases,
    required this.particles,
    required this.embers,
    required this.centerX,
    required this.centerY,
    this.disableAnimations = false,
  });

  final SplashPhases phases;
  final List<SplashParticle> particles;
  final List<SplashEmberParticle> embers;
  final double centerX;
  final double centerY;
  final bool disableAnimations;

  @override
  Widget build(BuildContext context) {
    if (disableAnimations) {
      return const SizedBox.expand();
    }

    final tick = phases.ambientTime * 4;
    final particleOpacity = phases.particles;

    return LayoutBuilder(
      builder: (context, constraints) {
        return Stack(
          fit: StackFit.expand,
          children: [
            Opacity(
              opacity: particleOpacity,
              child: CustomPaint(
                painter: ParticleFieldPainter(
                  particles: particles,
                  tick: tick,
                  centerX: centerX,
                  centerY: centerY,
                  exitProgress: phases.exitProgress,
                ),
              ),
            ),
            if (particleOpacity > 0.3)
              CustomPaint(
                painter: EmberPainter(
                  embers: embers,
                  tick: tick,
                  screenW: constraints.maxWidth,
                  screenH: constraints.maxHeight,
                ),
              ),
          ],
        );
      },
    );
  }
}

List<SplashParticle> createSplashParticles(int count, math.Random rng) {
  return List.generate(count, (i) {
    return SplashParticle(
      orbitRadius: 80 + rng.nextDouble() * 220,
      orbitAngle: rng.nextDouble() * 2 * math.pi,
      orbitRadiusY: 0.3 + rng.nextDouble() * 0.5,
      speed: 0.02 + rng.nextDouble() * 0.06,
      size: 1 + rng.nextDouble() * 2.5,
      targetOpacity: 0.4 + rng.nextDouble() * 0.6,
      color: splashParticleColor(rng),
      fadeDelay: rng.nextDouble() * 0.8,
    );
  });
}

List<SplashEmberParticle> createSplashEmbers(int count, math.Random rng) {
  return List.generate(count, (i) {
    return SplashEmberParticle(
      x: rng.nextDouble(),
      y: rng.nextDouble(),
      size: 1 + rng.nextDouble() * 2,
      speed: 0.0003 + rng.nextDouble() * 0.0008,
      wobble: rng.nextDouble() * 2 * math.pi,
      delay: rng.nextDouble() * 2,
    );
  });
}
