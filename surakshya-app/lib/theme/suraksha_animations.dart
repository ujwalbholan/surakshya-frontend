library suraksha_animations;

import 'package:flutter/material.dart';

class SurakshaAnimations {
  SurakshaAnimations._();

  static const Duration splash = Duration(milliseconds: 1800);
  static const Duration splashCinematic = Duration(milliseconds: 4200);
  static const Duration splashHold = Duration(milliseconds: 400);
  static const Duration splashFade = Duration(milliseconds: 500);
  static const Duration splashExit = Duration(milliseconds: 500);
  static const Duration sectionReveal = Duration(milliseconds: 700);
  static const Duration textReveal = Duration(milliseconds: 600);
  static const Duration textStagger = Duration(milliseconds: 80);
  static const Duration hoverEnter = Duration(milliseconds: 200);
  static const Duration hoverExit = Duration(milliseconds: 300);
  static const Duration pageTurn = Duration(milliseconds: 400);
  static const Duration authLoad = Duration(milliseconds: 1100);
  static const Duration dotsBounce = Duration(milliseconds: 350);
  static const Duration bandRotate = Duration(seconds: 12);
  static const Duration sosCountdown = Duration(seconds: 5);
  static const Duration countUp = Duration(milliseconds: 1200);
  static const Duration parallax = Duration(milliseconds: 16);

  static const Curve easeOutExpo = Cubic(0.16, 1.0, 0.3, 1.0);
  static const Curve easeInOutSine = Cubic(0.37, 0.0, 0.63, 1.0);
  static const Curve splashEase = Cubic(0.4, 0.0, 0.2, 1.0);
  static const Curve heroText = Cubic(0.25, 0.46, 0.45, 0.94);
  static const Curve sectionEntry = Cubic(0.0, 0.0, 0.2, 1.0);
  static const Curve snapBack = Cubic(0.34, 1.56, 0.64, 1.0);
  static const Curve magneticPull = Cubic(0.25, 0.1, 0.25, 1.0);

  static const double parallaxHero = 0.4;
  static const double parallaxSection = 0.15;
  static const double parallaxBg = 0.07;
  static const double parallaxGrain = 0.02;
}
