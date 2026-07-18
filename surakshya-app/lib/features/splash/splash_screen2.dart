library splash_screen2;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/features/splash/layers/splash_scene.dart';
import 'package:suraksha/features/splash/widgets/skip_spinner_button.dart';
import 'package:suraksha/features/splash/splash_master_controller.dart';
import 'package:suraksha/features/splash/splash_timeline.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

/// Guardian Awakening — cinematic splash screen 2; Skip-only exit.
class SplashScreen2 extends ConsumerStatefulWidget {
  const SplashScreen2({super.key});

  @override
  ConsumerState<SplashScreen2> createState() => _SplashScreen2State();
}

class _SplashScreen2State extends ConsumerState<SplashScreen2>
    with SingleTickerProviderStateMixin {
  static const _reducedMotionT = SplashMasterController.holdT;

  late final SplashMasterController _master;
  late final bool _reducedMotion;
  bool _navigating = false;

  @override
  void initState() {
    super.initState();
    _reducedMotion = WidgetsBinding
        .instance.platformDispatcher.accessibilityFeatures.disableAnimations;

    _master = SplashMasterController(
      vsync: this,
      onTick: () => setState(() {}),
    );

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (_reducedMotion) {
        _master.raw.value = SplashMasterController.holdT;
        setState(() {});
      } else {
        _master.playToHold();
      }
    });
  }

  Future<void> _navigateAway() async {
    if (_navigating) return;
    _navigating = true;

    final prefs = await SharedPreferences.getInstance();
    if (!mounted) return;
    final loggedIn = prefs.getBool(AppConstants.prefsLoggedIn) ?? false;
    if (!loggedIn) {
      context.go(AppRoutes.login);
      return;
    }
    final role = prefs.getString(AppConstants.prefsUserRole) ?? 'USER';
    context.go(AppRoutes.homeRouteForRole(role));
  }

  @override
  void dispose() {
    _master.dispose();
    super.dispose();
  }

  SplashPhases get _phases {
    if (_reducedMotion) {
      return const SplashPhases(_reducedMotionT);
    }
    return _master.phases;
  }

  @override
  Widget build(BuildContext context) {
    final phases = _phases;
    final padding = MediaQuery.paddingOf(context);
    final skipOpacity = _reducedMotion ? 1.0 : phases.skipButton;
    final showSkip = _reducedMotion || skipOpacity > 0;

    return Semantics(
      label: 'Suraksha — The Guardian On Your Wrist',
      child: Scaffold(
        backgroundColor: surakshaBlack,
        body: Stack(
          fit: StackFit.expand,
          children: [
            SplashScene(
              phases: phases,
              disableAnimations: _reducedMotion,
            ),
            if (showSkip)
              Positioned(
                right: 24,
                bottom: padding.bottom + 24,
                child: Opacity(
                  opacity: skipOpacity.clamp(0.0, 1.0),
                  child: IgnorePointer(
                    ignoring: skipOpacity < 0.5,
                    child: SkipSpinnerButton(onTap: _navigateAway),
                  ),
                ),
              ),
          ],
        ),
      ),
    );
  }
}
