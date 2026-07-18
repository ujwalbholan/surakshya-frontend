library ticket_status_card;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/ticket_status_card/ticket_notch_clipper.dart';

enum TicketStatus { success, error, info }

const double kTicketStatusCardMinHeight = 64;
const double kTicketStatusCardPaddingH = 12;
const double kTicketStatusCardPaddingV = 10;
const double kTicketStatusCardContentGap = 10;
const double kTicketStatusCardTitleGap = 2;
const double kTicketStatusCloseTapSize = 40;
const double kTicketStatusCloseIconSize = 16;
const double kTicketStatusBadgeSize = 34;
const double kTicketStatusIconSize = 18;
const double kTicketStatusTitleSize = 14;
const double kTicketStatusSubtitleSize = 12;
const double kTicketStatusBorderWidth = 0.75;

/// Compact ticket-style status toast for auth feedback.
class TicketStatusCard extends StatelessWidget {
  const TicketStatusCard({
    super.key,
    required this.status,
    required this.title,
    required this.subtitle,
    required this.onDismiss,
    this.onInfoTap,
  });

  final TicketStatus status;
  final String title;
  final String subtitle;
  final VoidCallback onDismiss;
  final VoidCallback? onInfoTap;

  Color get _accent => switch (status) {
        TicketStatus.success => statusGreen,
        TicketStatus.error => surakshaDanger,
        TicketStatus.info => surakshaInfo,
      };

  IconData get _statusIcon => switch (status) {
        TicketStatus.success => Icons.check_rounded,
        TicketStatus.error => Icons.error_outline_rounded,
        TicketStatus.info => Icons.info_outline_rounded,
      };

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      elevation: 8,
      shadowColor: Colors.black.withValues(alpha: 0.45),
      child: ClipPath(
        clipper: const TicketNotchClipper(),
        child: DecoratedBox(
          decoration: BoxDecoration(
            color: dashboardSheetBg,
            border: Border.all(
              color: dashboardBorder,
              width: kTicketStatusBorderWidth,
            ),
          ),
          child: ConstrainedBox(
            constraints: const BoxConstraints(
              minHeight: kTicketStatusCardMinHeight,
            ),
            child: Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: kTicketStatusCardPaddingH,
                vertical: kTicketStatusCardPaddingV,
              ),
              child: Row(
                crossAxisAlignment: CrossAxisAlignment.center,
                children: [
                  _StatusBadge(
                    accent: _accent,
                    icon: _statusIcon,
                  ),
                  const SizedBox(width: kTicketStatusCardContentGap),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisAlignment: MainAxisAlignment.center,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          style: SurakshaTypography.dashTitle.copyWith(
                            fontSize: kTicketStatusTitleSize,
                            fontWeight: FontWeight.w600,
                            color: surakshaAuthText,
                            height: 1.25,
                          ),
                        ),
                        const SizedBox(height: kTicketStatusCardTitleGap),
                        Text(
                          subtitle,
                          style: SurakshaTypography.dashSubtitle.copyWith(
                            fontSize: kTicketStatusSubtitleSize,
                            color: surakshaMuted,
                            height: 1.35,
                          ),
                        ),
                      ],
                    ),
                  ),
                  SizedBox(
                    width: kTicketStatusCloseTapSize,
                    height: kTicketStatusCloseTapSize,
                    child: InkWell(
                      onTap: onDismiss,
                      customBorder: const CircleBorder(),
                      child: const Center(
                        child: Icon(
                          Icons.close_rounded,
                          size: kTicketStatusCloseIconSize,
                          color: surakshaSubtle,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _StatusBadge extends StatelessWidget {
  const _StatusBadge({
    required this.accent,
    required this.icon,
  });

  final Color accent;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: kTicketStatusBadgeSize,
      height: kTicketStatusBadgeSize,
      decoration: BoxDecoration(
        shape: BoxShape.circle,
        color: accent.withValues(alpha: 0.14),
        border: Border.all(
          color: accent.withValues(alpha: 0.35),
          width: 0.75,
        ),
      ),
      child: Icon(
        icon,
        size: kTicketStatusIconSize,
        color: accent,
      ),
    );
  }
}
