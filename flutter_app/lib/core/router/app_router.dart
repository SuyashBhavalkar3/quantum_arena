import 'package:go_router/go_router.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../providers/auth_provider.dart';
import '../../presentation/screens/landing/landing_screen.dart';
import '../../presentation/screens/auth/login_screen.dart';
import '../../presentation/screens/auth/register_screen.dart';
import '../../presentation/screens/candidate/candidate_shell.dart';
import '../../presentation/screens/candidate/dashboard/candidate_dashboard_screen.dart';
import '../../presentation/screens/candidate/jobs/jobs_screen.dart';
import '../../presentation/screens/candidate/applications/applications_screen.dart';
import '../../presentation/screens/candidate/notifications/notifications_screen.dart';
import '../../presentation/screens/candidate/profile/profile_screen.dart';
import '../../presentation/screens/candidate/experience/experience_screen.dart';
import '../../presentation/screens/candidate/mock_interview/mock_interview_screen.dart';
import '../../presentation/screens/candidate/reports/candidate_report_screen.dart';
import '../../presentation/screens/candidate/resume_analyzer/resume_analyzer_screen.dart';
import '../../presentation/screens/candidate/prep/prep_onboarding_screen.dart';
import '../../presentation/screens/hr/hr_shell.dart';
import '../../presentation/screens/hr/dashboard/hr_dashboard_screen.dart';
import '../../presentation/screens/hr/jobs/hr_jobs_screen.dart';
import '../../presentation/screens/hr/jobs/create_job_screen.dart';
import '../../presentation/screens/hr/applicants/applicants_screen.dart';
import '../../presentation/screens/hr/strategy/strategy_screen.dart';
import '../../presentation/screens/hr/profile/hr_profile_screen.dart';
import '../../presentation/screens/hr/reports/report_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/',
    redirect: (context, state) {
      final isAuthenticated = authState.isAuthenticated;
      final role = authState.role;
      final path = state.uri.path;

      final publicRoutes = ['/', '/login', '/register'];
      final isPublic = publicRoutes.contains(path);

      if (!isAuthenticated && !isPublic) return '/login';

      if (isAuthenticated && (path == '/login' || path == '/register')) {
        return role == 'hr' ? '/hr' : '/candidate';
      }

      if (isAuthenticated && path == '/') {
        return role == 'hr' ? '/hr' : '/candidate';
      }

      if (isAuthenticated && role == 'hr' && path.startsWith('/candidate')) {
        return '/hr';
      }
      if (isAuthenticated && role == 'candidate' && path.startsWith('/hr')) {
        return '/candidate';
      }

      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const LandingScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),

      // Candidate routes
      ShellRoute(
        builder: (_, __, child) => CandidateShell(child: child),
        routes: [
          GoRoute(
            path: '/candidate',
            builder: (_, __) => const CandidateDashboardScreen(),
          ),
          GoRoute(
            path: '/candidate/jobs',
            builder: (_, __) => const JobsScreen(),
          ),
          GoRoute(
            path: '/candidate/applications',
            builder: (_, __) => const ApplicationsScreen(),
          ),
          GoRoute(
            path: '/candidate/notifications',
            builder: (_, __) => const NotificationsScreen(),
          ),
          GoRoute(
            path: '/candidate/profile',
            builder: (_, __) => const ProfileScreen(),
          ),
          GoRoute(
            path: '/candidate/experience',
            builder: (_, __) => const ExperienceScreen(),
          ),
          GoRoute(
            path: '/candidate/mock-interview',
            builder: (_, __) => const MockInterviewScreen(),
          ),
          GoRoute(
            path: '/candidate/reports/:applicationId',
            builder: (_, state) => CandidateReportScreen(
              applicationId: int.parse(state.pathParameters['applicationId']!),
            ),
          ),
          GoRoute(
            path: '/candidate/resume-analyzer',
            builder: (_, __) => const ResumeAnalyzerScreen(),
          ),
          GoRoute(
            path: '/candidate/prep',
            builder: (_, __) => const PrepOnboardingScreen(),
          ),
        ],
      ),

      // HR routes
      ShellRoute(
        builder: (_, __, child) => HRShell(child: child),
        routes: [
          GoRoute(
            path: '/hr',
            builder: (_, __) => const HRDashboardScreen(),
          ),
          GoRoute(
            path: '/hr/jobs',
            builder: (_, __) => const HRJobsScreen(),
          ),
          GoRoute(
            path: '/hr/jobs/new',
            builder: (_, __) => const CreateJobScreen(),
          ),
          GoRoute(
            path: '/hr/applicants',
            builder: (_, __) => const ApplicantsScreen(),
          ),
          GoRoute(
            path: '/hr/strategy',
            builder: (_, __) => const StrategyScreen(),
          ),
          GoRoute(
            path: '/hr/profile',
            builder: (_, __) => const HRProfileScreen(),
          ),
          GoRoute(
            path: '/hr/reports/:applicationId',
            builder: (_, state) => ReportScreen(
              applicationId: int.parse(state.pathParameters['applicationId']!),
            ),
          ),
        ],
      ),
    ],
  );
});
