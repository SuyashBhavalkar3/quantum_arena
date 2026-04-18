class ResumeAnalysisResponse {
  final int overallScore;
  final int formattingScore;
  final List<String> strengths;
  final List<String> weaknesses;
  final List<String> suggestions;

  ResumeAnalysisResponse({
    required this.overallScore,
    required this.formattingScore,
    required this.strengths,
    required this.weaknesses,
    required this.suggestions,
  });

  factory ResumeAnalysisResponse.fromJson(Map<String, dynamic> json) {
    return ResumeAnalysisResponse(
      overallScore: json['overall_score'] ?? 0,
      formattingScore: json['formatting_score'] ?? 0,
      strengths: List<String>.from(json['strengths'] ?? []),
      weaknesses: List<String>.from(json['weaknesses'] ?? []),
      suggestions: List<String>.from(json['suggestions'] ?? []),
    );
  }
}

class OnboardStatus {
  final bool hasResume;
  final String? resumeUrl;
  final String? candidateName;

  OnboardStatus({
    required this.hasResume,
    this.resumeUrl,
    this.candidateName,
  });

  factory OnboardStatus.fromJson(Map<String, dynamic> json) {
    return OnboardStatus(
      hasResume: json['has_resume'] ?? false,
      resumeUrl: json['resume_url'],
      candidateName: json['candidate_name'],
    );
  }
}
