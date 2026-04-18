import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/models/analyzer_prep_models.dart';
import '../../../../data/services/api_service.dart';
import '../../../widgets/shared_widgets.dart';

class ResumeAnalyzerScreen extends ConsumerStatefulWidget {
  const ResumeAnalyzerScreen({super.key});

  @override
  ConsumerState<ResumeAnalyzerScreen> createState() => _ResumeAnalyzerScreenState();
}

class _ResumeAnalyzerScreenState extends ConsumerState<ResumeAnalyzerScreen> {
  int _activeTab = 0; // 0: Profile, 1: Upload
  bool _isAnalyzing = false;
  ResumeAnalysisResponse? _result;
  String? _error;
  PlatformFile? _selectedFile;

  final ApiService _api = ApiService();

  Future<void> _handleProfileAnalysis() async {
    setState(() {
      _isAnalyzing = true;
      _error = null;
      _result = null;
    });

    try {
      final res = await _api.analyzeProfileResume();
      setState(() {
        _result = ResumeAnalysisResponse.fromJson(res);
      });
    } catch (e) {
      setState(() {
        _error = "Profile not completed. Please complete your profile and upload a resume before using this feature.\nOr try the Upload New tab.";
      });
    } finally {
      if (mounted) setState(() => _isAnalyzing = false);
    }
  }

  Future<void> _pickFile() async {
    FilePickerResult? result = await FilePicker.pickFiles(
      type: FileType.custom,
      allowedExtensions: ['pdf', 'doc', 'docx'],
    );
    if (result != null) {
      setState(() {
        _selectedFile = result.files.first;
      });
    }
  }

  Future<void> _handleUploadAnalysis() async {
    if (_selectedFile == null || _selectedFile!.path == null) {
      setState(() => _error = "Please select a file first.");
      return;
    }

    setState(() {
      _isAnalyzing = true;
      _error = null;
      _result = null;
    });

    try {
      final res = await _api.analyzeUploadedResume(_selectedFile!.path!);
      setState(() {
        _result = ResumeAnalysisResponse.fromJson(res);
      });
    } catch (e) {
      if (mounted) setState(() => _error = "Failed to analyze uploaded resume: $e");
    } finally {
      if (mounted) setState(() => _isAnalyzing = false);
    }
  }

