library band_device_status;

class BandDeviceStatus {
  const BandDeviceStatus({
    required this.linked,
    required this.isOnline,
    this.id,
    this.imei,
    this.label,
    this.lastSeenAt,
  });

  final bool linked;
  final bool isOnline;
  final String? id;
  final String? imei;
  final String? label;
  final DateTime? lastSeenAt;

  factory BandDeviceStatus.fromJson(Map<String, dynamic> json) {
    return BandDeviceStatus(
      linked: json['linked'] == true,
      isOnline: json['isOnline'] == true,
      id: json['id'] as String?,
      imei: json['imei'] as String?,
      label: json['label'] as String?,
      lastSeenAt: DateTime.tryParse(json['lastSeenAt'] as String? ?? ''),
    );
  }
}
