import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../core/utils/helpers.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/schedule_model.dart';
import '../../../widgets/shared_widgets.dart';

class NotificationsScreen extends StatefulWidget {
  const NotificationsScreen({super.key});
  @override
  State<NotificationsScreen> createState() => _State();
}

class _State extends State<NotificationsScreen> {
  bool _loading = true;
  List<ScheduleModel> _schedules = [];

  @override
  void initState() { super.initState(); _load(); }

  Future<void> _load() async {
    try {
      _schedules = await ApiService().getMySchedules();
      if (mounted) setState(() => _loading = false);
    } catch (_) { if (mounted) setState(() => _loading = false); }
  }

  @override
  Widget build(BuildContext context) {
    if (_loading) return const Scaffold(body: AppLoadingIndicator());
    return Scaffold(
      body: SafeArea(
        child: RefreshIndicator(
          color: AppColors.accent, onRefresh: _load,
          child: _schedules.isEmpty
            ? ListView(children: const [SizedBox(height: 200), EmptyState(icon: Icons.notifications_off, message: 'No schedules yet')])
            : ListView.builder(
                padding: const EdgeInsets.all(20), itemCount: _schedules.length + 1,
                itemBuilder: (ctx, i) {
                  if (i == 0) return Padding(padding: const EdgeInsets.only(bottom: 20), child: Text('Schedules & Notifications', style: Theme.of(ctx).textTheme.headlineLarge));
                  final s = _schedules[i - 1];
                  return Container(
                    margin: const EdgeInsets.only(bottom: 10), padding: const EdgeInsets.all(16),
                    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
                    child: Row(children: [
                      Container(
                        padding: const EdgeInsets.all(10),
                        decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(10)),
                        child: Icon(s.scheduleType.contains('interview') ? Icons.mic : Icons.quiz, color: AppColors.accent, size: 22),
                      ),
                      const SizedBox(width: 14),
                      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(Helpers.formatStatus(s.scheduleType), style: Theme.of(ctx).textTheme.titleMedium),
                        const SizedBox(height: 4),
                        Text(Helpers.formatDateTime(s.scheduledTime), style: Theme.of(ctx).textTheme.bodySmall),
                        Text('${s.durationMinutes} min', style: Theme.of(ctx).textTheme.bodySmall),
                      ])),
                      if (s.completed)
                        const Icon(Icons.check_circle, color: AppColors.success, size: 22)
                      else
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(6)),
                          child: const Text('Upcoming', style: TextStyle(color: AppColors.accent, fontSize: 11, fontWeight: FontWeight.w600)),
                        ),
                    ]),
                  );
                },
              ),
        ),
      ),
    );
  }
}
