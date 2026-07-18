library auth_field_decoration;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';

/// Matches [SurakshaEmailInput] — solid card fill, not the theme's translucent default.
InputDecoration authFieldDecoration({
  required String labelText,
  String? hintText,
  Widget? suffixIcon,
}) {
  final border = OutlineInputBorder(
    borderRadius: BorderRadius.circular(S.radius),
    borderSide: const BorderSide(color: surakshaBorder),
  );

  return InputDecoration(
    labelText: labelText,
    hintText: hintText,
    suffixIcon: suffixIcon,
    filled: true,
    fillColor: surakshaCard,
    contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 14),
    border: border,
    enabledBorder: border,
    focusedBorder: OutlineInputBorder(
      borderRadius: BorderRadius.circular(S.radius),
      borderSide: const BorderSide(color: surakshaAuthFocus, width: 1.5),
    ),
  );
}
