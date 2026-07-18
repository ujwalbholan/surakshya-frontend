library suraksha_theme;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class SurakshaTheme {
  SurakshaTheme._();

  /// Inter for body/label slots, Space Grotesk for display/headline/title
  /// slots — so any Text without an explicit style still follows the pairing.
  static TextTheme _textTheme(TextTheme base) {
    final themed = GoogleFonts.interTextTheme(base);
    return themed.copyWith(
      displayLarge: GoogleFonts.spaceGrotesk(textStyle: themed.displayLarge),
      displayMedium: GoogleFonts.spaceGrotesk(textStyle: themed.displayMedium),
      displaySmall: GoogleFonts.spaceGrotesk(textStyle: themed.displaySmall),
      headlineLarge: GoogleFonts.spaceGrotesk(textStyle: themed.headlineLarge),
      headlineMedium:
          GoogleFonts.spaceGrotesk(textStyle: themed.headlineMedium),
      headlineSmall: GoogleFonts.spaceGrotesk(textStyle: themed.headlineSmall),
      titleLarge: GoogleFonts.spaceGrotesk(textStyle: themed.titleLarge),
      titleMedium: GoogleFonts.spaceGrotesk(textStyle: themed.titleMedium),
      titleSmall: GoogleFonts.spaceGrotesk(textStyle: themed.titleSmall),
    );
  }

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        textTheme: _textTheme(ThemeData.dark().textTheme),
        scaffoldBackgroundColor: surakshaBlack,
        colorScheme: const ColorScheme.dark(
          primary: surakshaCrimson,
          secondary: surakshaYellow,
          surface: surakshaCard,
          onSurface: surakshaForeground,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          systemOverlayStyle: SystemUiOverlayStyle.light,
          titleTextStyle: SurakshaTypography.dashTitle,
        ),
        dividerColor: surakshaBorder,
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: surakshaCrimson,
            foregroundColor: surakshaForeground,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(S.radius),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surakshaWhiteT6,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(S.radius),
            borderSide: const BorderSide(color: surakshaBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(S.radius),
            borderSide: const BorderSide(color: surakshaBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(S.radius),
            borderSide: const BorderSide(color: surakshaCrimson),
          ),
        ),
        scrollbarTheme: ScrollbarThemeData(
          thickness: WidgetStateProperty.all(6),
          thumbColor: WidgetStateProperty.all(surakshaBorder),
          trackColor: WidgetStateProperty.all(surakshaSecondary),
          radius: const Radius.circular(3),
          crossAxisMargin: 2,
        ),
      );
}
