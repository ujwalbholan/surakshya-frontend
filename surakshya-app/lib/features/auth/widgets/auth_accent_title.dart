library auth_accent_title;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

const double kAuthTitleAccentBarHeight = 2.0;
const double kAuthTitleAccentBarGap = 4.0;

/// Auth screen title with a crimson bar under [accent] only (e.g. "Log **In**").
class AuthAccentTitle extends StatelessWidget {
  const AuthAccentTitle({
    super.key,
    required this.leading,
    required this.accent,
  });

  final String leading;
  final String accent;

  double _accentWidth(TextStyle style) {
    final painter = TextPainter(
      text: TextSpan(text: accent, style: style),
      textDirection: TextDirection.ltr,
      maxLines: 1,
    )..layout();
    return painter.width;
  }

  @override
  Widget build(BuildContext context) {
    final style = SurakshaTypography.displayTitle;
    final accentWidth = _accentWidth(style);

    return Row(
      mainAxisSize: MainAxisSize.min,
      crossAxisAlignment: CrossAxisAlignment.baseline,
      textBaseline: TextBaseline.alphabetic,
      children: [
        Text(leading, style: style),
        Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(accent, style: style),
            const SizedBox(height: kAuthTitleAccentBarGap),
            SizedBox(
              width: accentWidth,
              height: kAuthTitleAccentBarHeight,
              child: const ColoredBox(color: surakshyaCrimson),
            ),
          ],
        ),
      ],
    );
  }
}
