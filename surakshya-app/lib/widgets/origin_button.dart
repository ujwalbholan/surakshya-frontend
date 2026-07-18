library origin_button;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:suraksha/theme/suraksha_animations.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

/// Auth primary button with a radial fill that originates from the pointer
/// or keyboard focus point.
class OriginButton extends StatefulWidget {
  const OriginButton({
    super.key,
    required this.onPressed,
    required this.child,
    this.loading = false,
    this.enabled = true,
  });

  final VoidCallback onPressed;
  final Widget child;
  final bool loading;
  final bool enabled;

  @override
  State<OriginButton> createState() => _OriginButtonState();
}

class _OriginButtonState extends State<OriginButton>
    with SingleTickerProviderStateMixin {
  static const _height = 48.0;
  static const _radius = 12.0;
  static const _horizontalPadding = 32.0;

  /// Subtle press depth — enough to feel, not enough to jump.
  static const _tapScale = 0.978;
  static const _tapDuration = Duration(milliseconds: 200);
  static const _tapCurve = Curves.easeOutCubic;
  static const _tapReverseCurve = Curves.easeOutCubic;

  static const _hoverFillDuration = Duration(milliseconds: 340);
  static const _pressFillDuration = Duration(milliseconds: 280);
  static const _releaseFillDuration = Duration(milliseconds: 420);

  static final TextStyle _labelStyle = GoogleFonts.spaceGrotesk(
    fontSize: 15,
    fontWeight: FontWeight.w500,
    height: 1.2,
  );

  late final AnimationController _fillController;
  late final Animation<double> _fillAnimation;
  late final FocusNode _focusNode;

  double _originX = 0;
  double _originY = 0;
  bool _isHovered = false;
  bool _isPressed = false;
  bool _hasFocus = false;

  /// True while a successful tap is completing fill → callback.
  bool _activating = false;

  bool get _isInactive => !widget.enabled || widget.loading;

  bool get _showFill =>
      !_isInactive &&
      (_activating || _isHovered || _isPressed || _hasFocus);

  @override
  void initState() {
    super.initState();
    _focusNode = FocusNode()..addListener(_onFocusChange);
    _fillController = AnimationController(
      vsync: this,
      duration: _hoverFillDuration,
    );
    _fillAnimation = CurvedAnimation(
      parent: _fillController,
      curve: SurakshaAnimations.easeOutExpo,
      reverseCurve: SurakshaAnimations.easeInOutSine,
    );
  }

  @override
  void didUpdateWidget(covariant OriginButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (_isInactive) {
      _activating = false;
      if (_isPressed) _setPressed(false);
      if (_isHovered) _setHovered(false);
      _fillController.reverse();
    } else {
      _syncFillAnimation();
    }
  }

  @override
  void dispose() {
    _focusNode
      ..removeListener(_onFocusChange)
      ..dispose();
    _fillController.dispose();
    super.dispose();
  }

  void _onFocusChange() {
    final focused = _focusNode.hasFocus;
    if (focused == _hasFocus) return;
    setState(() => _hasFocus = focused);
    if (focused) _lockOriginToCenter();
    _syncFillAnimation();
  }

  void _syncFillAnimation() {
    if (_activating) return;

    if (_showFill) {
      _fillController
        ..duration = _isPressed ? _pressFillDuration : _hoverFillDuration
        ..forward();
    } else {
      _fillController
        ..duration = _releaseFillDuration
        ..reverse();
    }
  }

  void _lockOrigin(double x, double y) {
    setState(() {
      _originX = x;
      _originY = y;
    });
  }

  void _lockOriginToCenter() {
    final renderBox = context.findRenderObject() as RenderBox?;
    if (renderBox == null || !renderBox.hasSize) return;
    final size = renderBox.size;
    _lockOrigin(size.width / 2, size.height / 2);
  }

  void _setHovered(bool value) {
    if (_isHovered == value || _activating) return;
    setState(() => _isHovered = value);
    _syncFillAnimation();
  }

  void _setPressed(bool value) {
    if (_isPressed == value || _activating) return;
    setState(() => _isPressed = value);
    _syncFillAnimation();
  }

  Future<void> _activateFromPointer() async {
    if (_isInactive || _activating) return;

    setState(() {
      _activating = true;
      _isPressed = false;
    });

    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    if (reduceMotion) {
      _fillController.value = 1.0;
    } else {
      _fillController.duration = _pressFillDuration;
      await _fillController.forward();
    }

    if (!mounted) return;
    HapticFeedback.lightImpact();
    widget.onPressed();

    // Keep fill held; parent usually navigates. If still mounted, ease out.
    if (!mounted) return;
    setState(() => _activating = false);
    _syncFillAnimation();
  }

  void _handleKeyboardActivate() {
    if (_isInactive || _activating) return;
    HapticFeedback.lightImpact();
    widget.onPressed();
  }

  KeyEventResult _handleKeyEvent(FocusNode node, KeyEvent event) {
    if (_isInactive) return KeyEventResult.ignored;

    final isActivationKey =
        event.logicalKey == LogicalKeyboardKey.enter ||
        event.logicalKey == LogicalKeyboardKey.space;

    if (!isActivationKey) return KeyEventResult.ignored;

    if (event is KeyDownEvent) {
      _lockOriginToCenter();
      _setPressed(true);
      return KeyEventResult.handled;
    }

    if (event is KeyUpEvent && _isPressed) {
      _setPressed(false);
      _handleKeyboardActivate();
      return KeyEventResult.handled;
    }

    return KeyEventResult.ignored;
  }

  String? _semanticLabel(Widget child) {
    if (child is Text) {
      return child.data ?? child.textSpan?.toPlainText();
    }
    return null;
  }

  @override
  Widget build(BuildContext context) {
    final label = _semanticLabel(widget.child);
    final content = widget.loading
        ? const SizedBox(
            height: 20,
            width: 20,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: surakshaAuthText,
            ),
          )
        : widget.child;

    final reduceMotion = MediaQuery.disableAnimationsOf(context);
    final scaleDuration = reduceMotion ? Duration.zero : _tapDuration;

    final button = Opacity(
      opacity: widget.enabled ? 1 : 0.5,
      child: IgnorePointer(
        ignoring: _isInactive,
        child: Focus(
          focusNode: _focusNode,
          onKeyEvent: _handleKeyEvent,
          child: MouseRegion(
            cursor: SystemMouseCursors.click,
            hitTestBehavior: HitTestBehavior.opaque,
            onEnter: (_) {
              if (_activating) return;
              _lockOriginToCenter();
              _setHovered(true);
            },
            onExit: (_) {
              if (_activating) return;
              _setHovered(false);
              _setPressed(false);
            },
            child: Listener(
              onPointerDown: (event) {
                if (event.buttons != 1 || _activating) return;
                // Lock origin once at press — do not chase the finger.
                _lockOrigin(event.localPosition.dx, event.localPosition.dy);
                _setPressed(true);
              },
              onPointerUp: (event) {
                if (_activating) return;
                final wasPressed = _isPressed;
                _setPressed(false);
                if (!wasPressed) return;

                final renderBox = context.findRenderObject() as RenderBox?;
                if (renderBox == null || !renderBox.hasSize) return;
                final local = renderBox.globalToLocal(event.position);
                if ((Offset.zero & renderBox.size).contains(local)) {
                  _activateFromPointer();
                }
              },
              onPointerCancel: (_) {
                if (_activating) return;
                _setPressed(false);
              },
              child: AnimatedScale(
                scale: _isPressed && !_isInactive ? _tapScale : 1,
                duration: scaleDuration,
                curve: _isPressed ? _tapCurve : _tapReverseCurve,
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    final width = constraints.maxWidth;
                    final height = _height;
                    final diameter = _coverDiameter(
                      width,
                      height,
                      _originX,
                      _originY,
                    );

                    return ClipRRect(
                      borderRadius: BorderRadius.circular(_radius),
                      child: AnimatedBuilder(
                        animation: _fillAnimation,
                        builder: (context, _) {
                          final fillProgress = _fillAnimation.value;
                          final textColor = Color.lerp(
                            surakshaAuthText,
                            surakshaAuthRight,
                            fillProgress,
                          )!;
                          final borderColor = Color.lerp(
                            surakshaBorder,
                            surakshaAuthText.withValues(alpha: 0.4),
                            Curves.easeOut.transform(
                              (_isHovered || _isPressed || _activating) &&
                                      !_isInactive
                                  ? math.max(fillProgress, 0.35)
                                  : fillProgress * 0.5,
                            ),
                          )!;

                          return Container(
                            height: height,
                            width: width,
                            decoration: BoxDecoration(
                              color: surakshaCard,
                              border: Border.all(
                                color: borderColor,
                                width: 0.5,
                              ),
                              borderRadius: BorderRadius.circular(_radius),
                            ),
                            child: Stack(
                              clipBehavior: Clip.hardEdge,
                              children: [
                                Positioned(
                                  left: _originX - diameter / 2,
                                  top: _originY - diameter / 2,
                                  child: Transform.scale(
                                    scale: fillProgress,
                                    alignment: Alignment.center,
                                    filterQuality: FilterQuality.medium,
                                    child: Container(
                                      width: diameter,
                                      height: diameter,
                                      decoration: const BoxDecoration(
                                        color: surakshaAuthText,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                  ),
                                ),
                                Padding(
                                  padding: const EdgeInsets.symmetric(
                                    horizontal: _horizontalPadding,
                                  ),
                                  child: Center(
                                    child: DefaultTextStyle(
                                      style: _labelStyle.copyWith(
                                        color: textColor,
                                      ),
                                      child: IconTheme(
                                        data: IconThemeData(
                                          color: textColor,
                                          size: 20,
                                        ),
                                        child: content,
                                      ),
                                    ),
                                  ),
                                ),
                              ],
                            ),
                          );
                        },
                      ),
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );

    return Semantics(
      button: true,
      enabled: !_isInactive,
      label: label,
      child: button,
    );
  }
}

double _coverDiameter(double width, double height, double x, double y) {
  final distances = [
    math.sqrt(x * x + y * y),
    math.sqrt((width - x) * (width - x) + y * y),
    math.sqrt(x * x + (height - y) * (height - y)),
    math.sqrt((width - x) * (width - x) + (height - y) * (height - y)),
  ];
  return math.max(distances.reduce(math.max) * 2, 0).ceilToDouble();
}
