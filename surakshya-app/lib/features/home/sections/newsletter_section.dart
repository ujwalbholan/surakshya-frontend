library newsletter_section;

import 'package:flutter/material.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/decorators/crimson_accent_line.dart';

class NewsletterSection extends StatefulWidget {
  const NewsletterSection({super.key});

  @override
  State<NewsletterSection> createState() => _NewsletterSectionState();
}

class _NewsletterSectionState extends State<NewsletterSection> {
  final _emailController = TextEditingController();
  bool _privacyAccepted = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  void _submit() {
    if (!_privacyAccepted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please accept the privacy policy')),
      );
      return;
    }
    if (!_emailController.text.contains('@')) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Enter a valid email')),
      );
      return;
    }
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text("You're in!"),
        backgroundColor: surakshaSuccess,
      ),
    );
  }

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(
          horizontal: S.sectionH,
          vertical: S.sectionV,
        ),
        child: Container(
          padding: const EdgeInsets.all(S.xl),
          decoration: BoxDecoration(
            color: surakshaCard,
            borderRadius: BorderRadius.circular(S.radiusXl),
            border: Border.all(color: surakshaBorder),
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Stay Updated', style: SurakshaTypography.sectionLabel),
              const SizedBox(height: S.md),
              const CrimsonAccentLine(),
              const SizedBox(height: S.lg),
              Text(
                'Stay Protected.\nStay Informed.',
                style: SurakshaTypography.sectionHeadline.copyWith(fontSize: 36),
              ),
              const SizedBox(height: S.lg),
              Row(
                children: [
                  Expanded(
                    child: TextField(
                      controller: _emailController,
                      decoration: const InputDecoration(
                        hintText: 'your@email.com',
                      ),
                    ),
                  ),
                  const SizedBox(width: S.md),
                  ElevatedButton(
                    onPressed: _submit,
                    child: const Text('Subscribe'),
                  ),
                ],
              ),
              CheckboxListTile(
                value: _privacyAccepted,
                onChanged: (v) => setState(() => _privacyAccepted = v ?? false),
                title: Text(
                  'I agree to the Privacy Policy',
                  style: SurakshaTypography.bodyMedium,
                ),
                controlAffinity: ListTileControlAffinity.leading,
                activeColor: surakshaCrimson,
              ),
            ],
          ),
        ),
      );
}
