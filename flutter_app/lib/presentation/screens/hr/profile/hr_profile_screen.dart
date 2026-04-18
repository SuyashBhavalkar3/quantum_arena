import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../providers/auth_provider.dart';

class HRProfileScreen extends ConsumerStatefulWidget {
  const HRProfileScreen({super.key});
  @override
  ConsumerState<HRProfileScreen> createState() => _State();
}

class _State extends ConsumerState<HRProfileScreen> {
  @override
  Widget build(BuildContext context) {
    final user = ref.watch(authProvider).user;
    return Scaffold(
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(20), children: [
          Center(child: Column(children: [
            Container(
              width: 80, height: 80,
              decoration: const BoxDecoration(color: AppColors.accent, shape: BoxShape.circle),
              child: Center(child: Text((user?.firstName ?? 'H').substring(0, 1).toUpperCase(), style: const TextStyle(color: AppColors.background, fontSize: 32, fontWeight: FontWeight.w700))),
            ),
            const SizedBox(height: 14),
            Text(user?.name ?? 'HR Manager', style: Theme.of(context).textTheme.headlineLarge),
            const SizedBox(height: 4),
            Text(user?.email ?? '', style: Theme.of(context).textTheme.bodyMedium),
            if (user?.company != null) ...[
              const SizedBox(height: 4),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(6)),
                child: Text(user!.company!, style: const TextStyle(color: AppColors.accent, fontSize: 13, fontWeight: FontWeight.w600)),
              ),
            ],
          ])),
          const SizedBox(height: 32),

          _InfoCard(icon: Icons.business, label: 'Company', value: user?.company ?? 'Not set'),
          _InfoCard(icon: Icons.verified_user, label: 'Role', value: 'HR / Employer'),
          _InfoCard(icon: Icons.email, label: 'Email', value: user?.email ?? ''),
          _InfoCard(icon: Icons.calendar_today, label: 'Joined', value: user?.createdAt ?? ''),

          const SizedBox(height: 32),
          OutlinedButton.icon(
            onPressed: () { ref.read(authProvider.notifier).logout(); context.go('/login'); },
            icon: const Icon(Icons.logout, color: AppColors.error),
            label: const Text('Logout', style: TextStyle(color: AppColors.error)),
            style: OutlinedButton.styleFrom(side: const BorderSide(color: AppColors.error)),
          ),
        ]),
      ),
    );
  }
}

class _InfoCard extends StatelessWidget {
  final IconData icon; final String label; final String value;
  const _InfoCard({required this.icon, required this.label, required this.value});
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
    child: Row(children: [
      Container(
        padding: const EdgeInsets.all(10),
        decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: AppColors.accent, size: 20),
      ),
      const SizedBox(width: 14),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: Theme.of(context).textTheme.bodySmall),
        const SizedBox(height: 2),
        Text(value, style: Theme.of(context).textTheme.titleMedium),
      ])),
    ]),
  );
}
