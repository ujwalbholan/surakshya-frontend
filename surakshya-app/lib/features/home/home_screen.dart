library home_screen;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:suraksha/core/extensions/context_extensions.dart';
import 'package:suraksha/core/utils/scroll_controller.dart';
import 'package:suraksha/features/home/home_controller.dart';
import 'package:suraksha/features/home/sections/app_features_section.dart';
import 'package:suraksha/features/home/sections/brand_statement_section.dart';
import 'package:suraksha/features/home/sections/craft_section.dart';
import 'package:suraksha/features/home/sections/hero_section.dart';
import 'package:suraksha/features/home/sections/home_footer.dart';
import 'package:suraksha/features/home/sections/innovation_section.dart';
import 'package:suraksha/features/home/sections/newsletter_section.dart';
import 'package:suraksha/features/home/sections/philosophy_section.dart';
import 'package:suraksha/features/home/sections/perspective_marquee_section.dart';
import 'package:suraksha/features/home/sections/social_wall_section.dart';
import 'package:suraksha/models/chapter_model.dart';
import 'package:suraksha/theme/suraksha_colors.dart';
import 'package:suraksha/widgets/navigation/suraksha_navbar.dart';

class HomeScreen extends ConsumerStatefulWidget {
  const HomeScreen({super.key});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  final _scrollController = ScrollController();

  @override
  void initState() {
    super.initState();
    _scrollController.addListener(_onScroll);
  }

  void _onScroll() {
    final offset = _scrollController.offset;
    ref.read(homeScrollNotifierProvider.notifier).update(offset);
    final viewport = _scrollController.position.viewportDimension;
    if (viewport > 0) {
      final index = (offset / (viewport / 5))
          .floor()
          .clamp(0, kHeroChapters.length - 1);
      ref.read(heroChapterIndexProvider.notifier).state = index;
    }
  }

  @override
  void dispose() {
    _scrollController.removeListener(_onScroll);
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => Scaffold(
        backgroundColor: surakshaBlack,
        body: NotificationListener<ScrollNotification>(
          onNotification: (n) {
            if (n is ScrollUpdateNotification) {
              ref
                  .read(homeScrollNotifierProvider.notifier)
                  .update(n.metrics.pixels);
            }
            return false;
          },
          child: RawScrollbar(
            controller: _scrollController,
            thumbVisibility: true,
            thickness: 6,
            thumbColor: surakshaBorder,
            child: SingleChildScrollView(
              controller: _scrollController,
              physics: const SurakshaScrollPhysics(),
              child: Column(
                children: [
                  const SurakshaNavbar(),
                  HeroSection(height: context.screenHeight),
                  const PhilosophySection(),
                  const CraftSection(),
                  const InnovationSection(),
                  const PerspectiveMarqueeSection(),
                  const AppFeaturesSection(),
                  const SocialWallSection(),
                  const BrandStatementSection(),
                  const NewsletterSection(),
                  const HomeFooter(),
                ],
              ),
            ),
          ),
        ),
      );
}
