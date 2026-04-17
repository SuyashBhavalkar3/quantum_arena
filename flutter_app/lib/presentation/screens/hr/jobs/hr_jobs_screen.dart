import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/job_model.dart';
import '../../../widgets/shared_widgets.dart';

class HRJobsScreen extends StatefulWidget {
  const HRJobsScreen({super.key});
  @override
  State<HRJobsScreen> createState() => _State();
}

class _State extends State<HRJobsScreen> {
  bool _loading = true;
  List<JobModel> _jobs = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final r = await ApiService().getAllJobs();
      if (mounted) setState(() { _jobs = r.jobs; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: AppLoadingIndicator());
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.accent, onRefresh: _load,
          child: _jobs.isEmpty
            ? ListView(children: const [SizedBox(height: 200), EmptyState(icon: Icons.work_off_rounded, message: 'No jobs posted yet', subtitle: 'Create your first job posting')])
            : ListView.builder(
                padding: const EdgeInsets.all(20), itemCount: _jobs.length + 1,
                itemBuilder: (ctx, i) {
                  if (i == 0) return Padding(
                    padding: const EdgeInsets.only(bottom: 20),
                    child: Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                      Text('Your Jobs', style: Theme.of(ctx).textTheme.headlineLarge),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                        decoration: BoxDecoration(border: Border.all(color: AppColors.accentBorder), borderRadius: BorderRadius.circular(6)),
                        child: Text('${_jobs.length} total', style: const TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w600)),
                      ),
                    ]),
                  );
                  final j = _jobs[i - 1];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
                    child: Row(children: [
                      Container(width: 44, height: 44, decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
                        child: const Icon(Icons.work, color: AppColors.accent, size: 22)),
                      const SizedBox(width: 12),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(j.title, style: Theme.of(ctx).textTheme.titleMedium),
                        Text('${j.location ?? "Remote"} • ${j.salaryRange ?? "N/A"}', style: Theme.of(ctx).textTheme.bodySmall),
                      ])),
                    ]),
                  );
                },
              ),
        ),
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => context.go('/hr/jobs/new'),
        backgroundColor: AppColors.accent,
        foregroundColor: AppColors.background,
        icon: const Icon(Icons.add),
        label: const Text('Post Job', style: TextStyle(fontWeight: FontWeight.w700)),
      ),
    );
  }
}
