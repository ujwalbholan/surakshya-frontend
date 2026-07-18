library guardian_activate_screen;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/models/guardian_activation_models.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/origin_button.dart';

enum _ActivateStep { otp, password, done }

/// Guardian activation after login challenge: OTP → optional password → login.
class GuardianActivateScreen extends ConsumerStatefulWidget {
  const GuardianActivateScreen({
    super.key,
    required this.challenge,
  });

  final GuardianLoginChallenge challenge;

  @override
  ConsumerState<GuardianActivateScreen> createState() =>
      _GuardianActivateScreenState();
}

class _GuardianActivateScreenState extends ConsumerState<GuardianActivateScreen> {
  static const _minPasswordLength = 8;
  static const _otpCooldownSeconds = 30;

  late _ActivateStep _step;
  final _otpController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _loading = false;
  String? _error;
  int _cooldown = 0;
  bool _needsPassword = false;

  @override
  void initState() {
    super.initState();
    _step = _ActivateStep.otp;
    _needsPassword = widget.challenge.requiresPasswordChange;
  }

  @override
  void dispose() {
    _otpController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  void _tickCooldown() {
    Future<void>.delayed(const Duration(seconds: 1), () {
      if (!mounted || _cooldown <= 0) return;
      setState(() => _cooldown -= 1);
      if (_cooldown > 0) _tickCooldown();
    });
  }

  Future<void> _resendOtp() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final message = await ref
          .read(surakshyaApiServiceProvider)
          .guardianActivationResendOtp(widget.challenge.challengeToken);
      if (!mounted) return;
      setState(() {
        _cooldown = _otpCooldownSeconds;
        _loading = false;
      });
      _tickCooldown();
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(message)),
      );
    } on SurakshyaApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Could not resend verification code';
        _loading = false;
      });
    }
  }

  Future<void> _verifyOtp() async {
    final otp = _otpController.text.trim();
    if (!RegExp(r'^\d{6}$').hasMatch(otp)) {
      setState(() => _error = 'Enter the 6-digit code from your email or SMS.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final result = await ref
          .read(surakshyaApiServiceProvider)
          .guardianActivationVerifyOtp(
            challengeToken: widget.challenge.challengeToken,
            otp: otp,
          );
      if (!mounted) return;
      setState(() {
        _needsPassword = result.requiresPasswordChange;
        _step = result.requiresPasswordChange
            ? _ActivateStep.password
            : _ActivateStep.done;
        _loading = false;
      });
    } on SurakshyaApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Verification failed';
        _loading = false;
      });
    }
  }

  Future<void> _setPassword() async {
    final newPassword = _newPasswordController.text;
    final confirm = _confirmPasswordController.text;
    if (newPassword.length < _minPasswordLength) {
      setState(
        () => _error =
            'Password must be at least $_minPasswordLength characters.',
      );
      return;
    }
    if (newPassword != confirm) {
      setState(() => _error = 'Passwords do not match.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(surakshyaApiServiceProvider).guardianActivationSetPassword(
            challengeToken: widget.challenge.challengeToken,
            newPassword: newPassword,
          );
      if (!mounted) return;
      setState(() {
        _step = _ActivateStep.done;
        _loading = false;
      });
    } on SurakshyaApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to update password';
        _loading = false;
      });
    }
  }

  int get _stepNumber {
    switch (_step) {
      case _ActivateStep.otp:
        return 1;
      case _ActivateStep.password:
        return 2;
      case _ActivateStep.done:
        return _needsPassword ? 3 : 2;
    }
  }

  int get _totalSteps => _needsPassword ? 3 : 2;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: surakshaBlack,
      appBar: AppBar(
        backgroundColor: surakshaBlack,
        elevation: 0,
        title: Text(
          'Guardian activation',
          style: SurakshaTypography.dashGreeting,
        ),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(S.lg),
          children: [
            Text(
              'Step $_stepNumber of $_totalSteps',
              style: SurakshaTypography.monoLabel,
            ),
            const SizedBox(height: S.sm),
            Text(
              widget.challenge.email,
              style: SurakshaTypography.bodyMedium.copyWith(
                color: surakshaMuted,
              ),
            ),
            const SizedBox(height: S.md),
            if (_error != null) ...[
              Text(
                _error!,
                style: SurakshaTypography.bodyMedium.copyWith(
                  color: surakshaCrimson,
                ),
              ),
              const SizedBox(height: S.md),
            ],
            if (_step == _ActivateStep.otp) ...[
              Text(
                widget.challenge.message.isNotEmpty
                    ? widget.challenge.message
                    : 'Enter the 6-digit code sent to your email and phone.',
                style: SurakshaTypography.dashSubtitle,
              ),
              const SizedBox(height: S.md),
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                style: SurakshaTypography.bodyLarge,
                decoration: const InputDecoration(
                  labelText: 'Verification code',
                  labelStyle: TextStyle(color: surakshaMuted),
                  counterText: '',
                ),
              ),
              const SizedBox(height: S.lg),
              OriginButton(
                onPressed: _verifyOtp,
                loading: _loading,
                enabled: !_loading,
                child: const Text('Verify code'),
              ),
              TextButton(
                onPressed: (_loading || _cooldown > 0) ? null : _resendOtp,
                child: Text(
                  _cooldown > 0
                      ? 'Resend in ${_cooldown}s'
                      : 'Resend code',
                ),
              ),
            ] else if (_step == _ActivateStep.password) ...[
              Text(
                'OTP verified. Choose a new permanent password for your guardian account.',
                style: SurakshaTypography.dashSubtitle,
              ),
              const SizedBox(height: S.md),
              TextField(
                controller: _newPasswordController,
                obscureText: true,
                style: SurakshaTypography.bodyLarge,
                decoration: const InputDecoration(
                  labelText: 'New password',
                  labelStyle: TextStyle(color: surakshaMuted),
                ),
              ),
              const SizedBox(height: S.sm),
              TextField(
                controller: _confirmPasswordController,
                obscureText: true,
                style: SurakshaTypography.bodyLarge,
                decoration: const InputDecoration(
                  labelText: 'Confirm password',
                  labelStyle: TextStyle(color: surakshaMuted),
                ),
              ),
              const SizedBox(height: S.lg),
              OriginButton(
                onPressed: _setPassword,
                loading: _loading,
                enabled: !_loading,
                child: const Text('Save password'),
              ),
            ] else ...[
              const Icon(
                Icons.check_circle,
                color: Colors.greenAccent,
                size: 56,
              ),
              const SizedBox(height: S.md),
              Text(
                _needsPassword
                    ? 'Your password was updated. Sign in with your email and new password.'
                    : 'Your guardian account is active. Sign in to continue.',
                style: SurakshaTypography.dashSubtitle,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: S.lg),
              OriginButton(
                onPressed: () => context.go(AppRoutes.login),
                child: const Text('Go to sign in'),
              ),
            ],
            const SizedBox(height: S.xl),
            TextButton(
              onPressed: () => context.go(AppRoutes.login),
              child: const Text('Back to sign in'),
            ),
          ],
        ),
      ),
    );
  }
}
