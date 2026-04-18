import 'package:flutter/material.dart';
import 'package:dio/dio.dart';
import '../../../../core/constants/api_constants.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/services/api_service.dart';

// ─── Data models ─────────────────────────────────────────────────────────────

class ExperiencePost {
  final int id;
  final String company;
  final String role;
  final String? offerDate;
  final String? ctc;
  final int roundsCount;
  final List<Map<String, dynamic>> roundsDetail;
  final String? tips;
  final List<String> tags;
  final bool isAnonymous;
  final bool isVerified;
  int upvotes;
  final String createdAt;

  ExperiencePost({
    required this.id,
    required this.company,
    required this.role,
    this.offerDate,
    this.ctc,
    required this.roundsCount,
    required this.roundsDetail,
    this.tips,
    required this.tags,
    required this.isAnonymous,
    required this.isVerified,
    required this.upvotes,
    required this.createdAt,
  });

  factory ExperiencePost.fromJson(Map<String, dynamic> json) {
    return ExperiencePost(
      id: json['id'],
      company: json['company'] ?? '',
      role: json['role'] ?? '',
      offerDate: json['offer_date'],
      ctc: json['ctc'],
      roundsCount: json['rounds_count'] ?? 0,
      roundsDetail: List<Map<String, dynamic>>.from(json['rounds_detail'] ?? []),
      tips: json['tips'],
      tags: List<String>.from(json['tags'] ?? []),
      isAnonymous: json['is_anonymous'] ?? false,
      isVerified: json['is_verified'] ?? false,
      upvotes: json['upvotes'] ?? 0,
      createdAt: json['created_at'] ?? '',
    );
  }
}

// ─── Main Screen ─────────────────────────────────────────────────────────────

class ExperienceScreen extends StatefulWidget {
  const ExperienceScreen({super.key});

  @override
  State<ExperienceScreen> createState() => _ExperienceScreenState();
}

class _ExperienceScreenState extends State<ExperienceScreen> {
  final _dio = ApiService().dio;
  List<ExperiencePost> _posts = [];
  int _total = 0;
  bool _loading = true;
  int _page = 1;
  bool _hasMore = false;

  final _companyCtrl = TextEditingController();
  final _roleCtrl = TextEditingController();
  String _sort = 'recency';
  List<String> _companySuggestions = [];

  @override
  void initState() {
    super.initState();
    _fetchPosts(reset: true);
  }

  @override
  void dispose() {
    _companyCtrl.dispose();
    _roleCtrl.dispose();
    super.dispose();
  }

  Future<void> _fetchPosts({bool reset = false}) async {
    final page = reset ? 1 : _page;
    setState(() => _loading = true);
    try {
      final res = await _dio.get(
        ApiConstants.experienceFeed,
        queryParameters: {
          'sort': _sort,
          'page': page,
          'page_size': 10,
          if (_companyCtrl.text.isNotEmpty) 'company': _companyCtrl.text,
          if (_roleCtrl.text.isNotEmpty) 'role': _roleCtrl.text,
        },
      );
      final data = res.data as Map<String, dynamic>;
      final newPosts = (data['posts'] as List).map((p) => ExperiencePost.fromJson(p)).toList();
      setState(() {
        if (reset) {
          _posts = newPosts;
          _page = 1;
        } else {
          _posts = [..._posts, ...newPosts];
        }
        _total = data['total'] ?? 0;
        _hasMore = _posts.length < _total;
        _loading = false;
      });
    } catch (e) {
      setState(() => _loading = false);
    }
  }

  Future<void> _fetchCompanySuggestions(String q) async {
    if (q.isEmpty) {
      setState(() => _companySuggestions = []);
      return;
    }
    try {
      final res = await _dio.get(ApiConstants.experienceCompanies, queryParameters: {'q': q});
      setState(() => _companySuggestions = List<String>.from(res.data['companies'] ?? []));
    } catch (_) {}
  }

  Future<void> _upvote(ExperiencePost post) async {
    try {
      final res = await _dio.post(ApiConstants.experienceUpvote(post.id));
      setState(() => post.upvotes = res.data['upvotes'] ?? post.upvotes + 1);
    } catch (_) {}
  }

