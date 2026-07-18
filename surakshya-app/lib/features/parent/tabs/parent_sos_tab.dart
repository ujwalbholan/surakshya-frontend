library parent_sos_tab;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/parent/parent_dashboard_provider.dart';
import 'package:suraksha/features/parent/widgets/sos_location_map.dart';
import 'package:suraksha/models/parent_models.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/app_header_bar.dart';
import 'package:suraksha/widgets/navigation/notched_sos_bottom_nav.dart';
import 'package:url_launcher/url_launcher.dart';

/// Guardian SOS view: the ward's triggered-SOS live map. Guardians only
/// observe — there is no countdown or cancel here.
class ParentSosTab extends ConsumerWidget {
  const ParentSosTab({super.key});

  Future<void> _openMaps(BuildContext context, double lat, double lng) async {
    final uri = Uri.parse(
      'https://www.google.com/maps/search/?api=1&query=$lat,$lng',
    );
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Could not open maps')),
      );
    }
  }

  (double, double)? _sosCoordinates(WardSosEvent? sos) {
    if (sos == null || !sos.isActive) return null;
    final last = sos.lastLocation;
    if (last != null) return (last.latitude, last.longitude);
    if (sos.latitude != null && sos.longitude != null) {
      return (sos.latitude!, sos.longitude!);
    }
    return null;
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(parentDashboardProvider);
    final ward = state.selectedWard;
    final sos = state.activeSos;
    final active = sos?.isActive ?? false;
    final coords = _sosCoordinates(sos);
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
              unreadCount: 0,
              onAvatarTap: () => ref
                  .read(parentDashboardProvider.notifier)
                  .setTab(ParentTab.profile),
            ),
            Expanded(
              child: Padding(
                padding: EdgeInsets.fromLTRB(S.lg, S.md, S.lg, bottomPad),
                child: ward == null
                    ? const _EmptyMessage(text: CopyConstants.parentNoChildren)
                    : Column(
                        crossAxisAlignment: CrossAxisAlignment.stretch,
                        children: [
                          _SosBanner(ward: ward, sos: sos, active: active),
                          const SizedBox(height: S.md),
                          if (coords != null) ...[
                            Expanded(
                              child: SosLocationMap(
                                latitude: coords.$1,
                                longitude: coords.$2,
                                height: null,
                              ),
                            ),
                            const SizedBox(height: S.sm),
                            Text(
                              '${coords.$1.toStringAsFixed(5)}, ${coords.$2.toStringAsFixed(5)}',
                              style: SurakshaTypography.monoLabel,
                            ),
                            const SizedBox(height: S.sm),
                            OutlinedButton.icon(
                              onPressed: () =>
                                  _openMaps(context, coords.$1, coords.$2),
                              icon: const Icon(Icons.map_outlined, size: 18),
                              label: const Text(CopyConstants.parentOpenInMaps),
                              style: OutlinedButton.styleFrom(
                                foregroundColor: surakshaForeground,
                                side: const BorderSide(color: dashboardBorder),
                              ),
                            ),
                          ] else if (active)
                            const Expanded(
                              child: _EmptyMessage(
                                text: CopyConstants.parentLocationUnavailable,
                              ),
                            )
                          else
                            const Expanded(
                              child: _EmptyMessage(
                                text:
                                    'No SOS has been triggered. The live map appears here when your ward starts an SOS.',
                              ),
                            ),
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

class _SosBanner extends StatelessWidget {
  const _SosBanner({
    required this.ward,
    required this.sos,
    required this.active,
  });

  final LinkedWard ward;
  final WardSosEvent? sos;
  final bool active;

  @override
  Widget build(BuildContext context) {
    final started = sos?.startedAt;
    final timeLabel = started != null
        ? DateFormat('MMM d, h:mm a').format(started.toLocal())
        : null;

    return Container(
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
      child: Row(
        children: [
          Icon(
            active ? Icons.warning_amber_rounded : Icons.shield_outlined,
            color: active ? surakshaCrimson : surakshaMuted,
            size: 22,
          ),
          const SizedBox(width: S.sm),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  active
                      ? '${CopyConstants.parentSosActive} — ${ward.fullName}'
                      : '${CopyConstants.parentSosSafe} — ${ward.fullName}',
                  style: SurakshaTypography.dashGreeting.copyWith(
                    fontSize: 16,
                    color: active ? surakshaCrimson : surakshaForeground,
                  ),
                ),
                if (active && timeLabel != null)
                  Text(
                    'Started: $timeLabel',
                    style: SurakshaTypography.dashSubtitle,
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _EmptyMessage extends StatelessWidget {
  const _EmptyMessage({required this.text});

  final String text;

  @override
  Widget build(BuildContext context) => Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: S.lg),
          child: Text(
            text,
            style: SurakshaTypography.dashSubtitle,
            textAlign: TextAlign.center,
          ),
        ),
      );
}
