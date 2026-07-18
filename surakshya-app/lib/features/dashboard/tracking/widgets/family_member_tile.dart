library family_member_tile;

import 'package:flutter/material.dart';
import 'package:suraksha/models/contact_model.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

/// Horizontal / vertical gap between guardian cards in the masonry grid.
const double kGuardianGridGap = S.sm;

/// Enlarged profile-style avatar (was radius 20).
const double kGuardianAvatarRadius = 30.0;

const double kGuardianAvatarInitialsSize = 15.0;
const FontWeight kGuardianAvatarInitialsWeight = FontWeight.w600;

/// Slightly roomier than [S.md] for card breathing room.
const double kGuardianCardPadding = 18.0;

const double kGuardianPhoneIconSize = 20.0;

const List<BoxShadow> kGuardianCardShadow = [
  BoxShadow(
    color: Color(0x40000000),
    blurRadius: 12,
    offset: Offset(0, 4),
  ),
];

class FamilyMemberTile extends StatelessWidget {
  const FamilyMemberTile({super.key, required this.member});

  final ContactModel member;

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(kGuardianCardPadding),
        decoration: BoxDecoration(
          color: dashboardCard,
          borderRadius: BorderRadius.circular(S.radiusLg),
          border: Border.all(color: dashboardBorder),
          boxShadow: kGuardianCardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: kGuardianAvatarRadius,
                  backgroundColor: surakshaCrimsonCard,
                  backgroundImage: member.avatarPath != null
                      ? AssetImage(member.avatarPath!)
                      : null,
                  child: member.avatarPath == null
                      ? Text(
                          member.initials,
                          style: SurakshaTypography.dashTitle.copyWith(
                            fontSize: kGuardianAvatarInitialsSize,
                            fontWeight: kGuardianAvatarInitialsWeight,
                            color: surakshyaCrimson,
                          ),
                        )
                      : null,
                ),
                const Spacer(),
                const Padding(
                  padding: EdgeInsets.only(top: S.xs),
                  child: Icon(
                    Icons.phone_outlined,
                    color: surakshaAuthText,
                    size: kGuardianPhoneIconSize,
                  ),
                ),
              ],
            ),
            const SizedBox(height: S.md),
            Text(
              member.name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: SurakshaTypography.dashTitle.copyWith(fontSize: 16),
            ),
            const SizedBox(height: S.xs),
            Text(
              member.role,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: SurakshaTypography.monoLabel.copyWith(
                color: surakshyaCrimson,
                fontSize: 11,
              ),
            ),
            const SizedBox(height: S.xs),
            Text(
              member.phone,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: SurakshaTypography.monoLabel.copyWith(
                fontSize: 11,
                color: surakshaAuthText,
              ),
            ),
          ],
        ),
      );
}
