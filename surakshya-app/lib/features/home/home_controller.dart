library home_controller;

import 'package:flutter_riverpod/flutter_riverpod.dart';

class HomeScrollNotifier extends StateNotifier<double> {
  HomeScrollNotifier() : super(0);

  void update(double offset) => state = offset;
}

final homeScrollNotifierProvider =
    StateNotifierProvider<HomeScrollNotifier, double>(
  (ref) => HomeScrollNotifier(),
);

final heroChapterIndexProvider = StateProvider<int>((ref) => 0);
