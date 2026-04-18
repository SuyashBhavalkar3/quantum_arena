import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/profile_model.dart';
import '../../../../providers/auth_provider.dart';
import '../../../widgets/shared_widgets.dart';

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});
  @override
  ConsumerState<ProfileScreen> createState() => _State();
}

class _State extends ConsumerState<ProfileScreen> {
  bool _loading = true;
  CandidateProfileData? _profile;

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      _profile = await ApiService().getProfile();
      if (mounted) setState(() => _loading = false);
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
            // Header
            Center(child: Column(children: [
              Container(
                width: 80, height: 80,
                decoration: BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
                child: Center(child: Text(user?.firstName.substring(0, 1).toUpperCase() ?? 'C', style: const TextStyle(color: AppColors.background, fontSize: 32, fontWeight: FontWeight.w700))),
              ),
              const SizedBox(height: 12),
              Text(user?.name ?? 'Candidate', style: Theme.of(context).textTheme.headlineLarge),
              const SizedBox(height: 4),
              Text(user?.email ?? '', style: Theme.of(context).textTheme.bodyMedium),
            ])),
            const SizedBox(height: 24),

            // Quick Nav
            Wrap(spacing: 8, runSpacing: 8, children: [
              _NavChip(label: 'Mock Interview', icon: Icons.mic, onTap: () => context.go('/candidate/mock-interview')),
              _NavChip(label: 'Experience Wall', icon: Icons.people, onTap: () => context.go('/candidate/experience')),
            ]),
            const SizedBox(height: 24),

            if (_profile != null) ...[
              if (_profile!.experiences.isNotEmpty) ...[
                _SectionHeader(title: 'Experience', icon: Icons.work),
                ..._profile!.experiences.map((e) => _ProfileItem(title: e.jobTitle, subtitle: '${e.companyName} • ${e.startDate} - ${e.isCurrent ? "Present" : e.endDate ?? ""}')),
                const SizedBox(height: 16),
              ],
              if (_profile!.education.isNotEmpty) ...[
                _SectionHeader(title: 'Education', icon: Icons.school),
                ..._profile!.education.map((e) => _ProfileItem(title: e.degree, subtitle: '${e.institution} • ${e.fieldOfStudy ?? ""}')),
                const SizedBox(height: 16),
              ],
              if (_profile!.skills.isNotEmpty) ...[
                _SectionHeader(title: 'Skills', icon: Icons.code),
                ..._profile!.skills.map((s) => _SkillSection(skill: s)),
                const SizedBox(height: 16),
              ],
            ] else
              const EmptyState(icon: Icons.person_outline, message: 'Profile not loaded'),

            // Logout
            const SizedBox(height: 24),
            OutlinedButton.icon(
              onPressed: () { ref.read(authProvider.notifier).logout(); context.go('/login'); },
              icon: const Icon(Icons.logout, color: AppColors.error),
              label: const Text('Logout', style: TextStyle(color: AppColors.error)),
              style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.error)),
            ),
          ]),
        ),
      ),
    );
  }
}

class _NavChip extends StatelessWidget {
  final String label; final IconData icon; final VoidCallback onTap;
  const _NavChip({required this.label, required this.icon, required this.onTap});
  @override
  Widget build(BuildContext context) => ActionChip(onPressed: onTap, avatar: Icon(icon, size: 16, color: AppColors.accent), label: Text(label));
}

class _SectionHeader extends StatelessWidget {
  final String title; final IconData icon;
  const _SectionHeader({required this.title, required this.icon});
  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Row(children: [Icon(icon, size: 18, color: AppColors.accent), const SizedBox(width: 8), Text(title, style: Theme.of(context).textTheme.headlineSmall)]),
  );
}

class _ProfileItem extends StatelessWidget {
  final String title; final String subtitle;
  const _ProfileItem({required this.title, required this.subtitle});
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.accentBorder)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: Theme.of(context).textTheme.titleMedium),
      const SizedBox(height: 4),
      Text(subtitle, style: Theme.of(context).textTheme.bodySmall),
    ]),
  );
}

class _SkillSection extends StatelessWidget {
  final ProfileSkill skill;
  const _SkillSection({required this.skill});
  @override
  Widget build(BuildContext context) {
    final items = <String, String?>{
      'Languages': skill.languages, 'Backend': skill.backendTechnologies,
      'Databases': skill.databases, 'AI/ML': skill.aiMlFrameworks,
      'Tools': skill.toolsPlatforms, 'Core': skill.coreCompetencies,
    };
    final nonNull = items.entries.where((e) => e.value != null && e.value!.isNotEmpty).toList();
    if (nonNull.isEmpty) return const SizedBox.shrink();
    return Container(
      margin: const EdgeInsets.only(bottom: 8), padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(10), border: Border.all(color: AppColors.accentBorder)),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: nonNull.map((e) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(e.key, style: const TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w600)),
          const SizedBox(height: 2),
          Text(e.value!, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textPrimary)),
        ]),
      )).toList()),
    );
  }
}
