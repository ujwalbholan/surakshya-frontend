library login_screen;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/core/utils/email_utils.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/features/auth/widgets/auth_accent_title.dart';
import 'package:suraksha/features/auth/widgets/auth_cinematic_background.dart';
import 'package:suraksha/features/auth/widgets/auth_footer_link.dart';
import 'package:suraksha/features/auth/widgets/auth_register_prompt.dart';
import 'package:suraksha/features/auth/widgets/auth_reveal_transition.dart';
import 'package:suraksha/features/auth/widgets/auth_ticket_status_overlay.dart';
import 'package:suraksha/features/auth/widgets/auth_ticket_status_presenter.dart';
import 'package:suraksha/features/auth/widgets/auth_underline_field_style.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/origin_button.dart';
import 'package:suraksha/widgets/suraksha_email_input.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _emailLocalController = TextEditingController();
  final _passwordController = TextEditingController();
  String _emailDomain = EmailDomains.defaultSelected;
  bool _obscurePassword = true;
  bool _isLoading = false;
  late final bool _reducedMotion;
  late final AuthTicketStatusPresenter _statusPresenter;

  @override
  void initState() {
    super.initState();
    _reducedMotion = WidgetsBinding
        .instance.platformDispatcher.accessibilityFeatures.disableAnimations;
    _statusPresenter = AuthTicketStatusPresenter((fn) => setState(fn));
  }

  @override
  void dispose() {
    _statusPresenter.dispose();
    _emailLocalController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    final email = buildEmailAddress(
      _emailLocalController.text,
      _emailDomain,
    );
    if (!isValidEmail(email)) {
      _statusPresenter.showInfo(
        'Invalid email',
        'Enter a valid email. Use only the username — @gmail.com is added for you.',
      );
      return;
    }

    setState(() => _isLoading = true);
    try {
      final challenge = await ref.read(authProvider.notifier).attemptLogin(
            email,
            _passwordController.text,
          );
      if (!mounted) return;
      if (challenge != null) {
        context.go(AppRoutes.guardianActivate, extra: challenge);
        return;
      }
      final role = ref.read(authProvider).user?.role ?? 'USER';
      final route = AppRoutes.homeRouteForRole(role);
      _statusPresenter.showSuccess(
        'Login successful',
        'Welcome back, redirecting…',
        autoDismiss: authTicketLoginSuccessDelay,
        onDismissed: () {
          if (mounted) context.go(route);
        },
      );
    } on SurakshyaApiException catch (e) {
      if (mounted) {
        _statusPresenter.showError('Login failed', e.message);
      }
    } catch (_) {
      if (mounted) {
        _statusPresenter.showError(
          'Connection failed',
          kApiNetworkErrorMessage,
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Stack(
          fit: StackFit.expand,
          children: [
            AuthCinematicBackground(
              disableAnimations: _reducedMotion ||
                  MediaQuery.disableAnimationsOf(context),
            ),
            Container(color: Colors.black.withValues(alpha: authScrimOpacity)),
            SafeArea(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final isDesktop = constraints.maxWidth >= 768;
                  if (isDesktop) {
                    return Row(
                      children: [
                        Expanded(child: _buildLeftPanel()),
                        Expanded(
                          child: AuthRevealTransition(
                            disableAnimations: _reducedMotion,
                            child: _buildForm(),
                          ),
                        ),
                      ],
                    );
                  }
                  return AuthRevealTransition(
                    disableAnimations: _reducedMotion,
                    child: _buildForm(),
                  );
                },
              ),
            ),
            AuthTicketStatusOverlay(presenter: _statusPresenter),
          ],
        ),
      );

  Widget _buildLeftPanel() => Center(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.shield_outlined, color: surakshyaCrimson, size: 48),
            const SizedBox(height: S.lg),
            Text(
              'THE SURAKSHA',
              style: SurakshaTypography.playfairDisplay.copyWith(
                fontSize: 20,
                letterSpacing: 4,
                color: surakshaAuthText,
              ),
            ),
            const SizedBox(height: S.sm),
            Text(
              'Wear it. Trust it. Stay safe.',
              style: SurakshaTypography.monoLabel,
            ),
          ],
        ),
      );

  Widget _buildForm() => Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: Padding(
            padding: const EdgeInsets.fromLTRB(S.xl, S.md, S.xl, S.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AuthAccentTitle(leading: 'Log ', accent: 'In'),
                const SizedBox(height: S.sm),
                Text(CopyConstants.loginSubtitle,
                    style: SurakshaTypography.monoLabel),
                const SizedBox(height: S.xl2),
                const AuthFieldLabel('EMAIL'),
                const SizedBox(height: kFieldLabelGap),
                SurakshaEmailInput(
                  localPartController: _emailLocalController,
                  initialDomain: _emailDomain,
                  textInputAction: TextInputAction.next,
                  style: SurakshaEmailInputStyle.underline,
                  onDomainChanged: (domain) =>
                      setState(() => _emailDomain = domain),
                ),
                const SizedBox(height: S.lg),
                const AuthFieldLabel('PASSWORD'),
                const SizedBox(height: kFieldLabelGap),
                TextField(
                  controller: _passwordController,
                  obscureText: _obscurePassword,
                  style: const TextStyle(color: surakshaAuthText),
                  cursorColor: kFieldUnderlineFocused,
                  decoration: authUnderlineFieldDecoration(
                    suffixIcon: IconButton(
                      icon: Icon(
                        _obscurePassword
                            ? Icons.visibility_off_outlined
                            : Icons.visibility_outlined,
                        color: surakshaMuted,
                      ),
                      onPressed: () => setState(
                        () => _obscurePassword = !_obscurePassword,
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: S.xl),
                SizedBox(
                  width: double.infinity,
                  child: OriginButton(
                    onPressed: _submit,
                    loading: _isLoading,
                    child: const Text('Log In'),
                  ),
                ),
                const SizedBox(height: authFooterLinkTopGap),
                AuthFooterLink(
                  label: 'Forgot password?',
                  onPressed: () => context.go(AppRoutes.forgotPassword),
                ),
                AuthRegisterPrompt(
                  onPressed: () => context.go(AppRoutes.signup),
                ),
              ],
            ),
          ),
        ),
      );
}
