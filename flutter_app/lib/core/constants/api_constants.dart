class ApiConstants {
  ApiConstants._();

  static const String baseUrl = 'https://quantum-arena.onrender.com';

  // Auth
  static const String register = '/v1/auth/register';
  static const String login = '/v1/auth/login';
  static const String me = '/v1/auth/me';

  // Profile
  static const String profileStatus = '/v1/candidate/profile-status';
  static const String profileSave = '/api/profile/save';
  static const String profileGet = '/api/profile';
  static const String profileStatusApi = '/api/profile/status';
  static const String resumeParse = '/api/profile/parse';
  static const String completeProfile = '/v1/candidate/complete-profile';
  static const String experiences = '/v1/candidate/experiences';
  static const String education = '/v1/candidate/education';
  static const String skills = '/v1/candidate/skills';
  static const String projects = '/v1/candidate/projects';
  static const String certifications = '/v1/candidate/certifications';

  // Candidate Dashboard
  static const String candidateStats = '/v1/candidate/dashboard/stats';
  static String candidateActivity(int limit) =>
      '/v1/candidate/dashboard/activity?limit=$limit';

  // HR Dashboard
  static const String hrStats = '/v1/hr/dashboard/stats';
  static String recentApplicants(int limit) =>
      '/v1/hr/dashboard/recent-applicants?limit=$limit';
  static String topCandidates(int limit) =>
      '/v1/hr/dashboard/top-candidates?limit=$limit';
  static const String pendingActions = '/v1/hr/dashboard/pending-actions';

  // Jobs
  static const String jobs = '/jobs/';
  static const String createJob = '/jobs/create';

  // Applications
  static const String applyForJob = '/v1/applications/apply';
  static const String myApplications = '/v1/applications/my-applications';
  static String myApplicationDetail(int id) =>
      '/v1/applications/my-applications/$id';
  static String jobApplicants(int jobId) =>
      '/v1/applications/job/$jobId/applicants';
  static String applicationDetail(int id) =>
      '/v1/applications/application/$id/detail';
  static String updateApplication(int id) =>
      '/v1/applications/application/$id';

  // Assessment
  static String startAssessment(int applicationId) =>
      '/v1/assessment/start/$applicationId';
  static String submitAssessment(int applicationId) =>
      '/v1/assessment/submit/$applicationId';

  // Scheduling
  static const String mySchedules = '/v1/scheduling/my-schedules';

  // Reports
  static String candidateReport(int applicationId) =>
      '/v1/reports/application/$applicationId';
  static String candidateMyReport(int applicationId) =>
      '/v1/reports/my/application/$applicationId';
  static String generateReport(int applicationId) =>
      '/v1/reports/application/$applicationId/generate';
  static String downloadReport(int reportId) =>
      '/v1/reports/$reportId/download';

  // Recruitment Strategy
  static const String recruitmentStrategy = '/v1/recruitment-strategy/generate';

  // HR AI Command
  static const String hrAiCommand = '/v1/hr/ai-command';

  // HR Actions
  static const String sendOffer = '/v1/hr/actions/offer';
  static const String rejectCandidate = '/v1/hr/actions/reject';

  // Proctoring
  static const String reportViolation = '/v1/proctoring/report-violation';
  static String violations(int applicationId) =>
      '/v1/proctoring/violations/$applicationId';
  static const String terminateSession = '/v1/proctoring/terminate-session';

  // Experience Wall
  static const String experienceFeed = '/experience/feed';
  static const String experienceSubmit = '/experience/submit';
  static const String experienceCompanies = '/experience/companies';
  static String experienceUpvote(int id) => '/experience/$id/upvote';

  // Mock Interview
  static const String mockInterviewStart = '/mock/start';
  static const String mockInterviewMessage = '/mock/message';
  static const String mockInterviewEnd = '/mock/end';

  // Resume Analyzer
  static const String resumeAnalyzerProfile = '/v1/resume-analyzer/profile';
  static const String resumeAnalyzerUpload = '/v1/resume-analyzer/upload';

  // AI Prep
  static const String prepResumeStatus = '/prep/resume-status';
  static const String prepUploadResume = '/prep/upload-resume';
  static const String prepGenerateReport = '/prep/generate-report';
}
