library edit_profile_screen;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/features/auth/auth_provider.dart';
import 'package:suraksha/features/dashboard/profile/widgets/profile_section_card.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

/// Max length accepted by the backend `PATCH /user/me` name field.
const int kEditProfileNameMaxLength = 100;

/// Minimal edit-profile screen (D5-rev): editable name only; email is the
/// auth identifier and photo has no upload backend yet, so both stay
/// read-only.
class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  late final TextEditingController _nameController;
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(
      text: ref.read(authProvider).user?.name ?? '',
    );
  }

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    final name = _nameController.text.trim();
    if (name.isEmpty || name.length > kEditProfileNameMaxLength) {
      setState(() {
        _error = 'Enter a name (1–$kEditProfileNameMaxLength characters).';
      });
      return;
    }
    setState(() {
      _saving = true;
      _error = null;
    });
    try {
      await ref.read(authProvider.notifier).updateName(name);
      if (mounted) {
        Navigator.pop(context);
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profile updated')),
        );
      }
    } catch (err) {
      setState(() {
        _saving = false;
        _error = err.toString();
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final email = ref.watch(authProvider).user?.email ?? '';

    return Scaffold(
      backgroundColor: dashboardBg,
      appBar: AppBar(
        backgroundColor: dashboardBg,
        foregroundColor: surakshaForeground,
        elevation: 0,
        title: Text('Edit profile', style: SurakshaTypography.dashTitle),
      ),
      body: SafeArea(
        child: ListView(
          padding: const EdgeInsets.all(S.lg),
          children: [
            ProfileSettingsCard(
              child: Padding(
                padding: const EdgeInsets.all(S.lg),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Full name', style: kProfileRowSubtitleStyle),
                    const SizedBox(height: S.xs),
                    TextField(
                      controller: _nameController,
                      enabled: !_saving,
                      maxLength: kEditProfileNameMaxLength,
                      style: kProfileRowTitleStyle,
                      cursorColor: surakshaCrimson,
                      decoration: InputDecoration(
                        counterText: '',
                        hintText: 'Your name',
                        hintStyle: kProfileRowSubtitleStyle,
                        enabledBorder: const UnderlineInputBorder(
                          borderSide:
                              BorderSide(color: surakshaOnLightDivider),
                        ),
                        focusedBorder: const UnderlineInputBorder(
                          borderSide: BorderSide(color: surakshaCrimson),
                        ),
                      ),
                    ),
                    const SizedBox(height: S.lg),
                    Text('Email', style: kProfileRowSubtitleStyle),
                    const SizedBox(height: S.xs),
                    Text(email, style: kProfileRowTitleStyle),
                    const SizedBox(height: S.xs),
                    Text(
                      'Email is your sign-in ID and cannot be changed.',
                      style: kProfileRowSubtitleStyle,
                    ),
                    if (_error != null) ...[
                      const SizedBox(height: S.sm),
                      Text(
                        _error!,
                        style: kProfileRowSubtitleStyle.copyWith(
                          color: surakshaCrimson,
                        ),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: S.lg),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _saving ? null : _save,
                style: FilledButton.styleFrom(
                  backgroundColor: surakshaCrimson,
                  foregroundColor: surakshaForeground,
                ),
                child: Text(_saving ? 'Saving…' : 'Save'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