  void _openSubmit() async {
    final success = await showModalBottomSheet<bool>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => const _SubmitExperienceSheet(),
    );
    if (success == true) _fetchPosts(reset: true);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
              child: Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Experience Wall', style: Theme.of(context).textTheme.headlineLarge),
                        Text('$_total experiences shared', style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                  FilledButton.icon(
                    onPressed: _openSubmit,
                    icon: const Icon(Icons.add, size: 16),
                    label: const Text('Share'),
                    style: FilledButton.styleFrom(
                      backgroundColor: AppColors.accent,
                      foregroundColor: Colors.white,
                      padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                      textStyle: const TextStyle(fontSize: 13, fontWeight: FontWeight.w600),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Search + sort
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Column(
                children: [
                  // Company search with autocomplete
                  _AutocompleteField(
                    controller: _companyCtrl,
                    hint: 'Search by company...',
                    suggestions: _companySuggestions,
                    onChanged: (v) {
                      _fetchCompanySuggestions(v);
                    },
                    onSubmitted: (_) => _fetchPosts(reset: true),
                    onSuggestionSelected: (s) {
                      _companyCtrl.text = s;
                      setState(() => _companySuggestions = []);
                      _fetchPosts(reset: true);
                    },
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: _roleCtrl,
                          style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                          decoration: InputDecoration(
                            hintText: 'Filter by role...',
                            hintStyle: TextStyle(color: AppColors.textSecondary, fontSize: 13),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
                            isDense: true,
                            filled: true,
                            fillColor: AppColors.surface,
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.accentBorder)),
                            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.accentBorder)),
                            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.accent)),
                          ),
                          onSubmitted: (_) => _fetchPosts(reset: true),
                        ),
                      ),
                      const SizedBox(width: 8),
                      // Sort toggle
                      Container(
                        decoration: BoxDecoration(
                          border: Border.all(color: AppColors.accentBorder),
                          borderRadius: BorderRadius.circular(10),
                          color: AppColors.surface,
                        ),
                        child: Row(
                          children: [
                            _SortChip(label: 'Recent', active: _sort == 'recency', onTap: () { setState(() => _sort = 'recency'); _fetchPosts(reset: true); }),
                            _SortChip(label: 'Top', active: _sort == 'upvotes', onTap: () { setState(() => _sort = 'upvotes'); _fetchPosts(reset: true); }),
                          ],
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),
            const SizedBox(height: 12),

            // Feed
            Expanded(
              child: _loading && _posts.isEmpty
                  ? const Center(child: CircularProgressIndicator())
                  : _posts.isEmpty
                      ? _buildEmpty()
                      : RefreshIndicator(
                          onRefresh: () => _fetchPosts(reset: true),
                          child: ListView.separated(
                            padding: const EdgeInsets.fromLTRB(16, 0, 16, 24),
                            itemCount: _posts.length + (_hasMore ? 1 : 0),
                            separatorBuilder: (_, __) => const SizedBox(height: 10),
                            itemBuilder: (_, i) {
                              if (i == _posts.length) {
                                return Center(
                                  child: TextButton.icon(
                                    onPressed: () { setState(() => _page++); _fetchPosts(); },
                                    icon: const Icon(Icons.refresh, size: 16),
                                    label: Text('Load More (${_total - _posts.length} left)'),
                                  ),
                                );
                              }
                              return _ExperienceCard(post: _posts[i], onUpvote: () => _upvote(_posts[i]));
                            },
                          ),
                        ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty() {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: const Icon(Icons.people_rounded, size: 48, color: AppColors.accent),
          ),
          const SizedBox(height: 16),
          const Text('No experiences yet', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600, color: AppColors.textPrimary)),
          const SizedBox(height: 8),
          const Text('Be the first to share!', style: TextStyle(color: AppColors.textSecondary)),
          const SizedBox(height: 16),
          FilledButton(onPressed: _openSubmit, style: FilledButton.styleFrom(backgroundColor: AppColors.accent), child: const Text('Share Experience')),
        ],
      ),
    );
  }
}

