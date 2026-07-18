library suraksha_typography;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

/// App-bar SURAKSHYA wordmark: Anton (bundled local asset), ultra-condensed
/// display face. Anton ships a single weight, so no fontWeight is set.
/// Display-scale per reference — the wordmark fills the bar's center, taller
/// than the side circles. The header's FittedBox scales it down on screens
/// too narrow for the full size.
const double kSurakshyaWordmarkFontSize = 50.0;
const double kSurakshyaWordmarkLetterSpacing = 0.0;

const TextStyle kSurakshyaWordmarkStyle = TextStyle(
  fontFamily: 'Anton',
  fontSize: kSurakshyaWordmarkFontSize,
  letterSpacing: kSurakshyaWordmarkLetterSpacing,
  height: 1.0,
  color: surakshaForeground,
);

/// App type system:
/// - Space Grotesk — headings, display text, big numbers (SOS digits, stats).
/// - Inter — body copy, subtitles, links, metadata.
/// - JetBrains Mono — letter-spaced data fields (section labels, indicators,
///   phone numbers, stats).
class SurakshaTypography {
  SurakshaTypography._();

  static TextStyle get interBase => GoogleFonts.inter();
  static TextStyle get headingBase => GoogleFonts.spaceGrotesk();
  static TextStyle get monoBase => GoogleFonts.jetBrainsMono();

  static TextStyle get sectionLabel => GoogleFonts.jetBrainsMono(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        letterSpacing: 3.0,
        color: surakshaCrimson,
        height: 1.2,
      );

  static TextStyle get navLink => GoogleFonts.inter(
        fontSize: 11,
        fontWeight: FontWeight.w300,
        letterSpacing: 1.65,
        color: surakshaNavLink,
      );

  static TextStyle heroHeadline({double size = 56}) => GoogleFonts.spaceGrotesk(
        fontSize: size,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.5,
        height: 1.05,
        color: surakshaForeground,
      );

  static TextStyle get sectionHeadline => GoogleFonts.spaceGrotesk(
        fontSize: 44,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.0,
        height: 1.1,
        color: surakshaForeground,
      );

  static TextStyle get bodyLarge => GoogleFonts.inter(
        fontSize: 16,
        fontWeight: FontWeight.w400,
        letterSpacing: 0.1,
        height: 1.75,
        color: surakshaMuted,
      );

  static TextStyle get bodyMedium => GoogleFonts.inter(
        fontSize: 14,
        fontWeight: FontWeight.w400,
        height: 1.7,
        color: surakshaMuted,
      );

  static TextStyle get monoIndicator => GoogleFonts.jetBrainsMono(
        fontSize: 10,
        fontWeight: FontWeight.w400,
        letterSpacing: 2.5,
        color: surakshaMuted,
      );

  static TextStyle get monoLabel => GoogleFonts.jetBrainsMono(
        fontSize: 9,
        fontWeight: FontWeight.w400,
        letterSpacing: 2.0,
        color: surakshaMuted,
        height: 1.4,
      );

  static TextStyle get monoStat => GoogleFonts.jetBrainsMono(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        letterSpacing: 1.0,
        color: surakshaForeground,
      );

  static TextStyle get brandLogo => GoogleFonts.spaceGrotesk(
        fontSize: 22,
        fontWeight: FontWeight.w600,
        letterSpacing: 0.5,
        color: surakshaForeground,
      );

  static TextStyle get displayTitle => GoogleFonts.spaceGrotesk(
        fontSize: 38,
        fontWeight: FontWeight.w700,
        height: 1.1,
        color: surakshaForeground,
      );

  static TextStyle get brandWordmark => GoogleFonts.spaceGrotesk(
        fontSize: 64,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.5,
        height: 1.0,
        color: surakshaForeground,
      );

  static TextStyle get featureCardTitle => GoogleFonts.spaceGrotesk(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.3,
        color: surakshaForeground,
      );

  static TextStyle get featureCardStat => GoogleFonts.jetBrainsMono(
        fontSize: 11,
        letterSpacing: 1.2,
        color: surakshaCrimson,
      );

  static TextStyle get dashGreeting => GoogleFonts.spaceGrotesk(
        fontSize: 24,
        fontWeight: FontWeight.w600,
        letterSpacing: -0.5,
        color: surakshaForeground,
      );

  static TextStyle get dashStat => GoogleFonts.spaceGrotesk(
        fontSize: 32,
        fontWeight: FontWeight.w700,
        letterSpacing: -1.0,
        color: surakshaForeground,
      );

  static TextStyle get dashStatLabel => GoogleFonts.jetBrainsMono(
        fontSize: 10,
        letterSpacing: 1.5,
        color: surakshaMuted,
      );

  static TextStyle get dashTitle => GoogleFonts.spaceGrotesk(
        fontSize: 18,
        fontWeight: FontWeight.w600,
        color: surakshaForeground,
      );

  static TextStyle get dashSubtitle => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
        color: surakshaMuted,
      );

  static TextStyle get sosCountdownDigit => GoogleFonts.spaceGrotesk(
        fontSize: 72,
        fontWeight: FontWeight.w700,
        color: surakshaForeground,
      );
}
