library guardian_setup_screen;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/origin_button.dart';

/// Guardian invite activation: email → OTP → set password → success.
/// Mirrors web `/guardian/setup` against public `/guardian/*` endpoints.
class GuardianSetupScreen extends ConsumerStatefulWidget {
  const GuardianSetupScreen({super.key, this.initialEmail});

  final String? initialEmail;

  @override
  ConsumerState<GuardianSetupScreen> createState() =>
      _GuardianSetupScreenState();
}

class _GuardianSetupScreenState extends ConsumerState<GuardianSetupScreen> {
  static const _minPasswordLength = 8;
  static const _otpCooldownSeconds = 30;

  int _step = 1;
  late final TextEditingController _emailController;
  final _otpController = TextEditingController();
  final _oldPasswordController = TextEditingController();
  final _newPasswordController = TextEditingController();
  final _confirmPasswordController = TextEditingController();

  bool _loading = false;
  String? _error;
  int _cooldown = 0;

  @override
  void initState() {
    super.initState();
    _emailController = TextEditingController(text: widget.initialEmail ?? '');
  }

  @override
  void dispose() {
    _emailController.dispose();
    _otpController.dispose();
    _oldPasswordController.dispose();
    _newPasswordController.dispose();
    _confirmPasswordController.dispose();
    super.dispose();
  }

  Future<void> _sendOtp() async {
    final email = _emailController.text.trim().toLowerCase();
    if (!_isValidEmail(email)) {
      setState(() => _error = 'Enter a valid email address.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(surakshyaApiServiceProvider).guardianSendOtp(email);
      if (!mounted) return;
      setState(() {
        _step = 2;
        _cooldown = _otpCooldownSeconds;
        _loading = false;
      });
      _tickCooldown();
    } on SurakshyaApiException catch (e) {
      if (!mounted) return;
      setState(() {
        _error = e.message;
        _loading = false;
      });
    } catch (_) {
      if (!mounted) return;
      setState(() {
        _error = 'Failed to send OTP';
        _loading = false;
      });
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
      setState(() => _error = 'Enter the 6-digit code from your SMS.');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      await ref.read(surakshyaApiServiceProvider).guardianVerifyOtp(
            email: _emailController.text.trim().toLowerCase(),
            otp: otp,
          );
      if (!mounted) return;
      setState(() {
        _step = 3;
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
    final oldPassword = _oldPasswordController.text;
    final newPassword = _newPasswordController.text;
    final confirm = _confirmPasswordController.text;
    if (oldPassword.trim().isEmpty) {
      setState(
        () => _error = 'Enter the temporary password from your invitation.',
      );
      return;
    }
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
      await ref.read(surakshyaApiServiceProvider).guardianSetPassword(
            email: _emailController.text.trim().toLowerCase(),
            oldPassword: oldPassword,
            newPassword: newPassword,
          );
      if (!mounted) return;
      setState(() {
        _step = 4;
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
        _error = 'Failed to set password';
        _loading = false;
      });
    }
  }

  bool _isValidEmail(String value) =>
      RegExp(r'^[^\s@]+@[^\s@]+\.[^\s@]+$').hasMatch(value);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: surakshaBlack,
      appBar: AppBar(
        backgroundColor: surakshaBlack,
        elevation: 0,
        title: Text('Guardian setup', style: SurakshaTypography.dashGreeting),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(S.lg),
          children: [
            Text(
              'Step $_step of 4',
              style: SurakshaTypography.monoLabel,
            ),
            const SizedBox(height: S.md),
            if (_error != null) ...[
              Text(_error!, style: SurakshaTypography.bodyMedium.copyWith(
                color: surakshaCrimson,
              )),
              const SizedBox(height: S.md),
            ],
            if (_step == 1) ...[
              Text(
                'Enter the email from your invitation.',
                style: SurakshaTypography.dashSubtitle,
              ),
              const SizedBox(height: S.md),
              TextField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                style: SurakshaTypography.bodyLarge,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  labelStyle: TextStyle(color: surakshaMuted),
                ),
              ),
              const SizedBox(height: S.lg),
              OriginButton(
                onPressed: _sendOtp,
                loading: _loading,
                enabled: !_loading,
                child: const Text('Send OTP'),
              ),
            ] else if (_step == 2) ...[
              Text(
                'Enter the 6-digit code sent to your phone.',
                style: SurakshaTypography.dashSubtitle,
              ),
              const SizedBox(height: S.md),
              TextField(
                controller: _otpController,
                keyboardType: TextInputType.number,
                maxLength: 6,
                style: SurakshaTypography.bodyLarge,
                decoration: const InputDecoration(
                  labelText: 'OTP',
                  labelStyle: TextStyle(color: surakshaMuted),
                  counterText: '',
                ),
              ),
              const SizedBox(height: S.lg),
              OriginButton(
                onPressed: _verifyOtp,
                loading: _loading,
                enabled: !_loading,
                child: const Text('Verify OTP'),
              ),
              TextButton(
                onPressed: (_loading || _cooldown > 0) ? null : _sendOtp,
                child: Text(
                  _cooldown > 0 ? 'Resend in ${_cooldown}s' : 'Resend OTP',
                ),
              ),
            ] else if (_step == 3) ...[
              Text(
                'Set a new password using your temporary invite password.',
                style: SurakshaTypography.dashSubtitle,
              ),
              const SizedBox(height: S.md),
              TextField(
                controller: _oldPasswordController,
                obscureText: true,
                style: SurakshaTypography.bodyLarge,
                decoration: const InputDecoration(
                  labelText: 'Temporary password',
                  labelStyle: TextStyle(color: surakshaMuted),
                ),
              ),
              const SizedBox(height: S.sm),
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
              const Icon(Icons.check_circle, color: Colors.greenAccent, size: 56),
              const SizedBox(height: S.md),
              Text(
                'Your guardian account is ready. Sign in to continue.',
                style: SurakshaTypography.dashSubtitle,
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: S.lg),
              OriginButton(
                onPressed: () => context.go(AppRoutes.login),
                child: const Text('Go to login'),
              ),
            ],
            const SizedBox(height: S.xl),
            TextButton(
              onPressed: () => context.go(AppRoutes.login),
              child: const Text('Back to login'),
            ),
          ],
        ),
      ),
    );
  }
}
