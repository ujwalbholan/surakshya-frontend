library app_bottom_sheet;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';

/// Sheet top-corner radius (matches the app's existing sheet shape).
const double kSheetCornerRadius = S.radiusXl;

/// Drag handle dimensions.
const double kSheetHandleWidth = 40.0;
const double kSheetHandleHeight = 4.0;
const double kSheetHandleRadius = kSheetHandleHeight / 2;
const Color kSheetHandleColor = surakshaSubtle;

/// Horizontal content inset.
const double kSheetPaddingH = S.lg;

/// Gap above the drag handle.
const double kSheetHandleTopGap = S.sm;

/// Gap between the drag handle and the sheet content.
const double kSheetHandleBottomGap = S.md;

/// Content inset above the safe area / keyboard.
const double kSheetPaddingBottom = S.lg;

/// Shared modal bottom sheet: consistent background, corner radius, drag
/// handle, and safe-area/keyboard-aware padding (D1).
Future<T?> showAppBottomSheet<T>({
  required BuildContext context,
  required WidgetBuilder builder,
  bool isScrollControlled = false,
}) =>
    showModalBottomSheet<T>(
      context: context,
      isScrollControlled: isScrollControlled,
      backgroundColor: dashboardSheetBg,
      shape: const RoundedRectangleBorder(
        borderRadius:
            BorderRadius.vertical(top: Radius.circular(kSheetCornerRadius)),
      ),
      builder: (sheetContext) => AppSheetChrome(child: builder(sheetContext)),
    );

/// Drag handle + padding around a sheet's content.
class AppSheetChrome extends StatelessWidget {
  const AppSheetChrome({super.key, required this.child});

  final Widget child;

  @override
  Widget build(BuildContext context) {
    final keyboardInset = MediaQuery.viewInsetsOf(context).bottom;
    final safeBottom = MediaQuery.viewPaddingOf(context).bottom;

    return Padding(
      padding: EdgeInsets.fromLTRB(
        kSheetPaddingH,
        kSheetHandleTopGap,
        kSheetPaddingH,
        keyboardInset + safeBottom + kSheetPaddingBottom,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: kSheetHandleWidth,
            height: kSheetHandleHeight,
            decoration: BoxDecoration(
              color: kSheetHandleColor,
              borderRadius: BorderRadius.circular(kSheetHandleRadius),
            ),
          ),
          const SizedBox(height: kSheetHandleBottomGap),
          child,
        ],
      ),
    );
  }
}
