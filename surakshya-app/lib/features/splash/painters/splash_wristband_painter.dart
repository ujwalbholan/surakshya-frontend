library splash_wristband_painter;

import 'dart:math' as math;

import 'package:flutter/material.dart';

/// Glossy single-torus wristband geometry.
class WristbandGeometry {
  WristbandGeometry._();

  static const double majorRadius = 1.15;
  static const double tubeRadius = 0.20;
  /// Near-horizontal pose with a slight pitch toward the camera.
  static const double tilt = math.pi * 0.5 - 0.30;

  static int uSegments(double shortestSide) =>
      shortestSide >= 600 ? 96 : 72;

  static int vSegments(double shortestSide) =>
      shortestSide >= 600 ? 28 : 24;

  static double pixelsPerUnit(double shortestSide) =>
      (shortestSide * 0.34) / majorRadius;
}

class _Vec3 {
  const _Vec3(this.x, this.y, this.z);

  final double x;
  final double y;
  final double z;

  _Vec3 operator +(_Vec3 o) => _Vec3(x + o.x, y + o.y, z + o.z);
  _Vec3 operator -(_Vec3 o) => _Vec3(x - o.x, y - o.y, z - o.z);
  _Vec3 operator *(double s) => _Vec3(x * s, y * s, z * s);

  double get length => math.sqrt(x * x + y * y + z * z);

  _Vec3 normalized() {
    final len = length;
    if (len < 1e-9) return const _Vec3(0, 0, 1);
    return _Vec3(x / len, y / len, z / len);
  }

  double dot(_Vec3 o) => x * o.x + y * o.y + z * o.z;

  _Vec3 rotateY(double angle) {
    final c = math.cos(angle);
    final s = math.sin(angle);
    return _Vec3(x * c + z * s, y, -x * s + z * c);
  }

  _Vec3 rotateX(double angle) {
    final c = math.cos(angle);
    final s = math.sin(angle);
    return _Vec3(x, y * c - z * s, y * s + z * c);
  }

  _Vec3 rotateZ(double angle) {
    final c = math.cos(angle);
    final s = math.sin(angle);
    return _Vec3(x * c - y * s, x * s + y * c, z);
  }
}

class _WristbandMaterial {
  const _WristbandMaterial({
    required this.baseColor,
    required this.metalness,
    required this.roughness,
    required this.emissive,
    required this.emissiveIntensity,
  });

  final Color baseColor;
  final double metalness;
  final double roughness;
  final Color emissive;
  final double emissiveIntensity;
}

class _WristbandLighting {
  _WristbandLighting._();

  static const _ambient = 0.28;
  static const _camera = _Vec3(0, 0, 5);

  /// Bright glossy burgundy — matches reference wristband.
  static const _glossyRed = _WristbandMaterial(
    baseColor: Color(0xFFB52A40),
    metalness: 0.78,
    roughness: 0.04,
    emissive: Color(0xFF3D0814),
    emissiveIntensity: 0.04,
  );

  static _Vec3 torusPoint(double u, double v, double tubeR) {
    final cu = math.cos(u);
    final su = math.sin(u);
    final cv = math.cos(v);
    final sv = math.sin(v);
    final r = WristbandGeometry.majorRadius + tubeR * cv;
    return _Vec3(r * cu, r * su, tubeR * sv);
  }

  static _Vec3 torusNormal(double u, double v, double tubeR) {
    final cu = math.cos(u);
    final su = math.sin(u);
    final cv = math.cos(v);
    final sv = math.sin(v);
    return _Vec3(cv * cu, cv * su, sv).normalized();
  }

  static _Vec3 transform(_Vec3 p, double rotY, double rotX, double rotZ) =>
      p.rotateZ(rotZ).rotateY(rotY).rotateX(WristbandGeometry.tilt + rotX);

