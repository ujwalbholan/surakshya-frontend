library auth_ticket_status_overlay;

import 'package:flutter/material.dart';
import 'package:suraksha/features/auth/widgets/auth_ticket_status_presenter.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/widgets/ticket_status_card/ticket_status_card.dart';

const double kAuthTicketStatusTopInset = S.md;

/// Top-of-screen ticket status card overlay for auth screens.
class AuthTicketStatusOverlay extends StatelessWidget {
  const AuthTicketStatusOverlay({
    super.key,
    required this.presenter,
  });

  final AuthTicketStatusPresenter presenter;

  @override
  Widget build(BuildContext context) {
    final data = presenter.current;
    if (data == null) return const SizedBox.shrink();

    return Positioned(
      top: MediaQuery.paddingOf(context).top + kAuthTicketStatusTopInset,
      left: S.lg,
      right: S.lg,
      child: TicketStatusCard(
        status: data.status,
        title: data.title,
        subtitle: data.subtitle,
        onDismiss: presenter.dismiss,
        onInfoTap: data.onInfoTap,
      ),
    );
  }
}
