class ProfileStatus {
  final bool profileCompleted;
  final bool? resumeUploaded;
  final bool? hasExperience;
  final bool? hasEducation;
  final bool? hasSkills;

  ProfileStatus({
    required this.profileCompleted,
    this.resumeUploaded,
    this.hasExperience,
    this.hasEducation,
    this.hasSkills,
  });

  factory ProfileStatus.fromJson(Map<String, dynamic> json) {
    return ProfileStatus(
      profileCompleted: json['profile_completed'] as bool? ?? false,
      resumeUploaded: json['resume_uploaded'] as bool?,
      hasExperience: json['has_experience'] as bool?,
      hasEducation: json['has_education'] as bool?,
      hasSkills: json['has_skills'] as bool?,
    );
  }
}

class CandidateProfileData {
  final bool profileCompleted;
  final String? profilePhotoUrl;
  final String? phone;
  final String? linkedinUrl;
  final String? githubUrl;
  final String? bio;
  final List<ProfileExperience> experiences;
  final List<ProfileEducation> education;
  final List<ProfileSkill> skills;
  final List<ProfileProject>? projects;
  final List<ProfileCertification>? certifications;

  CandidateProfileData({
    required this.profileCompleted,
    this.profilePhotoUrl,
    this.phone,
    this.linkedinUrl,
    this.githubUrl,
    this.bio,
    required this.experiences,
    required this.education,
    required this.skills,
    this.projects,
    this.certifications,
  });

  factory CandidateProfileData.fromJson(Map<String, dynamic> json) {
    return CandidateProfileData(
      profileCompleted: json['profile_completed'] as bool? ?? false,
      profilePhotoUrl: json['profile_photo_url'] as String?,
      phone: json['phone'] as String?,
      linkedinUrl: json['linkedin_url'] as String?,
      githubUrl: json['github_url'] as String?,
      bio: json['bio'] as String?,
      experiences: (json['experiences'] as List<dynamic>?)
              ?.map(
                  (e) => ProfileExperience.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      education: (json['education'] as List<dynamic>?)
              ?.map(
                  (e) => ProfileEducation.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      skills: (json['skills'] as List<dynamic>?)
              ?.map((e) => ProfileSkill.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
      projects: (json['projects'] as List<dynamic>?)
          ?.map((e) => ProfileProject.fromJson(e as Map<String, dynamic>))
          .toList(),
      certifications: (json['certifications'] as List<dynamic>?)
          ?.map(
              (e) => ProfileCertification.fromJson(e as Map<String, dynamic>))
          .toList(),
    );
  }
}

class ProfileExperience {
  final String companyName;
  final String jobTitle;
  final String? location;
  final String startDate;
  final String? endDate;
  final bool isCurrent;
  final String? description;

  ProfileExperience({
    required this.companyName,
    required this.jobTitle,
    this.location,
    required this.startDate,
    this.endDate,
    required this.isCurrent,
    this.description,
  });

  factory ProfileExperience.fromJson(Map<String, dynamic> json) {
    return ProfileExperience(
      companyName: json['company_name'] as String? ?? '',
      jobTitle: json['job_title'] as String? ?? '',
      location: json['location'] as String?,
      startDate: json['start_date'] as String? ?? '',
      endDate: json['end_date'] as String?,
      isCurrent: json['is_current'] as bool? ?? false,
      description: json['description'] as String?,
    );
  }
}

class ProfileEducation {
  final String institution;
  final String degree;
  final String? fieldOfStudy;
  final String startDate;
  final String? endDate;
  final String? grade;

  ProfileEducation({
    required this.institution,
    required this.degree,
    this.fieldOfStudy,
    required this.startDate,
    this.endDate,
    this.grade,
  });

  factory ProfileEducation.fromJson(Map<String, dynamic> json) {
    return ProfileEducation(
      institution: json['institution'] as String? ?? '',
      degree: json['degree'] as String? ?? '',
      fieldOfStudy: json['field_of_study'] as String?,
      startDate: json['start_date'] as String? ?? '',
      endDate: json['end_date'] as String?,
      grade: json['grade'] as String?,
    );
  }
}

class ProfileSkill {
  final String? languages;
  final String? backendTechnologies;
  final String? databases;
  final String? aiMlFrameworks;
  final String? toolsPlatforms;
  final String? coreCompetencies;

  ProfileSkill({
    this.languages,
    this.backendTechnologies,
    this.databases,
    this.aiMlFrameworks,
    this.toolsPlatforms,
    this.coreCompetencies,
  });

  factory ProfileSkill.fromJson(Map<String, dynamic> json) {
    return ProfileSkill(
      languages: json['languages'] as String?,
      backendTechnologies: json['backend_technologies'] as String?,
      databases: json['databases'] as String?,
      aiMlFrameworks: json['ai_ml_frameworks'] as String?,
      toolsPlatforms: json['tools_platforms'] as String?,
      coreCompetencies: json['core_competencies'] as String?,
    );
  }
}

class ProfileProject {
  final String title;
  final String? description;
  final String? link;

  ProfileProject({required this.title, this.description, this.link});

  factory ProfileProject.fromJson(Map<String, dynamic> json) {
    return ProfileProject(
      title: json['title'] as String? ?? json['project_name'] as String? ?? '',
      description: json['description'] as String?,
      link: json['link'] as String? ?? json['github_url'] as String?,
    );
  }
}

class ProfileCertification {
  final String title;
  final String? issuer;
  final String? date;

  ProfileCertification({required this.title, this.issuer, this.date});

  factory ProfileCertification.fromJson(Map<String, dynamic> json) {
    return ProfileCertification(
      title: json['title'] as String? ?? '',
      issuer: json['issuer'] as String?,
      date: json['date'] as String?,
    );
  }
}
