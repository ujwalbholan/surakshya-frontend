library dark_map_widget;

import 'package:flutter/material.dart';
import 'package:suraksha/features/dashboard/tracking/tracking_map_view.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';

/// Default (collapsed) map height — taller than the prior 140px for Box 1 breathing room.
const double kMapHeightCompact = 220;

/// Expanded map height = compact × 1.35 (capped so guardians stay reachable).
const double kMapHeightExpanded = 297;

const Duration kMapExpandDuration = Duration(milliseconds: 280);

const double kMapToggleIconSize = 20;
const double kMapToggleAlpha = 0.55;

/// How far the live-location banner hangs below the map stack edge.
const double kMapBannerOverlap = 20;

class DarkMapWidget extends StatelessWidget {
  const DarkMapWidget({
    super.key,
    required this.expanded,
    required this.onToggle,
  });

  final bool expanded;
  final VoidCallback onToggle;

  @override
  Widget build(BuildContext context) => AnimatedContainer(
        duration: kMapExpandDuration,
        curve: Curves.easeInOut,
        height: expanded ? kMapHeightExpanded : kMapHeightCompact,
        margin: const EdgeInsets.symmetric(horizontal: S.md),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(S.radiusLg),
          border: Border.all(color: dashboardBorder),
        ),
        clipBehavior: Clip.antiAlias,
        child: Stack(
          fit: StackFit.expand,
          children: [
            const TrackingMapView(),
            Positioned(
              right: S.sm,
              top: S.sm,
              child: Material(
                color: surakshaBlack.withValues(alpha: kMapToggleAlpha),
                shape: const CircleBorder(),
                clipBehavior: Clip.antiAlias,
                child: IconButton(
                  onPressed: onToggle,
                  icon: Icon(
                    expanded ? Icons.close_fullscreen : Icons.open_in_full,
                    color: surakshaForeground,
                    size: kMapToggleIconSize,
                  ),
                  tooltip: expanded ? 'Collapse map' : 'Expand map',
                  visualDensity: VisualDensity.compact,
                  padding: const EdgeInsets.all(S.sm),
                  constraints: const BoxConstraints(
                    minWidth: 40,
                    minHeight: 40,
                  ),
                ),
              ),
            ),
          ],
        ),
      );
}
