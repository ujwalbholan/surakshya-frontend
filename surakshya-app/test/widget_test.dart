import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/app.dart';
import 'package:suraksha/features/auth/login_screen.dart';
import 'package:suraksha/router/app_router.dart';

void main() {
  testWidgets('SurakshaApp builds', (tester) async {
    final testRouter = GoRouter(
      initialLocation: '/login',
      routes: [
        GoRoute(
          path: '/login',
          builder: (context, state) => const LoginScreen(),
        ),
      ],
    );

    await tester.pumpWidget(
      ProviderScope(
        overrides: [
          appRouterProvider.overrideWithValue(testRouter),
        ],
        child: const SurakshaApp(),
      ),
    );
    expect(find.byType(SurakshaApp), findsOneWidget);
  });
}
