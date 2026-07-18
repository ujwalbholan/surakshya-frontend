library notched_sos_bottom_nav;

import 'package:flutter/material.dart';
import 'package:suraksha/core/constants/copy_constants.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/app_svg_icon.dart';

/// Nav item glyph size (matches the previous Material icon size).
const double kNavIconSize = 24;

/// Width of the SOS wordmark glyph inside the crimson circle.
const double kSosNavGlyphWidth = 24;

/// Hit target / layout slot for the SOS button.
const double kSosNavButtonSlot = 72;

/// Diameter of the solid crimson SOS circle — nearly fills its slot so it
/// reads as anchored in the bar rather than floating in empty space.
const double kSosNavCircleSize = 68;

/// Extra diameter the pulse ring adds at its widest (kept inside the slot).
const double kSosNavPulseGrowth = 4;

/// Soft glow around the SOS circle (tight, per reference).
const double kSosNavGlowBlur = 10;
const double kSosNavGlowAlpha = 0.4;

/// Gap between the SOS circle and the notch edge cut into the bar.
const double kSosNotchMargin = 6;

/// Radius of the concave notch carved out of the bar's top edge.
const double kSosNotchRadius = kSosNavCircleSize / 2 + kSosNotchMargin;

/// How far the SOS button rises above the bar (its center sits on the
/// bar's top edge, docked-FAB style per the reference).
const double kSosNotchProtrusion = kSosNavButtonSlot / 2;

/// Rounded top corners of the notched bar.
const double kNavBarCornerRadius = 24;

/// Hairline outline weight for the notched bar.
const double kNavBarBorderWidth = 0.5;

/// Shared bottom nav chrome: Home / Profile items on a notched black bar
/// with the crimson SOS button docked in the top-center notch. Used by both
/// the user dashboard and the guardian (parent) dashboard.
class NotchedSosBottomNav extends StatelessWidget {
  const NotchedSosBottomNav({
    super.key,
    required this.homeActive,
    required this.profileActive,
    required this.onHomeTap,
    required this.onSosTap,
    required this.onProfileTap,
    this.sosPulseFast = false,
  });

  final bool homeActive;
  final bool profileActive;
  final VoidCallback onHomeTap;
  final VoidCallback onSosTap;
  final VoidCallback onProfileTap;

  /// Speeds up the SOS button pulse (signals an SOS is active).
  final bool sosPulseFast;

