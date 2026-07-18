library stagger_list_animator;

import 'package:flutter/material.dart';

class StaggerListAnimator extends StatefulWidget {
  const StaggerListAnimator({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.delay = const Duration(milliseconds: 60),
  });

  final int itemCount;
  final Widget Function(BuildContext context, int index, Animation<double> anim)
      itemBuilder;
  final Duration delay;

  @override
  State<StaggerListAnimator> createState() => _StaggerListAnimatorState();
}

class _StaggerListAnimatorState extends State<StaggerListAnimator>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(
        milliseconds: widget.delay.inMilliseconds * widget.itemCount + 400,
      ),
    )..forward();
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) => AnimatedBuilder(
        animation: _controller,
        builder: (context, _) {
          return Column(
            children: List.generate(widget.itemCount, (i) {
              final start = i / widget.itemCount;
              final end = (i + 1) / widget.itemCount;
              final anim = CurvedAnimation(
                parent: _controller,
                curve: Interval(start, end, curve: Curves.easeOut),
              );
              return widget.itemBuilder(context, i, anim);
            }),
          );
        },
      );
}
