library profile_hero_card;

import 'dart:ui' show ImageFilter;

import 'package:flutter/material.dart';
import 'package:suraksha/widgets/app_svg_icon.dart';
import 'package:suraksha/widgets/user_avatar.dart';
import 'package:suraksha/features/dashboard/profile/widgets/profile_section_card.dart';
import 'package:suraksha/models/user_model.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

/// Avatar circle radius for the Profile hero (reference-scale).
const double kProfileAvatarRadius = 92;

/// Initials size scaled to the large hero avatar.
const double kProfileAvatarInitialsSize = 40;

/// How far the avatar sticks up above the card's top edge. The card then
/// covers the avatar's remaining bottom portion behind a frosted band,
/// matching the reference composition.
const double kProfileAvatarOverlap = kProfileAvatarRadius * 1.2;

/// Blur strength of the frosted band where the card covers the avatar.
const double kProfileHeroBlurSigma = 12.0;

/// Card fill opacity — translucent enough to reveal the avatar behind it.
const double kProfileHeroCardFillAlpha = 0.88;

/// Crimson halo blur — matches SOS center-button glow.
const double kProfileHaloBlur = 16;

/// Crimson halo spread — matches SOS center-button glow.
const double kProfileHaloSpread = 2;

/// Crimson halo opacity — matches SOS center-button glow.
const double kProfileHaloAlpha = 0.45;

/// Hero card corner radius (reference uses a deeper rounding).
const double kProfileHeroCardRadius = S.radiusXl;

/// Horizontal padding inside the hero card body.
const double kProfileHeroCardPaddingH = S.lg;

/// Vertical padding inside the hero card body (below the avatar).
const double kProfileHeroCardPaddingV = S.lg;

/// Gap between name and secondary line.
const double kProfileHeroTextGap = S.xs;

/// Diameter of the decorative tick badge on the avatar (D3-rev).
const double kProfileBadgeSize = 40;

/// White ring around the tick badge so it separates from the avatar.
const double kProfileBadgeRingWidth = 2;

/// Check glyph size inside the tick badge.
const double kProfileBadgeIconSize = 22;

/// Progress bar track height inside the hero card (D4-rev).
const double kProfileProgressHeight = 12;

/// Gap between the identity row and the progress section.
const double kProfileProgressGap = S.lg;

/// Gap between the progress label row and the bar.
const double kProfileProgressLabelGap = S.sm;

/// Diameter of the circular edit button beside the name.
const double kProfileEditButtonSize = 48;

/// Name size in the identity row (reference-scale).
const double kProfileHeroNameFontSize = 28;

/// Secondary line size in the identity row.
const double kProfileHeroSecondaryFontSize = 15;

/// Progress label size.
const double kProfileProgressLabelFontSize = 15;

/// Percentage figure size in the progress row.
const double kProfilePercentFontSize = 24;

/// Label copy above the progress bar.
const String kProfileProgressLabel = 'Profile completion';

class ProfileHeroCard extends StatelessWidget {
  const ProfileHeroCard({
    super.key,
    required this.user,
    required this.completeness,
    required this.onEdit,
  });

  final UserModel? user;

  /// Profile-setup completeness in [0, 1], derived from real signals (D4-rev).
  final double completeness;

  /// Opens the edit-profile screen (D5-rev pencil action).
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    final name = user?.name ?? 'User';
    final secondary = user?.email ?? user?.phone ?? '';
    final percent = (completeness * 100).round();

