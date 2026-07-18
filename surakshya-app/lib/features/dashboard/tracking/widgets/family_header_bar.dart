library family_header_bar;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/user_avatar.dart';

/// Avatar and bell share one diameter so the bar's ends read as a matched
/// pair, like the reference.
const double kHeaderCircleSize = 48.0;

/// Top-bar avatar radius (plain, no halo — hero-card treatment is too heavy
/// at this size).
const double kHeaderAvatarRadius = kHeaderCircleSize / 2;

/// Initials size inside the small top-bar avatar.
const double kHeaderAvatarInitialsSize = 16.0;

/// Bell glyph size inside the circular button.
const double kHeaderBellIconSize = 22.0;

/// Breathing room between the wordmark and the side circles.
const double kHeaderWordmarkGap = S.sm;

/// Understated neutral outline for the bell button (reference style).
const Color kHeaderBellOutlineColor = surakshaBorder;

/// Unread-dot diameter and inset on the bell button.
const double kHeaderUnreadDotSize = 8.0;
const double kHeaderUnreadDotInset = 2.0;

/// Tracking top bar: tappable avatar (left) — SURAKSHYA wordmark (center) —
/// circular outlined notification bell (right).
class FamilyHeaderBar extends ConsumerWidget {
  const FamilyHeaderBar({super.key, required this.unreadCount});

  final int unreadCount;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: S.md, vertical: S.sm),
      child: Row(
        children: [
          // Avatar replaces the settings gear; same Profile-tab wiring.
          Semantics(
            label: 'Profile',
            button: true,
            child: InkWell(
              customBorder: const CircleBorder(),
              onTap: () => ref
                  .read(dashboardProvider.notifier)
                  .setTab(DashboardTab.profile),
              child: UserAvatar(
                user: user,
                radius: kHeaderAvatarRadius,
                initialsStyle: SurakshaTypography.dashTitle.copyWith(
                  fontSize: kHeaderAvatarInitialsSize,
                ),
              ),
            ),
          ),
          Expanded(
            child: Semantics(
              header: true,
              label: 'Surakshya',
              child: const Padding(
                padding:
                    EdgeInsets.symmetric(horizontal: kHeaderWordmarkGap),
                // Scale down instead of ellipsizing if a narrow screen can't
                // fit the display-size wordmark.
                child: FittedBox(
                  fit: BoxFit.scaleDown,
                  child: Text(
                    'SURAKSHYA',
                    maxLines: 1,
                    style: kSurakshyaWordmarkStyle,
                  ),
                ),
              ),
            ),
          ),
          Semantics(
            label: 'Notifications',
            button: true,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Material(
                  color: Colors.transparent,
                  shape: const CircleBorder(
                    side: BorderSide(color: kHeaderBellOutlineColor),
                  ),
                  clipBehavior: Clip.antiAlias,
                  child: InkWell(
                    onTap: () => context.push(AppRoutes.notifications),
                    child: const SizedBox(
                      width: kHeaderCircleSize,
                      height: kHeaderCircleSize,
                      child: Icon(
                        Icons.notifications_outlined,
                        color: surakshaForeground,
                        size: kHeaderBellIconSize,
                      ),
                    ),
                  ),
                ),
                if (unreadCount > 0)
                  Positioned(
                    right: kHeaderUnreadDotInset,
                    top: kHeaderUnreadDotInset,
                    child: Container(
                      width: kHeaderUnreadDotSize,
                      height: kHeaderUnreadDotSize,
                      decoration: const BoxDecoration(
                        shape: BoxShape.circle,
                        color: surakshaYellow,
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
