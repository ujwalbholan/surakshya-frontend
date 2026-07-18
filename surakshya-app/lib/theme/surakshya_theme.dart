library surakshya_theme;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:surakshya/theme/surakshya_colors.dart';
import 'package:surakshya/theme/surakshya_spacing.dart';
import 'package:surakshya/theme/surakshya_typography.dart';

class SurakshyaTheme {
  SurakshyaTheme._();

  static ThemeData get dark => ThemeData(
        useMaterial3: true,
        brightness: Brightness.dark,
        scaffoldBackgroundColor: surakshyaBlack,
        colorScheme: const ColorScheme.dark(
          primary: surakshyaCrimson,
          secondary: surakshyaYellow,
          surface: surakshyaCard,
          onSurface: surakshyaForeground,
        ),
        appBarTheme: AppBarTheme(
          backgroundColor: Colors.transparent,
          elevation: 0,
          systemOverlayStyle: SystemUiOverlayStyle.light,
          titleTextStyle: SurakshyaTypography.dashTitle,
        ),
        dividerColor: surakshyaBorder,
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: surakshyaCrimson,
            foregroundColor: surakshyaForeground,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 14),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(S.radius),
            ),
          ),
        ),
        inputDecorationTheme: InputDecorationTheme(
          filled: true,
          fillColor: surakshyaWhiteT6,
          border: OutlineInputBorder(
            borderRadius: BorderRadius.circular(S.radius),
            borderSide: const BorderSide(color: surakshyaBorder),
          ),
          enabledBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(S.radius),
            borderSide: const BorderSide(color: surakshyaBorder),
          ),
          focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(S.radius),
            borderSide: const BorderSide(color: surakshyaCrimson),
          ),
        ),
        scrollbarTheme: ScrollbarThemeData(
          thickness: WidgetStateProperty.all(6),
          thumbColor: WidgetStateProperty.all(surakshyaBorder),
          trackColor: WidgetStateProperty.all(surakshyaSecondary),
          radius: const Radius.circular(3),
          crossAxisMargin: 2,
        ),
      );
}
