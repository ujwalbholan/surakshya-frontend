library sos_contact_orbit;

import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/app_constants.dart';
import 'package:suraksha/features/dashboard/dashboard_provider.dart';
import 'package:suraksha/models/contact_model.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

class SosContactOrbit extends StatefulWidget {
  const SosContactOrbit({
    super.key,
    required this.phase,
    required this.contacts,
    this.dispatchIndex = -1,
  });

  final SosPhase phase;
  final List<ContactModel> contacts;
  final int dispatchIndex;

  @override
  State<SosContactOrbit> createState() => _SosContactOrbitState();
}

class _SosContactOrbitState extends State<SosContactOrbit>
    with TickerProviderStateMixin {
  late final AnimationController _orbit;
  late final AnimationController _float;

  @override
  void initState() {
    super.initState();
    _orbit = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 6),
    )..repeat();
    _float = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 3),
    )..repeat(reverse: true);
  }

  @override
  void dispose() {
    _orbit.dispose();
    _float.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final emergency =
        widget.contacts.where((c) => c.id != 'me').take(3).toList();
    if (emergency.isEmpty) return const SizedBox.shrink();

    return LayoutBuilder(
      builder: (context, constraints) {
        final w = constraints.maxWidth;
        final h = constraints.maxHeight;
        final center = Offset(w / 2, h * 0.55);

        return AnimatedBuilder(
          animation: Listenable.merge([_orbit, _float]),
          builder: (_, __) => Stack(
            clipBehavior: Clip.none,
            children: List.generate(emergency.length, (i) {
              final contact = emergency[i];
              final sent = (widget.phase == SosPhase.dispatching ||
                      widget.phase == SosPhase.active) &&
                  i <= widget.dispatchIndex;

              Offset pos;
              if (widget.phase == SosPhase.counting) {
                final angle =
                    _orbit.value * 2 * math.pi + (i * 2 * math.pi / 3);
                pos = Offset(
                  center.dx +
                      math.cos(angle) * AppConstants.sosOrbitRadiusX,
                  center.dy +
                      math.sin(angle) * AppConstants.sosOrbitRadiusY,
                );
              } else if (widget.phase == SosPhase.dispatching ||
                  widget.phase == SosPhase.active) {
                final angle = -math.pi * 0.75 + (i * math.pi * 0.35);
                pos = Offset(
                  center.dx + math.cos(angle) * 110,
                  center.dy + math.sin(angle) * 55,
                );
              } else {
                final floatY =
                    math.sin(_float.value * math.pi * 2 + i) * 8;
                pos = Offset(
                  w * (0.2 + i * 0.3),
                  h * (0.25 + i * 0.08) + floatY,
                );
              }

              return Positioned(
                left: pos.dx - AppConstants.sosAvatarSize / 2,
                top: pos.dy - AppConstants.sosAvatarSize / 2,
                child: _OrbitAvatar(
                  contact: contact,
                  showCheck: sent,
                ),
              );
            }),
          ),
        );
      },
    );
  }
}

class _OrbitAvatar extends StatelessWidget {
  const _OrbitAvatar({required this.contact, this.showCheck = false});

  final ContactModel contact;
  final bool showCheck;

  @override
  Widget build(BuildContext context) => Stack(
        clipBehavior: Clip.none,
        children: [
          Container(
            width: AppConstants.sosAvatarSize,
            height: AppConstants.sosAvatarSize,
            decoration: BoxDecoration(
              shape: BoxShape.circle,
              border: Border.all(color: surakshaForeground, width: 2),
            ),
            child: ClipOval(
              child: contact.avatarPath != null
                  ? Image.asset(
                      contact.avatarPath!,
                      fit: BoxFit.cover,
                      errorBuilder: (_, __, ___) => _initials(),
                    )
                  : _initials(),
            ),
          ),
          if (showCheck)
            Positioned(
              right: -2,
              bottom: -2,
              child: Container(
                padding: const EdgeInsets.all(2),
                decoration: const BoxDecoration(
                  color: surakshaSuccess,
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  size: 14,
                  color: surakshaForeground,
                ),
              ),
            ),
        ],
      );

  Widget _initials() => ColoredBox(
        color: surakshaSecondary,
        child: Center(
          child: Text(
            contact.initials,
            style: const TextStyle(
              color: surakshaForeground,
              fontWeight: FontWeight.w600,
              fontSize: 14,
            ),
          ),
        ),
      );
}
