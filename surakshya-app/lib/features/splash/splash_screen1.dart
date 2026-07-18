library splash_screen1;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

/// Startup progress overlay — splash screen 1 (no text, bar only).
class SplashScreen1 extends StatefulWidget {
  const SplashScreen1({super.key});

  @override
  State<SplashScreen1> createState() => _SplashScreen1State();
}

class _SplashScreen1State extends State<SplashScreen1>
    with SingleTickerProviderStateMixin {
  static const _progressDuration = Duration(milliseconds: 5000);
  static const _progressCurve = Cubic(0.4, 0.0, 0.2, 1.0);

  late final AnimationController _controller;
  bool _navigating = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: _progressDuration,
    )..addListener(() => setState(() {}));

    _controller.addStatusListener((status) {
      if (status == AnimationStatus.completed && mounted && !_navigating) {
        _goToSplash2();
      }
    });

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (!mounted) return;
      if (MediaQuery.disableAnimationsOf(context)) {
        _goToSplash2();
        return;
      }
      _controller.forward(from: 0);
    });
  }

  double get _progress =>
      _progressCurve.transform(_controller.value.clamp(0.0, 1.0)) * 100;

  void _goToSplash2() {
    if (_navigating) return;
    _navigating = true;
    _controller.stop();
    context.go(AppRoutes.splash2);
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Loading',
      child: ExcludeSemantics(
        child: Scaffold(
          backgroundColor: surakshaBlack,
          body: ColoredBox(
            color: surakshaBlack,
            child: Center(
              child: _SplashProgressBar(progress: _progress),
            ),
          ),
        ),
      ),
    );
  }
}

class _SplashProgressBar extends StatelessWidget {
  const _SplashProgressBar({required this.progress});

  final double progress;

  static const _trackColor = Color(0xFF1A1A1A);
  static const _fillColor = Color(0xFFFFFFFF);
  static const _barHeight = 3.0;

  @override
  Widget build(BuildContext context) {
    final barWidth = math.min(
      580.0,
      MediaQuery.sizeOf(context).width * 0.8,
    );
    final fillWidth = barWidth * (progress / 100).clamp(0.0, 1.0);

    return Semantics(
      label: 'Loading progress',
      value: '${progress.round()} percent',
      child: SizedBox(
        width: barWidth,
        height: _barHeight,
        child: Stack(
          clipBehavior: Clip.hardEdge,
          alignment: Alignment.centerLeft,
          children: [
            const SizedBox(
              width: double.infinity,
              height: _barHeight,
              child: ColoredBox(color: _trackColor),
            ),
            if (fillWidth > 0)
              SizedBox(
                width: fillWidth,
                height: _barHeight,
                child: const ColoredBox(color: _fillColor),
              ),
          ],
        ),
      ),
    );
  }
}
