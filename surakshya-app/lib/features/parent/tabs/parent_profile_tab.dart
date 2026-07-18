library parent_profile_tab;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/features/parent/parent_dashboard_provider.dart';
import 'package:suraksha/models/parent_models.dart';
import 'package:suraksha/models/user_model.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class ParentProfileTab extends ConsumerWidget {
  const ParentProfileTab({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final dash = ref.watch(parentDashboardProvider);
    final user = auth.user;
    final bottomPad = S.bottomNavHeight + MediaQuery.paddingOf(context).bottom;

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
                  CircleAvatar(
                    radius: 50,
                    backgroundColor: surakshaCrimson,
                    child: Text(
                      _userInitials(user),
                      style: SurakshaTypography.dashGreeting,
                    ),
                  ),
                  const SizedBox(height: S.md),
                  Text(
                    user?.name ?? 'Guardian',
                    style: SurakshaTypography.dashGreeting,
                  ),
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
            _Section(CopyConstants.parentSelectChild, [
              Material(
                color: dashboardCard,
                borderRadius: BorderRadius.circular(S.radiusLg),
                clipBehavior: Clip.antiAlias,
                child: dash.wards.isEmpty
                    ? Padding(
                        padding: const EdgeInsets.all(S.md),
                        child: Text(
                          CopyConstants.parentNoChildren,
                          style: SurakshaTypography.monoLabel,
                        ),
                      )
                    : Column(
                        children: [
                          for (var i = 0; i < dash.wards.length; i++) ...[
                            if (i > 0)
                              const Divider(height: 1, color: dashboardBorder),
                            _WardListTile(ward: dash.wards[i]),
                          ],
                        ],
                      ),
              ),
            ]),
            Center(
              child: TextButton(
                onPressed: () => _confirmSignOut(context, ref),
                child: const Text(
                  CopyConstants.profileSignOut,
                  style: TextStyle(color: surakshaCrimson),
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
        leading: CircleAvatar(
          backgroundColor: surakshaCrimson.withValues(alpha: 0.15),
          child: Text(
            ward.initials,
            style: const TextStyle(color: surakshaCrimson),
          ),
        ),
        title: Text(ward.fullName),
        subtitle: Text(ward.phone),
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
          const Text(CopyConstants.profileSignOutConfirm),
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

String _userInitials(UserModel? user) {
  final name = user?.name.trim() ?? '';
  if (name.isEmpty) return 'G';
  if (name.length == 1) return name.toUpperCase();
  return name.substring(0, 2).toUpperCase();
}

class _Section extends StatelessWidget {
  const _Section(this.title, this.children);

  final String title;
  final List<Widget> children;

  @override
  Widget build(BuildContext context) => Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(title.toUpperCase(), style: SurakshaTypography.monoLabel),
          const SizedBox(height: S.sm),
          ...children,
          const SizedBox(height: S.lg),
        ],
      );
}
