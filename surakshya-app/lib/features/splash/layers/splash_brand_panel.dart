library splash_brand_panel;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:suraksha/features/splash/splash_content.dart';
import 'package:suraksha/features/splash/splash_timeline.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class SplashBrandPanel extends StatelessWidget {
  const SplashBrandPanel({
    super.key,
    required this.phases,
    required this.landscape,
    this.disableAnimations = false,
  });

  final SplashPhases phases;
  final bool landscape;
  final bool disableAnimations;

  @override
  Widget build(BuildContext context) {
    if (landscape) {
      return _LandscapeBrand(phases: phases, disableAnimations: disableAnimations);
    }
    return _PortraitBrand(phases: phases, disableAnimations: disableAnimations);
  }
}

class _PortraitBrand extends StatelessWidget {
  const _PortraitBrand({
    required this.phases,
    required this.disableAnimations,
  });

  final SplashPhases phases;
  final bool disableAnimations;

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.paddingOf(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(28, 0, 28, padding.bottom + 108),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.end,
        children: [
          _StaggeredCopy(phases: phases, disableAnimations: disableAnimations),
        ],
      ),
    );
  }
}

class _LandscapeBrand extends StatelessWidget {
  const _LandscapeBrand({
    required this.phases,
    required this.disableAnimations,
  });

  final SplashPhases phases;
  final bool disableAnimations;

  @override
  Widget build(BuildContext context) {
    final padding = MediaQuery.paddingOf(context);
    return Padding(
      padding: EdgeInsets.fromLTRB(40, padding.top + 48, 24, padding.bottom + 24),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          _StaggeredCopy(phases: phases, disableAnimations: disableAnimations),
        ],
      ),
    );
  }
}

class _StaggeredCopy extends StatelessWidget {
  const _StaggeredCopy({
    required this.phases,
    required this.disableAnimations,
  });

  final SplashPhases phases;
  final bool disableAnimations;

  double _p(double v) => disableAnimations ? 1.0 : v;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        _FadeSlide(
          progress: _p(phases.eyebrow),
          offsetY: 8,
          child: Text(
            SplashContent.eyebrow,
            style: GoogleFonts.dmMono(
              fontSize: 11,
              letterSpacing: 3,
              color: surakshaCrimson,
            ),
          ),
        ),
        const SizedBox(height: 12),
        _FadeSlide(
          progress: _p(phases.headline1),
          offsetY: 14,
          child: Text(
            SplashContent.headlineLine1,
            style: GoogleFonts.bebasNeue(
              fontSize: 52,
              height: 0.95,
              letterSpacing: 2,
              color: surakshaForeground,
            ),
          ),
        ),
        _FadeSlide(
          progress: _p(phases.headline2),
          offsetY: 14,
          child: Text(
            SplashContent.headlineLine2,
            style: GoogleFonts.bebasNeue(
              fontSize: 52,
              height: 0.95,
              letterSpacing: 2,
              fontWeight: FontWeight.w900,
              foreground: Paint()
                ..style = PaintingStyle.stroke
                ..strokeWidth = 1
                ..color = const Color(0x8CFFFFFF),
            ),
          ),
        ),
        const SizedBox(height: 16),
        _FadeSlide(
          progress: _p(phases.bodyCopy),
          offsetY: 10,
          child: ConstrainedBox(
            constraints: const BoxConstraints(maxWidth: 340),
            child: Text(
              SplashContent.body,
              style: GoogleFonts.inter(
                fontSize: 13,
                height: 1.55,
                color: const Color(0xFF666666),
              ),
            ),
          ),
        ),
      ],
    );
  }
}

class _FadeSlide extends StatelessWidget {
  const _FadeSlide({
    required this.progress,
    required this.offsetY,
    required this.child,
  });

  final double progress;
  final double offsetY;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return Opacity(
      opacity: progress.clamp(0.0, 1.0),
      child: Transform.translate(
        offset: Offset(0, offsetY * (1 - progress)),
        child: child,
      ),
    );
  }
}
