import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          child: Column(
            children: [
              // Hero Section
              Padding(
                padding: const EdgeInsets.fromLTRB(24, 48, 24, 32),
                child: Column(
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                      decoration: BoxDecoration(
                        border: Border.all(color: AppColors.accentBorder),
                        borderRadius: BorderRadius.circular(20),
                      ),
                      child: const Text(
                        'Modern Hiring Platform',
                        style: TextStyle(color: AppColors.accent, fontSize: 12, fontWeight: FontWeight.w600),
                      ),
                    ),
                    const SizedBox(height: 24),
                    Text(
                      'Find the Perfect Candidate with',
                      style: Theme.of(context).textTheme.displayMedium,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      'Smart Assessments',
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(color: AppColors.accent),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 4),
                    Text(
                      '& Proctored Interviews',
                      style: Theme.of(context).textTheme.displayMedium?.copyWith(color: AppColors.accent),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      'HRs post jobs, candidates apply, and our platform handles compatibility checks, assessments, and proctored voice interviews.',
                      style: Theme.of(context).textTheme.bodyLarge?.copyWith(color: AppColors.textSecondary),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 32),
                    Row(
                      children: [
                        Expanded(
                          child: ElevatedButton(
                            onPressed: () => context.go('/register'),
                            child: const Text('For HR'),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: OutlinedButton(
                            onPressed: () => context.go('/register'),
                            child: const Text('For Candidates'),
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: TextButton(
                        onPressed: () => context.go('/login'),
                        child: const Text('Already have an account? Login'),
                      ),
                    ),
                  ],
                ),
              ),

              // Features
              Container(
                color: AppColors.surface,
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text('Everything you need', style: Theme.of(context).textTheme.headlineLarge, textAlign: TextAlign.center),
                    const SizedBox(height: 8),
                    Text('From job posting to final interview', style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
                    const SizedBox(height: 24),
                    ..._features.map((f) => _FeatureCard(icon: f.$1, title: f.$2, desc: f.$3)),
                  ],
                ),
              ),

              // How it works
              Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  children: [
                    Text('How it works', style: Theme.of(context).textTheme.headlineLarge, textAlign: TextAlign.center),
                    const SizedBox(height: 24),
                    _StepItem(number: '1', title: 'HR Posts a Job', desc: 'Create a detailed job description with required skills.'),
                    _StepItem(number: '2', title: 'Candidate Applies', desc: 'Candidates apply and our system checks compatibility.'),
                    _StepItem(number: '3', title: 'Interviews & Rounds', desc: 'Qualified candidates go through assessments and voice interviews.'),
                  ],
                ),
              ),

              // CTA
              Container(
                width: double.infinity,
                padding: const EdgeInsets.all(32),
                color: AppColors.accent,
                child: Column(
                  children: [
                    Text(
                      'Ready to transform your hiring?',
                      style: Theme.of(context).textTheme.headlineLarge?.copyWith(color: AppColors.background),
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    ElevatedButton(
                      onPressed: () => context.go('/register'),
                      style: ElevatedButton.styleFrom(
                        backgroundColor: AppColors.background,
                        foregroundColor: AppColors.accent,
                      ),
                      child: const Text('Get Started'),
                    ),
                  ],
                ),
              ),

              // Footer
              Container(
                padding: const EdgeInsets.all(24),
                color: AppColors.surface,
                child: Column(
                  children: [
                    Text('HireFlow', style: Theme.of(context).textTheme.headlineSmall),
                    const SizedBox(height: 8),
                    Text(
                      'Comprehensive hiring platform connecting HR with the best candidates.',
                      style: Theme.of(context).textTheme.bodySmall,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 16),
                    Text('© 2026 HireFlow. All rights reserved.', style: Theme.of(context).textTheme.bodySmall),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

final _features = [
  (Icons.work_rounded, 'Post Jobs Instantly', 'Create and publish job listings in minutes.'),
  (Icons.people_rounded, 'Compatibility Check', 'Auto-match candidates based on skills and experience.'),
  (Icons.bar_chart_rounded, 'Smart Assessments', 'Personalized assessments for each candidate.'),
  (Icons.mic_rounded, 'Voice Interviews', 'Automated voice interviews with AI analysis.'),
  (Icons.videocam_rounded, 'Proctoring', 'Advanced proctoring for fair assessments.'),
  (Icons.dashboard_rounded, 'Candidate Dashboard', 'Track applications, assessments, and feedback.'),
];

class _FeatureCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String desc;
  const _FeatureCard({required this.icon, required this.title, required this.desc});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 12),
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: AppColors.modal,
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: AppColors.accentBorder),
      ),
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: AppColors.accent.withValues(alpha: 0.1),
              borderRadius: BorderRadius.circular(10),
            ),
            child: Icon(icon, color: AppColors.accent, size: 22),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(desc, style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _StepItem extends StatelessWidget {
  final String number;
  final String title;
  final String desc;
  const _StepItem({required this.number, required this.title, required this.desc});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Container(
            width: 40,
            height: 40,
            decoration: const BoxDecoration(
              color: AppColors.accent,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(number, style: const TextStyle(color: AppColors.background, fontWeight: FontWeight.w700, fontSize: 18)),
            ),
          ),
          const SizedBox(width: 16),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: Theme.of(context).textTheme.titleMedium),
                const SizedBox(height: 4),
                Text(desc, style: Theme.of(context).textTheme.bodyMedium),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
