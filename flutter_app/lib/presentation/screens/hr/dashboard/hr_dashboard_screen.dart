import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/helpers.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/dashboard_model.dart';
import '../../../../providers/auth_provider.dart';
import '../../../widgets/shared_widgets.dart';

class HRDashboardScreen extends ConsumerStatefulWidget {
  const HRDashboardScreen({super.key});
  @override
  ConsumerState<HRDashboardScreen> createState() => _State();
}

class _State extends ConsumerState<HRDashboardScreen> {
  bool _loading = true;
  HRDashboardStats? _stats;
  List<HRRecentApplicant> _recent = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      final api = ApiService();
      final r = await Future.wait([api.getHRStats(), api.getRecentApplicants(limit: 5)]);
      if (mounted) setState(() { _stats = r[0] as HRDashboardStats; _recent = r[1] as List<HRRecentApplicant>; _loading = false; });
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    if (_loading) return const Scaffold(body: AppLoadingIndicator());

    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.accent, onRefresh: _load,
          child: ListView(padding: const EdgeInsets.all(20), children: [
            Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
              Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Welcome, ${user?.firstName ?? "HR"}!', style: Theme.of(context).textTheme.headlineLarge),
                const SizedBox(height: 4),
                Text('Your hiring pipeline overview', style: Theme.of(context).textTheme.bodyMedium),
              ])),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                decoration: BoxDecoration(border: Border.all(color: AppColors.accentBorder), borderRadius: BorderRadius.circular(8)),
                child: Text(Helpers.todayFormatted(), style: const TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w600)),
              ),
            ]),
            const SizedBox(height: 24),

            if (_stats != null) GridView.count(
              crossAxisCount: 2, shrinkWrap: true, physics: const NeverScrollableScrollPhysics(),
              crossAxisSpacing: 12, mainAxisSpacing: 12, childAspectRatio: 1.5,
              children: [
                StatCard(label: 'Open Positions', value: '${_stats!.totalJobs}', subtitle: '${_stats!.applicationsThisMonth} apps/mo', icon: Icons.work_rounded),
                StatCard(label: 'Total Applications', value: '${_stats!.totalApplications}', subtitle: '${_stats!.pendingReview} pending review', icon: Icons.description_rounded),
                StatCard(label: 'In Assessment', value: '${_stats!.inAssessment}', subtitle: '${_stats!.inInterview} interviewing', icon: Icons.quiz_rounded),
                StatCard(label: 'Hired', value: '${_stats!.hiredTotal}', subtitle: '${_stats!.hiredThisMonth} this month', icon: Icons.check_circle_rounded),
              ],
            ),
            const SizedBox(height: 24),

            Row(children: [
              _QuickAction(icon: Icons.add_rounded, label: 'Post Job', onTap: () => context.go('/hr/jobs/new')),
              const SizedBox(width: 10),
              _QuickAction(icon: Icons.lightbulb_rounded, label: 'Strategy', onTap: () => context.go('/hr/strategy')),
              const SizedBox(width: 10),
              _QuickAction(icon: Icons.people_rounded, label: 'Applicants', onTap: () => context.go('/hr/applicants')),
            ]),
            const SizedBox(height: 24),

            if (_recent.isNotEmpty) ...[
              Text('Recent Applicants', style: Theme.of(context).textTheme.headlineSmall),
              const SizedBox(height: 12),
              ..._recent.map((a) => Container(
                margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.accentBorder)),
                child: Row(children: [
                  Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    Text(a.jobTitle, style: Theme.of(context).textTheme.titleMedium),
                    const SizedBox(height: 4),
                    Text('Score: ${a.bestScore}% • ${Helpers.formatRelativeDate(a.appliedAt)}', style: Theme.of(context).textTheme.bodySmall),
                  ])),
                  StatusBadge(status: a.status),
                ]),
              )),
            ],
          ]),
        ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon; final String label; final VoidCallback onTap;
  const _QuickAction({required this.icon, required this.label, required this.onTap});
  @override
  Widget build(BuildContext context) => Expanded(
    child: GestureDetector(
      onTap: onTap,
      child: Container(
        padding: const EdgeInsets.all(14),
        decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
        child: Column(children: [Icon(icon, color: AppColors.accent, size: 24), const SizedBox(height: 6), Text(label, style: const TextStyle(color: AppColors.textPrimary, fontSize: 12, fontWeight: FontWeight.w600))]),
      ),
    ),
  );
}
