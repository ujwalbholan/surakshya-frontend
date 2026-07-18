library parent_profile_tab;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/features/dashboard/profile/widgets/profile_hero_card.dart';
import 'package:suraksha/features/dashboard/profile/widgets/profile_section_card.dart';
import 'package:suraksha/features/parent/parent_dashboard_provider.dart';
import 'package:suraksha/models/parent_models.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/app_bottom_sheet.dart';
import 'package:suraksha/widgets/navigation/notched_sos_bottom_nav.dart';

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
            // Same hero as the user profile: halo avatar over a frosted
            // white card with name, email, and edit button (no progress bar).
            ProfileHeroCard(
              user: user,
              onEdit: () => context.push(AppRoutes.editProfile),
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
            // Same sign-out row as the user profile: white settings card
            // with a crimson logout icon and label.
            ProfileSettingsCard(
              child: ListTile(
                contentPadding: const EdgeInsets.symmetric(
                  horizontal: kProfileRowPaddingH,
                  vertical: kProfileRowPaddingV,
                ),
                leading: const ProfileRowIcon(
                  Icons.logout,
                  color: surakshaCrimson,
                ),
                title: Text(
                  CopyConstants.profileSignOut,
                  style: kProfileRowTitleStyle.copyWith(color: surakshaCrimson),
                ),
                onTap: () => _confirmSignOut(context, ref),
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

/// Same confirmation sheet as the user profile's sign out.
Future<void> _confirmSignOut(BuildContext context, WidgetRef ref) async {
  final confirm = await showAppBottomSheet<bool>(
    context: context,
    builder: (ctx) => Padding(
      padding: const EdgeInsets.only(top: S.sm),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: kSheetActionIconCircleSize,
            height: kSheetActionIconCircleSize,
            alignment: Alignment.center,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              color: surakshaCrimson.withValues(
                alpha: kProfileRowIconBgAlpha,
              ),
            ),
            child: const Icon(
              Icons.logout,
              size: kSheetActionIconSize,
              color: surakshaCrimson,
            ),
          ),
          const SizedBox(height: S.md),
          Text(
            CopyConstants.profileSignOut,
            style: SurakshaTypography.dashTitle,
          ),
          const SizedBox(height: S.sm),
          Text(
            CopyConstants.profileSignOutConfirm,
            style: SurakshaTypography.dashSubtitle.copyWith(
              color: surakshaAuthText,
            ),
          ),
          const SizedBox(height: S.lg),
          Row(
            children: [
              Expanded(
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: surakshaForeground,
                    minimumSize: const Size.fromHeight(kSheetButtonHeight),
                  ),
                  onPressed: () => Navigator.pop(ctx, false),
                  child: const Text('Cancel'),
                ),
              ),
              const SizedBox(width: S.md),
              Expanded(
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: surakshaCrimson,
                    foregroundColor: surakshaForeground,
                    minimumSize: const Size.fromHeight(kSheetButtonHeight),
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
