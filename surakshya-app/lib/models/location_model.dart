library location_model;

class LocationModel {
  const LocationModel({
    required this.latitude,
    required this.longitude,
    this.label = '',
    this.updatedAt,
    this.accuracyMeters,
  });

  final double latitude;
  final double longitude;
  final String label;
  final DateTime? updatedAt;
  final double? accuracyMeters;

  LocationModel copyWith({
    double? latitude,
    double? longitude,
    String? label,
    DateTime? updatedAt,
    double? accuracyMeters,
  }) =>
      LocationModel(
        latitude: latitude ?? this.latitude,
        longitude: longitude ?? this.longitude,
        label: label ?? this.label,
        updatedAt: updatedAt ?? this.updatedAt,
        accuracyMeters: accuracyMeters ?? this.accuracyMeters,
      );
}

class PlaceModel {
  const PlaceModel({
    required this.id,
    required this.name,
    required this.location,
    this.type = 'home',
    this.memberCount = 1,
  });

  final String id;
  final String name;
  final LocationModel location;
  final String type;
  final int memberCount;
}
