library auth_underline_field_style;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

/// Idle hairline opacity applied to light white (visible on dark auth bg).
const double kFieldUnderlineIdleOpacity = 0.4;

/// Idle hairline — light white at [kFieldUnderlineIdleOpacity].
Color get kFieldUnderlineIdle =>
    surakshaAuthText.withValues(alpha: kFieldUnderlineIdleOpacity);

/// Focused hairline — reuses [surakshyaCrimson].
const Color kFieldUnderlineFocused = surakshyaCrimson;

const double kFieldUnderlineWidth = 1.0;

/// Static uppercase field label (reuses [SurakshaTypography.monoLabel]).
TextStyle get kFieldLabelStyle => SurakshaTypography.monoLabel;

const Duration kRegisterUnderlineDuration = Duration(milliseconds: 550);

const Curve kRegisterUnderlineCurve = Curves.easeOut;

/// Thickness for the Create-account reveal underline (mid of 1.5–2px).
const double kRegisterUnderlineThickness = 1.75;

const double kRegisterUnderlineGap = 2.0;

/// Gap between the static field label and the input.
const double kFieldLabelGap = 6.0;

/// Login-scoped underline [InputDecoration] — not filled, no floating label.
InputDecoration authUnderlineFieldDecoration({
  String? hintText,
  Widget? suffixIcon,
}) {
  final idleSide = BorderSide(
    color: kFieldUnderlineIdle,
    width: kFieldUnderlineWidth,
  );
  const focusedSide = BorderSide(
    color: kFieldUnderlineFocused,
    width: kFieldUnderlineWidth,
  );

  return InputDecoration(
    hintText: hintText,
    hintStyle: const TextStyle(color: surakshaMuted),
    suffixIcon: suffixIcon,
    filled: false,
    contentPadding: const EdgeInsets.symmetric(horizontal: 0, vertical: 12),
    border: UnderlineInputBorder(borderSide: idleSide),
    enabledBorder: UnderlineInputBorder(borderSide: idleSide),
    focusedBorder: const UnderlineInputBorder(borderSide: focusedSide),
  );
}

/// Static label rendered above a login underline field.
class AuthFieldLabel extends StatelessWidget {
  const AuthFieldLabel(this.text, {super.key});

  final String text;

  @override
  Widget build(BuildContext context) => Text(
        text.toUpperCase(),
        style: kFieldLabelStyle,
      );
}
