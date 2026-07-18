library parent_models;

class LinkedWard {
  const LinkedWard({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
  });

  final String id;
  final String fullName;
  final String email;
  final String phone;

  factory LinkedWard.fromJson(Map<String, dynamic> json) => LinkedWard(
        id: json['id'] as String,
        fullName: json['full_name'] as String,
        email: json['email'] as String,
        phone: json['phone'] as String,
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

class GuardianPendingRequest {
  const GuardianPendingRequest({
    required this.id,
    required this.requesterName,
    required this.createdAt,
  });

  final String id;
  final String requesterName;
  final DateTime? createdAt;

  factory GuardianPendingRequest.fromJson(Map<String, dynamic> json) =>
      GuardianPendingRequest(
        id: json['id'] as String,
        requesterName: json['requester_name'] as String? ?? '',
        createdAt: json['created_at'] != null
            ? DateTime.tryParse(json['created_at'] as String)
            : null,
      );
}

class WardLastLocation {
  const WardLastLocation({
    required this.latitude,
    required this.longitude,
    required this.recordedAt,
  });

  final double latitude;
  final double longitude;
  final DateTime? recordedAt;

  factory WardLastLocation.fromJson(Map<String, dynamic> json) =>
      WardLastLocation(
        latitude: (json['latitude'] as num).toDouble(),
        longitude: (json['longitude'] as num).toDouble(),
        recordedAt: json['recordedAt'] != null
            ? DateTime.tryParse(json['recordedAt'] as String)
            : null,
      );
}

class WardSosEvent {
  const WardSosEvent({
    required this.id,
    required this.imei,
    required this.status,
    required this.startedAt,
    this.latitude,
    this.longitude,
    this.lastLocation,
  });

  final String id;
  final String imei;
  final String status;
  final DateTime? startedAt;
  final double? latitude;
  final double? longitude;
  final WardLastLocation? lastLocation;

  factory WardSosEvent.fromJson(Map<String, dynamic> json) => WardSosEvent(
        id: json['id'] as String,
        imei: json['imei'] as String,
        status: json['status'] as String,
        startedAt: json['startedAt'] != null
            ? DateTime.tryParse(json['startedAt'] as String)
            : null,
        latitude: json['latitude'] != null
            ? (json['latitude'] as num).toDouble()
            : null,
        longitude: json['longitude'] != null
            ? (json['longitude'] as num).toDouble()
            : null,
        lastLocation: json['lastLocation'] is Map<String, dynamic>
            ? WardLastLocation.fromJson(
                json['lastLocation'] as Map<String, dynamic>,
              )
            : null,
      );

  bool get isActive => status.toUpperCase() == 'ACTIVE';
}
