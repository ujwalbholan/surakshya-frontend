library app_router;

import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/features/auth/forgot_password_screen.dart';
import 'package:suraksha/features/auth/login_screen.dart';
import 'package:suraksha/features/auth/signup_screen.dart';
import 'package:suraksha/features/dashboard/dashboard_shell.dart';
import 'package:suraksha/features/dashboard/profile/edit_profile_screen.dart';
import 'package:suraksha/features/guardians/guardian_activate_screen.dart';
import 'package:suraksha/features/guardians/guardians_screen.dart';
import 'package:suraksha/features/guardians/guardian_setup_screen.dart';
import 'package:suraksha/models/guardian_activation_models.dart';
import 'package:suraksha/features/home/home_screen.dart';
import 'package:suraksha/features/notifications/notifications_screen.dart';
import 'package:suraksha/features/onboarding/onboarding_screen.dart';
import 'package:suraksha/features/parent/parent_shell.dart';
import 'package:suraksha/features/splash/splash_screen2.dart';
import 'package:suraksha/features/splash/surakshya_reveal_splash_screen.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

final _rootKey = GlobalKey<NavigatorState>();

final appRouterProvider = Provider<GoRouter>((ref) {
  return GoRouter(
    navigatorKey: _rootKey,
    initialLocation: AppRoutes.splash,
    debugLogDiagnostics: kDebugMode,
    routes: [
      GoRoute(
        path: '/',
        redirect: (context, state) => AppRoutes.splash,
      ),
      GoRoute(
        path: AppRoutes.splash,
        builder: (context, state) => const SurakshyaRevealSplashScreen(),
      ),
      GoRoute(
        path: AppRoutes.splash2,
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          child: const SplashScreen2(),
          transitionsBuilder: (context, animation, secondary, child) =>
              FadeTransition(opacity: animation, child: child),
        ),
      ),
      GoRoute(
        path: AppRoutes.onboarding,
        builder: (context, state) => const OnboardingScreen(),
      ),
      GoRoute(
        path: AppRoutes.home,
        builder: (context, state) => const HomeScreen(),
      ),
      GoRoute(
        path: AppRoutes.login,
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          child: const LoginScreen(),
          transitionsBuilder: (context, animation, secondary, child) =>
              FadeTransition(opacity: animation, child: child),
        ),
      ),
      GoRoute(
        path: AppRoutes.guardianActivate,
        pageBuilder: (context, state) {
          final challenge = state.extra;
          if (challenge is! GuardianLoginChallenge) {
            return CustomTransitionPage<void>(
              child: const LoginScreen(),
              transitionsBuilder: (context, animation, secondary, child) =>
                  FadeTransition(opacity: animation, child: child),
            );
          }
          return CustomTransitionPage<void>(
            child: GuardianActivateScreen(challenge: challenge),
            transitionsBuilder: (context, animation, secondary, child) =>
                FadeTransition(opacity: animation, child: child),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.guardianSetup,
        pageBuilder: (context, state) {
          final email = state.uri.queryParameters['email'];
          return CustomTransitionPage<void>(
            child: GuardianSetupScreen(initialEmail: email),
            transitionsBuilder: (context, animation, secondary, child) =>
                FadeTransition(opacity: animation, child: child),
          );
        },
      ),
      GoRoute(
        path: AppRoutes.signup,
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          child: const SignupScreen(),
          transitionsBuilder: (context, animation, secondary, child) =>
              FadeTransition(opacity: animation, child: child),
        ),
      ),
      GoRoute(
        path: AppRoutes.forgotPassword,
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          child: const ForgotPasswordScreen(),
          transitionsBuilder: (context, animation, secondary, child) =>
              FadeTransition(opacity: animation, child: child),
        ),
      ),
      GoRoute(
        path: AppRoutes.parent,
        redirect: (context, state) async {
          final prefs = await SharedPreferences.getInstance();
          final loggedIn = prefs.getBool(AppConstants.prefsLoggedIn) ?? false;
          if (!loggedIn) return AppRoutes.login;
          final role = prefs.getString(AppConstants.prefsUserRole) ?? 'USER';
          if (role == 'USER') return AppRoutes.tracking;
          if (role != 'GUARDIAN') return AppRoutes.login;
          return null;
        },
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          child: const ParentShell(),
          transitionsBuilder: (context, animation, secondary, child) =>
              FadeTransition(opacity: animation, child: child),
        ),
      ),
      GoRoute(
        path: AppRoutes.tracking,
        redirect: (context, state) async {
          final prefs = await SharedPreferences.getInstance();
          final loggedIn = prefs.getBool(AppConstants.prefsLoggedIn) ?? false;
          if (!loggedIn) return AppRoutes.login;
          final role = prefs.getString(AppConstants.prefsUserRole) ?? 'USER';
          if (role == 'GUARDIAN') return AppRoutes.parent;
          return null;
        },
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          child: const DashboardShell(),
          transitionsBuilder: (context, animation, secondary, child) =>
              FadeTransition(opacity: animation, child: child),
        ),
      ),
      GoRoute(
        path: AppRoutes.guardians,
        redirect: (context, state) async {
          final prefs = await SharedPreferences.getInstance();
          final loggedIn = prefs.getBool(AppConstants.prefsLoggedIn) ?? false;
          if (!loggedIn) return AppRoutes.login;
          final role = prefs.getString(AppConstants.prefsUserRole) ?? 'USER';
          if (role == 'GUARDIAN') return AppRoutes.parent;
          return null;
        },
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          child: const GuardiansScreen(),
          transitionsBuilder: (context, animation, secondary, child) =>
              FadeTransition(opacity: animation, child: child),
        ),
      ),
      GoRoute(
        path: AppRoutes.notifications,
        redirect: (context, state) async {
          final prefs = await SharedPreferences.getInstance();
          final loggedIn = prefs.getBool(AppConstants.prefsLoggedIn) ?? false;
          if (!loggedIn) return AppRoutes.login;
          return null;
        },
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          child: const NotificationsScreen(),
          transitionsBuilder: (context, animation, secondary, child) =>
              FadeTransition(opacity: animation, child: child),
        ),
      ),
      GoRoute(
        path: AppRoutes.profile,
        redirect: (context, state) => AppRoutes.tracking,
      ),
      GoRoute(
        path: AppRoutes.editProfile,
        redirect: (context, state) async {
          final prefs = await SharedPreferences.getInstance();
          final loggedIn = prefs.getBool(AppConstants.prefsLoggedIn) ?? false;
          if (!loggedIn) return AppRoutes.login;
          return null;
        },
        pageBuilder: (context, state) => CustomTransitionPage<void>(
          child: const EditProfileScreen(),
          transitionsBuilder: (context, animation, secondary, child) =>
              FadeTransition(opacity: animation, child: child),
        ),
      ),
    ],
    errorBuilder: (context, state) => Scaffold(
      backgroundColor: surakshaBlack,
      body: Center(
        child: Text(
          '404 — ${state.error}',
          style: SurakshaTypography.bodyLarge,
        ),
      ),
    ),
  );
});
