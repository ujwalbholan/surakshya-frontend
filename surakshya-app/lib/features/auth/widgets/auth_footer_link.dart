library auth_footer_link;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';

/// Accessible auth footer link color — aliases [surakshaAuthLink].
const authFooterLinkColor = surakshaAuthLink;

/// Spacing between primary button and footer link (~½ of [S.md]).
const authFooterLinkTopGap = S.sm;

const double _footerLinkFontSize = 13;
const double _hoverUnderlineThickness = 1.25;
const double _hoverUnderlineGap = 2;
const Duration _hoverUnderlineDuration = Duration(milliseconds: 120);

TextStyle authFooterLinkStyle({Color color = authFooterLinkColor}) =>
    GoogleFonts.inter(
      fontSize: _footerLinkFontSize,
      fontWeight: FontWeight.w500,
      letterSpacing: 0.1,
      height: 1.3,
      color: color,
      decoration: TextDecoration.none,
    );

/// Compact footer link with an underline on mouse hover (and press).
class AuthFooterLink extends StatefulWidget {
  const AuthFooterLink({
    super.key,
    required this.label,
    required this.onPressed,
    this.color = authFooterLinkColor,
  });

  final String label;
  final VoidCallback onPressed;

  /// Link text (and hover underline) color. Defaults to [authFooterLinkColor].
  final Color color;

  @override
  State<AuthFooterLink> createState() => _AuthFooterLinkState();
}

class _AuthFooterLinkState extends State<AuthFooterLink> {
  bool _hovered = false;
  bool _pressed = false;

  bool get _showUnderline => _hovered || _pressed;

  double get _labelWidth {
    final painter = TextPainter(
      text: TextSpan(
        text: widget.label,
        style: authFooterLinkStyle(color: widget.color),
      ),
      textDirection: TextDirection.ltr,
      maxLines: 1,
    )..layout();
    return painter.width;
  }

  void _setHovered(bool value) {
    if (_hovered == value) return;
    setState(() => _hovered = value);
  }

  void _setPressed(bool value) {
    if (_pressed == value) return;
    setState(() => _pressed = value);
  }

  @override
  Widget build(BuildContext context) {
    final labelWidth = _labelWidth;

    return Center(
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: widget.onPressed,
          onHover: _setHovered,
          onHighlightChanged: _setPressed,
          overlayColor: const WidgetStatePropertyAll(surakshaAuthLinkSplash),
          borderRadius: BorderRadius.circular(4),
          child: Padding(
            padding: const EdgeInsets.symmetric(
              vertical: S.xs,
              horizontal: S.sm,
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  widget.label,
                  textAlign: TextAlign.center,
                  style: authFooterLinkStyle(color: widget.color),
                ),
                const SizedBox(height: _hoverUnderlineGap),
                SizedBox(
                  width: labelWidth,
                  child: AnimatedContainer(
                    duration: _hoverUnderlineDuration,
                    curve: Curves.easeOut,
                    height: _hoverUnderlineThickness,
                    color: _showUnderline ? widget.color : Colors.transparent,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
