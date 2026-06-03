/**
 * Jalaku — Helper Autentikasi
 *
 * Mengelola JWT token dan data user di localStorage.
 * Digunakan oleh authStore (Nano Stores) dan komponen auth.
 */

const TOKEN_KEY = "jalaku_token";
const USER_KEY = "jalaku_user";

/** Tipe data user yang dikembalikan oleh endpoint /auth/login */
export interface AuthUser {
  id: string;
  email: string;
  role: string;
  poin: number;
  membership_expiry: string | null;
}

// ---- Token Management ----

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

// ---- User Management ----

export function getUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setUser(user: AuthUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

// ---- Session Control ----

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.role === "admin";
}
