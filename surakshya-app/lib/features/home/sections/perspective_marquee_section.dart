library perspective_marquee_section;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:marquee/marquee.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class PerspectiveMarqueeSection extends StatelessWidget {
  const PerspectiveMarqueeSection({super.key});

  static const _text =
      'SURAKSHA  ·  SAFETY  ·  TRACKING  ·  ALERTS  ·  SOS  ·  PROTECTION  ·  ';

  @override
  Widget build(BuildContext context) => SizedBox(
        height: 160,
        child: Stack(
          children: [
            Marquee(
              text: _text,
              style: GoogleFonts.spaceGrotesk(
                fontSize: 80,
                fontWeight: FontWeight.w700,
                color: const Color(0xFF1A1A1A),
              ),
              blankSpace: 40,
              velocity: 60,
            ),
            Marquee(
              text: _text,
              style: GoogleFonts.spaceGrotesk(
                fontSize: 80,
                fontWeight: FontWeight.w700,
                color: surakshaBorder.withValues(alpha: 0.8),
              ),
              blankSpace: 40,
              velocity: 30,
            ),
          ],
        ),
      );
}
