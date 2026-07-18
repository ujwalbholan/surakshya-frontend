library guardians_masonry_grid;

import 'package:flutter/material.dart';
import 'package:suraksha/features/dashboard/tracking/widgets/family_member_tile.dart';
import 'package:suraksha/models/contact_model.dart';

/// Two-column masonry for guardian cards (no staggered-grid package).
///
/// Places each card into the shorter column so any count (1, 2, 3, …) packs
/// without a broken trailing half-row.
class GuardiansMasonryGrid extends StatefulWidget {
  const GuardiansMasonryGrid({
    super.key,
    required this.members,
    this.staggerDelay = const Duration(milliseconds: 60),
  });

  final List<ContactModel> members;
  final Duration staggerDelay;

  @override
  State<GuardiansMasonryGrid> createState() => _GuardiansMasonryGridState();
}

class _GuardiansMasonryGridState extends State<GuardiansMasonryGrid>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      vsync: this,
      duration: Duration(
        milliseconds:
            widget.staggerDelay.inMilliseconds * widget.members.length + 400,
      ),
    )..forward();
  }

  @override
  void didUpdateWidget(GuardiansMasonryGrid oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.members.length != widget.members.length) {
      _controller
        ..duration = Duration(
          milliseconds:
              widget.staggerDelay.inMilliseconds * widget.members.length + 400,
        )
        ..forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  /// Shortest-column-next using relative column height weights.
  /// Uniform tiles use weight 1; taller content can raise the weight later.
  static (List<int> left, List<int> right) _partition(int count) {
    final left = <int>[];
    final right = <int>[];
    var leftWeight = 0;
    var rightWeight = 0;
    for (var i = 0; i < count; i++) {
      if (leftWeight <= rightWeight) {
        left.add(i);
        leftWeight += 1;
      } else {
        right.add(i);
        rightWeight += 1;
      }
    }
    return (left, right);
  }

  Widget _animatedTile(int index, ContactModel member) {
    final n = widget.members.length;
    final start = n == 0 ? 0.0 : index / n;
    final end = n == 0 ? 1.0 : (index + 1) / n;
    final anim = CurvedAnimation(
      parent: _controller,
      curve: Interval(start, end, curve: Curves.easeOut),
    );
    return FadeTransition(
      opacity: anim,
      child: SlideTransition(
        position: Tween<Offset>(
          begin: const Offset(0, 0.06),
          end: Offset.zero,
        ).animate(anim),
        child: Padding(
          padding: const EdgeInsets.only(bottom: kGuardianGridGap),
          child: FamilyMemberTile(member: member),
        ),
      ),
    );
  }

  Widget _column(List<int> indices) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (final i in indices) _animatedTile(i, widget.members[i]),
        ],
      );

  @override
  Widget build(BuildContext context) {
    if (widget.members.isEmpty) {
      return const SizedBox.shrink();
    }

    final (left, right) = _partition(widget.members.length);

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) => Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Expanded(child: _column(left)),
          const SizedBox(width: kGuardianGridGap),
          Expanded(child: _column(right)),
        ],
      ),
    );
  }
}
