library profile_section_card;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/app_svg_icon.dart';

/// Corner radius for Profile section cards (D8: match hero / D1 surface).
const double kProfileSectionCardRadius = S.radiusLg;

/// Gap between section label and card.
const double kProfileSectionLabelGap = S.sm;

/// Gap below each section block.
const double kProfileSectionBottomGap = S.lg;

/// Leading icon glyph size inside the tinted circle.
const double kProfileRowIconSize = 20;

/// Leading icon circle diameter.
const double kProfileRowIconCircleSize = 36;

/// Guardian list avatar radius inside section rows.
const double kProfileGuardianAvatarRadius = 20;

/// Horizontal inset for section list rows.
const double kProfileRowPaddingH = S.md;

/// Vertical inset for section list rows.
const double kProfileRowPaddingV = S.sm;

/// Crimson tint behind leading row icons.
const double kProfileRowIconBgAlpha = 0.15;

/// Border width for the white/crimson Profile cards (D1-rev).
const double kProfileCardBorderWidth = 1.0;

/// Border color for the white/crimson Profile cards (D1-rev).
const Color kProfileCardBorderColor = surakshaCrimson;

/// Chevrons and trailing action icons on [surakshaLightSurface].
const Color kProfileChevronColor = surakshaOnLightMuted;

/// Profile type scale (top-down hierarchy):
/// section heading 13 > row title 16 > subtitle 13 > trailing mono 11.
const double kProfileSectionLabelFontSize = 13.0;
const double kProfileRowTitleFontSize = 16.0;
const double kProfileRowSubtitleFontSize = 13.0;
const double kProfileRowTrailingFontSize = 11.0;

/// Title style for Profile settings rows — Space Grotesk (heading font).
TextStyle get kProfileRowTitleStyle => SurakshaTypography.dashTitle.copyWith(
      fontSize: kProfileRowTitleFontSize,
      color: surakshaOnLight,
    );

/// Subtitle / secondary line for Profile settings rows — Inter (body font).
TextStyle get kProfileRowSubtitleStyle =>
    SurakshaTypography.dashSubtitle.copyWith(
      fontSize: kProfileRowSubtitleFontSize,
      color: surakshaOnLightMuted,
    );

/// Trailing status / chevron-adjacent muted text — JetBrains Mono.
TextStyle get kProfileRowTrailingStyle => SurakshaTypography.monoLabel.copyWith(
      color: surakshaOnLightMuted,
      fontSize: kProfileRowTrailingFontSize,
    );

/// Uppercase section heading above a Profile card — JetBrains Mono with the
/// letter-spaced label treatment, sized ABOVE the body copy so the hierarchy
/// reads heading > title > subtitle (was 9px, smaller than everything else).
TextStyle get kProfileSectionLabelStyle =>
    SurakshaTypography.sectionLabel.copyWith(
      fontSize: kProfileSectionLabelFontSize,
      color: surakshaAuthText,
    );

/// Uppercase section label above a Profile card.
class ProfileSection extends StatelessWidget {
  const ProfileSection(this.title, this.children, {super.key});

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(), style: kProfileSectionLabelStyle),
          const SizedBox(height: kProfileSectionLabelGap),
          ...children,
          const SizedBox(height: kProfileSectionBottomGap),
        ],
      );
}

/// White surface with a crimson border for Profile section content (D1-rev).
class ProfileSettingsCard extends StatelessWidget {
  const ProfileSettingsCard({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) => Material(
        color: surakshaLightSurface,
        clipBehavior: Clip.antiAlias,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(kProfileSectionCardRadius),
          side: const BorderSide(
            color: kProfileCardBorderColor,
            width: kProfileCardBorderWidth,
          ),
        ),
        child: child,
      );
}

/// Circular leading icon for Profile list rows: black glyph on an
/// off-white circle, so crimson stays reserved for the card borders.
class ProfileRowIcon extends StatelessWidget {
  const ProfileRowIcon(this.icon, {super.key, this.color = surakshaOnLight});

  final IconData icon;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        width: kProfileRowIconCircleSize,
        height: kProfileRowIconCircleSize,
        alignment: Alignment.center,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: surakshaLightSurfaceAlt,
        ),
        child: Icon(icon, size: kProfileRowIconSize, color: color),
      );
}

/// [ProfileRowIcon] variant for the custom SVG icon set.
class ProfileRowSvgIcon extends StatelessWidget {
  const ProfileRowSvgIcon(
    this.asset, {
    super.key,
    this.color = surakshaOnLight,
  });

  final String asset;
  final Color color;

  @override
  Widget build(BuildContext context) => Container(
        width: kProfileRowIconCircleSize,
        height: kProfileRowIconCircleSize,
        alignment: Alignment.center,
        decoration: const BoxDecoration(
          shape: BoxShape.circle,
          color: surakshaLightSurfaceAlt,
        ),
        child: AppSvgIcon(
          asset,
          size: kProfileRowIconSize,
          color: color,
        ),
      );
}

/// Inset hairline between rows inside a [ProfileSettingsCard].
class ProfileRowDivider extends StatelessWidget {
  const ProfileRowDivider({super.key});

  @override
  Widget build(BuildContext context) => const Divider(
        height: 1,
        thickness: 1,
        color: surakshaOnLightDivider,
        indent: kProfileRowPaddingH +
            kProfileRowIconCircleSize +
            kProfileRowPaddingH,
      );
}
