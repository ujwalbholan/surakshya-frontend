library sos_countdown_tip_card;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_typography.dart';

/// Bordered tip card shown only during SOS countdown.
class SosCountdownTipCard extends StatelessWidget {
  const SosCountdownTipCard({super.key});

  static const _cardBg = Color(0xFF1E1E1E);
  static const _cardBorder = Color(0xFF2A2A2A);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(
            color: _cardBg,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: _cardBorder),
          ),
          child: Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const Padding(
                padding: EdgeInsets.only(right: 10, top: 1),
                child: Text('💡', style: TextStyle(fontSize: 18)),
              ),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      CopyConstants.sosBackInactiveTitle,
                      style: SurakshaTypography.dashTitle.copyWith(
                        fontSize: 15,
                        fontWeight: FontWeight.w700,
                        letterSpacing: -0.2,
                      ),
                    ),
                    const SizedBox(height: 6),
                    Text(
                      CopyConstants.sosBackInactiveBody,
                      style: SurakshaTypography.bodyMedium.copyWith(
                        fontSize: 13,
                        color: surakshaMuted,
                        height: 1.5,
                      ),
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      );
}
