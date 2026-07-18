library guardians_screen;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/guardians/edit_guardian_phone_sheet.dart';
import 'package:suraksha/features/guardians/guardian_provider.dart';
import 'package:suraksha/models/guardian_models.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class GuardiansScreen extends ConsumerStatefulWidget {
  const GuardiansScreen({super.key});

  @override
  ConsumerState<GuardiansScreen> createState() => _GuardiansScreenState();
}

class _GuardiansScreenState extends ConsumerState<GuardiansScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(guardianLinkingProvider.notifier).refresh();
    });
  }

  Future<void> _showInviteSheet() async {
    final nameController = TextEditingController();
    final emailController = TextEditingController();
    final phoneController = TextEditingController(text: '98');

    final sent = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: dashboardSheetBg,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(S.radiusXl)),
      ),
      builder: (ctx) => Padding(
        padding: EdgeInsets.only(
          left: S.lg,
          right: S.lg,
          top: S.lg,
          bottom: MediaQuery.viewInsetsOf(ctx).bottom + S.lg,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(CopyConstants.inviteGuardianTitle,
                style: SurakshaTypography.dashTitle),
            const SizedBox(height: S.sm),
            Text(
              CopyConstants.inviteGuardianSubtitle,
              style: SurakshaTypography.monoLabel,
            ),
            const SizedBox(height: S.lg),
            TextField(
              controller: nameController,
              decoration: const InputDecoration(labelText: 'Guardian name'),
            ),
            const SizedBox(height: S.md),
            TextField(
              controller: emailController,
              keyboardType: TextInputType.emailAddress,
              decoration: const InputDecoration(labelText: 'Email'),
            ),
            const SizedBox(height: S.md),
            TextField(
              controller: phoneController,
              keyboardType: TextInputType.phone,
              decoration: const InputDecoration(
                labelText: 'Phone (Nepal mobile)',
                hintText: '98XXXXXXXX',
              ),
            ),
            const SizedBox(height: S.lg),
            FilledButton(
              style: FilledButton.styleFrom(backgroundColor: surakshaCrimson),
              onPressed: () => Navigator.pop(ctx, true),
              child: const Text('Send invite'),
            ),
          ],
        ),
      ),
    );

    if (sent != true || !mounted) return;

    try {
      final message = await ref.read(guardianLinkingProvider.notifier).inviteGuardian(
            fullName: nameController.text.trim(),
            email: emailController.text.trim(),
            phone: phoneController.text.trim(),
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } on SurakshyaApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(guardianLinkingProvider);
    final bottomPad = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      backgroundColor: dashboardBg,
      appBar: AppBar(
        backgroundColor: dashboardBg,
        foregroundColor: surakshaForeground,
        title: const Text(CopyConstants.guardiansTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(guardianLinkingProvider.notifier).refresh(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: surakshaCrimson,
        onPressed: _showInviteSheet,
        icon: const Icon(Icons.person_add_outlined),
        label: const Text('Invite'),
      ),
      body: RefreshIndicator(
        color: surakshaCrimson,
        onRefresh: () => ref.read(guardianLinkingProvider.notifier).refresh(),
        child: ListView(
          padding: EdgeInsets.fromLTRB(S.lg, S.md, S.lg, bottomPad + 88),
          children: [
            if (state.loading && state.guardians.isEmpty)
              const Padding(
                padding: EdgeInsets.all(S.xl2),
                child: Center(child: CircularProgressIndicator()),
              ),
            if (state.error != null)
              Padding(
                padding: const EdgeInsets.only(bottom: S.md),
                child: Text(
                  state.error!,
                  style: const TextStyle(color: surakshaCrimson),
                ),
              ),
            _SectionHeader(title: CopyConstants.pendingRequestsTitle),
            if (state.pendingRequests.isEmpty && !state.loading)
              Text(
                CopyConstants.noPendingRequests,
                style: SurakshaTypography.monoLabel,
              )
            else
              ...state.pendingRequests.map(
                (request) => _PendingRequestTile(
                  request: request,
                  onAccept: () => _handleAccept(request.id),
                  onReject: () => _handleReject(request.id),
                ),
              ),
            const SizedBox(height: S.xl),
            _SectionHeader(title: CopyConstants.linkedGuardiansTitle),
            if (state.guardians.isEmpty && !state.loading)
              Text(
                CopyConstants.noLinkedGuardians,
                style: SurakshaTypography.monoLabel,
              )
            else ...[
              Text(
                CopyConstants.emergencyContactSubtitle,
                style: SurakshaTypography.monoLabel,
              ),
              const SizedBox(height: S.sm),
              Material(
                color: dashboardCard,
                borderRadius: BorderRadius.circular(S.radiusLg),
                clipBehavior: Clip.antiAlias,
                child: Column(
                  children: [
                    for (var i = 0; i < state.guardians.length; i++) ...[
                      if (i > 0)
                        const Divider(height: 1, color: dashboardBorder),
                      _GuardianTile(
                        guardian: state.guardians[i],
                        onSetEmergency: () => _setEmergency(
                          state.guardians[i],
                          !state.guardians[i].isEmergencyContact,
                        ),
                        onEditPhone: () => showEditGuardianPhoneSheet(
                          context: context,
                          ref: ref,
                          guardian: state.guardians[i],
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _handleAccept(String id) async {
    try {
      final message =
          await ref.read(guardianLinkingProvider.notifier).acceptRequest(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } on SurakshyaApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    }
  }

  Future<void> _handleReject(String id) async {
    try {
      final message =
          await ref.read(guardianLinkingProvider.notifier).rejectRequest(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } on SurakshyaApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    }
  }

  Future<void> _setEmergency(LinkedGuardian guardian, bool enable) async {
    try {
      final message = await ref
          .read(guardianLinkingProvider.notifier)
          .setEmergencyContact(
            guardianId: guardian.id,
            isEmergencyContact: enable,
          );
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(message)),
        );
      }
    } on SurakshyaApiException catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(e.message)),
        );
      }
    }
  }
}

class _SectionHeader extends StatelessWidget {
  const _SectionHeader({required this.title});

  final String title;

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.only(bottom: S.sm),
        child: Text(title.toUpperCase(), style: SurakshaTypography.monoLabel),
      );
}

class _PendingRequestTile extends StatelessWidget {
  const _PendingRequestTile({
    required this.request,
    required this.onAccept,
    required this.onReject,
  });

  final ChildPendingRequest request;
  final VoidCallback onAccept;
  final VoidCallback onReject;

  @override
  Widget build(BuildContext context) {
    final title = request.isGuardianInvite
        ? request.requesterName ?? 'Guardian'
        : request.targetName;
    final subtitle = request.isGuardianInvite
        ? 'Wants to link as your guardian'
        : request.targetEmail;

    return Card(
      color: dashboardSheetBg,
      margin: const EdgeInsets.only(bottom: S.sm),
      child: Padding(
        padding: const EdgeInsets.all(S.md),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: SurakshaTypography.dashTitle),
            const SizedBox(height: 4),
            Text(subtitle, style: SurakshaTypography.monoLabel),
            const SizedBox(height: S.md),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: onReject,
                    child: const Text('Reject'),
                  ),
                ),
                const SizedBox(width: S.md),
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: surakshaCrimson,
                    ),
                    onPressed: onAccept,
                    child: const Text('Accept'),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}

class _GuardianTile extends StatelessWidget {
  const _GuardianTile({
    required this.guardian,
    required this.onSetEmergency,
    required this.onEditPhone,
  });

  final LinkedGuardian guardian;
  final VoidCallback onSetEmergency;
  final VoidCallback onEditPhone;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: const EdgeInsets.symmetric(horizontal: S.md),
      onTap: onEditPhone,
      leading: CircleAvatar(
        backgroundColor: surakshaCrimson.withValues(alpha: 0.2),
        child: Text(
          guardian.initials,
          style: const TextStyle(color: surakshaCrimson),
        ),
      ),
      title: Row(
        children: [
          Flexible(child: Text(guardian.fullName)),
          if (guardian.isEmergencyContact) ...[
            const SizedBox(width: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
              decoration: BoxDecoration(
                color: surakshaCrimson.withValues(alpha: 0.2),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                CopyConstants.emergencyContactBadge,
                style: SurakshaTypography.monoLabel.copyWith(
                  color: surakshaCrimson,
                  fontSize: 10,
                ),
              ),
            ),
          ],
        ],
      ),
      subtitle: Text('Guardian · ${guardian.phone}'),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: CopyConstants.editPhoneAction,
            onPressed: onEditPhone,
            icon: const Icon(Icons.edit_outlined, size: 20),
            color: surakshaMuted,
          ),
          IconButton(
            tooltip: guardian.isEmergencyContact
                ? CopyConstants.clearEmergencyContact
                : CopyConstants.setAsEmergencyContact,
            onPressed: onSetEmergency,
            icon: Icon(
              guardian.isEmergencyContact
                  ? Icons.star_rounded
                  : Icons.star_outline_rounded,
              color:
                  guardian.isEmergencyContact ? surakshaCrimson : surakshaMuted,
            ),
          ),
        ],
      ),
    );
  }
}
