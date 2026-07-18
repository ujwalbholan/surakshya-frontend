library surakshya_typography;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:surakshya/theme/surakshya_colors.dart';

class SurakshyaTypography {
  SurakshyaTypography._();

  static TextStyle get interBase => GoogleFonts.inter();
  static TextStyle get playfairBase => GoogleFonts.playfairDisplay();
  static TextStyle get dmMonoBase => GoogleFonts.dmMono();

  static TextStyle get sectionLabel => GoogleFonts.inter(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        letterSpacing: 3.0,
        color: surakshyaCrimson,
        height: 1.2,
      );

  static TextStyle get navLink => GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w300,
        letterSpacing: 1.65,
        color: surakshyaNavLink,
      );

  static TextStyle heroHeadline({double size = 56}) => GoogleFonts.inter(
        fontSize: size,
        fontWeight: FontWeight.w800,
        letterSpacing: -1.5,
        height: 1.05,
        color: surakshyaForeground,
      );

  static TextStyle get sectionHeadline => GoogleFonts.inter(
        fontSize: 44,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.0,
        height: 1.1,
        color: surakshyaForeground,
      );

  static TextStyle get bodyLarge => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.1,
        height: 1.75,
        color: surakshyaMuted,
      );

  static TextStyle get bodyMedium => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.7,
        color: surakshyaMuted,
      );

  static TextStyle get monoIndicator => GoogleFonts.dmMono(
        fontSize: 10,
        fontWeight: FontWeight.w400,
        letterSpacing: 2.5,
        color: surakshyaMuted,
      );

  static TextStyle get monoLabel => GoogleFonts.dmMono(
        fontSize: 9,
        fontWeight: FontWeight.w400,
        letterSpacing: 2.0,
        color: surakshyaMuted,
        height: 1.4,
      );

  static TextStyle get monoStat => GoogleFonts.dmMono(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        letterSpacing: 1.0,
        color: surakshyaForeground,
      );

  static TextStyle get playfairLogo => GoogleFonts.playfairDisplay(
        fontSize: 22,
        fontWeight: FontWeight.w400,
        fontStyle: FontStyle.italic,
        letterSpacing: 0.5,
        color: surakshyaForeground,
      );

  static TextStyle get playfairDisplay => GoogleFonts.playfairDisplay(
        fontSize: 38,
        fontWeight: FontWeight.w700,
        height: 1.1,
        color: surakshyaForeground,
      );

  static TextStyle get playfairBrand => GoogleFonts.playfairDisplay(
        fontSize: 64,
        fontWeight: FontWeight.w700,
        fontStyle: FontStyle.italic,
        letterSpacing: -1.0,
        height: 1.0,
        color: surakshyaForeground,
      );

  static TextStyle get featureCardTitle => GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.3,
        color: surakshyaForeground,
      );

  static TextStyle get featureCardStat => GoogleFonts.dmMono(
        fontSize: 11,
        letterSpacing: 1.2,
        color: surakshyaCrimson,
      );

  static TextStyle get dashGreeting => GoogleFonts.inter(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.5,
        color: surakshyaForeground,
      );

  static TextStyle get dashStat => GoogleFonts.inter(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.0,
        color: surakshyaForeground,
      );

  static TextStyle get dashStatLabel => GoogleFonts.dmMono(
        fontSize: 10,
        letterSpacing: 1.5,
        color: surakshyaMuted,
      );

  static TextStyle get dashTitle => GoogleFonts.inter(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: surakshyaForeground,
      );

  static TextStyle get dashSubtitle => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: surakshyaMuted,
      );

  static TextStyle get sosCountdownDigit => GoogleFonts.inter(
        fontSize: 72,
        fontWeight: FontWeight.w800,
        color: surakshyaForeground,
      );
}