// ─── Experience Card ──────────────────────────────────────────────────────────

class _ExperienceCard extends StatelessWidget {
  final ExperiencePost post;
  final VoidCallback onUpvote;

  const _ExperienceCard({required this.post, required this.onUpvote});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: AppColors.surface,
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: AppColors.accentBorder),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Company + role header
          Row(
            children: [
              Container(
                width: 38,
                height: 38,
                alignment: Alignment.center,
                decoration: BoxDecoration(
                  color: AppColors.accent.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Text(
                  post.company.isNotEmpty ? post.company[0].toUpperCase() : '?',
                  style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(child: Text(post.company, style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 14, color: AppColors.textPrimary))),
                        if (post.isVerified)
                          const Icon(Icons.verified_rounded, size: 14, color: AppColors.accent),
                      ],
                    ),
                    Text(post.role, style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                  ],
                ),
              ),
            ],
          ),

          if (post.ctc != null || post.offerDate != null) ...[
            const SizedBox(height: 8),
            Row(
              children: [
                if (post.ctc != null) _Chip(post.ctc!, color: Colors.green.shade700, bg: Colors.green.shade50),
                if (post.ctc != null && post.offerDate != null) const SizedBox(width: 6),
                if (post.offerDate != null) _Chip(post.offerDate!, color: AppColors.textSecondary, bg: AppColors.background),
              ],
            ),
          ],

          const SizedBox(height: 8),
          Text('${post.roundsCount} Round${post.roundsCount == 1 ? '' : 's'}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),

          // Round pills
          if (post.roundsDetail.isNotEmpty) ...[
            const SizedBox(height: 6),
            Wrap(
              spacing: 6,
              runSpacing: 4,
              children: post.roundsDetail.map((r) {
                final name = r['round_name'] ?? '';
                final diff = r['difficulty'] ?? 'Medium';
                Color bg, fg;
                if (diff == 'Easy') { bg = Colors.green.shade50; fg = Colors.green.shade700; }
                else if (diff == 'Hard') { bg = Colors.red.shade50; fg = Colors.red.shade700; }
                else { bg = Colors.orange.shade50; fg = Colors.orange.shade700; }
                return Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                  decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20), border: Border.all(color: fg.withValues(alpha: 0.3))),
                  child: Text(name, style: TextStyle(fontSize: 10, fontWeight: FontWeight.w600, color: fg)),
                );
              }).toList(),
            ),
          ],

          if (post.tips != null && post.tips!.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text('"${post.tips!.length > 120 ? '${post.tips!.substring(0, 120)}...' : post.tips!}"',
                style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontStyle: FontStyle.italic)),
          ],

          if (post.tags.isNotEmpty) ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 5,
              runSpacing: 4,
              children: post.tags.map((t) => Container(
                padding: const EdgeInsets.symmetric(horizontal: 7, vertical: 2),
                decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), borderRadius: BorderRadius.circular(20)),
                child: Text(t, style: const TextStyle(fontSize: 10, color: AppColors.accent)),
              )).toList(),
            ),
          ],

          const SizedBox(height: 10),
          Row(
            children: [
              if (post.isAnonymous)
                const Row(children: [
                  Icon(Icons.shield_outlined, size: 12, color: AppColors.textSecondary),
                  SizedBox(width: 3),
                  Text('Anonymous', style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                ]),
              const Spacer(),
              GestureDetector(
                onTap: onUpvote,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: AppColors.accent.withValues(alpha: 0.3)),
                  ),
                  child: Row(
                    children: [
                      const Icon(Icons.thumb_up_alt_outlined, size: 13, color: AppColors.accent),
                      const SizedBox(width: 4),
                      Text('${post.upvotes}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.accent)),
                    ],
                  ),
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

class _Chip extends StatelessWidget {
  final String label;
  final Color color;
  final Color bg;
  const _Chip(this.label, {required this.color, required this.bg});

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
    decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(20)),
    child: Text(label, style: TextStyle(fontSize: 11, color: color, fontWeight: FontWeight.w500)),
  );
}

class _SortChip extends StatelessWidget {
  final String label;
  final bool active;
  final VoidCallback onTap;
  const _SortChip({required this.label, required this.active, required this.onTap});

  @override
  Widget build(BuildContext context) => GestureDetector(
    onTap: onTap,
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 7),
      decoration: BoxDecoration(
        color: active ? AppColors.accent : Colors.transparent,
        borderRadius: BorderRadius.circular(9),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: active ? Colors.white : AppColors.textSecondary)),
    ),
  );
}

