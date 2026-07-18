library forgot_password_screen;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/utils/email_utils.dart';
import 'package:suraksha/features/auth/widgets/auth_accent_title.dart';
import 'package:suraksha/features/auth/widgets/auth_cinematic_background.dart';
import 'package:suraksha/features/auth/widgets/auth_footer_link.dart';
import 'package:suraksha/features/auth/widgets/auth_register_prompt.dart';
import 'package:suraksha/features/auth/widgets/auth_reveal_transition.dart';
import 'package:suraksha/features/auth/widgets/auth_ticket_status_overlay.dart';
import 'package:suraksha/features/auth/widgets/auth_ticket_status_presenter.dart';
import 'package:suraksha/features/auth/widgets/auth_underline_field_style.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/origin_button.dart';
import 'package:suraksha/widgets/suraksha_email_input.dart';

/// Password recovery: email → OTP → new password → success.
/// Mirrors the guardian setup step machine against `/auth/*` reset endpoints,
/// styled like [LoginScreen] (cinematic background, ticket status cards).
class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  static const _minPasswordLength = 5;
  static const _otpCooldownSeconds = 30;

  int _step = 1;
  final _emailLocalController = TextEditingController();
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  String _emailDomain = EmailDomains.defaultSelected;
  String _email = '';
  String _resetToken = '';
  bool _obscurePassword = true;
  bool _loading = false;
  int _cooldown = 0;
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
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
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
    setState(() => _loading = true);
    try {
      await ref.read(surakshyaApiServiceProvider).forgotPassword(email);
      if (!mounted) return;
      setState(() {
        _email = email;
        _step = 2;
        _cooldown = _otpCooldownSeconds;
        _loading = false;
      });
      _tickCooldown();
    } on SurakshyaApiException catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      _statusPresenter.showError('Could not send code', e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
      _statusPresenter.showError('Connection failed', kApiNetworkErrorMessage);
    }
  }

  void _tickCooldown() {
    Future<void>.delayed(const Duration(seconds: 1), () {
      if (!mounted || _cooldown <= 0) return;
      setState(() => _cooldown -= 1);
      if (_cooldown > 0) _tickCooldown();
    });
  }

  Future<void> _verifyOtp() async {
    final otp = _otpController.text.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(otp)) {
      _statusPresenter.showInfo(
        'Invalid code',
        'Enter the 6-digit code sent to your email.',
      );
      return;
    }
    setState(() => _loading = true);
    try {
      final resetToken =
          await ref.read(surakshyaApiServiceProvider).verifyResetOtp(
                email: _email,
                otp: otp,
              );
      if (!mounted) return;
      setState(() {
        _resetToken = resetToken;
        _step = 3;
        _loading = false;
      });
    } on SurakshyaApiException catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      _statusPresenter.showError('Verification failed', e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
      _statusPresenter.showError('Connection failed', kApiNetworkErrorMessage);
    }
  }

  Future<void> _resetPassword() async {
    final newPassword = _newPasswordController.text;
    final confirm = _confirmPasswordController.text;
    if (newPassword.length < _minPasswordLength) {
      _statusPresenter.showInfo(
        'Password too short',
        'Password must be at least $_minPasswordLength characters.',
      );
      return;
    }
    if (newPassword != confirm) {
      _statusPresenter.showInfo(
        'Passwords do not match',
        'Both password fields must be identical.',
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(surakshyaApiServiceProvider).resetPassword(
            email: _email,
            newPassword: newPassword,
            comparePassword: confirm,
            resetToken: _resetToken,
          );
      if (!mounted) return;
      setState(() {
        _step = 4;
        _loading = false;
      });
    } on SurakshyaApiException catch (e) {
      if (!mounted) return;
      setState(() => _loading = false);
      _statusPresenter.showError('Reset failed', e.message);
    } catch (_) {
      if (!mounted) return;
      setState(() => _loading = false);
      _statusPresenter.showError('Connection failed', kApiNetworkErrorMessage);
    }
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: Colors.transparent,
        body: Stack(
          fit: StackFit.expand,
          children: [
            AuthCinematicBackground(
              disableAnimations:
                  _reducedMotion || MediaQuery.disableAnimationsOf(context),
            ),
            Container(color: Colors.black.withValues(alpha: authScrimOpacity)),
            SafeArea(
              child: AuthRevealTransition(
                disableAnimations: _reducedMotion,
                child: _buildForm(),
              ),
            ),
            AuthTicketStatusOverlay(presenter: _statusPresenter),
          ],
        ),
      );

  Widget _buildForm() => Align(
        alignment: Alignment.bottomCenter,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 400),
          child: SingleChildScrollView(
            padding: const EdgeInsets.fromLTRB(S.xl, S.md, S.xl, S.lg),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const AuthAccentTitle(leading: 'Reset ', accent: 'Password'),
                const SizedBox(height: S.sm),
                Text(_subtitle, style: SurakshaTypography.monoLabel),
                const SizedBox(height: S.xl2),
                ..._buildStepFields(),
                const SizedBox(height: authFooterLinkTopGap),
                // Same underline-fill treatment as the login screen links.
                Center(
                  child: AuthBarActionText(
                    label: 'Back to login',
                    onPressed: () => context.go(AppRoutes.login),
                  ),
                ),
              ],
            ),
          ),
        ),
      );

  String get _subtitle => switch (_step) {
        1 => 'ENTER YOUR EMAIL TO RECEIVE A RESET CODE',
        2 => 'ENTER THE 6-DIGIT CODE SENT TO YOUR EMAIL',
        3 => 'CHOOSE A NEW PASSWORD',
        _ => 'PASSWORD UPDATED',
      };

  List<Widget> _buildStepFields() {
    switch (_step) {
      case 1:
        return [
          const AuthFieldLabel('EMAIL'),
          const SizedBox(height: kFieldLabelGap),
          SurakshaEmailInput(
            localPartController: _emailLocalController,
            initialDomain: _emailDomain,
            textInputAction: TextInputAction.done,
            style: SurakshaEmailInputStyle.underline,
            onDomainChanged: (domain) => setState(() => _emailDomain = domain),
          ),
          const SizedBox(height: S.xl),
          SizedBox(
            width: double.infinity,
            child: OriginButton(
              onPressed: _sendOtp,
              loading: _loading,
              child: const Text('Send Code'),
            ),
          ),
        ];
      case 2:
        return [
          const AuthFieldLabel('VERIFICATION CODE'),
          const SizedBox(height: kFieldLabelGap),
          TextField(
            controller: _otpController,
            keyboardType: TextInputType.number,
            maxLength: 6,
            style: const TextStyle(color: surakshaAuthText),
            cursorColor: kFieldUnderlineFocused,
            decoration: authUnderlineFieldDecoration(
              hintText: '6-digit code',
            ).copyWith(counterText: ''),
          ),
          const SizedBox(height: S.xl),
          SizedBox(
            width: double.infinity,
            child: OriginButton(
              onPressed: _verifyOtp,
              loading: _loading,
              child: const Text('Verify Code'),
            ),
          ),
          const SizedBox(height: authFooterLinkTopGap),
          AuthFooterLink(
            label: _cooldown > 0 ? 'Resend in ${_cooldown}s' : 'Resend code',
            color: _cooldown > 0 ? surakshaMuted : authFooterLinkColor,
            onPressed: () {
              if (_loading || _cooldown > 0) return;
              _sendOtp();
            },
          ),
        ];
      case 3:
        return [
          const AuthFieldLabel('NEW PASSWORD'),
          const SizedBox(height: kFieldLabelGap),
          TextField(
            controller: _newPasswordController,
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
                onPressed: () =>
                    setState(() => _obscurePassword = !_obscurePassword),
              ),
            ),
          ),
          const SizedBox(height: S.lg),
          const AuthFieldLabel('CONFIRM PASSWORD'),
          const SizedBox(height: kFieldLabelGap),
          TextField(
            controller: _confirmPasswordController,
            obscureText: _obscurePassword,
            style: const TextStyle(color: surakshaAuthText),
            cursorColor: kFieldUnderlineFocused,
            decoration: authUnderlineFieldDecoration(),
          ),
          const SizedBox(height: S.xl),
          SizedBox(
            width: double.infinity,
            child: OriginButton(
              onPressed: _resetPassword,
              loading: _loading,
              child: const Text('Reset Password'),
            ),
          ),
        ];
      default:
        return [
          const Center(
            child: Icon(Icons.check_circle, color: Colors.greenAccent, size: 56),
          ),
          const SizedBox(height: S.md),
          Text(
            'Your password has been updated. Sign in with your new password.',
            style: SurakshaTypography.dashSubtitle,
            textAlign: TextAlign.center,
          ),
          const SizedBox(height: S.xl),
          SizedBox(
            width: double.infinity,
            child: OriginButton(
              onPressed: () => context.go(AppRoutes.login),
              child: const Text('Go to Login'),
            ),
          ),
        ];
    }
  }
}
