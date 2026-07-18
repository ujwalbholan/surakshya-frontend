library onboarding_screen;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/onboarding/widgets/onboarding_indicator.dart';
import 'package:suraksha/features/onboarding/widgets/onboarding_page.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final _controller = PageController();

  Future<void> _finish() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool(AppConstants.prefsOnboardingDone, true);
    if (mounted) context.go(AppRoutes.tracking);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: surakshaBlack,
        body: SafeArea(
          child: Column(
            children: [
              Align(
                alignment: Alignment.topRight,
                child: TextButton(
                  onPressed: _finish,
                  child: const Text(CopyConstants.onboardingSkip),
                ),
              ),
              Expanded(
                child: PageView(
                  controller: _controller,
                  children: const [
                    OnboardingPage(
                      title: CopyConstants.onboardingPage1Title,
                      body: CopyConstants.onboardingPage1Body,
                      icon: Icons.watch_outlined,
                    ),
                    OnboardingPage(
                      title: CopyConstants.onboardingPage2Title,
                      body: CopyConstants.onboardingPage2Body,
                      icon: Icons.location_on_outlined,
                    ),
                    OnboardingPage(
                      title: CopyConstants.onboardingPage3Title,
                      body: CopyConstants.onboardingPage3Body,
                      icon: Icons.shield_outlined,
                    ),
                  ],
                ),
              ),
              OnboardingIndicator(controller: _controller),
              const SizedBox(height: S.lg),
              Padding(
                padding: const EdgeInsets.all(S.lg),
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: _finish,
                    child: const Text(CopyConstants.onboardingGetStarted),
                  ),
                ),
              ),
            ],
          ),
        ),
      );
}
