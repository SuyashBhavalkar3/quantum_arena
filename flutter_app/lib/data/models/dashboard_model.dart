class CandidateDashboardStats {
  final int totalApplications;
  final int applicationsThisWeek;
  final int inProgress;
  final int interviewsTotal;
  final int upcomingInterviews;
  final int offersReceived;
  final int offersPendingResponse;
  final int unreadNotifications;

  CandidateDashboardStats({
    required this.totalApplications,
    required this.applicationsThisWeek,
    required this.inProgress,
    required this.interviewsTotal,
    required this.upcomingInterviews,
    required this.offersReceived,
    required this.offersPendingResponse,
    required this.unreadNotifications,
  });

  factory CandidateDashboardStats.fromJson(Map<String, dynamic> json) {
    return CandidateDashboardStats(
      totalApplications: json['total_applications'] as int? ?? 0,
      applicationsThisWeek: json['applications_this_week'] as int? ?? 0,
      inProgress: json['in_progress'] as int? ?? 0,
      interviewsTotal: json['interviews_total'] as int? ?? 0,
      upcomingInterviews: json['upcoming_interviews'] as int? ?? 0,
      offersReceived: json['offers_received'] as int? ?? 0,
      offersPendingResponse: json['offers_pending_response'] as int? ?? 0,
      unreadNotifications: json['unread_notifications'] as int? ?? 0,
    );
  }
}

class CandidateDashboardActivity {
  final int id;
  final int jobId;
  final String jobTitle;
  final String status;
  final String? updatedAt;
  final num? resumeScore;
  final num? assessmentScore;
  final String screeningStatus;
  final num screeningThreshold;
  final bool resumeScreened;
  final bool passedScreening;
  final String nextStepMessage;

  CandidateDashboardActivity({
    required this.id,
    required this.jobId,
    required this.jobTitle,
    required this.status,
    this.updatedAt,
    this.resumeScore,
    this.assessmentScore,
    required this.screeningStatus,
    required this.screeningThreshold,
    required this.resumeScreened,
    required this.passedScreening,
    required this.nextStepMessage,
  });

  factory CandidateDashboardActivity.fromJson(Map<String, dynamic> json) {
    return CandidateDashboardActivity(
      id: json['id'] as int,
      jobId: json['job_id'] as int,
      jobTitle: json['job_title'] as String? ?? '',
      status: json['status'] as String? ?? '',
      updatedAt: json['updated_at'] as String?,
      resumeScore: json['resume_score'] as num?,
      assessmentScore: json['assessment_score'] as num?,
      screeningStatus: json['screening_status'] as String? ?? 'pending',
      screeningThreshold: json['screening_threshold'] as num? ?? 0,
      resumeScreened: json['resume_screened'] as bool? ?? false,
      passedScreening: json['passed_screening'] as bool? ?? false,
      nextStepMessage: json['next_step_message'] as String? ?? '',
    );
  }
}

class HRDashboardStats {
  final int totalJobs;
  final int totalApplications;
  final int pendingReview;
  final int inAssessment;
  final int inInterview;
  final int hiredTotal;
  final int rejected;
  final int hiredThisMonth;
  final int applicationsThisMonth;

  HRDashboardStats({
    required this.totalJobs,
    required this.totalApplications,
    required this.pendingReview,
    required this.inAssessment,
    required this.inInterview,
    required this.hiredTotal,
    required this.rejected,
    required this.hiredThisMonth,
    required this.applicationsThisMonth,
  });

  factory HRDashboardStats.fromJson(Map<String, dynamic> json) {
    return HRDashboardStats(
      totalJobs: json['total_jobs'] as int? ?? 0,
      totalApplications: json['total_applications'] as int? ?? 0,
      pendingReview: json['pending_review'] as int? ?? 0,
      inAssessment: json['in_assessment'] as int? ?? 0,
      inInterview: json['in_interview'] as int? ?? 0,
      hiredTotal: json['hired_total'] as int? ?? 0,
      rejected: json['rejected'] as int? ?? 0,
      hiredThisMonth: json['hired_this_month'] as int? ?? 0,
      applicationsThisMonth: json['applications_this_month'] as int? ?? 0,
    );
  }
}

class HRRecentApplicant {
  final int id;
  final int candidateId;
  final String jobTitle;
  final String status;
  final num? resumeScore;
  final num? assessmentScore;
  final num? interviewScore;
  final num? finalScore;
  final String appliedAt;

  HRRecentApplicant({
    required this.id,
    required this.candidateId,
    required this.jobTitle,
    required this.status,
    this.resumeScore,
    this.assessmentScore,
    this.interviewScore,
    this.finalScore,
    required this.appliedAt,
  });

  factory HRRecentApplicant.fromJson(Map<String, dynamic> json) {
    return HRRecentApplicant(
      id: json['id'] as int,
      candidateId: json['candidate_id'] as int? ?? 0,
      jobTitle: json['job_title'] as String? ?? '',
      status: json['status'] as String? ?? '',
      resumeScore: json['resume_score'] as num?,
      assessmentScore: json['assessment_score'] as num?,
      interviewScore: json['interview_score'] as num?,
      finalScore: json['final_score'] as num?,
      appliedAt: json['applied_at'] as String? ?? '',
    );
  }

  num get bestScore =>
      finalScore ?? interviewScore ?? assessmentScore ?? resumeScore ?? 0;
}

class HRPendingActions {
  final List<Map<String, dynamic>> pendingReview;
  final List<Map<String, dynamic>> assessmentCompleted;
  final List<Map<String, dynamic>> interviewCompleted;

  HRPendingActions({
    required this.pendingReview,
    required this.assessmentCompleted,
    required this.interviewCompleted,
  });

  factory HRPendingActions.fromJson(Map<String, dynamic> json) {
    return HRPendingActions(
      pendingReview: _parseList(json['pending_review']),
      assessmentCompleted: _parseList(json['assessment_completed']),
      interviewCompleted: _parseList(json['interview_completed']),
    );
  }

  static List<Map<String, dynamic>> _parseList(dynamic data) {
    if (data == null) return [];
    return (data as List<dynamic>)
        .map((e) => e as Map<String, dynamic>)
        .toList();
  }
}
