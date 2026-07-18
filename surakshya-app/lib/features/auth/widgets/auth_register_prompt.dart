library auth_register_prompt;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:suraksha/features/auth/widgets/auth_underline_field_style.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';

const String kRegisterPromptPrefix = 'Not a member yet? ';
const String kRegisterPromptAction = 'Register now';

/// Empty track under bar-action text (reference light-gray hairline).
Color get kRegisterBarEmpty =>
    surakshaMuted.withValues(alpha: kRegisterBarEmptyOpacity);

const double kRegisterBarEmptyOpacity = 0.55;
const double kRegisterBarEmptyThickness = 1.0;
const double kRegisterBarFilledThickness = 2.0;
const double kRegisterBarGap = 2.0;

/// Default type for bar-action labels (register / forgot-password links).
TextStyle kAuthBarActionStyle({double fontSize = 13}) => GoogleFonts.inter(
      fontSize: fontSize,
      fontWeight: FontWeight.w700,
      letterSpacing: 0.1,
      height: 1.3,
      color: surakshaAuthText,
      decoration: TextDecoration.none,
    );

/// Bold action text over an empty hairline bar; on first tap the bar fills
/// crimson left → right, then [onPressed] runs. Shared by "Register now"
/// and "Forgot your password?".
class AuthBarActionText extends StatefulWidget {
  const AuthBarActionText({
    super.key,
    required this.label,
    required this.onPressed,
    this.style,
    this.padding = const EdgeInsets.symmetric(
      vertical: S.xs,
      horizontal: S.sm,
    ),
  });

  final String label;
  final VoidCallback onPressed;

  /// Defaults to [kAuthBarActionStyle].
  final TextStyle? style;

  /// Tap-target padding around the text + bar block.
  final EdgeInsets padding;

  @override
  State<AuthBarActionText> createState() => _AuthBarActionTextState();
}

class _AuthBarActionTextState extends State<AuthBarActionText>
    with SingleTickerProviderStateMixin {
  late final AnimationController _fillController;
  bool _busy = false;

  TextStyle get _style => widget.style ?? kAuthBarActionStyle();

  double get _labelWidth {
    final painter = TextPainter(
      text: TextSpan(text: widget.label, style: _style),
      textDirection: TextDirection.ltr,
      maxLines: 1,
    )..layout();
    return painter.width;
  }

  @override
  void initState() {
    super.initState();
    _fillController = AnimationController(
      vsync: this,
      duration: kRegisterUnderlineDuration,
    );
  }

  @override
  void dispose() {
    _fillController.dispose();
    super.dispose();
  }

  Future<void> _onTap() async {
    if (_busy) return;
    setState(() => _busy = true);

    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    if (reduceMotion) {
      _fillController.value = 1.0;
    } else {
      await _fillController.forward();
    }

    if (!mounted) return;
    widget.onPressed();
  }

  Widget _buildBar(double width) {
    return AnimatedBuilder(
      animation: _fillController,
      builder: (context, _) {
        final t = kRegisterUnderlineCurve.transform(_fillController.value);
        final fillWidth = width * t;
        final fillHeight = kRegisterBarEmptyThickness +
            (kRegisterBarFilledThickness - kRegisterBarEmptyThickness) * t;

        return SizedBox(
          width: width,
          height: kRegisterBarFilledThickness,
          child: Stack(
            alignment: Alignment.bottomLeft,
            children: [
              // Empty track (always visible until fully covered).
              Positioned(
                left: 0,
                right: 0,
                bottom: 0,
                child: ColoredBox(
                  color: kRegisterBarEmpty,
                  child: const SizedBox(height: kRegisterBarEmptyThickness),
                ),
              ),
              // Crimson fill — grows left → right on first tap.
              Positioned(
                left: 0,
                bottom: 0,
                child: SizedBox(
                  width: fillWidth,
                  height: fillHeight,
                  child: const ColoredBox(color: surakshyaCrimson),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final labelWidth = _labelWidth;

    return Semantics(
      button: true,
      label: widget.label,
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _onTap,
        child: Padding(
          padding: widget.padding,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.label, style: _style),
              const SizedBox(height: kRegisterBarGap),
              _buildBar(labelWidth),
            ],
          ),
        ),
      ),
    );
  }
}

/// Sign In register CTA: "Not a member yet?" prefix + bar-action
/// "Register now" (fill-then-navigate handled by [AuthBarActionText]).
class AuthRegisterPrompt extends StatelessWidget {
  const AuthRegisterPrompt({
    super.key,
    required this.onPressed,
    this.prefix = kRegisterPromptPrefix,
    this.action = kRegisterPromptAction,
  });

  final VoidCallback onPressed;
  final String prefix;
  final String action;

  static final TextStyle _prefixStyle = GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.1,
    height: 1.3,
    color: surakshaAuthText,
    decoration: TextDecoration.none,
  );

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Row(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.center,
        children: [
          Padding(
            // Optical baseline alignment against the action's bar block.
            padding: const EdgeInsets.only(
              bottom: kRegisterBarGap + kRegisterBarFilledThickness,
            ),
            child: Text(prefix, style: _prefixStyle),
          ),
          AuthBarActionText(
            label: action,
            onPressed: onPressed,
            // No horizontal inset: the prefix already ends with a space.
            padding: const EdgeInsets.symmetric(vertical: S.xs),
          ),
        ],
      ),
    );
  }
}
