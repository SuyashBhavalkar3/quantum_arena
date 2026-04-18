import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models/user_model.dart';
import '../data/services/api_service.dart';
import '../data/services/auth_service.dart';

class AuthState {
  final UserModel? user;
  final String? token;
  final String? role;
  final bool isLoading;
  final String? error;

  AuthState({this.user, this.token, this.role, this.isLoading = false, this.error});

  AuthState copyWith({
    UserModel? user,
    String? token,
    String? role,
    bool? isLoading,
    String? error,
  }) {
    return AuthState(
      user: user ?? this.user,
      token: token ?? this.token,
      role: role ?? this.role,
      isLoading: isLoading ?? this.isLoading,
      error: error,
    );
  }

  bool get isAuthenticated => token != null && token!.isNotEmpty;
}

class AuthNotifier extends StateNotifier<AuthState> {
  final ApiService _api;

  AuthNotifier(this._api) : super(AuthState());

  Future<void> checkAuth() async {
    final token = await AuthService.getToken();
    final role = await AuthService.getRole();
    final user = await AuthService.getUserData();
    if (token != null && token.isNotEmpty) {
      state = AuthState(user: user, token: token, role: role);
    }
  }

  Future<bool> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final authResponse = await _api.login(LoginRequest(email: email, password: password));
      await AuthService.setToken(authResponse.accessToken);

      final user = await _api.getCurrentUser();
      final role = user.isEmployer ? 'hr' : 'candidate';
      await AuthService.setRole(role);
      await AuthService.setUserData(user);

      state = AuthState(user: user, token: authResponse.accessToken, role: role);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
      return false;
    }
  }

  Future<bool> register(RegisterRequest request) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      await _api.register(request);
      // Auto-login after registration
      final authResponse = await _api.login(
        LoginRequest(email: request.email, password: request.password),
      );
      await AuthService.setToken(authResponse.accessToken);

      final user = await _api.getCurrentUser();
      final role = user.isEmployer ? 'hr' : 'candidate';
      await AuthService.setRole(role);
      await AuthService.setUserData(user);

      state = AuthState(user: user, token: authResponse.accessToken, role: role);
      return true;
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
      return false;
    }
  }

  Future<void> logout() async {
    await AuthService.logout();
    state = AuthState();
  }

  String _extractError(dynamic e) {
    if (e is Exception) {
      final msg = e.toString();
      if (msg.contains('detail')) {
        final match = RegExp(r'"detail"\s*:\s*"([^"]+)"').firstMatch(msg);
        if (match != null) return match.group(1)!;
      }
      return msg.replaceAll('Exception: ', '');
    }
    return 'An error occurred';
  }
}

final apiServiceProvider = Provider<ApiService>((ref) => ApiService());

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref.watch(apiServiceProvider));
});
