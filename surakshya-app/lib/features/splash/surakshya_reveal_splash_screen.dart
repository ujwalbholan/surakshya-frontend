library surakshya_reveal_splash_screen;

import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/core/extensions/context_extensions.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/tumbler_word.dart';

/// Cold-start text-reveal splash (Option A): illuminates [CopyConstants.appName]
/// left → right, then Welcome → [AppRoutes.splash2].
class SurakshyaRevealSplashScreen extends StatefulWidget {
  const SurakshyaRevealSplashScreen({super.key});

  @override
  State<SurakshyaRevealSplashScreen> createState() =>
      _SurakshyaRevealSplashScreenState();
}

class _SurakshyaRevealSplashScreenState extends State<SurakshyaRevealSplashScreen>
    with TickerProviderStateMixin {
  static const kRevealDuration = Duration(milliseconds: 2500);
  static const kButtonDelay = Duration(milliseconds: 350);
  static const kButtonFadeDuration = Duration(milliseconds: 500);
  static const kRevealCurve = Curves.easeInOut;
  static const kButtonFadeCurve = Curves.easeIn;

  static const kWordmarkSizeNarrow = 40.0;
  static const kWordmarkSizePhone = 52.0;
  static const kWordmarkSizeTablet = 72.0;
  static const kNarrowWidth = 360.0;
  static const kButtonRadius = 24.0;
  static const kButtonHorizontalPadding = 36.0;
  static const kButtonVerticalPadding = 14.0;
  static const kWordmarkButtonGap = 48.0;
  static const kAccentUnderlineHeight = 1.5;
  static const kAccentUnderlineGap = 18.0;
  static const kButtonBorderWidth = 1.0;
  static const kWelcomeFontSize = 15.0;
  static const kWelcomeLetterSpacing = 1.2;

  late final AnimationController _revealController;
  late final AnimationController _buttonController;
  late final CurvedAnimation _revealCurved;
  late final CurvedAnimation _buttonCurved;

  Timer? _buttonDelayTimer;
  bool _navigating = false;

  @override
  void initState() {
    super.initState();

    _revealController = AnimationController(
      vsync: this,
      duration: kRevealDuration,
    );
    _buttonController = AnimationController(
      vsync: this,
      duration: kButtonFadeDuration,
    );

    _revealCurved = CurvedAnimation(
      parent: _revealController,
      curve: kRevealCurve,
    );
    _buttonCurved = CurvedAnimation(
      parent: _buttonController,
      curve: kButtonFadeCurve,
    );

    _revealController.addStatusListener((status) {
      if (status == AnimationStatus.completed) {
        _scheduleWelcomeButton();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (MediaQuery.disableAnimationsOf(context)) {
        _jumpToCompleted();
        return;
      }
      _revealController.forward();
    });
  }

  void _scheduleWelcomeButton() {
    _buttonDelayTimer?.cancel();
    _buttonDelayTimer = Timer(kButtonDelay, () {
      if (!mounted) return;
      _buttonController.forward();
    });
  }

  void _jumpToCompleted() {
    _buttonDelayTimer?.cancel();
    _buttonDelayTimer = null;
    _revealController.value = 1.0;
    _buttonController.value = 1.0;
  }

  bool get _sequenceFullyComplete =>
      _revealController.isCompleted && _buttonController.isCompleted;

  void _onBodyTap() {
    if (_sequenceFullyComplete) return;
    _jumpToCompleted();
  }

  void _onWelcomeTap() {
    if (_navigating) return;
    if (!_sequenceFullyComplete) return;
    _navigating = true;
    context.go(AppRoutes.splash2);
  }

  double _wordmarkSize(BuildContext context) {
    if (context.isTablet) return kWordmarkSizeTablet;
    if (context.screenWidth < kNarrowWidth) return kWordmarkSizeNarrow;
    return kWordmarkSizePhone;
  }

  @override
  void dispose() {
    _buttonDelayTimer?.cancel();
    _revealCurved.dispose();
    _buttonCurved.dispose();
    _revealController.dispose();
    _buttonController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return AnnotatedRegion<SystemUiOverlayStyle>(
      value: SystemUiOverlayStyle.light.copyWith(
        statusBarColor: surakshaBlack,
        systemNavigationBarColor: surakshaBlack,
      ),
      child: Scaffold(
        backgroundColor: surakshaBlack,
        body: GestureDetector(
          behavior: HitTestBehavior.opaque,
          onTap: _onBodyTap,
          child: ColoredBox(
            color: surakshaBlack,
            child: SafeArea(
              child: Center(
                child: AnimatedBuilder(
                  animation: Listenable.merge([
                    _revealController,
                    _buttonController,
                  ]),
                  builder: (context, _) {
                    final progress = _revealCurved.value.clamp(0.0, 1.0);
                    final wordmarkSize = _wordmarkSize(context);
                    final wordmarkStyle =
                        SurakshaTypography.brandWordmark.copyWith(
                      fontSize: wordmarkSize,
                      color: kSplashTextBright,
                    );
                    final wordmarkWidth = () {
                      final painter = TextPainter(
                        text: TextSpan(
                          text: CopyConstants.appName,
                          style: wordmarkStyle,
                        ),
                        textDirection: TextDirection.ltr,
                        maxLines: 1,
                      )..layout();
                      return painter.width;
                    }();
                    return Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Semantics(
                          label: CopyConstants.appName,
                          child: ShaderMask(
                            blendMode: BlendMode.dstIn,
                            shaderCallback: (bounds) {
                              return LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: const [
                                  Colors.white,
                                  Colors.white,
                                  Colors.transparent,
                                ],
                                stops: [
                                  0.0,
                                  progress,
                                  progress,
                                ],
                              ).createShader(bounds);
                            },
                            child: Text(
                              CopyConstants.appName,
                              textAlign: TextAlign.center,
                              softWrap: false,
                              style: wordmarkStyle,
                            ),
                          ),
                        ),
                        const SizedBox(height: kAccentUnderlineGap),
                        SizedBox(
                          width: wordmarkWidth,
                          height: kAccentUnderlineHeight,
                          child: ShaderMask(
                            blendMode: BlendMode.dstIn,
                            shaderCallback: (bounds) {
                              return LinearGradient(
                                begin: Alignment.centerLeft,
                                end: Alignment.centerRight,
                                colors: const [
                                  Colors.white,
                                  Colors.white,
                                  Colors.transparent,
                                ],
                                stops: [
                                  0.0,
                                  progress,
                                  progress,
                                ],
                              ).createShader(bounds);
                            },
                            child: const ColoredBox(color: surakshaCrimson),
                          ),
                        ),
                        const SizedBox(height: kWordmarkButtonGap),
                        FadeTransition(
                          opacity: _buttonCurved,
                          child: IgnorePointer(
                            ignoring: !_sequenceFullyComplete,
                            child: _WelcomePillButton(
                              onPressed: _onWelcomeTap,
                            ),
                          ),
                        ),
                      ],
                    );
                  },
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

class _WelcomePillButton extends StatefulWidget {
  const _WelcomePillButton({required this.onPressed});

  final VoidCallback onPressed;

  @override
  State<_WelcomePillButton> createState() => _WelcomePillButtonState();
}

class _WelcomePillButtonState extends State<_WelcomePillButton> {
  bool _tumbling = false;

  void _setTumbling(bool value) {
    if (_tumbling == value) return;
    setState(() => _tumbling = value);
  }

  @override
  Widget build(BuildContext context) {
    final labelStyle = SurakshaTypography.interBase.copyWith(
      fontSize: _SurakshyaRevealSplashScreenState.kWelcomeFontSize,
      fontWeight: FontWeight.w400,
      height: 1.2,
      color: kSplashTextBright,
    );

    return Semantics(
      button: true,
      label: CopyConstants.welcome,
      child: MouseRegion(
        onEnter: (_) => _setTumbling(true),
        onExit: (_) => _setTumbling(false),
        child: Material(
          color: Colors.transparent,
          child: InkWell(
            onTap: widget.onPressed,
            onHover: _setTumbling,
            onHighlightChanged: _setTumbling,
            borderRadius: BorderRadius.circular(
              _SurakshyaRevealSplashScreenState.kButtonRadius,
            ),
            child: Container(
              padding: const EdgeInsets.symmetric(
                horizontal:
                    _SurakshyaRevealSplashScreenState.kButtonHorizontalPadding,
                vertical:
                    _SurakshyaRevealSplashScreenState.kButtonVerticalPadding,
              ),
              decoration: BoxDecoration(
                color: Colors.transparent,
                borderRadius: BorderRadius.circular(
                  _SurakshyaRevealSplashScreenState.kButtonRadius,
                ),
                border: Border.all(
                  color: kSplashButtonBorder,
                  width: _SurakshyaRevealSplashScreenState.kButtonBorderWidth,
                ),
              ),
              child: TumblerWord(
                text: CopyConstants.welcome,
                style: labelStyle,
                active: _tumbling,
                letterSpacing:
                    _SurakshyaRevealSplashScreenState.kWelcomeLetterSpacing,
              ),
            ),
          ),
        ),
      ),
    );
  }
}
