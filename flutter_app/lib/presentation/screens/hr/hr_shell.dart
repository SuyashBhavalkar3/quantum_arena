import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../../core/theme/app_theme.dart';

class HRShell extends StatelessWidget {
  final Widget child;
  const HRShell({super.key, required this.child});

  static const _tabs = [
    (icon: Icons.dashboard_rounded, label: 'Dashboard', path: '/hr'),
    (icon: Icons.work_rounded, label: 'Jobs', path: '/hr/jobs'),
    (icon: Icons.people_rounded, label: 'Applicants', path: '/hr/applicants'),
    (icon: Icons.lightbulb_rounded, label: 'Strategy', path: '/hr/strategy'),
    (icon: Icons.person_rounded, label: 'Profile', path: '/hr/profile'),
  ];

  int _idx(String path) {
    for (int i = _tabs.length - 1; i >= 0; i--) {
      if (path.startsWith(_tabs[i].path)) {
        if (_tabs[i].path == '/hr' && path != '/hr') continue;
        return i;
      }
    }
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final loc = GoRouterState.of(context).uri.path;
    final idx = _idx(loc);
    return Scaffold(
      body: child,
      bottomNavigationBar: Container(
        decoration: BoxDecoration(color: AppColors.surface, border: Border(top: BorderSide(color: AppColors.accentBorder))),
        child: SafeArea(
          child: SizedBox(
            height: 64,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceAround,
              children: List.generate(_tabs.length, (i) {
                final t = _tabs[i]; final active = i == idx;
                return Expanded(
                  child: GestureDetector(
                    behavior: HitTestBehavior.opaque,
                    onTap: () => context.go(t.path),
                    child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                      Icon(t.icon, size: 22, color: active ? AppColors.accent : AppColors.textSecondary),
                      const SizedBox(height: 4),
                      Text(t.label, style: TextStyle(fontSize: 11, fontWeight: active ? FontWeight.w700 : FontWeight.w500, color: active ? AppColors.accent : AppColors.textSecondary)),
                    ]),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}
