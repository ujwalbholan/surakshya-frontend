library parent_home_tab;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/features/parent/parent_dashboard_provider.dart';
import 'package:suraksha/models/parent_models.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/app_header_bar.dart';
import 'package:suraksha/widgets/navigation/notched_sos_bottom_nav.dart';

class ParentHomeTab extends ConsumerStatefulWidget {
  const ParentHomeTab({super.key});

  @override
  ConsumerState<ParentHomeTab> createState() => _ParentHomeTabState();
}

class _ParentHomeTabState extends ConsumerState<ParentHomeTab> {
  Future<void> _acceptRequest(String requestId) async {
    try {
      final message =
          await ref.read(parentDashboardProvider.notifier).acceptRequest(
                requestId,
              );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } on SurakshyaApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
      await ref.read(parentDashboardProvider.notifier).refresh();
    }
  }

  Future<void> _rejectRequest(String requestId) async {
    try {
      final message =
          await ref.read(parentDashboardProvider.notifier).rejectRequest(
                requestId,
              );
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } on SurakshyaApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
      await ref.read(parentDashboardProvider.notifier).refresh();
    }
  }

  Future<void> _inviteWard() async {
    final controller = TextEditingController();
    final email = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: dashboardCard,
        title: Text('Invite ward', style: SurakshaTypography.dashGreeting),
        content: TextField(
          controller: controller,
          keyboardType: TextInputType.emailAddress,
          style: SurakshaTypography.bodyLarge,
          decoration: const InputDecoration(
            labelText: 'Child email',
            labelStyle: TextStyle(color: surakshaMuted),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(ctx, controller.text.trim()),
            child: const Text('Send'),
          ),
        ],
      ),
    );
    if (email == null || email.isEmpty || !mounted) return;
    try {
      final message =
          await ref.read(parentDashboardProvider.notifier).inviteWard(email);
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } on SurakshyaApiException catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(e.message)),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(parentDashboardProvider);
    final auth = ref.watch(authProvider);
    final ward = state.selectedWard;
    final sos = state.activeSos;
    final bottomPad = S.bottomNavHeight +
        kSosNotchProtrusion +
        MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: dashboardBg,
      body: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            AppHeaderBar(
              // Guardian dashboard has no unread-notification state yet.
              unreadCount: 0,
              onAvatarTap: () => ref
                  .read(parentDashboardProvider.notifier)
                  .setTab(ParentTab.profile),
            ),
            Expanded(
              child: RefreshIndicator(
                color: surakshaCrimson,
                onRefresh: () =>
                    ref.read(parentDashboardProvider.notifier).refresh(),
                child: ListView(
                  padding:
                      EdgeInsets.fromLTRB(S.lg, S.md, S.lg, bottomPad + S.xl),
                  children: [
                    if (auth.user?.name != null)
                      Padding(
                        padding: const EdgeInsets.only(bottom: S.md),
                        child: Text(
                          auth.user!.name,
                          style: SurakshaTypography.monoLabel,
                        ),
                      ),
                    if (state.error != null)
                      _ErrorBanner(message: state.error!),
                    if (state.pendingRequests.isNotEmpty) ...[
                      for (final request in state.pendingRequests)
                        _PendingBanner(
                          request: request,
                          onAccept: () => _acceptRequest(request.id),
                          onReject: () => _rejectRequest(request.id),
                        ),
                      const SizedBox(height: S.md),
                    ],
                    Align(
                      alignment: Alignment.centerLeft,
                      child: TextButton.icon(
                        onPressed: _inviteWard,
                        icon: const Icon(Icons.person_add_alt_1, size: 18),
                        label: const Text('Invite ward by email'),
                      ),
                    ),
                    const SizedBox(height: S.md),
                    if (state.loading && state.wards.isEmpty)
                      const Padding(
                        padding: EdgeInsets.symmetric(vertical: S.xl2),
                        child: Center(
                          child:
                              CircularProgressIndicator(color: surakshaCrimson),
                        ),
                      )
                    else if (state.wards.isEmpty)
                      _EmptyState()
                    else ...[
                      Text(
                        CopyConstants.parentSelectChild,
                        style: SurakshaTypography.dashGreeting
                            .copyWith(fontSize: 16),
                      ),
                      const SizedBox(height: S.sm),
                      ...state.wards.map(
                        (w) => _WardTile(
                          ward: w,
                          selected: w.id == state.selectedWardId,
                          onTap: () => ref
                              .read(parentDashboardProvider.notifier)
                              .selectWard(w.id),
                        ),
                      ),
                      const SizedBox(height: S.lg),
                      if (ward != null) ...[
                        Text(
                          CopyConstants.parentChildDetails,
                          style: SurakshaTypography.dashGreeting
                              .copyWith(fontSize: 16),
                        ),
                        const SizedBox(height: S.sm),
                        _ChildDetailsCard(ward: ward),
                        const SizedBox(height: S.lg),
                        // Status summary only — live map lives on the SOS tab.
                        _SosStatusCard(sos: sos),
                      ],
                    ],
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorBanner extends StatelessWidget {
  const _ErrorBanner({required this.message});

  final String message;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: S.md),
        padding: const EdgeInsets.all(S.md),
        decoration: BoxDecoration(
          color: surakshaCrimson.withValues(alpha: 0.12),
          borderRadius: BorderRadius.circular(S.radius),
          border: Border.all(color: surakshaCrimson.withValues(alpha: 0.35)),
        ),
        child: Text(message, style: SurakshaTypography.bodyMedium),
      );
}

class _PendingBanner extends StatelessWidget {
  const _PendingBanner({
    required this.request,
    required this.onAccept,
    required this.onReject,
  });

  final GuardianPendingRequest request;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) => Container(
        margin: const EdgeInsets.only(bottom: S.sm),
        padding: const EdgeInsets.all(S.md),
        decoration: BoxDecoration(
          color: dashboardCard,
          borderRadius: BorderRadius.circular(S.radius),
          border: Border.all(color: dashboardBorder),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                '${request.requesterName} ${CopyConstants.parentPendingLink}',
                style: SurakshaTypography.bodyMedium,
              ),
            ),
            TextButton(
              onPressed: onReject,
              child: const Text('Decline'),
            ),
            TextButton(
              onPressed: onAccept,
              child: const Text(CopyConstants.parentAcceptLink),
            ),
          ],
        ),
      );
}

