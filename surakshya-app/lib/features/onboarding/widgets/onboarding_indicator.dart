library onboarding_indicator;

import 'package:flutter/material.dart';
import 'package:smooth_page_indicator/smooth_page_indicator.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class OnboardingIndicator extends StatelessWidget {
  const OnboardingIndicator({super.key, required this.controller});

  final PageController controller;

  @override
  Widget build(BuildContext context) => SmoothPageIndicator(
        controller: controller,
        count: 3,
        effect: const WormEffect(
          activeDotColor: surakshaCrimson,
          dotColor: surakshaBorder,
          dotHeight: 4,
          dotWidth: 4,
        ),
      );
}
