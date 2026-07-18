library active_sos_summary;

class ActiveSosSummary {
  const ActiveSosSummary({
    required this.id,
    required this.status,
    required this.startedAt,
    this.latitude,
    this.longitude,
    this.imei,
    this.label,
  });

  final String id;
  final String status;
  final DateTime startedAt;
  final double? latitude;
  final double? longitude;
  final String? imei;
  final String? label;

  bool get isActive => status.toLowerCase() == 'active';

  factory ActiveSosSummary.fromJson(Map<String, dynamic> json) {
    return ActiveSosSummary(
      id: json['id'] as String? ?? '',
      status: json['status'] as String? ?? 'active',
      startedAt: DateTime.tryParse(json['startedAt'] as String? ?? '') ??
          DateTime.now(),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      imei: json['imei'] as String?,
      label: json['label'] as String?,
    );
  }
}
