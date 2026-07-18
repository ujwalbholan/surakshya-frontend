library scroll_controller;

import 'package:flutter/material.dart';
import 'package:flutter/physics.dart';

class SurakshaScrollPhysics extends ScrollPhysics {
  const SurakshaScrollPhysics({super.parent});

  @override
  SurakshaScrollPhysics applyTo(ScrollPhysics? ancestor) =>
      SurakshaScrollPhysics(parent: buildParent(ancestor));

  @override
  double get minFlingVelocity => 50.0;

  @override
  double get maxFlingVelocity => 6000.0;

  @override
  double carriedMomentum(double velocity) => velocity * 0.92;

  @override
  Simulation? createBallisticSimulation(
    ScrollMetrics position,
    double velocity,
  ) {
    final tol = toleranceFor(position);
    if (velocity.abs() < tol.velocity) return null;
    return FrictionSimulation(
      0.135,
      position.pixels,
      velocity,
      tolerance: tol,
    );
  }
}
