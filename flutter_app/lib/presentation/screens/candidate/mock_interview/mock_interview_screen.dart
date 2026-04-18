import 'package:flutter/material.dart';
import 'package:speech_to_text/speech_to_text.dart' as stt;
import 'package:flutter_tts/flutter_tts.dart';
import '../../../../core/theme/app_theme.dart';
import '../../../../data/services/api_service.dart';


class MockInterviewScreen extends StatefulWidget {
  const MockInterviewScreen({super.key});
  @override
  State<MockInterviewScreen> createState() => _State();
}

class _State extends State<MockInterviewScreen> with TickerProviderStateMixin {
  final _api = ApiService();
  final _stt = stt.SpeechToText();
  final _tts = FlutterTts();
  final _messages = <_ChatMsg>[];
  final _scrollCtrl = ScrollController();

  bool _initializing = false;
  bool _started = false;
  bool _listening = false;
  bool _aiSpeaking = false;
  bool _ending = false;
  String _sessionId = '';
  String _company = '';
  String _role = '';
  Map<String, dynamic>? _scorecard;
  late AnimationController _pulseCtrl;

  static const _roles = [
    'Software Engineer', 'Frontend Developer', 'Backend Developer',
    'Full Stack Developer', 'Data Scientist', 'Product Manager',
    'DevOps Engineer', 'Mobile Developer', 'UI/UX Designer',
  ];
  static const _companies = [
    'Google', 'Amazon', 'Microsoft', 'Meta', 'Apple', 'Netflix',
    'TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra', 'Cognizant',
  ];

