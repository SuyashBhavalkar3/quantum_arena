import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/application_model.dart';
import '../../../../data/models/job_model.dart';
import '../../../widgets/shared_widgets.dart';

class ApplicantsScreen extends StatefulWidget {
  const ApplicantsScreen({super.key});
  @override
  State<ApplicantsScreen> createState() => _State();
}

class _State extends State<ApplicantsScreen> {
  bool _loading = true;
  List<ApplicationModel> _apps = [];
  Map<int, JobModel> _jobsMap = {};

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final api = ApiService();
      final jobs = (await api.getAllJobs()).jobs;
      final jobsMap = {for (var j in jobs) j.id: j};
      final allApps = <ApplicationModel>[];
      for (final j in jobs) {
        try {
          final apps = await api.getJobApplicants(j.id);
          allApps.addAll(apps);
        } catch (_) {}
      }
      if (mounted) setState(() { _apps = allApps; _jobsMap = jobsMap; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: AppLoadingIndicator());
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.accent, onRefresh: _load,
          child: _apps.isEmpty
            ? ListView(children: const [SizedBox(height: 200), EmptyState(icon: Icons.people_outline, message: 'No applicants yet')])
            : ListView.builder(
                padding: const EdgeInsets.all(20), itemCount: _apps.length + 1,
                itemBuilder: (ctx, i) {
                  if (i == 0) return Padding(padding: const EdgeInsets.only(bottom: 20), child: Text('All Applicants', style: Theme.of(ctx).textTheme.headlineLarge));
                  final a = _apps[i - 1]; final job = _jobsMap[a.jobId];
                  return GestureDetector(
                    onTap: () => context.go('/hr/reports/${a.id}'),
                    child: Container(
                      margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(16),
                      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Row(children: [
                          Container(
                            width: 40, height: 40,
                            decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.15), shape: BoxShape.circle),
                            child: Center(child: Text((a.candidateName ?? 'C').substring(0, 1).toUpperCase(), style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.w700))),
                          ),
                          const SizedBox(width: 12),
                          Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(a.candidateName ?? 'Candidate #${a.candidateId}', style: Theme.of(ctx).textTheme.titleMedium),
                            Text(job?.title ?? 'Job #${a.jobId}', style: Theme.of(ctx).textTheme.bodySmall),
                          ])),
                          StatusBadge(status: a.status),
                        ]),
                        const SizedBox(height: 8),
                        Row(children: [
                          _ScoreChip(label: 'Resume', score: a.resumeMatchScore),
                          const SizedBox(width: 8),
                          _ScoreChip(label: 'Assessment', score: a.assessmentScore),
                          const SizedBox(width: 8),
                          _ScoreChip(label: 'Interview', score: a.interviewScore),
                        ]),
                      ]),
                    ),
                  );
                },
              ),
        ),
      ),
    );
  }
}

class _ScoreChip extends StatelessWidget {
  final String label; final num? score;
  const _ScoreChip({required this.label, this.score});
  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
    decoration: BoxDecoration(color: AppColors.modal, borderRadius: BorderRadius.circular(6)),
    child: Text('$label: ${score != null ? "${score!.round()}%" : "—"}', style: const TextStyle(color: AppColors.textSecondary, fontSize: 11)),
  );
}
