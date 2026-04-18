class ScheduleModel {
  final int id;
  final int applicationId;
  final String scheduleType;
  final String scheduledTime;
  final int durationMinutes;
  final bool reminderSent;
  final bool completed;
  final int rescheduledCount;

  ScheduleModel({
    required this.id,
    required this.applicationId,
    required this.scheduleType,
    required this.scheduledTime,
    required this.durationMinutes,
    required this.reminderSent,
    required this.completed,
    required this.rescheduledCount,
  });

  factory ScheduleModel.fromJson(Map<String, dynamic> json) {
    return ScheduleModel(
      id: json['id'] as int,
      applicationId: json['application_id'] as int,
      scheduleType: json['schedule_type'] as String? ?? '',
      scheduledTime: json['scheduled_time'] as String? ?? '',
      durationMinutes: json['duration_minutes'] as int? ?? 0,
      reminderSent: json['reminder_sent'] as bool? ?? false,
      completed: json['completed'] as bool? ?? false,
      rescheduledCount: json['rescheduled_count'] as int? ?? 0,
    );
  }
}
