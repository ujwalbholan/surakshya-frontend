library guardians_card_list;

import 'package:flutter/material.dart';
import 'package:suraksha/features/dashboard/tracking/widgets/family_member_tile.dart';
import 'package:suraksha/models/contact_model.dart';

/// Full-width stacked guardian cards (reference design) with a staggered
/// fade/slide entrance.
class GuardiansCardList extends StatefulWidget {
  const GuardiansCardList({
    super.key,
    required this.members,
    this.staggerDelay = const Duration(milliseconds: 60),
  });

  final List<ContactModel> members;
  final Duration staggerDelay;

  @override
  State<GuardiansCardList> createState() => _GuardiansCardListState();
}

class _GuardiansCardListState extends State<GuardiansCardList>
    with SingleTickerProviderStateMixin {
  late final AnimationController _controller;

  Duration get _totalDuration => Duration(
        milliseconds:
            widget.staggerDelay.inMilliseconds * widget.members.length + 400,
      );

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(vsync: this, duration: _totalDuration)
      ..forward();
  }

  @override
  void didUpdateWidget(GuardiansCardList oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.members.length != widget.members.length) {
      _controller
        ..duration = _totalDuration
        ..forward(from: 0);
    }
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
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

  @override
  Widget build(BuildContext context) {
    if (widget.members.isEmpty) {
      return const SizedBox.shrink();
    }

    return AnimatedBuilder(
      animation: _controller,
      builder: (context, _) => Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          for (var i = 0; i < widget.members.length; i++)
            _animatedTile(i, widget.members[i]),
        ],
      ),
    );
  }
}
