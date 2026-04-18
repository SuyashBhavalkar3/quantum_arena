import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/helpers.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/dashboard_model.dart';
import '../../../../data/models/job_model.dart';
import '../../../../data/models/schedule_model.dart';
import '../../../../providers/auth_provider.dart';
import '../../../widgets/shared_widgets.dart';

class CandidateDashboardScreen extends ConsumerStatefulWidget {
  const CandidateDashboardScreen({super.key});

  @override
  ConsumerState<CandidateDashboardScreen> createState() => _State();
}

class _State extends ConsumerState<CandidateDashboardScreen> {
  bool _loading = true;
  CandidateDashboardStats? _stats;
  List<JobModel> _jobs = [];
  List<CandidateDashboardActivity> _activity = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final api = ApiService();
      final results = await Future.wait([
        api.getCandidateStats(),
        api.getAllJobs(),
        api.getCandidateActivity(limit: 10),
      ]);
      if (mounted) {
        setState(() {
          _stats = results[0] as CandidateDashboardStats;
          _jobs = (results[1] as JobsResponse).jobs.take(3).toList();
          _activity = results[2] as List<CandidateDashboardActivity>;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;

    if (_loading) {
      return const Scaffold(body: AppLoadingIndicator());
    }

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.accent,
          onRefresh: _loadData,
          child: ListView(
            padding: const EdgeInsets.all(20),
            children: [
              // Header
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          'Welcome back, ${user?.firstName ?? "Candidate"}!',
                          style: Theme.of(context).textTheme.headlineLarge,
                        ),
                        const SizedBox(height: 4),
                        Text("Here's your job search overview", style: Theme.of(context).textTheme.bodyMedium),
                      ],
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                    decoration: BoxDecoration(
                      border: Border.all(color: AppColors.accentBorder),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(Helpers.todayFormatted(), style: const TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w600)),
                  ),
                ],
              ),
              const SizedBox(height: 24),

              // Stats grid
              if (_stats != null)
                GridView.count(
                  crossAxisCount: 2,
                  shrinkWrap: true,
                  physics: const NeverScrollableScrollPhysics(),
                  crossAxisSpacing: 12,
                  mainAxisSpacing: 12,
                  childAspectRatio: 1.5,
                  children: [
                    StatCard(label: 'Applications', value: '${_stats!.totalApplications}', subtitle: '+${_stats!.applicationsThisWeek} this week', icon: Icons.description_rounded),
                    StatCard(label: 'In Progress', value: '${_stats!.inProgress}', subtitle: '${_stats!.interviewsTotal} in pipeline', icon: Icons.work_rounded),
                    StatCard(label: 'Interviews', value: '${_stats!.interviewsTotal}', subtitle: '${_stats!.upcomingInterviews} upcoming', icon: Icons.mic_rounded),
                    StatCard(label: 'Offers', value: '${_stats!.offersReceived}', subtitle: '${_stats!.offersPendingResponse} pending', icon: Icons.star_rounded),
                  ],
                ),
              const SizedBox(height: 24),

              // Quick actions
              Row(
                children: [
                  _QuickAction(icon: Icons.work_rounded, label: 'Jobs', onTap: () => context.go('/candidate/jobs')),
                  const SizedBox(width: 10),
                  _QuickAction(icon: Icons.quiz_rounded, label: 'Mock Interview', onTap: () => context.go('/candidate/mock-interview')),
                  const SizedBox(width: 10),
                  _QuickAction(icon: Icons.people_rounded, label: 'Experience', onTap: () => context.go('/candidate/experience')),
                ],
              ),
              const SizedBox(height: 24),

              // Recommended jobs
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Recommended Jobs', style: Theme.of(context).textTheme.headlineSmall),
                  TextButton(
                    onPressed: () => context.go('/candidate/jobs'),
                    child: const Text('View all'),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              ..._jobs.map((job) => _JobCard(job: job)),

              // Activity
              if (_activity.isNotEmpty) ...[
                const SizedBox(height: 24),
                Text('Recent Activity', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 12),
                ..._activity.take(3).map((a) => _ActivityItem(activity: a)),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final VoidCallback onTap;
  const _QuickAction({required this.icon, required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(
            color: AppColors.surface,
            borderRadius: BorderRadius.circular(12),
            border: Border.all(color: AppColors.accentBorder),
          ),
          child: Column(
            children: [
              Icon(icon, color: AppColors.accent, size: 24),
              const SizedBox(height: 6),
              Text(label, style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w600)),
            ],
          ),
        ),
      ),
    );
  }
}

class _JobCard extends StatelessWidget {
  final JobModel job;
  const _JobCard({required this.job});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 10),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.accentBorder),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(job.title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Row(
                  children: [
                    const Icon(Icons.location_on_outlined, size: 14, color: AppColors.textSecondary),
                    const SizedBox(width: 4),
                    Text(job.location ?? 'Remote', style: Theme.of(context).textTheme.bodySmall),
                    if (job.requiredSkills != null && job.requiredSkills!.isNotEmpty) ...[
                      const SizedBox(width: 12),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                        decoration: BoxDecoration(
                          color: AppColors.accent.withValues(alpha: 0.1),
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: Text(job.requiredSkills!.first, style: const TextStyle(color: AppColors.accent, fontSize: 11, fontWeight: FontWeight.w600)),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          ElevatedButton(
            onPressed: () => context.go('/candidate/jobs'),
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8)),
            child: const Text('Apply', style: TextStyle(fontSize: 13)),
          ),
        ],
      ),
    );
  }
}

class _ActivityItem extends StatelessWidget {
  final CandidateDashboardActivity activity;
  const _ActivityItem({required this.activity});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: AppColors.accentBorder),
      ),
      child: Row(
        children: [
          Container(
            width: 8,
            height: 8,
            decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(activity.jobTitle, style: Theme.of(context).textTheme.titleSmall?.copyWith(color: AppColors.textPrimary)),
                const SizedBox(height: 2),
                Text(activity.nextStepMessage, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
          StatusBadge(status: activity.status),
        ],
      ),
    );
  }
}
