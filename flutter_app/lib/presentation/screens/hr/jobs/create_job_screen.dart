import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/services/api_service.dart';
import '../../../../data/models/job_model.dart';

class CreateJobScreen extends StatefulWidget {
  const CreateJobScreen({super.key});
  @override
  State<CreateJobScreen> createState() => _State();
}

class _State extends State<CreateJobScreen> {
  final _titleCtrl = TextEditingController();
  final _locationCtrl = TextEditingController();
  final _salaryCtrl = TextEditingController();
  final _expCtrl = TextEditingController();
  final _descCtrl = TextEditingController();
  final _skillsCtrl = TextEditingController();
  bool _submitting = false;
  String? _error;

  Future<void> _submit() async {
    if (_titleCtrl.text.isEmpty) { _showError('Title is required'); return; }
    setState(() { _submitting = true; _error = null; });
    try {
      await ApiService().createJob(CreateJobRequest(
        title: _titleCtrl.text.trim(),
        description: _descCtrl.text.trim(),
        requiredSkills: _skillsCtrl.text.split(',').map((s) => s.trim()).where((s) => s.isNotEmpty).toList(),
        experienceRequired: int.tryParse(_expCtrl.text) ?? 0,
        location: _locationCtrl.text.trim(),
        salaryRange: _salaryCtrl.text.trim(),
      ));
      if (mounted) { context.go('/hr/jobs'); ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Job created!'), backgroundColor: AppColors.success)); }
    } catch (e) {
      setState(() { _error = e.toString(); _submitting = false; });
    }
  }

  void _showError(String msg) => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));

  @override
  void dispose() { _titleCtrl.dispose(); _locationCtrl.dispose(); _salaryCtrl.dispose(); _expCtrl.dispose(); _descCtrl.dispose(); _skillsCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => context.go('/hr/jobs')),
        title: const Text('Post New Job'),
      ),
      body: SingleChildScrollView(padding: const EdgeInsets.all(20), child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        _field('Job Title', _titleCtrl, Icons.work, 'Senior Flutter Developer'),
        _field('Location', _locationCtrl, Icons.location_on, 'Bengaluru / Remote'),
        _field('Salary Range', _salaryCtrl, Icons.attach_money, '12 LPA - 18 LPA'),
        _field('Experience (years)', _expCtrl, Icons.timeline, '3', keyboard: TextInputType.number),
        _field('Description', _descCtrl, Icons.description, 'Describe the role...', maxLines: 5),
        _field('Required Skills', _skillsCtrl, Icons.code, 'Flutter, Dart, Firebase', hint: 'Comma separated'),
        if (_error != null) Padding(
          padding: const EdgeInsets.only(top: 8),
          child: Text(_error!, style: const TextStyle(color: AppColors.error, fontSize: 13)),
        ),
        const SizedBox(height: 24),
        Row(children: [
          Expanded(child: ElevatedButton.icon(
            onPressed: _submitting ? null : _submit,
            icon: _submitting ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.background)) : const Icon(Icons.save),
            label: Text(_submitting ? 'Posting...' : 'Post Job'),
          )),
          const SizedBox(width: 12),
          OutlinedButton(onPressed: () => context.go('/hr/jobs'), child: const Text('Cancel')),
        ]),
      ])),
    );
  }

  Widget _field(String label, TextEditingController ctrl, IconData icon, String placeholder, {TextInputType keyboard = TextInputType.text, int maxLines = 1, String? hint}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(label, style: const TextStyle(color: AppColors.textSecondary, fontSize: 13, fontWeight: FontWeight.w600)),
        const SizedBox(height: 6),
        TextField(
          controller: ctrl, keyboardType: keyboard, maxLines: maxLines,
          style: const TextStyle(color: AppColors.textPrimary),
          decoration: InputDecoration(hintText: placeholder, prefixIcon: Icon(icon, color: AppColors.textSecondary, size: 20), helperText: hint, helperStyle: const TextStyle(fontSize: 11)),
        ),
      ]),
    );
  }
}
