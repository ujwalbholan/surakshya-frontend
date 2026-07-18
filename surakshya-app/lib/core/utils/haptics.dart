library haptics;

import 'package:flutter/services.dart';

enum HapticPattern { light, medium, heavy, sos }

Future<void> triggerHaptic(HapticPattern pattern) async {
  switch (pattern) {
    case HapticPattern.light:
      await HapticFeedback.lightImpact();
    case HapticPattern.medium:
      await HapticFeedback.mediumImpact();
    case HapticPattern.heavy:
      await HapticFeedback.heavyImpact();
    case HapticPattern.sos:
      await HapticFeedback.heavyImpact();
      await Future<void>.delayed(const Duration(milliseconds: 80));
      await HapticFeedback.heavyImpact();
  }
}
