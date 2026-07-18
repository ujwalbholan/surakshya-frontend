library hero_section;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:suraksha/core/extensions/context_extensions.dart';
import 'package:suraksha/features/home/home_controller.dart';
import 'package:suraksha/models/chapter_model.dart';
import 'package:suraksha/router/app_routes.dart';
import 'package:suraksha/theme/suraksha_animations.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/theme/suraksha_spacing.dart';
import 'package:suraksha/theme/suraksha_typography.dart';
import 'package:suraksha/widgets/animations/text_reveal_animator.dart';
import 'package:suraksha/widgets/decorators/crimson_accent_line.dart';

class HeroSection extends ConsumerWidget {
  const HeroSection({super.key, required this.height});

  final double height;

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final chapterIndex = ref.watch(heroChapterIndexProvider);
    final chapter = kHeroChapters[chapterIndex];
    final isDesktop = context.isDesktop;

    return SizedBox(
      height: height,
      child: Stack(
        children: [
          Container(
            decoration: const BoxDecoration(
              gradient: RadialGradient(
                center: Alignment(0, -0.2),
                radius: 1.2,
                colors: [
                  surakshaCrimsonGlow,
                  surakshaBlack,
                ],
              ),
            ),
          ),
          Center(
            child: Opacity(
              opacity: 0.2,
              child: Icon(
                Icons.watch_outlined,
                size: isDesktop ? 280 : 180,
                color: surakshaMuted,
              ),
            ),
          ),
          Positioned(
            left: S.lg,
            right: S.lg,
            bottom: S.xl3,
            child: AnimatedSwitcher(
              duration: SurakshaAnimations.pageTurn,
              child: Column(
                key: ValueKey(chapter.index),
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text(chapter.index, style: SurakshaTypography.monoIndicator),
                      const SizedBox(width: 12),
                      Container(width: 24, height: 1, color: surakshaMuted),
                      const SizedBox(width: 12),
                      Text(chapter.label, style: SurakshaTypography.monoIndicator),
                    ],
                  ),
                  const SizedBox(height: S.lg),
                  TextRevealAnimator(
                    text: chapter.headline.replaceAll('\n', ' '),
                    style: SurakshaTypography.heroHeadline(
                      size: isDesktop ? 72 : 44,
                    ),
                    triggered: true,
                  ),
                  const SizedBox(height: S.md),
                  const CrimsonAccentLine(),
                  const SizedBox(height: S.md),
                  SizedBox(
                    width: 380,
                    child: Text(chapter.body, style: SurakshaTypography.bodyLarge),
                  ),
                  if (chapter.showCta) ...[
                    const SizedBox(height: S.xl),
                    ElevatedButton(
                      onPressed: () => context.go(AppRoutes.tracking),
                      child: const Text('Discover Suraksha'),
                    ),
                  ],
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }
}