  static _Vec3 transformNormal(_Vec3 n, double rotY, double rotX, double rotZ) =>
      n.rotateZ(rotZ).rotateY(rotY).rotateX(WristbandGeometry.tilt + rotX).normalized();

  static Offset project(_Vec3 p, double ppu) =>
      Offset(p.x * ppu, -p.y * ppu);

  static double _directional(
    _Vec3 normal,
    _Vec3 lightDir,
    Color color,
    double intensity,
  ) {
    final n = normal.dot(lightDir).clamp(0.0, 1.0);
    return n * intensity * _luminance(color);
  }

  static double _luminance(Color c) =>
      c.r * 0.299 + c.g * 0.587 + c.b * 0.114;

  static int _litChannel(double channel, double lit, double roughness) =>
      (channel * 255.0 * lit * (1 - roughness * 0.15)).round().clamp(0, 255);

  static Color shade(
    _Vec3 worldPoint,
    _Vec3 worldNormal,
    _WristbandMaterial mat,
    double rotation,
  ) {
    final n = worldNormal;
    final view = (_camera - worldPoint).normalized();

    var diffuse = _ambient * _luminance(mat.baseColor);

    final keyDir = const _Vec3(4, 6, 5).normalized();
    diffuse += _directional(n, keyDir, const Color(0xFFFFFFFF), 2.8);

    diffuse += _directional(
      n,
      const _Vec3(-3, -2, -4).normalized(),
      const Color(0xFF6B1020),
      0.45,
    );

    diffuse += _directional(
      n,
      const _Vec3(0, 5, -6).normalized(),
      const Color(0xFFFFE8E8),
      0.55,
    );

    var lit = diffuse.clamp(0.0, 3.2);

    final facingDown = (-n.y).clamp(0.0, 1.0);
    lit *= 1.0 - facingDown * 0.35;

    var r = _litChannel(mat.baseColor.r, lit, mat.roughness);
    var g = _litChannel(mat.baseColor.g, lit, mat.roughness);
    var b = _litChannel(mat.baseColor.b, lit, mat.roughness);

    r = (r + mat.emissive.r * 255.0 * mat.emissiveIntensity).round().clamp(0, 255);
    g = (g + mat.emissive.g * 255.0 * mat.emissiveIntensity).round().clamp(0, 255);
    b = (b + mat.emissive.b * 255.0 * mat.emissiveIntensity).round().clamp(0, 255);

    final lightReflect = (keyDir - view * (2 * n.dot(view))).normalized();
    final spec = math.pow(n.dot(lightReflect).clamp(0.0, 1.0), 72).toDouble();
    final specBoost = spec * (1 - mat.roughness) * mat.metalness * 1.25;
    r = (r + 255 * specBoost).round().clamp(0, 255);
    g = (g + 248 * specBoost).round().clamp(0, 255);
    b = (b + 245 * specBoost).round().clamp(0, 255);

    final travel = _Vec3(math.cos(rotation), 0.3, math.sin(rotation)).normalized();
    final travelReflect = (travel - view * (2 * n.dot(view))).normalized();
    final travelSpec =
        math.pow(n.dot(travelReflect).clamp(0.0, 1.0), 64).toDouble();
    final travelBoost = travelSpec * 0.65;
    r = (r + 255 * travelBoost).round().clamp(0, 255);
    g = (g + 255 * travelBoost).round().clamp(0, 255);
    b = (b + 255 * travelBoost).round().clamp(0, 255);

    return Color.fromARGB(255, r, g, b);
  }
}

class _TorusQuad {
  _TorusQuad({
    required this.corners,
    required this.depth,
    required this.color,
  });

  final List<Offset> corners;
  final double depth;
  final Color color;
}

/// Glossy burgundy torus — 3D mesh with faux-PBR lighting.
class SplashWristbandPainter extends CustomPainter {
  SplashWristbandPainter({
    required this.rotationY,
    required this.rotationX,
    required this.rotationZ,
    required this.breatheOffset,
    required this.scale,
    this.animateSpecular = true,
  });

