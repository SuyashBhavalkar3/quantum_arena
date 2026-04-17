import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/helpers.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/application_model.dart';
import '../../../../data/models/job_model.dart';
import '../../../widgets/shared_widgets.dart';

class ApplicationsScreen extends StatefulWidget {
  const ApplicationsScreen({super.key});
  @override
  State<ApplicationsScreen> createState() => _State();
}

class _State extends State<ApplicationsScreen> {
  bool _loading = true;
  List<ApplicationModel> _apps = [];
  Map<int, JobModel> _jobsMap = {};

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final api = ApiService();
      final r = await Future.wait([api.getMyApplications(), api.getAllJobs()]);
      final apps = r[0] as List<ApplicationModel>;
      final jobs = (r[1] as JobsResponse).jobs;
      if (mounted) setState(() { _apps = apps..sort((a, b) => b.createdAt.compareTo(a.createdAt)); _jobsMap = {for (var j in jobs) j.id: j}; _loading = false; });
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
            ? ListView(children: const [SizedBox(height: 200), EmptyState(icon: Icons.description_outlined, message: 'No applications yet')])
            : ListView.builder(
                padding: const EdgeInsets.all(20), itemCount: _apps.length + 1,
                itemBuilder: (ctx, i) {
                  if (i == 0) return Padding(padding: const EdgeInsets.only(bottom: 20), child: Text('My Applications', style: Theme.of(ctx).textTheme.headlineLarge));
                  final a = _apps[i - 1]; final job = _jobsMap[a.jobId];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Row(children: [Expanded(child: Text(job?.title ?? 'Job #${a.jobId}', style: Theme.of(ctx).textTheme.titleMedium)), StatusBadge(status: a.status)]),
                      const SizedBox(height: 6),
                      Text('Applied ${Helpers.formatDate(a.createdAt)} • Resume: ${Helpers.formatScore(a.resumeMatchScore)}', style: Theme.of(ctx).textTheme.bodySmall),
                      const SizedBox(height: 4),
                      Text('Assessment: ${a.assessmentProgressLabel} • Interview: ${a.interviewProgressLabel}', style: Theme.of(ctx).textTheme.bodySmall),
                    ]),
                  );
                },
              ),
        ),
      ),
    );
  }
}
