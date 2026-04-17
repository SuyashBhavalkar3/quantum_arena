class ApplicationModel {
  final int id;
  final int jobId;
  final int candidateId;
  final int userId;
  final String? candidateName;
  final String? candidateEmail;
  final String status;
  final num? resumeMatchScore;
  final Map<String, dynamic>? resumeAnalysis;
  final num? assessmentScore;
  final num? interviewScore;
  final num? finalScore;
  final String? hrNotes;
  final Map<String, dynamic>? assessmentData;
  final Map<String, dynamic>? interviewFeedback;
  final String? assessmentAvailableAt;
  final String? assessmentExpiresAt;
  final String createdAt;

  // Joined data
  final Map<String, dynamic>? job;

  ApplicationModel({
    required this.id,
    required this.jobId,
    required this.candidateId,
    required this.userId,
    this.candidateName,
    this.candidateEmail,
    required this.status,
    this.resumeMatchScore,
    this.resumeAnalysis,
    this.assessmentScore,
    this.interviewScore,
    this.finalScore,
    this.hrNotes,
    this.assessmentData,
    this.interviewFeedback,
    this.assessmentAvailableAt,
    this.assessmentExpiresAt,
    required this.createdAt,
    this.job,
  });

  factory ApplicationModel.fromJson(Map<String, dynamic> json) {
    return ApplicationModel(
      id: json['id'] as int,
      jobId: json['job_id'] as int,
      candidateId: json['candidate_id'] as int? ?? 0,
      userId: json['user_id'] as int? ?? 0,
      candidateName: json['candidate_name'] as String?,
      candidateEmail: json['candidate_email'] as String?,
      status: json['status'] as String? ?? 'pending',
      resumeMatchScore: json['resume_match_score'] as num?,
      resumeAnalysis: json['resume_analysis'] as Map<String, dynamic>?,
      assessmentScore: json['assessment_score'] as num?,
      interviewScore: json['interview_score'] as num?,
      finalScore: json['final_score'] as num?,
      hrNotes: json['hr_notes'] as String?,
      assessmentData: json['assessment_data'] as Map<String, dynamic>?,
      interviewFeedback: json['interview_feedback'] as Map<String, dynamic>?,
      assessmentAvailableAt: json['assessment_available_at'] as String?,
      assessmentExpiresAt: json['assessment_expires_at'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      job: json['job'] as Map<String, dynamic>?,
    );
  }

  String get jobTitle => job?['title'] as String? ?? 'Job #$jobId';
  String get jobLocation => job?['location'] as String? ?? '';

  bool get isAssessmentWindowActive {
    if (assessmentData?['assessment_status'] == 'auto_submitted_violation') {
      return false;
    }
    if (status != 'assessment_scheduled') return false;
    if (assessmentExpiresAt == null) return false;
    final expires = DateTime.tryParse(assessmentExpiresAt!);
    if (expires == null) return false;
    return expires.isAfter(DateTime.now());
  }

  String get assessmentProgressLabel {
    if (assessmentData?['assessment_status'] == 'auto_submitted_violation') {
      return 'Done (Auto-submitted)';
    }
    if (assessmentScore != null || status == 'assessment_completed') {
      return 'Done';
    }
    if (status == 'assessment_scheduled') return 'Scheduled';
    return 'Pending';
  }

  String get interviewProgressLabel {
    if (interviewFeedback?['ai_interview_status'] ==
        'auto_concluded_violation') {
      return 'Done (Auto-concluded)';
    }
    if (status == 'interview_completed' ||
        status == 'final_review' ||
        status == 'accepted' ||
        interviewScore != null) {
      return 'Done';
    }
    if (status == 'interview_scheduled') return 'Scheduled';
    return 'Pending';
  }
}