class _AutocompleteField extends StatelessWidget {
  final TextEditingController controller;
  final String hint;
  final List<String> suggestions;
  final ValueChanged<String> onChanged;
  final ValueChanged<String> onSubmitted;
  final ValueChanged<String> onSuggestionSelected;

  const _AutocompleteField({
    required this.controller,
    required this.hint,
    required this.suggestions,
    required this.onChanged,
    required this.onSubmitted,
    required this.onSuggestionSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: controller,
          style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
          decoration: InputDecoration(
            hintText: hint,
            hintStyle: TextStyle(color: AppColors.textSecondary, fontSize: 13),
            prefixIcon: const Icon(Icons.search, size: 18, color: AppColors.textSecondary),
            contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            isDense: true,
            filled: true,
            fillColor: AppColors.surface,
            border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.accentBorder)),
            enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.accentBorder)),
            focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.accent)),
          ),
          onChanged: onChanged,
          onSubmitted: onSubmitted,
        ),
        if (suggestions.isNotEmpty)
          Container(
            margin: const EdgeInsets.only(top: 2),
            decoration: BoxDecoration(
              color: AppColors.surface,
              borderRadius: BorderRadius.circular(10),
              border: Border.all(color: AppColors.accentBorder),
            ),
            child: Column(
              children: suggestions.take(5).map((s) => InkWell(
                onTap: () => onSuggestionSelected(s),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                  child: Align(alignment: Alignment.centerLeft, child: Text(s, style: const TextStyle(fontSize: 13, color: AppColors.textPrimary))),
                ),
              )).toList(),
            ),
          ),
      ],
    );
  }
}

// ─── Submit Experience Bottom Sheet ──────────────────────────────────────────

class _SubmitExperienceSheet extends StatefulWidget {
  const _SubmitExperienceSheet();

  @override
  State<_SubmitExperienceSheet> createState() => _SubmitExperienceSheetState();
}

class _SubmitExperienceSheetState extends State<_SubmitExperienceSheet> {
  final _dio = ApiService().dio;
  int _step = 0;
  bool _submitting = false;
  String _error = '';

  final _companyCtrl = TextEditingController();
  final _roleCtrl = TextEditingController();
  final _ctcCtrl = TextEditingController();
  final _tipsCtrl = TextEditingController();
  bool _isAnonymous = false;
  List<String> _tags = [];
  final _tagCtrl = TextEditingController();

  List<Map<String, String>> _rounds = [{'name': '', 'difficulty': 'Medium', 'desc': ''}];

  static const _steps = ['Company & Role', 'Rounds', 'Tips & Tags', 'Preview'];
  static const _popularTags = ['DSA', 'System Design', 'Behavioral', 'HR Round', 'Coding', 'LLD', 'HLD', 'Problem Solving', 'Aptitude'];
  static const _difficulties = ['Easy', 'Medium', 'Hard'];

  bool _canProceed() {
    if (_step == 0) return _companyCtrl.text.trim().isNotEmpty && _roleCtrl.text.trim().isNotEmpty;
    if (_step == 1) return _rounds.every((r) => r['name']!.trim().isNotEmpty);
    return true;
  }

