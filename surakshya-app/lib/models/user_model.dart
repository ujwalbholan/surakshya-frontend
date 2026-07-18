library user_model;

class UserModel {
  const UserModel({
    this.id,
    required this.name,
    required this.email,
    this.phone,
    this.avatarPath,
    this.bloodType,
    this.age,
    this.role = 'USER',
  });

  final String? id;
  final String name;
  final String email;
  final String? phone;
  final String? avatarPath;
  final String? bloodType;
  final int? age;
  final String role;

  UserModel copyWith({
    String? id,
    String? name,
    String? email,
    String? phone,
    String? avatarPath,
    String? bloodType,
    int? age,
    String? role,
  }) =>
      UserModel(
        id: id ?? this.id,
        name: name ?? this.name,
        email: email ?? this.email,
        phone: phone ?? this.phone,
        avatarPath: avatarPath ?? this.avatarPath,
        bloodType: bloodType ?? this.bloodType,
        age: age ?? this.age,
        role: role ?? this.role,
      );

  Map<String, dynamic> toMap() => {
        'id': id,
        'name': name,
        'email': email,
        'phone': phone,
        'avatarPath': avatarPath,
        'bloodType': bloodType,
        'age': age,
        'role': role,
      };

  factory UserModel.fromMap(Map<String, dynamic> map) => UserModel(
        id: map['id'] as String?,
        name: map['name'] as String,
        email: map['email'] as String,
        phone: map['phone'] as String?,
        avatarPath: map['avatarPath'] as String?,
        bloodType: map['bloodType'] as String?,
        age: map['age'] as int?,
        role: map['role'] as String? ?? 'USER',
      );

  factory UserModel.fromSurakshyaJson(Map<String, dynamic> json) => UserModel(
        id: json['id'] as String?,
        name: json['full_name'] as String? ?? json['name'] as String? ?? 'User',
        email: json['email'] as String,
        phone: json['phone'] as String?,
        bloodType: json['blood_type'] as String?,
        age: (json['age'] as num?)?.toInt(),
        avatarPath: 'assets/images/avatars/avatar_profile.png',
        role: json['role'] as String? ?? 'USER',
      );
}