  @override
  Widget build(BuildContext context) {
    // The bar stays black in every state; the SOS button's faster pulse is
    // the only nav signal that an SOS is active.
    const navColor = surakshaNavBg;

    // Docked-FAB composition: the bar is drawn with a concave notch carved
    // out of its top edge, and the SOS circle rises out of that notch.
    return SizedBox(
      height: S.bottomNavHeight + kSosNotchProtrusion,
      child: Stack(
        clipBehavior: Clip.none,
        children: [
          Positioned(
            left: 0,
            right: 0,
            bottom: 0,
            height: S.bottomNavHeight,
            child: CustomPaint(
              painter: const _NotchedBarPainter(color: navColor),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceAround,
                children: [
                  _NavItem(
                    asset: AppIcons.home,
                    label: CopyConstants.home,
                    active: homeActive,
                    onTap: onHomeTap,
                  ),
                  // Keeps Home/Profile clear of the notch.
                  const SizedBox(width: kSosNavButtonSlot),
                  _NavItem(
                    asset: AppIcons.profile,
                    label: CopyConstants.profile,
                    active: profileActive,
                    onTap: onProfileTap,
                  ),
                ],
              ),
            ),
          ),
          Positioned(
            top: 0,
            left: 0,
            right: 0,
            child: Center(
              child: _SosNavButton(
                pulseFast: sosPulseFast,
                onTap: onSosTap,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Paints the nav bar surface: rounded top corners with a semicircular
/// notch cut out of the top-center edge, hugging the docked SOS button.
class _NotchedBarPainter extends CustomPainter {
  const _NotchedBarPainter({required this.color});

  final Color color;

  @override
  void paint(Canvas canvas, Size size) {
    final bar = Path()
      ..addRRect(
        RRect.fromRectAndCorners(
          Offset.zero & size,
          topLeft: const Radius.circular(kNavBarCornerRadius),
          topRight: const Radius.circular(kNavBarCornerRadius),
        ),
      );
    final notch = Path()
      ..addOval(
        Rect.fromCircle(
          center: Offset(size.width / 2, 0),
          radius: kSosNotchRadius,
        ),
      );
    final shape = Path.combine(PathOperation.difference, bar, notch);

    canvas.drawPath(shape, Paint()..color = color);
    canvas.drawPath(
      shape,
      Paint()
        ..style = PaintingStyle.stroke
        ..strokeWidth = kNavBarBorderWidth
        ..color = dashboardBorder,
    );
  }

  @override
  bool shouldRepaint(_NotchedBarPainter oldDelegate) =>
      oldDelegate.color != color;
}

class _NavItem extends StatelessWidget {
  const _NavItem({
    required this.asset,
    required this.label,
    required this.active,
    required this.onTap,
  });

  final String asset;
  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) => GestureDetector(
        onTap: onTap,
        behavior: HitTestBehavior.opaque,
        child: SizedBox(
          width: 80,
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              AppSvgIcon(
                asset,
                color: active ? surakshaForeground : surakshaMuted,
                size: kNavIconSize,
                semanticLabel: label,
              ),
              const SizedBox(height: 4),
              Text(
                label,
                style: SurakshaTypography.monoLabel.copyWith(
                  color: active ? surakshaForeground : surakshaMuted,
                  fontSize: 10,
                ),
              ),
            ],
          ),
        ),
      );
}

class _SosNavButton extends StatefulWidget {
  const _SosNavButton({
    required this.onTap,
    this.pulseFast = false,
  });

  final VoidCallback onTap;
  final bool pulseFast;

  @override
  State<_SosNavButton> createState() => _SosNavButtonState();
}

class _SosNavButtonState extends State<_SosNavButton>
    with SingleTickerProviderStateMixin {
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _pulse = AnimationController(
      vsync: this,
      duration: const Duration(seconds: 2),
    )..repeat();
  }

  @override
  void didUpdateWidget(_SosNavButton oldWidget) {
    super.didUpdateWidget(oldWidget);
    _pulse.duration = widget.pulseFast
        ? const Duration(milliseconds: 800)
        : const Duration(seconds: 2);
  }

  @override
  void dispose() {
    _pulse.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Semantics(
        label: 'SOS emergency button',
        button: true,
        child: GestureDetector(
          onTap: widget.onTap,
          child: SizedBox(
            width: kSosNavButtonSlot,
            height: kSosNavButtonSlot,
            child: Stack(
              alignment: Alignment.center,
              children: [
                AnimatedBuilder(
                  animation: _pulse,
                  builder: (_, __) => Container(
                    width:
                        kSosNavCircleSize + _pulse.value * kSosNavPulseGrowth,
                    height:
                        kSosNavCircleSize + _pulse.value * kSosNavPulseGrowth,
                    decoration: const BoxDecoration(
                      shape: BoxShape.circle,
                      color: surakshaCrimsonRing,
                    ),
                  ),
                ),
                Container(
                  width: kSosNavCircleSize,
                  height: kSosNavCircleSize,
                  decoration: BoxDecoration(
                    shape: BoxShape.circle,
                    color: surakshaCrimson,
                    boxShadow: [
                      BoxShadow(
                        color: surakshaCrimson.withValues(
                          alpha: kSosNavGlowAlpha,
                        ),
                        blurRadius: kSosNavGlowBlur,
                      ),
                    ],
                  ),
                  child: const Center(
                    child: AppSvgIcon(
                      AppIcons.sos,
                      size: kSosNavGlyphWidth,
                      color: surakshaForeground,
                      semanticLabel: CopyConstants.sos,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      );
}
