library app_routes;

class AppRoutes {
  AppRoutes._();

  static const String splash = '/splash';
  static const String splash2 = '/splash2';
  static const String onboarding = '/onboarding';
  static const String home = '/home';
  static const String login = '/login';
  static const String signup = '/signup';
  static const String forgotPassword = '/forgot-password';
  static const String tracking = '/tracking';
  static const String parent = '/parent';
  static const String profile = '/profile';
  static const String editProfile = '/profile/edit';
  static const String guardians = '/guardians';
  static const String notifications = '/notifications';
  static const String guardianSetup = '/guardian/setup';
  static const String guardianActivate = '/guardian/activate';

  /// Home route after login or splash for the given account role.
  static String homeRouteForRole(String role) {
    switch (role) {
      case 'USER':
        return tracking;
      case 'GUARDIAN':
        return parent;
      default:
        throw UnsupportedError(
          'This app supports citizen and guardian accounts. '
          'Police and admin users should use the web portal.',
        );
    }
  }
}
