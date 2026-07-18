library ticket_notch_clipper;

import 'package:flutter/material.dart';

/// Compact corner radius for the refined status toast.
const double kTicketNotchCornerRadius = 14;

/// Subtle side notch radius (kept small so the silhouette stays clean).
const double kTicketNotchRadius = 8;

/// Clips a rounded rectangle with small semicircular notches on the left and
/// right edges — used by [TicketStatusCard].
class TicketNotchClipper extends CustomClipper<Path> {
  const TicketNotchClipper({
    this.cornerRadius = kTicketNotchCornerRadius,
    this.notchRadius = kTicketNotchRadius,
  });

  final double cornerRadius;
  final double notchRadius;

  @override
  Path getClip(Size size) {
    final r = cornerRadius;
    final nr = notchRadius;
    final w = size.width;
    final h = size.height;
    final centerY = h / 2;

    return Path()
      ..moveTo(r, 0)
      ..lineTo(w - r, 0)
      ..arcToPoint(Offset(w, r), radius: Radius.circular(r))
      ..lineTo(w, centerY - nr)
      ..arcToPoint(
        Offset(w, centerY + nr),
        radius: Radius.circular(nr),
        clockwise: false,
      )
      ..lineTo(w, h - r)
      ..arcToPoint(Offset(w - r, h), radius: Radius.circular(r))
      ..lineTo(r, h)
      ..arcToPoint(Offset(0, h - r), radius: Radius.circular(r))
      ..lineTo(0, centerY + nr)
      ..arcToPoint(
        Offset(0, centerY - nr),
        radius: Radius.circular(nr),
        clockwise: false,
      )
      ..lineTo(0, r)
      ..arcToPoint(Offset(r, 0), radius: Radius.circular(r))
      ..close();
  }

  @override
  bool shouldReclip(covariant TicketNotchClipper oldClipper) =>
      cornerRadius != oldClipper.cornerRadius ||
      notchRadius != oldClipper.notchRadius;
}
