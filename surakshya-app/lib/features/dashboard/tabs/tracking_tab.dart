library tracking_tab;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/features/dashboard/tracking/widgets/dark_map_widget.dart';
import 'package:suraksha/features/dashboard/tracking/widgets/family_header_bar.dart';
import 'package:suraksha/features/dashboard/tracking/widgets/guardians_masonry_grid.dart';
import 'package:suraksha/features/dashboard/tracking/widgets/map_location_sharing_banner.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class TrackingTab extends ConsumerStatefulWidget {
  const TrackingTab({super.key});

  @override
  ConsumerState<TrackingTab> createState() => _TrackingTabState();
}

class _TrackingTabState extends ConsumerState<TrackingTab> {
  bool _mapExpanded = false;

  @override
  Widget build(BuildContext context) {
    final dash = ref.watch(dashboardProvider);
    final family = ref.watch(familyMembersProvider);
    final familyUi = ref.watch(familyListUiStateProvider);
    final familyError = ref.watch(familyListErrorProvider);
    final bottomPad = S.bottomNavHeight + MediaQuery.paddingOf(context).bottom;

    return Material(
      color: dashboardBg,
      child: SafeArea(
        bottom: false,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            FamilyHeaderBar(unreadCount: dash.unreadNotifications),
            Stack(
              clipBehavior: Clip.none,
              children: [
                DarkMapWidget(
                  expanded: _mapExpanded,
                  onToggle: () => setState(() => _mapExpanded = !_mapExpanded),
                ),
                Positioned(
                  left: S.lg,
                  right: S.lg,
                  bottom: -kMapBannerOverlap,
                  child: MapLocationSharingBanner(
                    active: dash.locationSharingActive,
                    onToggle: (_) => ref
                        .read(dashboardProvider.notifier)
                        .toggleLocationSharing(),
                  ),
                ),
              ],
            ),
            const SizedBox(height: S.lg),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: S.lg),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    CopyConstants.familyMembersTitle,
                    style: SurakshaTypography.dashGreeting.copyWith(fontSize: 18),
                  ),
                  const SizedBox(height: S.xs),
                  Text(
                    CopyConstants.familyMembersSubtitle,
                    style: SurakshaTypography.dashSubtitle.copyWith(
                      color: surakshaAuthText,
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: S.sm),
            Expanded(
              child: ListView(
                padding: EdgeInsets.fromLTRB(S.md, S.sm, S.md, bottomPad),
                children: [
                  if (familyUi == FamilyListUiState.loading)
                    const Padding(
                      padding: EdgeInsets.all(S.lg),
                      child: Center(child: CircularProgressIndicator()),
                    )
                  else if (familyUi == FamilyListUiState.error)
                    Padding(
                      padding: const EdgeInsets.all(S.lg),
                      child: Text(
                        familyError ?? 'Unable to load family list',
                        style: SurakshaTypography.dashSubtitle.copyWith(
                          color: surakshaAuthText,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    )
                  else if (familyUi == FamilyListUiState.empty)
                    Padding(
                      padding: const EdgeInsets.all(S.lg),
                      child: Text(
                        'No family members linked yet.\nInvite a guardian to see them here.',
                        style: SurakshaTypography.dashSubtitle.copyWith(
                          color: surakshaAuthText,
                        ),
                        textAlign: TextAlign.center,
                      ),
                    )
                  else
                    GuardiansMasonryGrid(members: family),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