  void _switchTab(int tabIndex) {
    setState(() {
      _activeTab = tabIndex;
      _result = null;
      _error = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Resume Analyzer'),
        backgroundColor: AppColors.surface,
        elevation: 0,
        surfaceTintColor: Colors.transparent,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(20.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Get instant, AI-powered feedback on your resume. Identify strengths, fix weaknesses, and boost your ATS score.',
                style: Theme.of(context).textTheme.bodyMedium,
              ),
              const SizedBox(height: 24),

              // Tabs
              Container(
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: AppColors.accentBorder),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _switchTab(0),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _activeTab == 0 ? AppColors.accent : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'Profile Resume',
                            style: TextStyle(
                              color: _activeTab == 0 ? Colors.white : AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),
                    Expanded(
                      child: GestureDetector(
                        onTap: () => _switchTab(1),
                        child: Container(
                          padding: const EdgeInsets.symmetric(vertical: 12),
                          decoration: BoxDecoration(
                            color: _activeTab == 1 ? AppColors.accent : Colors.transparent,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          alignment: Alignment.center,
                          child: Text(
                            'Upload New',
                            style: TextStyle(
                              color: _activeTab == 1 ? Colors.white : AppColors.textSecondary,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 24),

              // Action Area
              Container(
                padding: const EdgeInsets.all(20),
                decoration: BoxDecoration(
                  color: AppColors.surface,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: AppColors.accentBorder),
                ),
                child: _activeTab == 0 ? _buildProfileTab() : _buildUploadTab(),
              ),

              if (_error != null) ...[
                const SizedBox(height: 16),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.error.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(8),
                    border: Border.all(color: AppColors.error.withValues(alpha: 0.3)),
                  ),
                  child: Text(
                    _error!,
                    style: const TextStyle(color: AppColors.error, fontSize: 13),
                  ),
                ),
              ],

              const SizedBox(height: 32),

              // Results Area
              if (_isAnalyzing)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 40),
                  child: Center(
                    child: Column(
                      children: [
                        AppLoadingIndicator(size: 40),
                        SizedBox(height: 16),
                        Text('Analyzing resume...', style: TextStyle(fontWeight: FontWeight.w600)),
                      ],
                    ),
                  ),
                )
              else if (_result != null)
                _buildResults()
              else
                const EmptyState(
                  icon: Icons.analytics_outlined,
                  message: 'No Analysis Yet',
                  subtitle: 'Select an option above to analyze your resume and get actionable feedback.',
                ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildProfileTab() {
    return Column(
      children: [
        const Icon(Icons.description_rounded, size: 48, color: AppColors.accent),
        const SizedBox(height: 16),
        const Text(
          'Stored Resume',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          'We will analyze the resume currently linked to your candidate profile.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isAnalyzing ? null : _handleProfileAnalysis,
            child: const Text('Analyze Profile Resume'),
          ),
        ),
      ],
    );
  }

  Widget _buildUploadTab() {
    return Column(
      children: [
        const Icon(Icons.cloud_upload_rounded, size: 48, color: AppColors.accent),
        const SizedBox(height: 16),
        const Text(
          'Ad-hoc Analysis',
          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        const Text(
          'Upload any PDF or Word document for instant analysis. Does not update your profile.',
          textAlign: TextAlign.center,
          style: TextStyle(color: AppColors.textSecondary, fontSize: 13),
        ),
        const SizedBox(height: 24),
        GestureDetector(
          onTap: _pickFile,
          child: Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(vertical: 24, horizontal: 16),
            decoration: BoxDecoration(
              border: Border.all(
                color: _selectedFile != null ? AppColors.accent : AppColors.accentBorder,
                style: BorderStyle.solid,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(12),
              color: _selectedFile != null ? AppColors.accent.withValues(alpha: 0.05) : Colors.transparent,
            ),
            child: Column(
              children: [
                if (_selectedFile != null) ...[
                  const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 32),
                  const SizedBox(height: 8),
                  Text(
                    _selectedFile!.name,
                    style: const TextStyle(fontWeight: FontWeight.bold, color: AppColors.accent),
                    textAlign: TextAlign.center,
                  ),
                ] else ...[
                  const Icon(Icons.upload_file_rounded, color: AppColors.textSecondary, size: 32),
                  const SizedBox(height: 8),
                  const Text('Tap to browse files', style: TextStyle(color: AppColors.textSecondary)),
                ]
              ],
            ),
          ),
        ),
        const SizedBox(height: 24),
        SizedBox(
          width: double.infinity,
          height: 48,
          child: ElevatedButton(
            onPressed: _isAnalyzing || _selectedFile == null ? null : _handleUploadAnalysis,
            child: const Text('Analyze Uploaded Resume'),
          ),
        ),
      ],
    );
  }

  Widget _buildResults() {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: AppColors.accentBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceAround,
            children: [
              _buildScoreRing(_result!.overallScore, 'Overall ATS'),
              _buildScoreRing(_result!.formattingScore, 'Formatting'),
            ],
          ),
          const SizedBox(height: 32),
          const Text('Strengths', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.success)),
          const SizedBox(height: 8),
          ..._result!.strengths.map((s) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.check_circle_rounded, color: AppColors.success, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(s, style: const TextStyle(fontSize: 13))),
                  ],
                ),
              )),
          const SizedBox(height: 24),
          const Text('Areas to Improve', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.error)),
          const SizedBox(height: 8),
          ..._result!.weaknesses.map((s) => Padding(
                padding: const EdgeInsets.only(bottom: 8.0),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Icon(Icons.warning_rounded, color: AppColors.error, size: 18),
                    const SizedBox(width: 8),
                    Expanded(child: Text(s, style: const TextStyle(fontSize: 13))),
                  ],
                ),
              )),
          const SizedBox(height: 24),
          const Text('Actionable Suggestions', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold, color: AppColors.accent)),
          const SizedBox(height: 12),
          ..._result!.suggestions.asMap().entries.map((entry) => Container(
                margin: const EdgeInsets.only(bottom: 12),
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.1),
                  border: Border.all(color: AppColors.accent.withValues(alpha: 0.2)),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Row(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Container(
                      width: 24,
                      height: 24,
                      decoration: const BoxDecoration(
                        color: AppColors.accent,
                        shape: BoxShape.circle,
                      ),
                      alignment: Alignment.center,
                      child: Text(
                        '${entry.key + 1}',
                        style: const TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.bold),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Text(entry.value, style: const TextStyle(fontSize: 13))),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildScoreRing(int score, String label) {
    Color color = AppColors.error;
    if (score >= 80) color = AppColors.success;
    else if (score >= 60) color = Colors.orange;

    return Column(
      children: [
        SizedBox(
          width: 80,
          height: 80,
          child: Stack(
            fit: StackFit.expand,
            children: [
              CircularProgressIndicator(
                value: score / 100,
                strokeWidth: 8,
                backgroundColor: color.withValues(alpha: 0.2),
                valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
              Center(
                child: Text(
                  '$score',
                  style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
            ],
          ),
        ),
        const SizedBox(height: 8),
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 12, fontWeight: FontWeight.w600)),
      ],
    );
  }
}
