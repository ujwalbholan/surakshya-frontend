library map_location_sharing_banner;

import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class MapLocationSharingBanner extends StatelessWidget {
  const MapLocationSharingBanner({
    super.key,
    required this.active,
    required this.onToggle,
  });

  final bool active;
  final ValueChanged<bool> onToggle;

  @override
  Widget build(BuildContext context) => ClipRRect(
        borderRadius: BorderRadius.circular(S.radiusLg),
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 12, sigmaY: 12),
          child: Container(
            padding: const EdgeInsets.symmetric(
              horizontal: S.md,
              vertical: S.sm,
            ),
            decoration: BoxDecoration(
              color: surakshaBlack.withValues(alpha: 0.55),
              borderRadius: BorderRadius.circular(S.radiusLg),
              border: Border.all(color: dashboardBorder),
            ),
            child: Row(
              children: [
                Icon(
                  Icons.location_on_outlined,
                  color: active ? statusGreen : surakshaMuted,
                  size: 20,
                ),
                const SizedBox(width: S.sm),
                Expanded(
                  child: Text(
                    active
                        ? CopyConstants.locationSharingOn
                        : CopyConstants.locationSharingOff,
                    style: SurakshaTypography.dashSubtitle.copyWith(
                      color: surakshaForeground,
                    ),
                  ),
                ),
                Switch(
                  value: active,
                  activeThumbColor: surakshaCrimson,
                  onChanged: onToggle,
                ),
              ],
            ),
          ),
        ),
      );
}
