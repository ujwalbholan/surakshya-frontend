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

/// Uniform action-button height across sheets (D8).
const double kSheetButtonHeight = 48.0;

/// Fill opacity for a disabled crimson action button — dimmed but still
/// clearly a button (D6).
const double kSheetDisabledButtonAlpha = 0.45;

/// Circle diameter for a sheet's header action icon (D7).
const double kSheetActionIconCircleSize = 48.0;

/// Glyph size inside the sheet header action icon circle.
const double kSheetActionIconSize = 24.0;

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
