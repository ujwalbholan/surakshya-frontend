library sos_app_bar;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class SosAppBar extends StatelessWidget implements PreferredSizeWidget {
  const SosAppBar({
    super.key,
    this.backEnabled = true,
    this.onBack,
  });

  final bool backEnabled;
  final VoidCallback? onBack;

  @override
  Size get preferredSize => const Size.fromHeight(56);

  @override
  Widget build(BuildContext context) => AppBar(
        backgroundColor: surakshaSecondary,
        elevation: 0,
        scrolledUnderElevation: 0,
        centerTitle: true,
        leading: IconButton(
          icon: Icon(
            Icons.chevron_left,
            size: 28,
            color: surakshaMuted.withValues(
              alpha: backEnabled ? 1.0 : 0.6,
            ),
          ),
          onPressed: backEnabled ? onBack : null,
        ),
        title: const Text(
          CopyConstants.sos,
          style: TextStyle(
            fontSize: 17,
            fontWeight: FontWeight.w600,
            color: surakshaForeground,
            letterSpacing: 0.5,
          ),
        ),
      );
}