  final double rotationY;
  final double rotationX;
  final double rotationZ;
  final double breatheOffset;
  final double scale;
  final bool animateSpecular;

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(
      size.width * 0.5,
      size.height * 0.5 + breatheOffset,
    );
    final ppu = WristbandGeometry.pixelsPerUnit(size.shortestSide);
    final uSegs = WristbandGeometry.uSegments(size.shortestSide);
    final vSegs = WristbandGeometry.vSegments(size.shortestSide);

    canvas.save();
    canvas.translate(center.dx, center.dy);
    canvas.scale(scale);

    final quads = _buildMesh(
      tubeR: WristbandGeometry.tubeRadius,
      uSegs: uSegs,
      vSegs: vSegs,
      rotY: rotationY,
      rotX: rotationX,
      rotZ: rotationZ,
      ppu: ppu,
    );

    for (final q in quads) {
      _drawQuad(canvas, q);
    }

    canvas.restore();
  }

  List<_TorusQuad> _buildMesh({
    required double tubeR,
    required int uSegs,
    required int vSegs,
    required double rotY,
    required double rotX,
    required double rotZ,
    required double ppu,
  }) {
    final quads = <_TorusQuad>[];
    final specularRot = animateSpecular ? rotY + rotZ * 0.5 : 0.0;

    for (var i = 0; i < uSegs; i++) {
      final u0 = i / uSegs * 2 * math.pi;
      final u1 = (i + 1) / uSegs * 2 * math.pi;

      for (var j = 0; j < vSegs; j++) {
        final v0 = j / vSegs * 2 * math.pi;
        final v1 = (j + 1) / vSegs * 2 * math.pi;

        final corners3d = <_Vec3>[];
        final depths = <double>[];

        for (final (u, v) in [(u0, v0), (u1, v0), (u1, v1), (u0, v1)]) {
          final world = _WristbandLighting.transform(
            _WristbandLighting.torusPoint(u, v, tubeR),
            rotY,
            rotX,
            rotZ,
          );
          corners3d.add(world);
          depths.add(world.z);
        }

        final cu = (u0 + u1) * 0.5;
        final cv = (v0 + v1) * 0.5;
        final centerPoint = _WristbandLighting.transform(
          _WristbandLighting.torusPoint(cu, cv, tubeR),
          rotY,
          rotX,
          rotZ,
        );
        final centerNormal = _WristbandLighting.transformNormal(
          _WristbandLighting.torusNormal(cu, cv, tubeR),
          rotY,
          rotX,
          rotZ,
        );

        final color = _WristbandLighting.shade(
          centerPoint,
          centerNormal,
          _WristbandLighting._glossyRed,
          specularRot,
        );

        quads.add(
          _TorusQuad(
            corners: corners3d
                .map((p) => _WristbandLighting.project(p, ppu))
                .toList(),
            depth: depths.reduce((a, b) => a + b) / depths.length,
            color: color,
          ),
        );
      }
    }

    quads.sort((a, b) => a.depth.compareTo(b.depth));
    return quads;
  }

  void _drawQuad(Canvas canvas, _TorusQuad quad) {
    if (quad.corners.length < 3) return;
    final path = Path()..moveTo(quad.corners[0].dx, quad.corners[0].dy);
    for (var i = 1; i < quad.corners.length; i++) {
      path.lineTo(quad.corners[i].dx, quad.corners[i].dy);
    }
    path.close();

    canvas.drawPath(
      path,
      Paint()
        ..style = PaintingStyle.fill
        ..color = quad.color,
    );
  }

  @override
  bool shouldRepaint(SplashWristbandPainter old) =>
      old.rotationY != rotationY ||
      old.rotationX != rotationX ||
      old.rotationZ != rotationZ ||
      old.breatheOffset != breatheOffset ||
      old.scale != scale ||
      old.animateSpecular != animateSpecular;
}
