// Authentication utilities for managing cookies and tokens

import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';
const IS_EMPLOYER_KEY = 'is_employer';
const USER_KEY = 'user_data';
const ROLE_KEY = 'user_role';

export function setAuthToken(token: string) {
  Cookies.set(TOKEN_KEY, token, { expires: 7 }); // 7 days
}

export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function removeAuthToken() {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(IS_EMPLOYER_KEY);
  Cookies.remove(USER_KEY);
}

export function setIsEmployer(isEmployer: boolean) {
  Cookies.set(IS_EMPLOYER_KEY, String(isEmployer), { expires: 7 });
}

export function getIsEmployer(): boolean | null {
  const value = Cookies.get(IS_EMPLOYER_KEY);
  return value ? value === 'true' : null;
}

export function setUserRole(role: string) {
  Cookies.set(ROLE_KEY, role, { expires: 7 });
}

export function getUserRole(): string | null {
  return Cookies.get(ROLE_KEY) || null;
}

export function setUserData(data: any) {
  Cookies.set(USER_KEY, JSON.stringify(data), { expires: 7 });
}

export function getUserData(): any | null {
  const data = Cookies.get(USER_KEY);
  return data ? JSON.parse(data) : null;
}

export function isAuthenticated(): boolean {
  return !!getAuthToken();
}

export function logout() {
  removeAuthToken();
  window.location.href = '/login';
}
