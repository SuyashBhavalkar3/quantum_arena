import 'package:flutter/material.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/report_model.dart';
import '../../../widgets/shared_widgets.dart';

class StrategyScreen extends StatefulWidget {
  const StrategyScreen({super.key});
  @override
  State<StrategyScreen> createState() => _State();
}

class _State extends State<StrategyScreen> {
  final _roleCtrl = TextEditingController();
  final _countCtrl = TextEditingController(text: '5');
  final _timeCtrl = TextEditingController(text: '30');
  String _category = 'Technology';
  bool _loading = false;
  RecruitmentStrategyResponse? _result;

  Future<void> _generate() async {
    if (_roleCtrl.text.isEmpty) { ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter a role'))); return; }
    setState(() { _loading = true; _result = null; });
    try {
      _result = await ApiService().generateRecruitmentStrategy(RecruitmentStrategyRequest(
        roleToHireFor: _roleCtrl.text.trim(),
        numberOfCandidates: int.tryParse(_countCtrl.text) ?? 5,
        hiringTimelineDays: int.tryParse(_timeCtrl.text) ?? 30,
        companyCategory: _category,
      ));
      if (mounted) setState(() => _loading = false);
    } catch (e) {
      if (mounted) { setState(() => _loading = false); ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e'))); }
    }
  }

  @override
  void dispose() { _roleCtrl.dispose(); _countCtrl.dispose(); _timeCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(20), children: [
          Text('Recruitment Strategy', style: Theme.of(context).textTheme.headlineLarge),
          const SizedBox(height: 8),
          Text('AI-powered hiring strategy generator', style: Theme.of(context).textTheme.bodyMedium),
          const SizedBox(height: 24),

          TextField(controller: _roleCtrl, style: const TextStyle(color: AppColors.textPrimary), decoration: const InputDecoration(labelText: 'Role to Hire', prefixIcon: Icon(Icons.work, color: AppColors.textSecondary))),
          const SizedBox(height: 12),
          Row(children: [
            Expanded(child: TextField(controller: _countCtrl, style: const TextStyle(color: AppColors.textPrimary), keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Candidates', prefixIcon: Icon(Icons.people, color: AppColors.textSecondary)))),
            const SizedBox(width: 12),
            Expanded(child: TextField(controller: _timeCtrl, style: const TextStyle(color: AppColors.textPrimary), keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: 'Timeline (days)', prefixIcon: Icon(Icons.calendar_today, color: AppColors.textSecondary)))),
          ]),
          const SizedBox(height: 12),
          DropdownButtonFormField<String>(
            value: _category, dropdownColor: AppColors.modal,
            decoration: const InputDecoration(labelText: 'Company Category'),
            items: ['Technology', 'Finance', 'Healthcare', 'Education', 'Other'].map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(color: AppColors.textPrimary)))).toList(),
            onChanged: (v) => setState(() => _category = v ?? 'Technology'),
          ),
          const SizedBox(height: 20),
          SizedBox(width: double.infinity, child: ElevatedButton.icon(
            onPressed: _loading ? null : _generate,
            icon: _loading ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.background)) : const Icon(Icons.auto_awesome),
            label: Text(_loading ? 'Generating...' : 'Generate Strategy'),
          )),
          const SizedBox(height: 24),

          if (_result != null) ...[
            _Section(title: 'Executive Summary', content: _result!.executiveSummary),
            if (_result!.sourcingStrategy != null) _BulletList(title: 'Sourcing Strategy', items: _result!.sourcingStrategy!),
            if (_result!.timeOptimizationPlan != null) _BulletList(title: 'Time Optimization', items: _result!.timeOptimizationPlan!),
            if (_result!.costOptimizationSuggestions != null) _BulletList(title: 'Cost Optimization', items: _result!.costOptimizationSuggestions!),
            if (_result!.competitiveHiringAdvice != null) _BulletList(title: 'Competitive Advice', items: _result!.competitiveHiringAdvice!),
            if (_result!.riskWarnings != null) _BulletList(title: 'Risk Warnings', items: _result!.riskWarnings!, isWarning: true),
          ],
        ]),
      ),
    );
  }
}

class _Section extends StatelessWidget {
  final String title; final String content;
  const _Section({required this.title, required this.content});
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Text(title, style: Theme.of(context).textTheme.headlineSmall),
      const SizedBox(height: 8),
      Text(content, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textPrimary)),
    ]),
  );
}

class _BulletList extends StatelessWidget {
  final String title; final List<String> items; final bool isWarning;
  const _BulletList({required this.title, required this.items, this.isWarning = false});
  @override
  Widget build(BuildContext context) => Container(
    margin: const EdgeInsets.only(bottom: 12), padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: isWarning ? AppColors.error.withValues(alpha: 0.3) : AppColors.accentBorder)),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(children: [
        if (isWarning) const Icon(Icons.warning_amber, color: AppColors.error, size: 18),
        if (isWarning) const SizedBox(width: 6),
        Text(title, style: Theme.of(context).textTheme.headlineSmall?.copyWith(color: isWarning ? AppColors.error : null)),
      ]),
      const SizedBox(height: 8),
      ...items.map((s) => Padding(
        padding: const EdgeInsets.only(bottom: 6),
        child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text('•  ', style: TextStyle(color: isWarning ? AppColors.error : AppColors.accent, fontWeight: FontWeight.w700)),
          Expanded(child: Text(s, style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textPrimary))),
        ]),
      )),
    ]),
  );
}
