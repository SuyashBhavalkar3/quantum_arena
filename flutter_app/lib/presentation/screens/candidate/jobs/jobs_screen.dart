import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/job_model.dart';
import '../../../../data/models/application_model.dart';
import '../../../widgets/shared_widgets.dart';

class JobsScreen extends StatefulWidget {
  const JobsScreen({super.key});
  @override
  State<JobsScreen> createState() => _JobsScreenState();
}

class _JobsScreenState extends State<JobsScreen> {
  bool _loading = true;
  List<JobModel> _jobs = [];
  Set<int> _appliedIds = {};
  String _search = '';
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadJobs();
  }

  Future<void> _loadJobs() async {
    try {
      setState(() { _loading = true; _error = null; });
      final api = ApiService();
      final results = await Future.wait([api.getAllJobs(), api.getMyApplications()]);
      if (mounted) {
        setState(() {
          _jobs = (results[0] as JobsResponse).jobs;
          _appliedIds = (results[1] as List<ApplicationModel>).map((a) => a.jobId).toSet();
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() { _error = e.toString(); _loading = false; });
    }
  }

  List<JobModel> get _filteredJobs {
    if (_search.isEmpty) return _jobs;
    final q = _search.toLowerCase();
    return _jobs.where((j) =>
        j.title.toLowerCase().contains(q) ||
        (j.description ?? '').toLowerCase().contains(q) ||
        (j.location ?? '').toLowerCase().contains(q)).toList();
  }

  Future<void> _applyForJob(JobModel job) async {
    try {
      await ApiService().applyForJob(job.id);
      setState(() => _appliedIds.add(job.id));
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Applied for ${job.title}!'), backgroundColor: AppColors.success),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.error),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: _loading
            ? const AppLoadingIndicator()
            : RefreshIndicator(
                color: AppColors.accent,
                onRefresh: _loadJobs,
                child: CustomScrollView(
                  slivers: [
                    SliverToBoxAdapter(
                      child: Padding(
                        padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Row(
                              mainAxisAlignment: MainAxisAlignment.spaceBetween,
                              children: [
                                Text('Find Jobs', style: Theme.of(context).textTheme.headlineLarge),
                                Container(
                                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                                  decoration: BoxDecoration(
                                    border: Border.all(color: AppColors.accentBorder),
                                    borderRadius: BorderRadius.circular(6),
                                  ),
                                  child: Text('${_filteredJobs.length} found', style: const TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w600)),
                                ),
                              ],
                            ),
                            const SizedBox(height: 16),
                            TextField(
                              style: const TextStyle(color: AppColors.textPrimary),
                              decoration: const InputDecoration(
                                hintText: 'Search jobs...',
                                prefixIcon: Icon(Icons.search, color: AppColors.textSecondary),
                              ),
                              onChanged: (v) => setState(() => _search = v),
                            ),
                            const SizedBox(height: 16),
                          ],
                        ),
                      ),
                    ),
                    if (_error != null)
                      SliverToBoxAdapter(
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 20),
                          child: Container(
                            padding: const EdgeInsets.all(12),
                            decoration: BoxDecoration(color: AppColors.error.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(8)),
                            child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
                          ),
                        ),
                      ),
                    if (_filteredJobs.isEmpty && !_loading)
                      const SliverFillRemaining(
                        child: EmptyState(icon: Icons.work_off_rounded, message: 'No jobs found'),
                      ),
                    SliverPadding(
                      padding: const EdgeInsets.symmetric(horizontal: 20),
                      sliver: SliverList(
                        delegate: SliverChildBuilderDelegate(
                          (context, index) {
                            final job = _filteredJobs[index];
                            final applied = _appliedIds.contains(job.id);
                            return Container(
                              margin: const EdgeInsets.only(bottom: 12),
                              padding: const EdgeInsets.all(16),
                              decoration: BoxDecoration(
                                color: AppColors.surface,
                                borderRadius: BorderRadius.circular(12),
                                border: Border.all(color: AppColors.accentBorder),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Row(
                                    children: [
                                      Container(
                                        width: 44, height: 44,
                                        decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(10)),
                                        child: Center(child: Text(job.title.substring(0, 2).toUpperCase(), style: const TextStyle(color: AppColors.background, fontWeight: FontWeight.w700))),
                                      ),
                                      const SizedBox(width: 12),
                                      Expanded(
                                        child: Column(
                                          crossAxisAlignment: CrossAxisAlignment.start,
                                          children: [
                                            Text(job.title, style: Theme.of(context).textTheme.titleMedium),
                                            Text('ID: ${job.id}', style: Theme.of(context).textTheme.bodySmall),
                                          ],
                                        ),
                                      ),
                                      ElevatedButton(
                                        onPressed: applied ? null : () => _applyForJob(job),
                                        style: applied ? ElevatedButton.styleFrom(backgroundColor: AppColors.textSecondary.withValues(alpha: 0.2)) : null,
                                        child: Text(applied ? 'Applied' : 'Apply', style: TextStyle(fontSize: 13, color: applied ? AppColors.textSecondary : null)),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 12),
                                  Row(
                                    children: [
                                      const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textSecondary),
                                      const SizedBox(width: 4),
                                      Text(job.location ?? 'Not specified', style: Theme.of(context).textTheme.bodySmall),
                                      const SizedBox(width: 16),
                                      const Icon(Icons.attach_money, size: 14, color: AppColors.textSecondary),
                                      const SizedBox(width: 4),
                                      Expanded(child: Text(job.salaryRange ?? 'Not specified', style: Theme.of(context).textTheme.bodySmall)),
                                    ],
                                  ),
                                  if (job.description != null && job.description!.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Text(job.description!, maxLines: 2, overflow: TextOverflow.ellipsis, style: Theme.of(context).textTheme.bodySmall),
                                  ],
                                  if (job.requiredSkills != null && job.requiredSkills!.isNotEmpty) ...[
                                    const SizedBox(height: 8),
                                    Wrap(
                                      spacing: 6, runSpacing: 4,
                                      children: job.requiredSkills!.map((s) => Chip(
                                        label: Text(s),
                                        materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                                        visualDensity: VisualDensity.compact,
                                      )).toList(),
                                    ),
                                  ],
                                ],
                              ),
                            );
                          },
                          childCount: _filteredJobs.length,
                        ),
                      ),
                    ),
                    const SliverToBoxAdapter(child: SizedBox(height: 20)),
                  ],
                ),
              ),
      ),
    );
  }
}
