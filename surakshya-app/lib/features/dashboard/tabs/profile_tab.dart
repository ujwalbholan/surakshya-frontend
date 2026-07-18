library profile_tab;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/features/dashboard/profile/widgets/profile_hero_card.dart';
import 'package:suraksha/features/dashboard/profile/widgets/profile_section_card.dart';
import 'package:suraksha/features/guardians/edit_guardian_phone_sheet.dart';
import 'package:suraksha/features/guardians/guardian_provider.dart';
import 'package:suraksha/models/guardian_models.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/services/ble_service.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class ProfileTab extends ConsumerStatefulWidget {
  const ProfileTab({super.key});

  @override
  ConsumerState<ProfileTab> createState() => _ProfileTabState();
}

class _ProfileTabState extends ConsumerState<ProfileTab> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (ref.read(authProvider).isLoggedIn) {
        ref.read(guardianLinkingProvider.notifier).refresh();
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final auth = ref.watch(authProvider);
    final dash = ref.watch(dashboardProvider);
    final guardians = ref.watch(guardianLinkingProvider);
    final user = auth.user;
    final bottomPad = S.bottomNavHeight + MediaQuery.paddingOf(context).bottom;

    return Material(
      color: dashboardBg,
      child: SafeArea(
        bottom: false,
        child: ListView(
          padding: EdgeInsets.fromLTRB(S.lg, S.lg, S.lg, bottomPad + S.lg),
          children: [
            ProfileHeroCard(user: user),
            const SizedBox(height: S.xl),
            ProfileSection(CopyConstants.familyMembersTitle, [
              ProfileSettingsCard(
                child: Column(
                  children: [
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: kProfileRowPaddingH,
                        vertical: kProfileRowPaddingV,
                      ),
                      leading: const ProfileRowIcon(Icons.group_outlined),
                      title: Text(
                        CopyConstants.manageGuardians,
                        style: kProfileRowTitleStyle,
                      ),
                      subtitle: Text(
                        guardians.guardians.isEmpty
                            ? CopyConstants.noLinkedGuardians
                            : '${guardians.guardians.length} linked · ${guardians.pendingRequests.length} pending',
                        style: kProfileRowSubtitleStyle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: const Icon(
                        Icons.chevron_right,
                        color: surakshaAuthText,
                      ),
                      onTap: () => context.push(AppRoutes.guardians),
                    ),
                    const ProfileRowDivider(),
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: kProfileRowPaddingH,
                        vertical: kProfileRowPaddingV,
                      ),
                      leading: const ProfileRowIcon(Icons.star_rounded),
                      title: Text(
                        CopyConstants.emergencyContactTitle,
                        style: kProfileRowTitleStyle,
                      ),
                      subtitle: Text(
                        () {
                          final matches = guardians.guardians
                              .where((g) => g.isEmergencyContact);
                          if (matches.isEmpty) {
                            return CopyConstants.noEmergencyContactYet;
                          }
                          final emergency = matches.first;
                          return '${emergency.fullName} · ${emergency.phone}';
                        }(),
                        style: kProfileRowSubtitleStyle,
                        maxLines: 2,
                        overflow: TextOverflow.ellipsis,
                      ),
                      trailing: const Icon(
                        Icons.chevron_right,
                        color: surakshaAuthText,
                      ),
                      onTap: () {
                        final matches = guardians.guardians
                            .where((g) => g.isEmergencyContact);
                        if (matches.isEmpty) {
                          context.push(AppRoutes.guardians);
                          return;
                        }
                        showEditGuardianPhoneSheet(
                          context: context,
                          ref: ref,
                          guardian: matches.first,
                        );
                      },
                    ),
                    if (guardians.guardians.isEmpty && !guardians.loading)
                      Padding(
                        padding: const EdgeInsets.fromLTRB(
                          kProfileRowPaddingH,
                          0,
                          kProfileRowPaddingH,
                          kProfileRowPaddingV,
                        ),
                        child: Align(
                          alignment: Alignment.centerLeft,
                          child: Text(
                            CopyConstants.noLinkedGuardians,
                            style: kProfileRowSubtitleStyle,
                          ),
                        ),
                      )
                    else
                      ...guardians.guardians.map(
                        (g) => _GuardianProfileRow(
                          guardian: g,
                          onEdit: () => showEditGuardianPhoneSheet(
                            context: context,
                            ref: ref,
                            guardian: g,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ]),
            ProfileSection('Location', [
              ProfileSettingsCard(
                child: SwitchListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: kProfileRowPaddingH,
                    vertical: kProfileRowPaddingV,
                  ),
                  secondary: const ProfileRowIcon(Icons.location_on_outlined),
                  title: Text(
                    'Share my location',
                    style: kProfileRowTitleStyle,
                  ),
                  subtitle: Text(
                    'Used for SOS alerts to the police dashboard',
                    style: kProfileRowSubtitleStyle,
                  ),
                  value: dash.locationSharingActive,
                  activeThumbColor: surakshaCrimson,
                  onChanged: (_) => ref
                      .read(dashboardProvider.notifier)
                      .toggleLocationSharing(),
                ),
              ),
            ]),
            ProfileSection('Device', [
              ProfileSettingsCard(
                child: Column(
                  children: [
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: kProfileRowPaddingH,
                        vertical: kProfileRowPaddingV,
                      ),
                      leading: const ProfileRowIcon(Icons.bluetooth),
                      title: Text(
                        'Pair Suraksha Band',
                        style: kProfileRowTitleStyle,
                      ),
                      trailing: const Icon(
                        Icons.chevron_right,
                        color: surakshaAuthText,
                      ),
                      onTap: () async {
                        await ref.read(bleServiceProvider).startScan();
                        if (context.mounted) {
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(content: Text('BLE scan started')),
                          );
                        }
                      },
                    ),
                    const ProfileRowDivider(),
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: kProfileRowPaddingH,
                        vertical: kProfileRowPaddingV,
                      ),
                      leading: const ProfileRowIcon(Icons.watch_outlined),
                      title: Text(
                        'Band status',
                        style: kProfileRowTitleStyle,
                      ),
                      trailing: Text(
                        dash.bandConnected ? 'Connected' : 'Disconnected',
                        style: kProfileRowTrailingStyle.copyWith(
                          color: dash.bandConnected
                              ? surakshaSuccess
                              : surakshaAuthText,
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ]),
            ProfileSection('Notifications', [
              ProfileSettingsCard(
                child: SwitchListTile(
                  contentPadding: const EdgeInsets.symmetric(
                    horizontal: kProfileRowPaddingH,
                    vertical: kProfileRowPaddingV,
                  ),
                  secondary: const ProfileRowIcon(Icons.notifications_outlined),
                  title: Text(
                    'SOS alerts',
                    style: kProfileRowTitleStyle,
                  ),
                  value: true,
                  activeThumbColor: surakshaCrimson,
                  onChanged: (_) {},
                ),
              ),
            ]),
            ProfileSection('Account', [
              ProfileSettingsCard(
                child: Column(
                  children: [
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: kProfileRowPaddingH,
                        vertical: kProfileRowPaddingV,
                      ),
                      leading: const ProfileRowIcon(Icons.language_outlined),
                      title: Text(
                        'Marketing site',
                        style: kProfileRowTitleStyle,
                      ),
                      trailing: const Icon(
                        Icons.chevron_right,
                        color: surakshaAuthText,
                      ),
                      onTap: () => context.push(AppRoutes.home),
                    ),
                    const ProfileRowDivider(),
                    ListTile(
                      contentPadding: const EdgeInsets.symmetric(
                        horizontal: kProfileRowPaddingH,
                        vertical: kProfileRowPaddingV,
                      ),
                      leading: const ProfileRowIcon(Icons.help_outline),
                      title: Text(
                        'Support',
                        style: kProfileRowTitleStyle,
                      ),
                      trailing: const Icon(
                        Icons.chevron_right,
                        color: surakshaAuthText,
                      ),
                      onTap: () {},
                    ),
                  ],
                ),
              ),
            ]),
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
              style: SurakshaTypography.dashSubtitle.copyWith(
                color: surakshaAuthText,
              ),
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
}

class _GuardianProfileRow extends StatelessWidget {
  const _GuardianProfileRow({
    required this.guardian,
    required this.onEdit,
  });

  final LinkedGuardian guardian;
  final VoidCallback onEdit;

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        const ProfileRowDivider(),
        ListTile(
          contentPadding: const EdgeInsets.symmetric(
            horizontal: kProfileRowPaddingH,
            vertical: kProfileRowPaddingV,
          ),
          leading: CircleAvatar(
            radius: kProfileGuardianAvatarRadius,
            backgroundColor: surakshaCrimson.withValues(
              alpha: kProfileRowIconBgAlpha,
            ),
            child: Text(
              guardian.initials,
              style: SurakshaTypography.dashTitle.copyWith(
                fontSize: 12,
                color: surakshaCrimson,
              ),
            ),
          ),
          title: Text(
            guardian.fullName,
            style: kProfileRowTitleStyle,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          subtitle: Text(
            guardian.isEmergencyContact
                ? '${CopyConstants.emergencyContactBadge} · ${guardian.phone}'
                : 'Guardian · ${guardian.phone}',
            style: kProfileRowSubtitleStyle,
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          trailing: Row(
            mainAxisSize: MainAxisSize.min,
            children: [
              if (guardian.isEmergencyContact)
                const Padding(
                  padding: EdgeInsets.only(right: S.xs),
                  child: Icon(
                    Icons.star_rounded,
                    color: surakshaCrimson,
                    size: kProfileRowIconSize,
                  ),
                ),
              IconButton(
                tooltip: CopyConstants.editPhoneAction,
                icon: const Icon(Icons.edit_outlined, size: kProfileRowIconSize),
                color: surakshaAuthText,
                onPressed: onEdit,
              ),
            ],
          ),
          onTap: onEdit,
        ),
      ],
    );
  }
}
