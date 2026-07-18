library profile_hero_card;

import 'package:flutter/material.dart';
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

class ProfileHeroCard extends StatelessWidget {
  const ProfileHeroCard({super.key, required this.user});

  final UserModel? user;

  @override
  Widget build(BuildContext context) {
    final name = user?.name ?? 'User';
    final secondary = user?.email ?? user?.phone ?? '';

    return SizedBox(
      width: double.infinity,
      child: Stack(
        clipBehavior: Clip.none,
        alignment: Alignment.topCenter,
        children: [
          Padding(
            padding: const EdgeInsets.only(top: kProfileAvatarOverlap),
            child: Material(
              color: dashboardCard,
              borderRadius: BorderRadius.circular(kProfileHeroCardRadius),
              clipBehavior: Clip.antiAlias,
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
                      style: SurakshaTypography.dashGreeting,
                    ),
                    if (secondary.isNotEmpty) ...[
                      const SizedBox(height: kProfileHeroTextGap),
                      Text(
                        secondary,
                        textAlign: TextAlign.center,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                        style: SurakshaTypography.monoLabel.copyWith(
                          color: surakshaAuthText,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
          Positioned(
            top: 0,
            child: Container(
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                boxShadow: [
                  BoxShadow(
                    color: surakshaCrimson.withValues(alpha: kProfileHaloAlpha),
                    blurRadius: kProfileHaloBlur,
                    spreadRadius: kProfileHaloSpread,
                  ),
                ],
              ),
              child: CircleAvatar(
                radius: kProfileAvatarRadius,
                backgroundColor: surakshaCrimson,
                child: Text(
                  _userInitials(user),
                  style: SurakshaTypography.dashGreeting,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

String _userInitials(UserModel? user) {
  final name = user?.name.trim() ?? '';
  if (name.isEmpty) return 'PS';
  if (name.length == 1) return name.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}
