library guardians_screen;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/dashboard/profile/widgets/profile_section_card.dart';
import 'package:suraksha/features/guardians/edit_guardian_phone_sheet.dart';
import 'package:suraksha/features/guardians/guardian_provider.dart';
import 'package:suraksha/models/guardian_models.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/app_bottom_sheet.dart';

/// Extra list padding so the last card clears the Invite FAB.
const double kGuardiansFabClearance = 88.0;

/// Emergency badge horizontal padding.
const double kEmergencyBadgePaddingH = 6.0;

/// Emergency badge vertical padding.
const double kEmergencyBadgePaddingV = 2.0;

/// Emergency badge corner radius.
const double kEmergencyBadgeRadius = 4.0;

/// Emergency badge label size.
const double kEmergencyBadgeFontSize = 10.0;

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

    final sent = await showAppBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      builder: (ctx) => Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Text(
            CopyConstants.inviteGuardianTitle,
            style: SurakshaTypography.dashTitle,
          ),
          const SizedBox(height: S.sm),
          Text(
            CopyConstants.inviteGuardianSubtitle,
            style: SurakshaTypography.dashSubtitle.copyWith(
              color: surakshaAuthText,
            ),
          ),
          const SizedBox(height: S.lg),
          TextField(
            controller: nameController,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Guardian name',
              prefixIcon: Icon(Icons.person_outline, color: surakshaSubtle),
            ),
          ),
          const SizedBox(height: S.md),
          TextField(
            controller: emailController,
            keyboardType: TextInputType.emailAddress,
            textInputAction: TextInputAction.next,
            decoration: const InputDecoration(
              labelText: 'Email',
              prefixIcon: Icon(Icons.email_outlined, color: surakshaSubtle),
            ),
          ),
          const SizedBox(height: S.md),
          TextField(
            controller: phoneController,
            keyboardType: TextInputType.phone,
            textInputAction: TextInputAction.done,
            decoration: const InputDecoration(
              labelText: 'Phone (Nepal mobile)',
              hintText: '98XXXXXXXX',
              prefixIcon: Icon(Icons.phone_outlined, color: surakshaSubtle),
            ),
          ),
          const SizedBox(height: S.lg),
          FilledButton(
            style: FilledButton.styleFrom(
              backgroundColor: surakshaCrimson,
              foregroundColor: surakshaForeground,
              minimumSize: const Size.fromHeight(kSheetButtonHeight),
            ),
            onPressed: () => Navigator.pop(ctx, true),
            child: const Text('Send invite'),
          ),
        ],
      ),
    );

    final name = nameController.text.trim();
    final email = emailController.text.trim();
    final phone = phoneController.text.trim();
    nameController.dispose();
    emailController.dispose();
    phoneController.dispose();

    if (sent != true || !mounted) return;

    try {
      final message =
          await ref.read(guardianLinkingProvider.notifier).inviteGuardian(
                fullName: name,
                email: email,
                phone: phone,
              );
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(message)));
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
        elevation: 0,
        title: Text(
          CopyConstants.guardiansTitle,
          style: SurakshaTypography.dashTitle,
        ),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
        actions: [
          IconButton(
            tooltip: 'Refresh',
            icon: const Icon(Icons.refresh),
            onPressed: () =>
                ref.read(guardianLinkingProvider.notifier).refresh(),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        backgroundColor: surakshaCrimson,
        foregroundColor: surakshaForeground,
        onPressed: _showInviteSheet,
        icon: const Icon(Icons.person_add_outlined),
        label: const Text('Invite'),
      ),
      body: RefreshIndicator(
        color: surakshaCrimson,
        onRefresh: () => ref.read(guardianLinkingProvider.notifier).refresh(),
        child: ListView(
          padding: EdgeInsets.fromLTRB(
            S.lg,
            S.md,
            S.lg,
            bottomPad + kGuardiansFabClearance,
          ),
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
                  style: SurakshaTypography.dashSubtitle.copyWith(
                    color: surakshaCrimson,
                  ),
                ),
              ),
            ProfileSection(CopyConstants.pendingRequestsTitle, [
              if (state.pendingRequests.isEmpty && !state.loading)
                const _EmptyStateCard(
                  icon: Icons.mark_email_read_outlined,
                  message: CopyConstants.noPendingRequests,
                )
              else
                ...state.pendingRequests.map(
                  (request) => _PendingRequestTile(
                    request: request,
                    onAccept: () => _handleAccept(request.id),
                    onReject: () => _handleReject(request.id),
                  ),
                ),
            ]),
            ProfileSection(CopyConstants.linkedGuardiansTitle, [
              if (state.guardians.isEmpty && !state.loading)
                const _EmptyStateCard(
                  icon: Icons.group_outlined,
                  message: CopyConstants.noLinkedGuardians,
                )
              else ...[
                Padding(
                  padding: const EdgeInsets.only(bottom: S.sm),
                  child: Text(
                    CopyConstants.emergencyContactSubtitle,
                    style: SurakshaTypography.dashSubtitle.copyWith(
                      color: surakshaAuthText,
                    ),
                  ),
                ),
                ProfileSettingsCard(
                  child: Column(
                    children: [
                      for (var i = 0; i < state.guardians.length; i++) ...[
                        if (i > 0) const ProfileRowDivider(),
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
            ]),
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
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(message)));
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
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text(message)));
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

/// White/crimson card with an icon and muted message for empty sections.
class _EmptyStateCard extends StatelessWidget {
  const _EmptyStateCard({required this.icon, required this.message});

  final IconData icon;
  final String message;

  @override
  Widget build(BuildContext context) => ProfileSettingsCard(
        child: Padding(
          padding: const EdgeInsets.all(S.lg),
          child: Row(
            children: [
              ProfileRowIcon(icon),
              const SizedBox(width: S.md),
              Expanded(
                child: Text(message, style: kProfileRowSubtitleStyle),
              ),
            ],
          ),
        ),
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

    return Padding(
      padding: const EdgeInsets.only(bottom: S.sm),
      child: ProfileSettingsCard(
        child: Padding(
          padding: const EdgeInsets.all(S.md),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(title, style: kProfileRowTitleStyle),
              const SizedBox(height: S.xs),
              Text(subtitle, style: kProfileRowSubtitleStyle),
              const SizedBox(height: S.md),
              Row(
                children: [
                  Expanded(
                    child: OutlinedButton(
                      style: OutlinedButton.styleFrom(
                        foregroundColor: surakshaOnLight,
                        side: const BorderSide(color: surakshaOnLightDivider),
                        minimumSize: const Size.fromHeight(kSheetButtonHeight),
                      ),
                      onPressed: onReject,
                      child: const Text('Reject'),
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
                      onPressed: onAccept,
                      child: const Text('Accept'),
                    ),
                  ),
                ],
              ),
            ],
          ),
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
      contentPadding: const EdgeInsets.symmetric(
        horizontal: kProfileRowPaddingH,
        vertical: kProfileRowPaddingV,
      ),
      onTap: onEditPhone,
      leading: CircleAvatar(
        radius: kProfileGuardianAvatarRadius,
        backgroundColor: surakshaLightSurfaceAlt,
        child: Text(
          guardian.initials,
          style: SurakshaTypography.dashTitle.copyWith(
            fontSize: 12,
            color: surakshaOnLight,
          ),
        ),
      ),
      title: Row(
        children: [
          Flexible(
            child: Text(
              guardian.fullName,
              style: kProfileRowTitleStyle,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
          ),
          if (guardian.isEmergencyContact) ...[
            const SizedBox(width: S.sm),
            Container(
              padding: const EdgeInsets.symmetric(
                horizontal: kEmergencyBadgePaddingH,
                vertical: kEmergencyBadgePaddingV,
              ),
              decoration: BoxDecoration(
                color: surakshaCrimson.withValues(alpha: kProfileRowIconBgAlpha),
                borderRadius: BorderRadius.circular(kEmergencyBadgeRadius),
              ),
              child: Text(
                CopyConstants.emergencyContactBadge,
                style: SurakshaTypography.monoLabel.copyWith(
                  color: surakshaCrimson,
                  fontSize: kEmergencyBadgeFontSize,
                ),
              ),
            ),
          ],
        ],
      ),
      subtitle: Text(
        'Guardian · ${guardian.phone}',
        style: kProfileRowSubtitleStyle,
        maxLines: 1,
        overflow: TextOverflow.ellipsis,
      ),
      trailing: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          IconButton(
            tooltip: CopyConstants.editPhoneAction,
            onPressed: onEditPhone,
            icon: const Icon(Icons.edit_outlined, size: kProfileRowIconSize),
            color: kProfileChevronColor,
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
              color: guardian.isEmergencyContact
                  ? surakshaCrimson
                  : kProfileChevronColor,
            ),
          ),
        ],
      ),
    );
  }
}
