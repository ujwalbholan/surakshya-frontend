library crimson_accent_line;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class CrimsonAccentLine extends StatelessWidget {
  const CrimsonAccentLine({super.key, this.width = 48});

  final double width;

  @override
  Widget build(BuildContext context) => Container(
        width: width,
        height: 2,
        color: surakshaCrimson,
      );
}
