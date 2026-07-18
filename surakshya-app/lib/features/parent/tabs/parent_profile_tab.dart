library parent_profile_tab;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/features/dashboard/profile/widgets/profile_section_card.dart';
import 'package:suraksha/features/parent/parent_dashboard_provider.dart';
import 'package:suraksha/models/parent_models.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/navigation/notched_sos_bottom_nav.dart';
import 'package:suraksha/widgets/user_avatar.dart';

/// Guardian profile avatar size (hero, centered).
const double kParentAvatarRadius = 56;
const double kParentAvatarInitialsSize = 28;

class ParentProfileTab extends ConsumerWidget {
  const ParentProfileTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final dash = ref.watch(parentDashboardProvider);
    final user = auth.user;
    final bottomPad = S.bottomNavHeight +
        kSosNotchProtrusion +
        MediaQuery.paddingOf(context).bottom;

    return Material(
      color: dashboardBg,
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: EdgeInsets.fromLTRB(S.lg, S.lg, S.lg, bottomPad + S.lg),
          children: [
            Center(
              child: Column(
                children: [
                  UserAvatar(
                    user: user,
                    radius: kParentAvatarRadius,
                    initialsStyle: SurakshaTypography.dashGreeting.copyWith(
                      fontSize: kParentAvatarInitialsSize,
                    ),
                  ),
                  const SizedBox(height: S.md),
                  Text(
                    user?.name ?? 'Guardian',
                    style: SurakshaTypography.dashGreeting,
                  ),
                  const SizedBox(height: S.xs),
                  if (user?.email.isNotEmpty ?? false)
                    Text(
                      user!.email,
                      style: SurakshaTypography.monoLabel,
                    ),
                  if (user?.phone != null && user!.phone!.isNotEmpty) ...[
                    const SizedBox(height: S.xs),
                    Text(
                      user.phone!,
                      style: SurakshaTypography.monoLabel,
                    ),
                  ],
                ],
              ),
            ),
            const SizedBox(height: S.xl),
            ProfileSection(CopyConstants.parentSelectChild, [
              ProfileSettingsCard(
                child: dash.wards.isEmpty
                    ? Padding(
                        padding: const EdgeInsets.all(S.md),
                        child: Text(
                          CopyConstants.parentNoChildren,
                          style: kProfileRowSubtitleStyle,
                        ),
                      )
                    : Column(
                        children: [
                          for (var i = 0; i < dash.wards.length; i++) ...[
                            if (i > 0) const ProfileRowDivider(),
                            _WardListTile(ward: dash.wards[i]),
                          ],
                        ],
                      ),
              ),
            ]),
            Center(
              child: TextButton(
                onPressed: () => _confirmSignOut(context, ref),
                child: Text(
                  CopyConstants.profileSignOut,
                  style: SurakshaTypography.dashSubtitle.copyWith(
                    fontSize: 14,
                    fontWeight: FontWeight.w600,
                    color: surakshaCrimson,
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _WardListTile extends StatelessWidget {
  const _WardListTile({required this.ward});

  final LinkedWard ward;

  @override
  Widget build(BuildContext context) => ListTile(
        contentPadding: const EdgeInsets.symmetric(
          horizontal: kProfileRowPaddingH,
          vertical: kProfileRowPaddingV / 2,
        ),
        leading: CircleAvatar(
          radius: kProfileGuardianAvatarRadius,
          backgroundColor:
              surakshaCrimson.withValues(alpha: kProfileRowIconBgAlpha),
          child: Text(
            ward.initials,
            style: SurakshaTypography.dashTitle.copyWith(
              fontSize: 13,
              color: surakshaCrimson,
            ),
          ),
        ),
        title: Text(ward.fullName, style: kProfileRowTitleStyle),
        subtitle: Text(
          ward.phone,
          style: SurakshaTypography.monoStat.copyWith(
            fontSize: 12,
            color: surakshaOnLightMuted,
          ),
        ),
      );
}

Future<void> _confirmSignOut(BuildContext context, WidgetRef ref) async {
  final confirm = await showModalBottomSheet<bool>(
    context: context,
    backgroundColor: dashboardSheetBg,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(S.radiusXl)),
    ),
    builder: (ctx) => Padding(
      padding: const EdgeInsets.all(S.lg),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            CopyConstants.profileSignOut,
            style: SurakshaTypography.dashTitle,
          ),
          const SizedBox(height: S.sm),
          Text(
            CopyConstants.profileSignOutConfirm,
            style: SurakshaTypography.dashSubtitle,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: S.lg),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: S.md),
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: surakshaCrimson,
                  ),
                  onPressed: () => Navigator.pop(ctx, true),
                  child: const Text('Sign Out'),
                ),
              ),
            ],
          ),
        ],
      ),
    ),
  );
  if (confirm == true) {
    ref.read(authProvider.notifier).logout();
    if (context.mounted) context.go(AppRoutes.login);
  }
}
