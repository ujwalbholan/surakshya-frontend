library guardian_models;

class LinkedGuardian {
  const LinkedGuardian({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
    required this.role,
    this.isEmergencyContact = false,
  });

  final String id;
  final String fullName;
  final String email;
  final String phone;
  final String role;
  final bool isEmergencyContact;

  factory LinkedGuardian.fromJson(Map<String, dynamic> json) => LinkedGuardian(
        id: json['id'] as String,
        fullName: json['full_name'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String,
        role: json['role'] as String? ?? 'GUARDIAN',
        isEmergencyContact: json['is_emergency_contact'] == true,
      );

  LinkedGuardian copyWith({
    String? phone,
    bool? isEmergencyContact,
  }) =>
      LinkedGuardian(
        id: id,
        fullName: fullName,
        email: email,
        phone: phone ?? this.phone,
        role: role,
        isEmergencyContact: isEmergencyContact ?? this.isEmergencyContact,
      );

  String get initials {
    final parts = fullName.trim().split(RegExp(r'\s+'));
    if (parts.isEmpty) return '?';
    if (parts.length == 1) {
      return parts.first.substring(0, 1).toUpperCase();
    }
    return '${parts.first[0]}${parts.last[0]}'.toUpperCase();
  }
}

class ChildPendingRequest {
  const ChildPendingRequest({
    required this.id,
    required this.targetName,
    required this.targetEmail,
    required this.direction,
    required this.status,
    required this.createdAt,
    this.requesterName,
  });

  final String id;
  final String targetName;
  final String targetEmail;
  final String direction;
  final String status;
  final DateTime? createdAt;
  final String? requesterName;

  factory ChildPendingRequest.fromJson(Map<String, dynamic> json) =>
      ChildPendingRequest(
        id: json['id'] as String,
        targetName: json['target_name'] as String? ?? '',
        targetEmail: json['target_email'] as String? ?? '',
        requesterName: json['requester_name'] as String?,
        direction: json['direction'] as String,
        status: json['status'] as String,
        createdAt: json['created_at'] != null
            ? DateTime.tryParse(json['created_at'] as String)
            : null,
      );

  bool get isGuardianInvite => direction == 'GUARDIAN_TO_CHILD';
}
