library edit_guardian_phone_sheet;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/features/guardians/guardian_provider.dart';
import 'package:suraksha/models/guardian_models.dart';
import 'package:suraksha/services/surakshya_api_service.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

/// Nepal mobile: optional +977, then 9[678]XXXXXXXX.
final _nepalMobilePattern = RegExp(r'^(\+977)?9[678]\d{8}$');

String normalizeNepalMobileInput(String raw) {
  var phone = raw.trim().replaceAll(RegExp(r'[\s-]'), '');
  if (phone.startsWith('+977')) {
    phone = phone.substring(4);
  } else if (phone.startsWith('977') && phone.length >= 12) {
    phone = phone.substring(3);
  }
  return phone;
}

bool isValidNepalMobile(String raw) {
  final phone = normalizeNepalMobileInput(raw);
  return _nepalMobilePattern.hasMatch(phone);
}

/// Opens a modal sheet to edit [guardian]'s phone. Returns true if saved.
Future<bool> showEditGuardianPhoneSheet({
  required BuildContext context,
  required WidgetRef ref,
  required LinkedGuardian guardian,
}) async {
  final saved = await showModalBottomSheet<bool>(
    context: context,
    isScrollControlled: true,
    backgroundColor: dashboardSheetBg,
    shape: const RoundedRectangleBorder(
      borderRadius: BorderRadius.vertical(top: Radius.circular(S.radiusXl)),
    ),
    builder: (ctx) => _EditGuardianPhoneSheet(
      guardian: guardian,
      onSubmit: (phone) => ref
          .read(guardianLinkingProvider.notifier)
          .updateGuardianPhone(guardianId: guardian.id, phone: phone),
    ),
  );

  if (saved == true && context.mounted) {
    final message = guardian.isEmergencyContact
        ? CopyConstants.editGuardianPhoneSynced
        : CopyConstants.editGuardianPhoneSuccess;
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
  }
  return saved == true;
}

class _EditGuardianPhoneSheet extends StatefulWidget {
  const _EditGuardianPhoneSheet({
    required this.guardian,
    required this.onSubmit,
  });

  final LinkedGuardian guardian;
  final Future<String> Function(String phone) onSubmit;

  @override
  State<_EditGuardianPhoneSheet> createState() =>
      _EditGuardianPhoneSheetState();
}

class _EditGuardianPhoneSheetState extends State<_EditGuardianPhoneSheet> {
  late final TextEditingController _phoneController;
  final _formKey = GlobalKey<FormState>();
  bool _saving = false;
  String? _error;

  @override
  void initState() {
    super.initState();
    _phoneController = TextEditingController(
      text: normalizeNepalMobileInput(widget.guardian.phone),
    );
  }

  @override
  void dispose() {
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _save() async {
    setState(() => _error = null);
    if (!(_formKey.currentState?.validate() ?? false)) return;

    final phone = normalizeNepalMobileInput(_phoneController.text);
    if (phone == normalizeNepalMobileInput(widget.guardian.phone)) {
      Navigator.pop(context, false);
      return;
    }

    setState(() => _saving = true);
    try {
      await widget.onSubmit(phone);
      if (mounted) Navigator.pop(context, true);
    } on SurakshyaApiException catch (e) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = e.message;
        });
      }
    } catch (_) {
      if (mounted) {
        setState(() {
          _saving = false;
          _error = 'Could not update phone number';
        });
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: S.lg,
        right: S.lg,
        top: S.lg,
        bottom: MediaQuery.viewInsetsOf(context).bottom + S.lg,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Center(
              child: Container(
                width: 40,
                height: 4,
                margin: const EdgeInsets.only(bottom: S.md),
                decoration: BoxDecoration(
                  color: dashboardBorder,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Text(
              CopyConstants.editGuardianPhoneTitle,
              style: SurakshaTypography.dashTitle,
            ),
            const SizedBox(height: S.xs),
            Text(
              widget.guardian.fullName,
              style: SurakshaTypography.monoLabel.copyWith(
                color: surakshaForeground,
              ),
            ),
            const SizedBox(height: S.sm),
            Text(
              CopyConstants.editGuardianPhoneSubtitle,
              style: SurakshaTypography.monoLabel,
            ),
            const SizedBox(height: S.lg),
            TextFormField(
              controller: _phoneController,
              enabled: !_saving,
              autofocus: true,
              keyboardType: TextInputType.phone,
              textInputAction: TextInputAction.done,
              inputFormatters: [
                FilteringTextInputFormatter.allow(RegExp(r'[0-9+]')),
                LengthLimitingTextInputFormatter(14),
              ],
              decoration: const InputDecoration(
                labelText: CopyConstants.editGuardianPhoneLabel,
                hintText: CopyConstants.editGuardianPhoneHint,
                prefixIcon: Icon(Icons.phone_outlined),
              ),
              validator: (value) {
                if (value == null || !isValidNepalMobile(value)) {
                  return CopyConstants.editGuardianPhoneInvalid;
                }
                return null;
              },
              onFieldSubmitted: (_) {
                if (!_saving) _save();
              },
            ),
            if (_error != null) ...[
              const SizedBox(height: S.sm),
              Text(
                _error!,
                style: const TextStyle(color: surakshaCrimson, fontSize: 13),
              ),
            ],
            const SizedBox(height: S.lg),
            Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: _saving ? null : () => Navigator.pop(context, false),
                    child: const Text('Cancel'),
                  ),
                ),
                const SizedBox(width: S.md),
                Expanded(
                  child: FilledButton(
                    style: FilledButton.styleFrom(
                      backgroundColor: surakshaCrimson,
                    ),
                    onPressed: _saving ? null : _save,
                    child: _saving
                        ? const SizedBox(
                            width: 20,
                            height: 20,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: Colors.white,
                            ),
                          )
                        : const Text(CopyConstants.editGuardianPhoneSave),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
