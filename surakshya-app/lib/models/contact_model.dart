library contact_model;

enum PlaceType { home, work, school, preschool, other }

class ContactModel {
  const ContactModel({
    required this.id,
    required this.name,
    required this.phone,
    this.avatarPath,
    this.isEmergency = false,
    this.isWatching = false,
    this.isOnline = false,
    this.batteryPercent = 100,
    this.placeLabel = '',
    this.placeType = PlaceType.other,
    this.lastSeen = '',
    this.distanceKm = 0,
    this.initials = '',
    this.role = '',
  });

  final String id;
  final String name;
  final String phone;
  final String role;
  final String? avatarPath;
  final bool isEmergency;
  final bool isWatching;
  final bool isOnline;
  final int batteryPercent;
  final String placeLabel;
  final PlaceType placeType;
  final String lastSeen;
  final double distanceKm;
  final String initials;

  String get placeEmoji {
    switch (placeType) {
      case PlaceType.home:
        return '🏠';
      case PlaceType.work:
        return '💼';
      case PlaceType.school:
        return '📚';
      case PlaceType.preschool:
        return '👟';
      case PlaceType.other:
        return '📍';
    }
  }

  ContactModel copyWith({
    String? id,
    String? name,
    String? phone,
    String? avatarPath,
    bool? isEmergency,
    bool? isWatching,
    bool? isOnline,
    int? batteryPercent,
    String? placeLabel,
    PlaceType? placeType,
    String? lastSeen,
    double? distanceKm,
    String? initials,
    String? role,
  }) =>
      ContactModel(
        id: id ?? this.id,
        name: name ?? this.name,
        phone: phone ?? this.phone,
        role: role ?? this.role,
        avatarPath: avatarPath ?? this.avatarPath,
        isEmergency: isEmergency ?? this.isEmergency,
        isWatching: isWatching ?? this.isWatching,
        isOnline: isOnline ?? this.isOnline,
        batteryPercent: batteryPercent ?? this.batteryPercent,
        placeLabel: placeLabel ?? this.placeLabel,
        placeType: placeType ?? this.placeType,
        lastSeen: lastSeen ?? this.lastSeen,
        distanceKm: distanceKm ?? this.distanceKm,
        initials: initials ?? this.initials,
      );
}
