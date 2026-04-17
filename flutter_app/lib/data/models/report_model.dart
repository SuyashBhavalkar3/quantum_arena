class CandidateReport {
  final int id;
  final int applicationId;
  final String reportType;
  final String status;
  final String? pdfPath;
  final String? pdfUrl;
  final Map<String, dynamic>? llmSummaryJson;
  final Map<String, dynamic>? chartMetadataJson;
  final String? generatedAt;
  final String? errorMessage;
  final String createdAt;
  final Map<String, dynamic>? subject;
  final Map<String, dynamic>? assessment;
  final Map<String, dynamic>? interview;
  final List<String>? strengths;
  final List<String>? weaknesses;
  final List<String>? behavioralObservations;
  final String? finalRecommendation;
  final String? candidateSummary;
  final String? interviewSummary;
  final Map<String, dynamic>? chartImages;

  CandidateReport({
    required this.id,
    required this.applicationId,
    required this.reportType,
    required this.status,
    this.pdfPath,
    this.pdfUrl,
    this.llmSummaryJson,
    this.chartMetadataJson,
    this.generatedAt,
    this.errorMessage,
    required this.createdAt,
    this.subject,
    this.assessment,
    this.interview,
    this.strengths,
    this.weaknesses,
    this.behavioralObservations,
    this.finalRecommendation,
    this.candidateSummary,
    this.interviewSummary,
    this.chartImages,
  });

  factory CandidateReport.fromJson(Map<String, dynamic> json) {
    return CandidateReport(
      id: json['id'] as int,
      applicationId: json['application_id'] as int,
      reportType: json['report_type'] as String? ?? '',
      status: json['status'] as String? ?? '',
      pdfPath: json['pdf_path'] as String?,
      pdfUrl: json['pdf_url'] as String?,
      llmSummaryJson: json['llm_summary_json'] as Map<String, dynamic>?,
      chartMetadataJson: json['chart_metadata_json'] as Map<String, dynamic>?,
      generatedAt: json['generated_at'] as String?,
      errorMessage: json['error_message'] as String?,
      createdAt: json['created_at'] as String? ?? '',
      subject: json['subject'] as Map<String, dynamic>?,
      assessment: json['assessment'] as Map<String, dynamic>?,
      interview: json['interview'] as Map<String, dynamic>?,
      strengths: (json['strengths'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      weaknesses: (json['weaknesses'] as List<dynamic>?)
          ?.map((e) => e.toString())
          .toList(),
      behavioralObservations:
          (json['behavioral_observations'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList(),
      finalRecommendation: json['final_recommendation'] as String?,
      candidateSummary: json['candidate_summary'] as String?,
      interviewSummary: json['interview_summary'] as String?,
      chartImages: json['chart_images'] as Map<String, dynamic>?,
    );
  }
}

class RecruitmentStrategyRequest {
  final String roleToHireFor;
  final int numberOfCandidates;
  final int hiringTimelineDays;
  final String companyCategory;

  RecruitmentStrategyRequest({
    required this.roleToHireFor,
    required this.numberOfCandidates,
    required this.hiringTimelineDays,
    required this.companyCategory,
  });

  Map<String, dynamic> toJson() => {
        'role_to_hire_for': roleToHireFor,
        'number_of_candidates_to_hire': numberOfCandidates,
        'hiring_timeline_days': hiringTimelineDays,
        'company_category': companyCategory,
      };
}

class RecruitmentStrategyResponse {
  final int id;
  final String roleToHireFor;
  final String executiveSummary;
  final Map<String, dynamic>? hiringFunnelStrategy;
  final List<String>? timeOptimizationPlan;
  final List<String>? costOptimizationSuggestions;
  final List<String>? competitiveHiringAdvice;
  final List<String>? sourcingStrategy;
  final List<String>? riskWarnings;
  final String createdAt;

  RecruitmentStrategyResponse({
    required this.id,
    required this.roleToHireFor,
    required this.executiveSummary,
    this.hiringFunnelStrategy,
    this.timeOptimizationPlan,
    this.costOptimizationSuggestions,
    this.competitiveHiringAdvice,
    this.sourcingStrategy,
    this.riskWarnings,
    required this.createdAt,
  });

  factory RecruitmentStrategyResponse.fromJson(Map<String, dynamic> json) {
    return RecruitmentStrategyResponse(
      id: json['id'] as int? ?? 0,
      roleToHireFor: json['role_to_hire_for'] as String? ?? '',
      executiveSummary: json['executive_summary'] as String? ?? '',
      hiringFunnelStrategy:
          json['hiring_funnel_strategy'] as Map<String, dynamic>?,
      timeOptimizationPlan: _strList(json['time_optimization_plan']),
      costOptimizationSuggestions:
          _strList(json['cost_optimization_suggestions']),
      competitiveHiringAdvice: _strList(json['competitive_hiring_advice']),
      sourcingStrategy: _strList(json['sourcing_strategy']),
      riskWarnings: _strList(json['risk_warnings']),
      createdAt: json['created_at'] as String? ?? '',
    );
  }

  static List<String>? _strList(dynamic data) {
    if (data == null) return null;
    return (data as List<dynamic>).map((e) => e.toString()).toList();
  }
}
