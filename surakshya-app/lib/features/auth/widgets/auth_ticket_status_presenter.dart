library auth_ticket_status_presenter;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:suraksha/widgets/ticket_status_card/ticket_status_card.dart';

/// Default auto-dismiss duration for error and info cards.
const authTicketStatusAutoDismiss = Duration(seconds: 4);

/// Brief success display before login redirect.
const authTicketLoginSuccessDelay = Duration(milliseconds: 1800);

/// View model for the auth ticket status overlay.
class TicketStatusViewData {
  const TicketStatusViewData({
    required this.status,
    required this.title,
    required this.subtitle,
    this.onInfoTap,
  });

  final TicketStatus status;
  final String title;
  final String subtitle;
  final VoidCallback? onInfoTap;
}

/// Presentation-only helper for showing [TicketStatusCard] on auth screens.
class AuthTicketStatusPresenter {
  AuthTicketStatusPresenter(this._notify);

  final void Function(VoidCallback fn) _notify;

  TicketStatusViewData? current;
  Timer? _autoDismissTimer;
  VoidCallback? _onDismissed;

  void dispose() {
    _autoDismissTimer?.cancel();
    _autoDismissTimer = null;
    _onDismissed = null;
  }

  void dismiss() {
    _autoDismissTimer?.cancel();
    _autoDismissTimer = null;
    final action = _onDismissed;
    _onDismissed = null;
    if (current == null) return;
    current = null;
    _notify(() {});
    action?.call();
  }

  void showError(
    String title,
    String subtitle, {
    VoidCallback? onDismissed,
  }) {
    _show(
      status: TicketStatus.error,
      title: title,
      subtitle: subtitle,
      autoDismiss: authTicketStatusAutoDismiss,
      onDismissed: onDismissed,
    );
  }

  void showInfo(
    String title,
    String subtitle, {
    VoidCallback? onDismissed,
  }) {
    _show(
      status: TicketStatus.info,
      title: title,
      subtitle: subtitle,
      autoDismiss: authTicketStatusAutoDismiss,
      onDismissed: onDismissed,
    );
  }

  void showSuccess(
    String title,
    String subtitle, {
    Duration autoDismiss = authTicketStatusAutoDismiss,
    VoidCallback? onDismissed,
  }) {
    _show(
      status: TicketStatus.success,
      title: title,
      subtitle: subtitle,
      autoDismiss: autoDismiss,
      onDismissed: onDismissed,
    );
  }

  void _show({
    required TicketStatus status,
    required String title,
    required String subtitle,
    Duration? autoDismiss,
    VoidCallback? onDismissed,
    VoidCallback? onInfoTap,
  }) {
    _autoDismissTimer?.cancel();
    _onDismissed = onDismissed;
    current = TicketStatusViewData(
      status: status,
      title: title,
      subtitle: subtitle,
      onInfoTap: onInfoTap,
    );
    _notify(() {});

    if (autoDismiss != null) {
      _autoDismissTimer = Timer(autoDismiss, dismiss);
    }
  }
}