  @override
  void initState() {
    super.initState();
    _pulseCtrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 1200))..repeat(reverse: true);
    _initTts();
  }

  Future<void> _initTts() async {
    await _tts.setLanguage('en-US');
    await _tts.setSpeechRate(0.45);
    await _tts.setPitch(1.0);
    _tts.setCompletionHandler(() { if (mounted) setState(() => _aiSpeaking = false); });
  }

  Future<bool> _initStt() async {
    if (_stt.isAvailable) return true;
    return await _stt.initialize(onError: (e) => debugPrint('STT Error: $e'));
  }

  Future<void> _startInterview() async {
    if (_company.isEmpty || _role.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Enter company and role')));
      return;
    }
    setState(() => _initializing = true);
    try {
      final resp = await _api.startMockInterview({'company': _company, 'role': _role});
      _sessionId = resp['session_id']?.toString() ?? '';
      final greeting = resp['message'] as String? ?? 'Hello! Tell me about yourself.';
      _messages.add(_ChatMsg(text: greeting, isUser: false));
      setState(() { _started = true; _initializing = false; });
      _speak(greeting);
    } catch (e) {
      setState(() => _initializing = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  Future<void> _speak(String text) async {
    setState(() => _aiSpeaking = true);
    await _tts.speak(text);
  }

  Future<void> _toggleListening() async {
    if (_listening) {
      await _stt.stop();
      setState(() => _listening = false);
      return;
    }
    final ok = await _initStt();
    if (!ok) {
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Speech recognition unavailable')));
      return;
    }
    setState(() => _listening = true);
    await _stt.listen(
      onResult: (r) {
        if (r.finalResult && r.recognizedWords.isNotEmpty) {
          _sendMessage(r.recognizedWords);
          setState(() => _listening = false);
        }
      },
      listenFor: const Duration(seconds: 30),
      localeId: 'en_US',
    );
  }

  Future<void> _sendMessage(String text) async {
    _messages.add(_ChatMsg(text: text, isUser: true));
    setState(() {});
    _scrollToBottom();
    try {
      final resp = await _api.sendMockInterviewMessage({'session_id': _sessionId, 'message': text});
      final reply = resp['message'] as String? ?? resp['response'] as String? ?? '';
      if (reply.isNotEmpty) {
        _messages.add(_ChatMsg(text: reply, isUser: false));
        setState(() {});
        _scrollToBottom();
        _speak(reply);
      }
    } catch (e) {
      _messages.add(_ChatMsg(text: 'Error: $e', isUser: false));
      setState(() {});
    }
  }

  Future<void> _endInterview() async {
    setState(() => _ending = true);
    await _tts.stop();
    await _stt.stop();
    try {
      final resp = await _api.endMockInterview({'session_id': _sessionId});
      setState(() { _scorecard = resp; _ending = false; });
    } catch (e) {
      setState(() => _ending = false);
      if (mounted) ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Error: $e')));
    }
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollCtrl.hasClients) _scrollCtrl.animateTo(_scrollCtrl.position.maxScrollExtent, duration: const Duration(milliseconds: 300), curve: Curves.easeOut);
    });
  }

  @override
  void dispose() { _pulseCtrl.dispose(); _tts.stop(); _stt.stop(); _scrollCtrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    if (_scorecard != null) return _buildScorecard();
    if (!_started) return _buildSetup();
    return _buildInterview();
  }

  Widget _buildSetup() {
    return Scaffold(
      body: SafeArea(
        child: Padding(padding: const EdgeInsets.all(24), child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(color: AppColors.accent.withValues(alpha: 0.1), shape: BoxShape.circle),
              child: const Icon(Icons.mic_rounded, size: 48, color: AppColors.accent),
            ),
            const SizedBox(height: 24),
            Text('Mock Interview', style: Theme.of(context).textTheme.headlineLarge, textAlign: TextAlign.center),
            const SizedBox(height: 8),
            Text('Practice with an AI interviewer using voice', style: Theme.of(context).textTheme.bodyMedium, textAlign: TextAlign.center),
            const SizedBox(height: 32),
            Autocomplete<String>(
              optionsBuilder: (TextEditingValue value) {
                if (value.text.isEmpty) return const Iterable<String>.empty();
                return _companies.where((c) => c.toLowerCase().contains(value.text.toLowerCase()));
              },
              onSelected: (selection) => _company = selection,
              fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
                return TextField(
                  controller: controller, focusNode: focusNode, style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Target Company', prefixIcon: Icon(Icons.business, color: AppColors.textSecondary)),
                  onChanged: (v) => _company = v,
                );
              },
            ),
            const SizedBox(height: 14),
            Autocomplete<String>(
              optionsBuilder: (TextEditingValue value) {
                if (value.text.isEmpty) return const Iterable<String>.empty();
                return _roles.where((r) => r.toLowerCase().contains(value.text.toLowerCase()));
              },
              onSelected: (selection) => _role = selection,
              fieldViewBuilder: (context, controller, focusNode, onFieldSubmitted) {
                return TextField(
                  controller: controller, focusNode: focusNode, style: const TextStyle(color: AppColors.textPrimary),
                  decoration: const InputDecoration(labelText: 'Target Role', prefixIcon: Icon(Icons.work, color: AppColors.textSecondary)),
                  onChanged: (v) => _role = v,
                );
              },
            ),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton.icon(
                onPressed: _initializing ? null : _startInterview,
                icon: _initializing ? const SizedBox(width: 18, height: 18, child: CircularProgressIndicator(strokeWidth: 2, color: AppColors.background)) : const Icon(Icons.play_arrow),
                label: Text(_initializing ? 'Starting...' : 'Start Interview'),
              ),
            ),
          ],
        )),
      ),
    );
  }

  Widget _buildInterview() {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mock Interview'),
        actions: [
          TextButton(
            onPressed: _ending ? null : _endInterview,
            child: Text(_ending ? 'Ending...' : 'End', style: const TextStyle(color: AppColors.error)),
          ),
        ],
      ),
      body: Column(children: [
        Expanded(
          child: ListView.builder(
            controller: _scrollCtrl,
            padding: const EdgeInsets.all(16),
            itemCount: _messages.length,
            itemBuilder: (_, i) {
              final msg = _messages[i];
              return Align(
                alignment: msg.isUser ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.all(14),
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.78),
                  decoration: BoxDecoration(
                    color: msg.isUser ? AppColors.accent : AppColors.surface,
                    borderRadius: BorderRadius.circular(14),
                    border: msg.isUser ? null : Border.all(color: AppColors.accentBorder),
                  ),
                  child: Text(msg.text, style: TextStyle(color: msg.isUser ? AppColors.background : AppColors.textPrimary, fontSize: 14, height: 1.5)),
                ),
              );
            },
          ),
        ),
        // Mic bar
        Container(
          padding: const EdgeInsets.fromLTRB(20, 12, 20, 24),
          decoration: BoxDecoration(color: AppColors.surface, border: Border(top: BorderSide(color: AppColors.accentBorder))),
          child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
            if (_aiSpeaking) ...[
              const Icon(Icons.volume_up, color: AppColors.accent, size: 22),
              const SizedBox(width: 8),
              const Text('AI is speaking...', style: TextStyle(color: AppColors.accent, fontSize: 13)),
            ] else
              GestureDetector(
                onTap: _toggleListening,
                child: AnimatedBuilder(
                  animation: _pulseCtrl,
                  builder: (_, __) => Container(
                    width: 64, height: 64,
                    decoration: BoxDecoration(
                      color: _listening ? AppColors.error : AppColors.accent,
                      shape: BoxShape.circle,
                      boxShadow: _listening ? [BoxShadow(color: AppColors.error.withValues(alpha: _pulseCtrl.value * 0.4), blurRadius: 20, spreadRadius: 4)] : null,
                    ),
                    child: Icon(_listening ? Icons.stop : Icons.mic, color: _listening ? Colors.white : AppColors.background, size: 28),
                  ),
                ),
              ),
          ]),
        ),
      ]),
    );
  }

  Widget _buildScorecard() {
    final score = _scorecard?['overall_score'] ?? _scorecard?['score'];
    return Scaffold(
      body: SafeArea(
        child: ListView(padding: const EdgeInsets.all(24), children: [
          Center(child: Container(
            padding: const EdgeInsets.all(20),
            decoration: BoxDecoration(color: AppColors.success.withValues(alpha: 0.1), shape: BoxShape.circle),
            child: const Icon(Icons.check_circle, size: 48, color: AppColors.success),
          )),
          const SizedBox(height: 20),
          Text('Interview Complete!', style: Theme.of(context).textTheme.headlineLarge, textAlign: TextAlign.center),
          if (score != null) ...[
            const SizedBox(height: 12),
            Text('Score: $score', style: Theme.of(context).textTheme.displayMedium?.copyWith(color: AppColors.accent), textAlign: TextAlign.center),
          ],
          const SizedBox(height: 24),
          if (_scorecard?['feedback'] != null)
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(color: AppColors.surface, borderRadius: BorderRadius.circular(12), border: Border.all(color: AppColors.accentBorder)),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Feedback', style: Theme.of(context).textTheme.headlineSmall),
                const SizedBox(height: 8),
                Text(_scorecard!['feedback'].toString(), style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textPrimary)),
              ]),
            ),
          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: () => setState(() { _started = false; _scorecard = null; _messages.clear(); _company = ''; _role = ''; }),
            child: const Text('Practice Again'),
          ),
        ]),
      ),
    );
  }
}

class _ChatMsg {
  final String text;
  final bool isUser;
  _ChatMsg({required this.text, required this.isUser});
}
