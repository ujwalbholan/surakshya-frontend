library scalloped_bezel_clipper;

import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Default number of scallop lobes around the bezel perimeter.
const int kScallopedBezelLobeCount = 9;

/// Fractional depth of each scallop relative to the base radius (0–1).
const double kScallopedBezelLobeDepth = 0.12;

/// Number of line segments used to approximate the scalloped circle.
const int kScallopedBezelSegments = 360;

/// Clips a circular shape whose radius varies sinusoidally — the coin-edge
/// silhouette used by [ScallopedIconBezel].
class ScallopedBezelClipper extends CustomClipper<Path> {
  const ScallopedBezelClipper({
    this.lobeCount = kScallopedBezelLobeCount,
    this.lobeDepth = kScallopedBezelLobeDepth,
  });

  final int lobeCount;
  final double lobeDepth;

  @override
  Path getClip(Size size) {
    final cx = size.width / 2;
    final cy = size.height / 2;
    final baseRadius = math.min(size.width, size.height) / 2;

    final path = Path();
    for (var i = 0; i <= kScallopedBezelSegments; i++) {
      final theta = (i / kScallopedBezelSegments) * 2 * math.pi;
      final modulation = math.cos(lobeCount * theta);
      final radius = baseRadius * (1 + lobeDepth * modulation);
      final x = cx + radius * math.cos(theta);
      final y = cy + radius * math.sin(theta);

      if (i == 0) {
        path.moveTo(x, y);
      } else {
        path.lineTo(x, y);
      }
    }
    path.close();
    return path;
  }

  @override
  bool shouldReclip(covariant ScallopedBezelClipper oldClipper) =>
      lobeCount != oldClipper.lobeCount || lobeDepth != oldClipper.lobeDepth;
}
