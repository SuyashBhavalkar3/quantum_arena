import 'package:dio/dio.dart';
import '../../core/constants/api_constants.dart';
import '../models/user_model.dart';
import '../models/job_model.dart';
import '../models/application_model.dart';
import '../models/dashboard_model.dart';
import '../models/report_model.dart';
import '../models/schedule_model.dart';
import '../models/profile_model.dart';
import 'auth_service.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;

  late final Dio _dio;

  ApiService._internal() {
    _dio = Dio(
      BaseOptions(
        baseUrl: ApiConstants.baseUrl,
        connectTimeout: const Duration(seconds: 15),
        receiveTimeout: const Duration(seconds: 15),
        headers: {'Content-Type': 'application/json'},
      ),
    );

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await AuthService.getToken();
        if (token != null && token.isNotEmpty) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) {
        if (error.response?.statusCode == 401) {
          AuthService.logout();
        }
        handler.next(error);
      },
    ));
  }

  // ============================================
  // AUTH
  // ============================================

  Future<UserModel> register(RegisterRequest request) async {
    final response = await _dio.post(ApiConstants.register, data: request.toJson());
    return UserModel.fromJson(response.data);
  }

  Future<AuthResponse> login(LoginRequest request) async {
    final response = await _dio.post(ApiConstants.login, data: request.toJson());
    return AuthResponse.fromJson(response.data);
  }

  Future<UserModel> getCurrentUser() async {
    final response = await _dio.get(ApiConstants.me);
    return UserModel.fromJson(response.data);
  }

  Future<UserModel> updateHRProfile(Map<String, dynamic> payload) async {
    final response = await _dio.put(ApiConstants.me, data: payload);
    return UserModel.fromJson(response.data);
  }

  // ============================================
  // PROFILE
  // ============================================

  Future<ProfileStatus> getProfileStatus() async {
    final response = await _dio.get(ApiConstants.profileStatus);
    return ProfileStatus.fromJson(response.data);
  }

  Future<CandidateProfileData> getProfile() async {
    final response = await _dio.get(ApiConstants.profileGet);
    return CandidateProfileData.fromJson(response.data);
  }

  Future<Map<String, dynamic>> completeProfile() async {
    final response = await _dio.post(ApiConstants.completeProfile);
    return response.data;
  }

  // Experiences
  Future<Map<String, dynamic>> addExperience(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConstants.experiences, data: data);
    return response.data;
  }

  Future<List<dynamic>> getExperiences() async {
    final response = await _dio.get(ApiConstants.experiences);
    return response.data;
  }

  // Education
  Future<Map<String, dynamic>> addEducation(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConstants.education, data: data);
    return response.data;
  }

  Future<List<dynamic>> getEducation() async {
    final response = await _dio.get(ApiConstants.education);
    return response.data;
  }

  // Skills
  Future<Map<String, dynamic>> addSkills(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConstants.skills, data: data);
    return response.data;
  }

  Future<List<dynamic>> getSkills() async {
    final response = await _dio.get(ApiConstants.skills);
    return response.data;
  }

  // Projects
  Future<Map<String, dynamic>> addProject(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConstants.projects, data: data);
    return response.data;
  }

  // Certifications
  Future<Map<String, dynamic>> addCertification(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConstants.certifications, data: data);
    return response.data;
  }

  // ============================================
  // DASHBOARD
  // ============================================

  Future<CandidateDashboardStats> getCandidateStats() async {
    final response = await _dio.get(ApiConstants.candidateStats);
    return CandidateDashboardStats.fromJson(response.data);
  }

  Future<List<CandidateDashboardActivity>> getCandidateActivity({int limit = 10}) async {
    final response = await _dio.get(ApiConstants.candidateActivity(limit));
    return (response.data as List)
        .map((e) => CandidateDashboardActivity.fromJson(e))
        .toList();
  }

  Future<HRDashboardStats> getHRStats() async {
    final response = await _dio.get(ApiConstants.hrStats);
    return HRDashboardStats.fromJson(response.data);
  }

  Future<List<HRRecentApplicant>> getRecentApplicants({int limit = 10}) async {
    final response = await _dio.get(ApiConstants.recentApplicants(limit));
    return (response.data as List)
        .map((e) => HRRecentApplicant.fromJson(e))
        .toList();
  }

  Future<HRPendingActions> getPendingActions() async {
    final response = await _dio.get(ApiConstants.pendingActions);
    return HRPendingActions.fromJson(response.data);
  }

  // ============================================
  // JOBS
  // ============================================

  Future<JobsResponse> getAllJobs() async {
    final response = await _dio.get(ApiConstants.jobs);
    return JobsResponse.fromJson(response.data);
  }

  Future<Map<String, dynamic>> createJob(CreateJobRequest request) async {
    final response = await _dio.post(ApiConstants.createJob, data: request.toJson());
    return response.data;
  }

  // ============================================
  // APPLICATIONS
  // ============================================

  Future<ApplicationModel> applyForJob(int jobId) async {
    final response = await _dio.post(ApiConstants.applyForJob, data: {'job_id': jobId});
    return ApplicationModel.fromJson(response.data);
  }

  Future<List<ApplicationModel>> getMyApplications() async {
    final response = await _dio.get(ApiConstants.myApplications);
    return (response.data as List)
        .map((e) => ApplicationModel.fromJson(e))
        .toList();
  }

  Future<List<ApplicationModel>> getJobApplicants(int jobId) async {
    final response = await _dio.get(ApiConstants.jobApplicants(jobId));
    return (response.data as List)
        .map((e) => ApplicationModel.fromJson(e))
        .toList();
  }

  Future<ApplicationModel> getApplicationDetail(int applicationId) async {
    final response = await _dio.get(ApiConstants.applicationDetail(applicationId));
    return ApplicationModel.fromJson(response.data);
  }

  Future<ApplicationModel> updateApplicationStatus(
      int applicationId, Map<String, dynamic> payload) async {
    final response = await _dio.patch(
      ApiConstants.updateApplication(applicationId),
      data: payload,
    );
    return ApplicationModel.fromJson(response.data);
  }

  // ============================================
  // SCHEDULING
  // ============================================

  Future<List<ScheduleModel>> getMySchedules() async {
    final response = await _dio.get(ApiConstants.mySchedules);
    return (response.data as List)
        .map((e) => ScheduleModel.fromJson(e))
        .toList();
  }

  // ============================================
  // REPORTS
  // ============================================

  Future<CandidateReport> getCandidateReport(int applicationId) async {
    final response = await _dio.get(ApiConstants.candidateReport(applicationId));
    return CandidateReport.fromJson(response.data);
  }

  Future<CandidateReport> getMyCandidateReport(int applicationId) async {
    final response = await _dio.get(ApiConstants.candidateMyReport(applicationId));
    return CandidateReport.fromJson(response.data);
  }

  Future<Map<String, dynamic>> generateCandidateReport(int applicationId) async {
    final response = await _dio.post(ApiConstants.generateReport(applicationId));
    return response.data;
  }

  // ============================================
  // RECRUITMENT STRATEGY
  // ============================================

  Future<RecruitmentStrategyResponse> generateRecruitmentStrategy(
      RecruitmentStrategyRequest request) async {
    final response = await _dio.post(
      ApiConstants.recruitmentStrategy,
      data: request.toJson(),
    );
    return RecruitmentStrategyResponse.fromJson(response.data);
  }

  // ============================================
  // HR AI COMMAND
  // ============================================

  Future<Map<String, dynamic>> runAICommand(String query) async {
    final response = await _dio.post(ApiConstants.hrAiCommand, data: {'query': query});
    return response.data;
  }

  // ============================================
  // MOCK INTERVIEW
  // ============================================

  Future<Map<String, dynamic>> startMockInterview(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConstants.mockInterviewStart, queryParameters: data);
    return response.data;
  }

  Future<Map<String, dynamic>> sendMockInterviewMessage(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConstants.mockInterviewMessage, data: data);
    return response.data;
  }

  Future<Map<String, dynamic>> endMockInterview(Map<String, dynamic> data) async {
    final response = await _dio.post(ApiConstants.mockInterviewEnd, data: data);
    return response.data;
  }

  // RESUME ANALYZER
  // ============================================

  Future<Map<String, dynamic>> analyzeProfileResume() async {
    final response = await _dio.get(ApiConstants.resumeAnalyzerProfile);
    return response.data;
  }

  Future<Map<String, dynamic>> analyzeUploadedResume(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: filePath.split('/').last),
    });
    final response = await _dio.post(ApiConstants.resumeAnalyzerUpload, data: formData);
    return response.data;
  }

  // AI PREP
  // ============================================

  Future<Map<String, dynamic>> getPrepResumeStatus() async {
    final response = await _dio.get(ApiConstants.prepResumeStatus);
    return response.data;
  }

  Future<Map<String, dynamic>> uploadPrepResume(String filePath) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(filePath, filename: filePath.split('/').last),
    });
    final response = await _dio.post(ApiConstants.prepUploadResume, data: formData);
    return response.data;
  }

  Future<Map<String, dynamic>> generatePrepReport(String jobRole, List<String> targetCompanies) async {
    final response = await _dio.post(ApiConstants.prepGenerateReport, data: {
      'job_role': jobRole,
      'target_companies': targetCompanies,
    });
    return response.data;
  }
}
