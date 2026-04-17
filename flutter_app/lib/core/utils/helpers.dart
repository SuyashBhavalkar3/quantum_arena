import 'package:intl/intl.dart';

class Helpers {
  Helpers._();

  static String formatStatus(String status) {
    return status
        .split('_')
        .map((part) => part.isNotEmpty
            ? '${part[0].toUpperCase()}${part.substring(1)}'
            : '')
        .join(' ');
  }

  static String formatRelativeDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return 'Updated recently';
    final parsed = DateTime.tryParse(dateStr);
    if (parsed == null) return 'Updated recently';
    final diff = DateTime.now().difference(parsed);
    if (diff.inDays <= 0) return 'Today';
    if (diff.inDays == 1) return '1 day ago';
    if (diff.inDays < 30) return '${diff.inDays} days ago';
    return DateFormat('MMM d, yyyy').format(parsed);
  }

  static String formatDate(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    final parsed = DateTime.tryParse(dateStr);
    if (parsed == null) return dateStr;
    return DateFormat('MMM d, yyyy').format(parsed);
  }

  static String formatDateTime(String? dateStr) {
    if (dateStr == null || dateStr.isEmpty) return '';
    final parsed = DateTime.tryParse(dateStr);
    if (parsed == null) return dateStr;
    return DateFormat('MMM d, yyyy h:mm a').format(parsed);
  }

  static String formatScore(num? score) {
    if (score == null) return 'Pending';
    return '${score.round()}%';
  }

  static String todayFormatted() {
    return DateFormat('MMMM d').format(DateTime.now());
  }
}
