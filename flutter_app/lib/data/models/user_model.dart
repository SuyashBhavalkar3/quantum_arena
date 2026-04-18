class UserModel {
  final int id;
  final String name;
  final String email;
  final bool isEmployer;
  final String? company;
  final String? companyWebsite;
  final String? companyDescription;
  final bool? profileCompleted;
  final String createdAt;

  UserModel({
    required this.id,
    required this.name,
    required this.email,
    required this.isEmployer,
    this.company,
    this.companyWebsite,
    this.companyDescription,
    this.profileCompleted,
    required this.createdAt,
  });

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as int,
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      isEmployer: json['is_employer'] as bool? ?? false,
      company: json['company'] as String?,
      companyWebsite: json['company_website'] as String?,
      companyDescription: json['company_description'] as String?,
      profileCompleted: json['profile_completed'] as bool?,
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'email': email,
        'is_employer': isEmployer,
        'company': company,
        'company_website': companyWebsite,
        'company_description': companyDescription,
        'profile_completed': profileCompleted,
        'created_at': createdAt,
      };

  String get role => isEmployer ? 'hr' : 'candidate';
  String get firstName => name.split(' ').first;
}

class AuthResponse {
  final String accessToken;
  final String tokenType;

  AuthResponse({required this.accessToken, required this.tokenType});

  factory AuthResponse.fromJson(Map<String, dynamic> json) {
    return AuthResponse(
      accessToken: json['access_token'] as String,
      tokenType: json['token_type'] as String? ?? 'bearer',
    );
  }
}

class RegisterRequest {
  final String name;
  final String email;
  final String password;
  final bool isEmployer;
  final String? company;

  RegisterRequest({
    required this.name,
    required this.email,
    required this.password,
    required this.isEmployer,
    this.company,
  });

  Map<String, dynamic> toJson() => {
        'name': name,
        'email': email,
        'password': password,
        'is_employer': isEmployer,
        if (company != null && company!.isNotEmpty) 'company': company,
      };
}

class LoginRequest {
  final String email;
  final String password;

  LoginRequest({required this.email, required this.password});

  Map<String, dynamic> toJson() => {'email': email, 'password': password};
}
