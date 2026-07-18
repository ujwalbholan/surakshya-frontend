library family_member_tile;

import 'package:flutter/material.dart';
import 'package:suraksha/models/contact_model.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:url_launcher/url_launcher.dart';

/// Vertical gap between stacked guardian cards.
const double kGuardianGridGap = S.sm + 4;

const double kGuardianAvatarRadius = 28.0;

const double kGuardianAvatarInitialsSize = 15.0;
const FontWeight kGuardianAvatarInitialsWeight = FontWeight.w600;

/// Pill-like card corner radius per reference design.
const double kGuardianCardRadius = 28.0;

const double kGuardianCardPadding = 18.0;

/// Diameter of the circular call button.
const double kGuardianActionButtonSize = 48.0;

const double kGuardianActionIconSize = 20.0;

/// Card palette: #F5F6F7 container, #212529 "black" text, #FFFFFF white
/// accents (call button).
const Color kGuardianCardColor = Color(0xFFF5F6F7);
const Color kGuardianCardBorder = Color(0xFFE3E5E8);
const Color kGuardianCardText = Color(0xFF212529);
const Color kGuardianCardTextMuted = Color(0xFF6C757D);

/// Circular button chrome — pure white against the #F5F6F7 card.
const Color kGuardianActionButtonColor = Color(0xFFFFFFFF);

const List<BoxShadow> kGuardianCardShadow = [
  BoxShadow(
    color: Color(0x40000000),
    blurRadius: 12,
    offset: Offset(0, 4),
  ),
];

/// Contact card per reference: avatar + name/number in the top row and a
/// call button in the bottom-right corner.
class FamilyMemberTile extends StatelessWidget {
  const FamilyMemberTile({super.key, required this.member});

  final ContactModel member;

  /// Guardian photo when one was added; supports remote URLs and bundled
  /// assets. Null falls back to first-name + surname initials.
  ImageProvider? get _avatarImage {
    final path = member.avatarPath;
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return NetworkImage(path);
    }
    return AssetImage(path);
  }

  Future<void> _launch(BuildContext context, Uri uri) async {
    final messenger = ScaffoldMessenger.of(context);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      messenger.showSnackBar(
        SnackBar(content: Text('Could not open ${uri.scheme} app')),
      );
    }
  }

  @override
  Widget build(BuildContext context) => Container(
        padding: const EdgeInsets.all(kGuardianCardPadding),
        decoration: BoxDecoration(
          color: kGuardianCardColor,
          borderRadius: BorderRadius.circular(kGuardianCardRadius),
          border: Border.all(
            color: member.isEmergency ? surakshyaCrimson : kGuardianCardBorder,
          ),
          boxShadow: kGuardianCardShadow,
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Row(
              // Pin the call button to the card's top-right corner.
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: kGuardianAvatarRadius,
                  backgroundColor: surakshaCrimsonCard,
                  backgroundImage: _avatarImage,
                  child: _avatarImage == null
                      ? Text(
                          member.initials,
                          style: SurakshaTypography.dashTitle.copyWith(
                            fontSize: kGuardianAvatarInitialsSize,
                            fontWeight: kGuardianAvatarInitialsWeight,
                            color: surakshyaCrimson,
                          ),
                        )
                      : null,
                ),
                const SizedBox(width: S.md),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          Flexible(
                            child: Text(
                              member.name,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: SurakshaTypography.dashTitle.copyWith(
                                fontSize: 18,
                                color: kGuardianCardText,
                              ),
                            ),
                          ),
                          if (member.role.isNotEmpty) ...[
                            const SizedBox(width: S.sm),
                            Text(
                              member.role,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: SurakshaTypography.monoLabel.copyWith(
                                color: surakshyaCrimson,
                                fontSize: 11,
                              ),
                            ),
                          ],
                        ],
                      ),
                      const SizedBox(height: S.xs),
                      Text(
                        member.phone,
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                        style: SurakshaTypography.monoStat.copyWith(
                          fontSize: 12,
                          color: kGuardianCardTextMuted,
                        ),
                      ),
                    ],
                  ),
                ),
                const SizedBox(width: S.sm),
                _CircleActionButton(
                  icon: Icons.phone_outlined,
                  semanticLabel: 'Call ${member.name}',
                  onTap: () =>
                      _launch(context, Uri(scheme: 'tel', path: member.phone)),
                ),
              ],
            ),
          ],
        ),
      );
}

class _CircleActionButton extends StatelessWidget {
  const _CircleActionButton({
    required this.icon,
    required this.semanticLabel,
    this.onTap,
  });

  final IconData icon;
  final String semanticLabel;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) => Semantics(
        button: true,
        label: semanticLabel,
        child: Material(
          color: kGuardianActionButtonColor,
          shape: const CircleBorder(
            side: BorderSide(color: kGuardianCardBorder),
          ),
          clipBehavior: Clip.antiAlias,
          child: InkWell(
            onTap: onTap,
            child: SizedBox(
              width: kGuardianActionButtonSize,
              height: kGuardianActionButtonSize,
              child: Icon(
                icon,
                size: kGuardianActionIconSize,
                color: kGuardianCardText,
              ),
            ),
          ),
        ),
      );
}