class _EmptyState extends StatelessWidget {
  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(S.lg),
        decoration: BoxDecoration(
          color: dashboardCard,
          borderRadius: BorderRadius.circular(S.radiusLg),
          border: Border.all(color: dashboardBorder),
        ),
        child: Text(
          CopyConstants.parentNoChildren,
          style: SurakshaTypography.dashSubtitle,
          textAlign: TextAlign.center,
        ),
      );
}

class _WardTile extends StatelessWidget {
  const _WardTile({
    required this.ward,
    required this.selected,
    required this.onTap,
  });

  final LinkedWard ward;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: S.xs),
        child: Material(
          color: selected
              ? surakshaCrimson.withValues(alpha: 0.15)
              : dashboardCard,
          borderRadius: BorderRadius.circular(S.radius),
          child: InkWell(
            onTap: onTap,
            borderRadius: BorderRadius.circular(S.radius),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal: S.md,
                vertical: S.sm,
              ),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(S.radius),
                border: Border.all(
                  color: selected ? surakshaCrimson : dashboardBorder,
                ),
              ),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 20,
                    backgroundColor: surakshaCrimson.withValues(alpha: 0.25),
                    child: Text(
                      ward.initials,
                      style: SurakshaTypography.bodyMedium,
                    ),
                  ),
                  const SizedBox(width: S.md),
                  Expanded(
                    child: Text(
                      ward.fullName,
                      style: SurakshaTypography.bodyLarge,
                    ),
                  ),
                  if (selected)
                    const Icon(Icons.check_circle,
                        color: surakshaCrimson, size: 20),
                ],
              ),
            ),
          ),
        ),
      );
}

class _ChildDetailsCard extends StatelessWidget {
  const _ChildDetailsCard({required this.ward});

  final LinkedWard ward;

  @override
  Widget build(BuildContext context) => Container(
        width: double.infinity,
        padding: const EdgeInsets.all(S.md),
        decoration: BoxDecoration(
          color: dashboardCard,
          borderRadius: BorderRadius.circular(S.radiusLg),
          border: Border.all(color: dashboardBorder),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(ward.fullName, style: SurakshaTypography.dashGreeting),
            const SizedBox(height: S.xs),
            Text(ward.email, style: SurakshaTypography.monoLabel),
            const SizedBox(height: S.xs),
            Text(ward.phone, style: SurakshaTypography.monoLabel),
          ],
        ),
      );
}

class _SosStatusCard extends StatelessWidget {
  const _SosStatusCard({required this.sos});

  final WardSosEvent? sos;

  @override
  Widget build(BuildContext context) {
    final active = sos?.isActive ?? false;
    final started = sos?.startedAt;
    final timeLabel = started != null
        ? DateFormat('MMM d, h:mm a').format(started.toLocal())
        : null;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(S.md),
      decoration: BoxDecoration(
        color: active ? surakshaCrimson.withValues(alpha: 0.12) : dashboardCard,
        borderRadius: BorderRadius.circular(S.radiusLg),
        border: Border.all(
          color: active
              ? surakshaCrimson.withValues(alpha: 0.45)
              : dashboardBorder,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                active ? Icons.warning_amber_rounded : Icons.shield_outlined,
                color: active ? surakshaCrimson : surakshaMuted,
                size: 22,
              ),
              const SizedBox(width: S.sm),
              Text(
                active
                    ? CopyConstants.parentSosActive
                    : CopyConstants.parentSosSafe,
                style: SurakshaTypography.dashGreeting.copyWith(
                  fontSize: 16,
                  color: active ? surakshaCrimson : surakshaForeground,
                ),
              ),
            ],
          ),
          if (active && sos != null) ...[
            const SizedBox(height: S.sm),
            Text(
              'Band: ${sos!.imei}',
              style: SurakshaTypography.monoLabel,
            ),
            if (timeLabel != null)
              Text(
                'Started: $timeLabel',
                style: SurakshaTypography.dashSubtitle,
              ),
          ],
        ],
      ),
    );
  }
}
