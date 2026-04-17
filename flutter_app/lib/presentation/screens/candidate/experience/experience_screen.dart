import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';

class ExperienceScreen extends StatelessWidget {
  const ExperienceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Center(
          child: Padding(
            padding: const EdgeInsets.all(32),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Container(
                  padding: const EdgeInsets.all(24),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.1),
                    shape: BoxShape.circle,
                  ),
                  child: const Icon(Icons.people_rounded, size: 56, color: AppColors.accent),
                ),
                const SizedBox(height: 24),
                Text('Alumni Experience Wall', style: Theme.of(context).textTheme.headlineLarge, textAlign: TextAlign.center),
                const SizedBox(height: 12),
                Text(
                  'Share your interview experiences and learn from others. This feature uses real-time data sync and is coming to mobile soon.',
                  style: Theme.of(context).textTheme.bodyMedium,
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: 24),
                Container(
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: AppColors.surface,
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(color: AppColors.accentBorder),
                  ),
                  child: Row(children: [
                    const Icon(Icons.info_outline, color: AppColors.accent, size: 20),
                    const SizedBox(width: 12),
                    Expanded(child: Text('Visit the web app to browse and submit experiences.', style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textPrimary))),
                  ]),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
