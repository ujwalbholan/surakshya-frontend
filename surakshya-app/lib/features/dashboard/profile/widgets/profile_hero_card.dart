library profile_hero_card;

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:suraksha/features/dashboard/profile/widgets/profile_section_card.dart';
import 'package:suraksha/models/user_model.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

/// Avatar circle radius for the Profile hero.
const double kProfileAvatarRadius = 50;

/// How far the avatar overlaps the top edge of the hero card.
const double kProfileAvatarOverlap = kProfileAvatarRadius;

/// Crimson halo blur — matches SOS center-button glow.
const double kProfileHaloBlur = 16;

/// Crimson halo spread — matches SOS center-button glow.
const double kProfileHaloSpread = 2;

/// Crimson halo opacity — matches SOS center-button glow.
const double kProfileHaloAlpha = 0.45;

/// Hero card corner radius (D1: reuse section card radius).
const double kProfileHeroCardRadius = S.radiusLg;

/// Horizontal padding inside the hero card body.
const double kProfileHeroCardPaddingH = S.lg;

/// Vertical padding inside the hero card body (below the avatar).
const double kProfileHeroCardPaddingV = S.lg;

/// Gap between name and secondary line.
const double kProfileHeroTextGap = S.xs;

/// Diameter of the decorative tick badge on the avatar (D3-rev).
const double kProfileBadgeSize = 28;

/// White ring around the tick badge so it separates from the avatar.
const double kProfileBadgeRingWidth = 2;

/// Check glyph size inside the tick badge.
const double kProfileBadgeIconSize = 16;

/// Progress bar track height inside the hero card (D4-rev).
const double kProfileProgressHeight = 6;

/// Gap between the secondary line and the progress bar.
const double kProfileProgressGap = S.md;

/// Gap between the progress bar and its percentage label.
const double kProfileProgressLabelGap = S.xs;

class ProfileHeroCard extends StatelessWidget {
  const ProfileHeroCard({
    super.key,
    required this.user,
    required this.completeness,
  });

  final UserModel? user;

  /// Profile-setup completeness in [0, 1], derived from real signals (D4-rev).
  final double completeness;

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
          Padding(
            padding: const EdgeInsets.only(top: kProfileAvatarOverlap),
            child: Material(
              color: surakshaLightSurface,
              clipBehavior: Clip.antiAlias,
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(kProfileHeroCardRadius),
                side: const BorderSide(
                  color: kProfileCardBorderColor,
                  width: kProfileCardBorderWidth,
                ),
              ),
              child: Padding(
                padding: const EdgeInsets.fromLTRB(
                  kProfileHeroCardPaddingH,
                  kProfileAvatarRadius + kProfileHeroCardPaddingV,
                  kProfileHeroCardPaddingH,
                  kProfileHeroCardPaddingV,
                ),
                child: Column(
                  children: [
                    Text(
                      name,
                      textAlign: TextAlign.center,
                      maxLines: 2,
                      overflow: TextOverflow.ellipsis,
                      style: SurakshaTypography.dashGreeting.copyWith(
                        color: surakshaOnLight,
                      ),
                    ),
                    if (secondary.isNotEmpty) ...[
                      const SizedBox(height: kProfileHeroTextGap),
                      Text(
                        secondary,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: SurakshaTypography.monoLabel.copyWith(
                          color: surakshaOnLightMuted,
                        ),
                      ),
                    ],
                    const SizedBox(height: kProfileProgressGap),
                    ClipRRect(
                      borderRadius:
                          BorderRadius.circular(kProfileProgressHeight),
                      child: LinearProgressIndicator(
                        value: completeness,
                        minHeight: kProfileProgressHeight,
                        color: surakshaCrimson,
                        backgroundColor: surakshaCrimsonFaint,
                      ),
                    ),
                    const SizedBox(height: kProfileProgressLabelGap),
                    Text(
                      'PROFILE $percent% COMPLETE',
                      style: SurakshaTypography.monoLabel.copyWith(
                        color: surakshaOnLightMuted,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
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
                  child: CircleAvatar(
                    radius: kProfileAvatarRadius,
                    backgroundColor: surakshaCrimson,
                    foregroundImage: _avatarImage(user?.avatarPath),
                    child: Text(
                      _userInitials(user),
                      style: SurakshaTypography.dashGreeting,
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
        ],
      ),
    );
  }
}

/// Uploaded photo if one exists; null keeps the initials fallback visible.
ImageProvider? _avatarImage(String? path) {
  if (path == null || path.isEmpty) return null;
  return path.startsWith('assets/')
      ? AssetImage(path)
      : FileImage(File(path)) as ImageProvider;
}

/// Initials derived from the user's email (D3-rev); name is the fallback.
String _userInitials(UserModel? user) {
  final source = (user?.email.trim().isNotEmpty ?? false)
      ? user!.email.trim()
      : user?.name.trim() ?? '';
  if (source.isEmpty) return 'PS';
  if (source.length == 1) return source.toUpperCase();
  return source.substring(0, 2).toUpperCase();
}
