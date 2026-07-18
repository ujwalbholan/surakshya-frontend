library app;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/router/app_router.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/services/notification_service.dart';
import 'package:suraksha/theme/suraksha_theme.dart';

class SurakshaApp extends ConsumerStatefulWidget {
  const SurakshaApp({super.key});

  @override
  ConsumerState<SurakshaApp> createState() => _SurakshaAppState();
}

class _SurakshaAppState extends ConsumerState<SurakshaApp> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(notificationServiceProvider).init();
      ref.read(authProvider.notifier).restoreSession();
    });
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(appRouterProvider);
    // Session ended outside a screen (e.g. token refresh failed mid-request):
    // reuse the existing login route rather than leaving a stale screen up.
    ref.listen(authProvider, (previous, next) {
      if (previous?.isLoggedIn == true && !next.isLoggedIn) {
        router.go(AppRoutes.login);
      }
    });
    return MaterialApp.router(
      title: 'Suraksha',
      debugShowCheckedModeBanner: false,
      theme: SurakshaTheme.dark,
      routerConfig: router,
    );
  }
}
