library app_svg_icon;

import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

/// Asset paths for the custom SVG icon set.
class AppIcons {
  AppIcons._();

  static const String home = 'assets/icons/home.svg';
  static const String profile = 'assets/icons/profile.svg';
  static const String sos = 'assets/icons/sos.svg';
  static const String edit = 'assets/icons/edit.svg';
  static const String ageBloodGroup = 'assets/icons/age_blood_group.svg';
  static const String emergencyContact = 'assets/icons/emergency_contact.svg';
  static const String bandStatus = 'assets/icons/band_status.svg';
}

/// Renders an SVG asset tinted to [color], sized like a Material [Icon].
class AppSvgIcon extends StatelessWidget {
  const AppSvgIcon(
    this.asset, {
    super.key,
    required this.size,
    required this.color,
    this.semanticLabel,
  });

  final String asset;
  final double size;
  final Color color;
  final String? semanticLabel;

  @override
  Widget build(BuildContext context) => SvgPicture.asset(
        asset,
        width: size,
        height: size,
        fit: BoxFit.contain,
        colorFilter: ColorFilter.mode(color, BlendMode.srcIn),
        semanticsLabel: semanticLabel,
      );
}