  Future<void> _submit() async {
    setState(() { _submitting = true; _error = ''; });
    try {
      await _dio.post(ApiConstants.experienceSubmit, data: {
        'company': _companyCtrl.text.trim(),
        'role': _roleCtrl.text.trim(),
        'ctc': _ctcCtrl.text.trim().isEmpty ? null : _ctcCtrl.text.trim(),
        'rounds_count': _rounds.length,
        'rounds_detail': _rounds.map((r) => {'round_name': r['name'], 'difficulty': r['difficulty'], 'description': r['desc']}).toList(),
        'tips': _tipsCtrl.text.trim().isEmpty ? null : _tipsCtrl.text.trim(),
        'tags': _tags,
        'is_anonymous': _isAnonymous,
      });
      if (mounted) Navigator.pop(context, true);
    } catch (e) {
      setState(() { _error = e.toString(); _submitting = false; });
    }
  }

  @override
  Widget build(BuildContext context) {
    final mq = MediaQuery.of(context);
    return Container(
      height: mq.size.height * 0.88,
      decoration: const BoxDecoration(
        color: AppColors.background,
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      child: Column(
        children: [
          // Handle + header
          const SizedBox(height: 8),
          Center(child: Container(width: 36, height: 4, decoration: BoxDecoration(color: AppColors.accentBorder, borderRadius: BorderRadius.circular(2)))),
          const SizedBox(height: 12),
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Share Your Experience', style: TextStyle(fontSize: 17, fontWeight: FontWeight.w700, color: AppColors.textPrimary)),
                      Text(_steps[_step], style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                IconButton(onPressed: () => Navigator.pop(context), icon: const Icon(Icons.close, color: AppColors.textSecondary)),
              ],
            ),
          ),
          // Progress bar
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: List.generate(_steps.length, (i) => Expanded(
                child: Container(
                  height: 3,
                  margin: EdgeInsets.only(right: i < _steps.length - 1 ? 4 : 0),
                  decoration: BoxDecoration(
                    color: i <= _step ? AppColors.accent : AppColors.accentBorder,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
              )),
            ),
          ),
          const SizedBox(height: 12),

          // Body
          Expanded(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(16, 0, 16, mq.viewInsets.bottom + 16),
              child: _buildStep(),
            ),
          ),

          // Footer nav
          Container(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 16),
            decoration: BoxDecoration(border: Border(top: BorderSide(color: AppColors.accentBorder))),
            child: Row(
              children: [
                if (_step > 0)
                  TextButton.icon(
                    onPressed: () => setState(() => _step--),
                    icon: const Icon(Icons.chevron_left),
                    label: const Text('Back'),
                  ),
                const Spacer(),
                if (_step < _steps.length - 1)
                  FilledButton(
                    onPressed: _canProceed() ? () => setState(() => _step++) : null,
                    style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
                    child: const Row(children: [Text('Next'), SizedBox(width: 4), Icon(Icons.chevron_right, size: 16)]),
                  )
                else
                  FilledButton.icon(
                    onPressed: _submitting ? null : _submit,
                    icon: _submitting ? const SizedBox(width: 16, height: 16, child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white)) : const Icon(Icons.send, size: 16),
                    label: Text(_submitting ? 'Submitting...' : 'Share Experience'),
                    style: FilledButton.styleFrom(backgroundColor: AppColors.accent),
                  ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStep() {
    final inputDec = InputDecoration(
      contentPadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      isDense: true,
      filled: true,
      fillColor: AppColors.surface,
      border: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.accentBorder)),
      enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: BorderSide(color: AppColors.accentBorder)),
      focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(10), borderSide: const BorderSide(color: AppColors.accent)),
    );

    if (_step == 0) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _label('Company Name *'),
          TextField(controller: _companyCtrl, decoration: inputDec.copyWith(hintText: 'e.g. Google, Infosys, Razorpay'), style: const TextStyle(color: AppColors.textPrimary, fontSize: 13)),
          const SizedBox(height: 12),
          _label('Role Applied For *'),
          TextField(controller: _roleCtrl, decoration: inputDec.copyWith(hintText: 'e.g. Software Engineer, SDE-1'), style: const TextStyle(color: AppColors.textPrimary, fontSize: 13)),
          const SizedBox(height: 12),
          _label('CTC / Stipend (optional)'),
          TextField(controller: _ctcCtrl, decoration: inputDec.copyWith(hintText: 'e.g. 12 LPA'), style: const TextStyle(color: AppColors.textPrimary, fontSize: 13)),
        ],
      );
    }

    if (_step == 1) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          ..._rounds.asMap().entries.map((e) {
            final i = e.key;
            final r = e.value;
            return Container(
              margin: const EdgeInsets.only(bottom: 10),
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Text('Round ${i + 1}', style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: AppColors.accent)),
                      const Spacer(),
                      if (_rounds.length > 1)
                        GestureDetector(
                          onTap: () => setState(() => _rounds.removeAt(i)),
                          child: const Icon(Icons.delete_outline, size: 16, color: Colors.red),
                        ),
                    ],
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                    decoration: inputDec.copyWith(hintText: 'Round name (e.g. Technical, HR, DSA)'),
                    onChanged: (v) => _rounds[i]['name'] = v,
                    controller: TextEditingController.fromValue(TextEditingValue(text: r['name']!)),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: _difficulties.map((d) {
                      final active = r['difficulty'] == d;
                      Color fg; Color bg;
                      if (d == 'Easy') { fg = Colors.green.shade700; bg = active ? Colors.green.shade50 : AppColors.background; }
                      else if (d == 'Hard') { fg = Colors.red.shade700; bg = active ? Colors.red.shade50 : AppColors.background; }
                      else { fg = Colors.orange.shade700; bg = active ? Colors.orange.shade50 : AppColors.background; }
                      return Expanded(
                        child: GestureDetector(
                          onTap: () => setState(() => _rounds[i]['difficulty'] = d),
                          child: Container(
                            margin: EdgeInsets.only(right: d != 'Hard' ? 6 : 0),
                            padding: const EdgeInsets.symmetric(vertical: 6),
                            alignment: Alignment.center,
                            decoration: BoxDecoration(color: bg, borderRadius: BorderRadius.circular(8), border: Border.all(color: active ? fg.withValues(alpha: 0.5) : AppColors.accentBorder)),
                            child: Text(d, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: fg)),
                          ),
                        ),
                      );
                    }).toList(),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                    decoration: inputDec.copyWith(hintText: 'Brief description...'),
                    maxLines: 2,
                    onChanged: (v) => _rounds[i]['desc'] = v,
                  ),
                ],
              ),
            );
          }),
          OutlinedButton.icon(
            onPressed: () => setState(() => _rounds.add({'name': '', 'difficulty': 'Medium', 'desc': ''})),
            icon: const Icon(Icons.add, size: 16),
            label: const Text('Add Round'),
            style: OutlinedButton.styleFrom(
              side: BorderSide(color: AppColors.accentBorder, style: BorderStyle.solid),
              foregroundColor: AppColors.textSecondary,
            ),
          ),
        ],
      );
    }

    if (_step == 2) {
      return Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _label('Tips for Future Candidates'),
          TextField(
            controller: _tipsCtrl,
            style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
            decoration: inputDec.copyWith(hintText: 'What topics to focus on? Any advice?'),
            maxLines: 4,
          ),
          const SizedBox(height: 16),
          _label('Tags'),
          Wrap(
            spacing: 6, runSpacing: 6,
            children: [
              ..._tags.map((t) => GestureDetector(
                onTap: () => setState(() => _tags.remove(t)),
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.accent.withValues(alpha: 0.3))),
                  child: Row(mainAxisSize: MainAxisSize.min, children: [
                    Text(t, style: const TextStyle(fontSize: 11, color: AppColors.accent, fontWeight: FontWeight.w600)),
                    const SizedBox(width: 4),
                    const Icon(Icons.close, size: 11, color: AppColors.accent),
                  ]),
                ),
              )),
            ],
          ),
          const SizedBox(height: 8),
          Row(
            children: [
              Expanded(
                child: TextField(
                  controller: _tagCtrl,
                  style: const TextStyle(color: AppColors.textPrimary, fontSize: 13),
                  decoration: inputDec.copyWith(hintText: 'Add custom tag...'),
                  onSubmitted: (v) { if (v.trim().isNotEmpty && !_tags.contains(v.trim())) setState(() { _tags.add(v.trim()); _tagCtrl.clear(); }); },
                ),
              ),
              const SizedBox(width: 8),
              FilledButton(
                onPressed: () {
                  final v = _tagCtrl.text.trim();
                  if (v.isNotEmpty && !_tags.contains(v)) setState(() { _tags.add(v); _tagCtrl.clear(); });
                },
                style: FilledButton.styleFrom(backgroundColor: AppColors.accent, padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10)),
                child: const Text('Add', style: TextStyle(fontSize: 13)),
              ),
            ],
          ),
          const SizedBox(height: 10),
          Wrap(
            spacing: 6, runSpacing: 6,
            children: _popularTags.where((t) => !_tags.contains(t)).map((t) => GestureDetector(
              onTap: () => setState(() => _tags.add(t)),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 9, vertical: 4),
                decoration: BoxDecoration(borderRadius: BorderRadius.circular(20), border: Border.all(color: AppColors.accentBorder)),
                child: Text('+ $t', style: const TextStyle(fontSize: 11, color: AppColors.textSecondary)),
              ),
            )).toList(),
          ),
        ],
      );
    }

    // Step 3: Preview
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          padding: const EdgeInsets.all(14),
          decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Container(
                    width: 36, height: 36, alignment: Alignment.center,
                    decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(9)),
                    child: Text(_companyCtrl.text.isNotEmpty ? _companyCtrl.text[0].toUpperCase() : '?', style: const TextStyle(color: AppColors.accent, fontWeight: FontWeight.bold, fontSize: 16)),
                  ),
                  const SizedBox(width: 10),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(_companyCtrl.text, style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 14, color: AppColors.textPrimary)),
                        Text('${_roleCtrl.text}${_ctcCtrl.text.isNotEmpty ? ' · ${_ctcCtrl.text}' : ''}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text('${_rounds.length} Round${_rounds.length == 1 ? '' : 's'} · ${_tags.join(', ')}', style: const TextStyle(fontSize: 12, color: AppColors.textSecondary)),
              if (_tipsCtrl.text.isNotEmpty)
                Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text('"${_tipsCtrl.text.length > 100 ? '${_tipsCtrl.text.substring(0, 100)}...' : _tipsCtrl.text}"',
                      style: const TextStyle(fontSize: 12, color: AppColors.textSecondary, fontStyle: FontStyle.italic)),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        // Anonymous toggle
        GestureDetector(
          onTap: () => setState(() => _isAnonymous = !_isAnonymous),
          child: Container(
            padding: const EdgeInsets.all(14),
            decoration: BoxDecoration(
              color: _isAnonymous ? AppColors.accent.withValues(alpha: 0.08) : AppColors.surface,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: _isAnonymous ? AppColors.accent : AppColors.accentBorder, width: _isAnonymous ? 1.5 : 1),
            ),
            child: Row(
              children: [
                Icon(Icons.shield_outlined, color: _isAnonymous ? AppColors.accent : AppColors.textSecondary, size: 20),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('Post Anonymously', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: _isAnonymous ? AppColors.accent : AppColors.textPrimary)),
                      const Text("Your name won't be shown publicly", style: TextStyle(fontSize: 11, color: AppColors.textSecondary)),
                    ],
                  ),
                ),
                Container(
                  width: 42, height: 24,
                  decoration: BoxDecoration(color: _isAnonymous ? AppColors.accent : AppColors.accentBorder, borderRadius: BorderRadius.circular(12)),
                  child: AnimatedAlign(
                    duration: const Duration(milliseconds: 200),
                    alignment: _isAnonymous ? Alignment.centerRight : Alignment.centerLeft,
                    child: Container(
                      width: 20, height: 20,
                      margin: const EdgeInsets.symmetric(horizontal: 2),
                      decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
        if (_error.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(_error, style: const TextStyle(color: Colors.red, fontSize: 12)),
        ],
      ],
    );
  }

  Widget _label(String text) => Padding(
    padding: const EdgeInsets.only(bottom: 6),
    child: Text(text, style: const TextStyle(fontSize: 12, fontWeight: FontWeight.w600, color: AppColors.textSecondary)),
  );
}
