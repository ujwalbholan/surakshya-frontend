library auth_register_prompt;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:suraksha/features/auth/widgets/auth_underline_field_style.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';

const String kRegisterPromptPrefix = 'Not a member yet? ';
const String kRegisterPromptAction = 'Register now';

/// Empty track under "Register now" (reference light-gray hairline).
Color get kRegisterBarEmpty =>
    surakshaMuted.withValues(alpha: kRegisterBarEmptyOpacity);

const double kRegisterBarEmptyOpacity = 0.55;
const double kRegisterBarEmptyThickness = 1.0;
const double kRegisterBarFilledThickness = 2.0;
const double kRegisterBarGap = 2.0;

/// Sign In register CTA: empty bar under bold "Register now"; on first tap
/// the bar fills crimson, then [onPressed] runs (navigate to signup).
class AuthRegisterPrompt extends StatefulWidget {
  const AuthRegisterPrompt({
    super.key,
    required this.onPressed,
    this.prefix = kRegisterPromptPrefix,
    this.action = kRegisterPromptAction,
  });

  final VoidCallback onPressed;
  final String prefix;
  final String action;

  @override
  State<AuthRegisterPrompt> createState() => _AuthRegisterPromptState();
}

class _AuthRegisterPromptState extends State<AuthRegisterPrompt>
    with SingleTickerProviderStateMixin {
  late final AnimationController _fillController;
  bool _busy = false;

  static final TextStyle _prefixStyle = GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w400,
    letterSpacing: 0.1,
    height: 1.3,
    color: surakshaAuthText,
    decoration: TextDecoration.none,
  );

  static final TextStyle _actionStyle = GoogleFonts.inter(
    fontSize: 13,
    fontWeight: FontWeight.w700,
    letterSpacing: 0.1,
    height: 1.3,
    color: surakshaAuthText,
    decoration: TextDecoration.none,
  );

  double _actionWidthFor(String action) {
    final painter = TextPainter(
      text: TextSpan(text: action, style: _actionStyle),
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

  Widget _buildBar(double actionWidth) {
    return AnimatedBuilder(
      animation: _fillController,
      builder: (context, _) {
        final t = kRegisterUnderlineCurve.transform(_fillController.value);
        final fillWidth = actionWidth * t;
        final fillHeight = kRegisterBarEmptyThickness +
            (kRegisterBarFilledThickness - kRegisterBarEmptyThickness) * t;

        return SizedBox(
          width: actionWidth,
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
                  child: SizedBox(height: kRegisterBarEmptyThickness),
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
    final actionWidth = _actionWidthFor(widget.action);

    return Center(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: _onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(
            vertical: S.xs,
            horizontal: S.sm,
          ),
          child: Row(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.baseline,
            textBaseline: TextBaseline.alphabetic,
            children: [
              Text(widget.prefix, style: _prefixStyle),
              Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(widget.action, style: _actionStyle),
                  const SizedBox(height: kRegisterBarGap),
                  _buildBar(actionWidth),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
