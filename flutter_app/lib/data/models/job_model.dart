class JobModel {
  final int id;
  final String title;
  final String? description;
  final List<String>? requiredSkills;
  final int? experienceRequired;
  final String? location;
  final String? salaryRange;
  final int createdBy;
  final String createdAt;

  JobModel({
    required this.id,
    required this.title,
    this.description,
    this.requiredSkills,
    this.experienceRequired,
    this.location,
    this.salaryRange,
    required this.createdBy,
    required this.createdAt,
  });

  factory JobModel.fromJson(Map<String, dynamic> json) {
    return JobModel(
      id: json['id'] as int,
      title: json['title'] as String? ?? '',
      description: json['description'] as String?,
      requiredSkills: (json['required_skills'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      experienceRequired: json['experience_required'] as int?,
      location: json['location'] as String?,
      salaryRange: json['salary_range'] as String?,
      createdBy: json['created_by'] as int? ?? 0,
      createdAt: json['created_at'] as String? ?? '',
    );
  }
}

class JobsResponse {
  final int totalJobs;
  final List<JobModel> jobs;

  JobsResponse({required this.totalJobs, required this.jobs});

  factory JobsResponse.fromJson(Map<String, dynamic> json) {
    return JobsResponse(
      totalJobs: json['total_jobs'] as int? ?? 0,
      jobs: (json['jobs'] as List<dynamic>?)
              ?.map((e) => JobModel.fromJson(e as Map<String, dynamic>))
              .toList() ??
          [],
    );
  }
}

class CreateJobRequest {
  final String title;
  final String? description;
  final List<String> requiredSkills;
  final int experienceRequired;
  final String location;
  final String salaryRange;

  CreateJobRequest({
    required this.title,
    this.description,
    required this.requiredSkills,
    required this.experienceRequired,
    required this.location,
    required this.salaryRange,
  });

  Map<String, dynamic> toJson() => {
        'title': title,
        'description': description,
        'required_skills': requiredSkills,
        'experience_required': experienceRequired,
        'location': location,
        'salary_range': salaryRange,
      };
}
