import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/helpers.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/report_model.dart';
import '../../../widgets/shared_widgets.dart';

class ReportScreen extends StatefulWidget {
  final int applicationId;
  const ReportScreen({super.key, required this.applicationId});
  @override
  State<ReportScreen> createState() => _State();
}

class _State extends State<ReportScreen> {
  bool _loading = true;
  bool _generating = false;
  CandidateReport? _report;
  String? _error;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      _report = await ApiService().getCandidateReport(widget.applicationId);
      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  Future<void> _generate() async {
    setState(() => _generating = true);
    try {
      await ApiService().generateCandidateReport(widget.applicationId);
      await _load();
      setState(() => _generating = false);
    } catch (e) {
      if (mounted) { setState(() => _generating = false); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: AppLoadingIndicator());
    return Scaffold(
      appBar: AppBar(
        title: Text('Report #${widget.applicationId}'),
        actions: [
          if (_report == null || _report!.status != 'completed')
            TextButton.icon(
              onPressed: _generating ? null : _generate,
              icon: _generating ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2)) : const Icon(Icons.auto_awesome, size: 18),
              label: Text(_generating ? 'Generating...' : 'Generate'),
            ),
        ],
      ),
      body: _error != null && _report == null
        ? Center(child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, color: AppColors.error, size: 48),
            const SizedBox(height: 12),
            Text('No report yet', style: Theme.of(context).textTheme.headlineSmall),
            const SizedBox(height: 8),
            ElevatedButton(onPressed: _generate, child: const Text('Generate Report')),
          ]))
        : ListView(padding: const EdgeInsets.all(20), children: [
          if (_report?.candidateSummary != null) _Card(title: 'Candidate Summary', child: Text(_report!.candidateSummary!, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textPrimary))),
          if (_report?.strengths != null && _report!.strengths!.isNotEmpty) _Card(title: 'Strengths', child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: _report!.strengths!.map((s) => Padding(padding: const EdgeInsets.only(bottom: 4), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('✓ ', style: TextStyle(color: AppColors.success, fontWeight: FontWeight.w700)),
              Expanded(child: Text(s, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textPrimary))),
            ]))).toList(),
          )),
          if (_report?.weaknesses != null && _report!.weaknesses!.isNotEmpty) _Card(title: 'Areas for Improvement', child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: _report!.weaknesses!.map((s) => Padding(padding: const EdgeInsets.only(bottom: 4), child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
              const Text('• ', style: TextStyle(color: AppColors.error, fontWeight: FontWeight.w700)),
              Expanded(child: Text(s, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textPrimary))),
            ]))).toList(),
          )),
          if (_report?.finalRecommendation != null) _Card(title: 'Final Recommendation', child: Text(_report!.finalRecommendation!, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.accent, fontWeight: FontWeight.w600))),
        ]),
    );
  }
}

class _Card extends StatelessWidget {
  final String title; final Widget child;
  const _Card({required this.title, required this.child});
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 10),
      child,
    ]),
  );
}
