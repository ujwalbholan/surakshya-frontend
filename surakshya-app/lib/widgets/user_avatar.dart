library user_avatar;

import 'dart:io';

import 'package:flutter/material.dart';
import 'package:suraksha/models/user_model.dart';
import 'package:suraksha/theme/suraksha_colors.dart';

/// Photo-or-initials circular avatar for the signed-in user.
///
/// Single source of truth shared by the Profile hero card and the Tracking
/// app bar: uploaded photo when [UserModel.avatarPath] is set, otherwise
/// email-derived initials on a crimson disc. Decorations (halo, badge) are
/// intentionally left to call sites.
class UserAvatar extends StatelessWidget {
  const UserAvatar({
    super.key,
    required this.user,
    required this.radius,
    required this.initialsStyle,
  });

  final UserModel? user;
  final double radius;
  final TextStyle initialsStyle;

  @override
  Widget build(BuildContext context) => CircleAvatar(
        radius: radius,
        backgroundColor: surakshaCrimson,
        foregroundImage: userAvatarImage(user?.avatarPath),
        child: Text(userInitials(user), style: initialsStyle),
      );
}

/// Uploaded photo if one exists; null keeps the initials fallback visible.
ImageProvider? userAvatarImage(String? path) {
  if (path == null || path.isEmpty) return null;
  return path.startsWith('assets/')
      ? AssetImage(path)
      : FileImage(File(path)) as ImageProvider;
}

/// Initials derived from the user's email (D3-rev); name is the fallback.
String userInitials(UserModel? user) {
  final source = (user?.email.trim().isNotEmpty ?? false)
      ? user!.email.trim()
      : user?.name.trim() ?? '';
  if (source.isEmpty) return 'PS';
  if (source.length == 1) return source.toUpperCase();
  return source.substring(0, 2).toUpperCase();
}
