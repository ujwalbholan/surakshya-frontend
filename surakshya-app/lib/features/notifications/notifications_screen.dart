library notifications_screen;

/// STUB: Notifications UI shell only.
///
/// No backend fetch, read/unread model, or Socket.IO. Future notification-feature
/// work should extend this screen rather than adding a second inbox surface.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

class NotificationsScreen extends StatelessWidget {
  const NotificationsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: dashboardBg,
      appBar: AppBar(
        backgroundColor: dashboardBg,
        foregroundColor: surakshaForeground,
        title: const Text(CopyConstants.notificationsTitle),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: S.lg),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                Icons.notifications_none_outlined,
                size: 64,
                color: surakshaAuthText.withValues(alpha: 0.7),
              ),
              const SizedBox(height: S.md),
              Text(
                CopyConstants.notificationsEmptyTitle,
                textAlign: TextAlign.center,
                style: SurakshaTypography.dashTitle,
              ),
              const SizedBox(height: S.sm),
              Text(
                CopyConstants.notificationsEmpty,
                textAlign: TextAlign.center,
                style: SurakshaTypography.dashSubtitle.copyWith(
                  color: surakshaAuthText,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