    return SizedBox(
      width: double.infinity,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.topCenter,
        children: [
          // Avatar layer painted FIRST: it sits in the background and the
          // frosted card below covers its bottom portion (reference layering).
          Positioned(
            top: 0,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Container(
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    boxShadow: [
                      BoxShadow(
                        color: surakshaCrimson.withValues(
                          alpha: kProfileHaloAlpha,
                        ),
                        blurRadius: kProfileHaloBlur,
                        spreadRadius: kProfileHaloSpread,
                      ),
                    ],
                  ),
                  child: UserAvatar(
                    user: user,
                    radius: kProfileAvatarRadius,
                    initialsStyle: SurakshaTypography.dashGreeting.copyWith(
                      fontSize: kProfileAvatarInitialsSize,
                    ),
                  ),
                ),
                // Decorative tick badge (D3-rev): static design element,
                // intentionally not wired to any verification flag.
                Positioned(
                  top: 0,
                  left: 0,
                  child: Container(
                    width: kProfileBadgeSize,
                    height: kProfileBadgeSize,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: surakshaCrimson,
                      border: Border.all(
                        color: surakshaLightSurface,
                        width: kProfileBadgeRingWidth,
                      ),
                    ),
                    child: const Icon(
                      Icons.check,
                      size: kProfileBadgeIconSize,
                      color: surakshaForeground,
                    ),
                  ),
                ),
              ],
            ),
          ),
          // Frosted card painted OVER the avatar's bottom: translucent white
          // fill + backdrop blur so the covered avatar shows through softly.
          Padding(
            padding: const EdgeInsets.only(top: kProfileAvatarOverlap),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(kProfileHeroCardRadius),
              child: BackdropFilter(
                filter: ImageFilter.blur(
                  sigmaX: kProfileHeroBlurSigma,
                  sigmaY: kProfileHeroBlurSigma,
                ),
                child: Container(
                  width: double.infinity,
                  decoration: BoxDecoration(
                    color: surakshaLightSurface.withValues(
                      alpha: kProfileHeroCardFillAlpha,
                    ),
                    borderRadius: BorderRadius.circular(kProfileHeroCardRadius),
                    border: Border.all(
                      color: kProfileCardBorderColor,
                      width: kProfileCardBorderWidth,
                    ),
                  ),
                  child: Padding(
                    padding: const EdgeInsets.all(kProfileHeroCardPaddingH),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        // Identity row: name + secondary on the left, circular
                        // edit button on the right (reference layout).
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.center,
                          children: [
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    name,
                                    maxLines: 1,
                                    overflow: TextOverflow.ellipsis,
                                    style: SurakshaTypography.dashGreeting
                                        .copyWith(
                                      color: surakshaOnLight,
                                      fontSize: kProfileHeroNameFontSize,
                                      fontWeight: FontWeight.w700,
                                    ),
                                  ),
                                  if (secondary.isNotEmpty) ...[
                                    const SizedBox(height: kProfileHeroTextGap),
                                    Text(
                                      secondary,
                                      maxLines: 1,
                                      overflow: TextOverflow.ellipsis,
                                      style: SurakshaTypography.dashSubtitle
                                          .copyWith(
                                        color: surakshaOnLightMuted,
                                        fontSize: kProfileHeroSecondaryFontSize,
                                      ),
                                    ),
                                  ],
                                ],
                              ),
                            ),
                            const SizedBox(width: S.md),
                            _EditButton(onEdit: onEdit),
                          ],
                        ),
                        const SizedBox(height: kProfileProgressGap),
                        // Progress row: label left, percentage right, bar below.
                        Row(
                          crossAxisAlignment: CrossAxisAlignment.end,
                          children: [
                            Expanded(
                              child: Text(
                                kProfileProgressLabel,
                                style: SurakshaTypography.dashSubtitle.copyWith(
                                  color: surakshaOnLightMuted,
                                  fontSize: kProfileProgressLabelFontSize,
                                ),
                              ),
                            ),
                            Text(
                              '$percent%',
                              style: SurakshaTypography.dashTitle.copyWith(
                                color: surakshaOnLight,
                                fontSize: kProfilePercentFontSize,
                                fontWeight: FontWeight.w700,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: kProfileProgressLabelGap),
                        ClipRRect(
                          borderRadius:
                              BorderRadius.circular(kProfileProgressHeight),
                          child: LinearProgressIndicator(
                            value: completeness,
                            minHeight: kProfileProgressHeight,
                            color: surakshaCrimson,
                            backgroundColor: surakshaLightSurfaceAlt,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Circular soft button with a pencil glyph (reference style).
class _EditButton extends StatelessWidget {
  const _EditButton({required this.onEdit});

  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) => Material(
        color: surakshaLightSurfaceAlt,
        shape: const CircleBorder(),
        clipBehavior: Clip.antiAlias,
        child: InkWell(
          onTap: onEdit,
          child: const SizedBox(
            width: kProfileEditButtonSize,
            height: kProfileEditButtonSize,
            child: Center(
              child: AppSvgIcon(
                AppIcons.edit,
                size: kProfileRowIconSize,
                color: surakshaOnLight,
                semanticLabel: 'Edit profile',
              ),
            ),
          ),
        ),
      );
}

