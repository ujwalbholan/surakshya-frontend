library context_extensions;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/app_constants.dart';

extension ContextExtensions on BuildContext {
  double get screenWidth => MediaQuery.sizeOf(this).width;
  double get screenHeight => MediaQuery.sizeOf(this).height;

  bool get isTablet => screenWidth >= AppConstants.tabletBreakpoint;
  bool get isDesktop => screenWidth >= AppConstants.desktopBreakpoint;
}
