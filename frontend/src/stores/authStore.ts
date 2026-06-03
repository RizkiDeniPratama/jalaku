/**
 * Jalaku — Auth Store (Nano Stores)
 *
 * Reactive state management untuk autentikasi,
 * dapat diakses dari React Island mana pun via @nanostores/react.
 *
 * Mengapa Nano Stores?
 * Setiap React Island di Astro terisolasi (hydrated terpisah).
 * Nano Stores memungkinkan state dibagi antar island tanpa prop drilling.
 */

import { atom, computed } from "nanostores";
import type { AuthUser } from "../lib/auth";
import {
  getToken,
  getUser,
  setToken,
  setUser,
  clearAuth as clearAuthStorage,
} from "../lib/auth";

// ---- Atoms (Reactive State) ----

/** JWT token saat ini */
export const $token = atom<string | null>(null);

/** Data user yang sedang login */
export const $user = atom<AuthUser | null>(null);

// ---- Computed Values ----

/** Apakah user sudah login? */
export const $isAuthenticated = computed($token, (token) => !!token);

/** Apakah user adalah admin? */
export const $isAdmin = computed($user, (user) => user?.role === "admin");

// ---- Actions ----

/**
 * Inisialisasi auth state dari localStorage.
 * Panggil sekali saat komponen pertama kali mount.
 */
export function initAuth(): void {
  const token = getToken();
  const user = getUser();
  if (token) $token.set(token);
  if (user) $user.set(user);
}

/**
 * Simpan kredensial setelah login berhasil.
 * Update localStorage DAN reactive store sekaligus.
 */
export function setAuth(token: string, user: AuthUser): void {
  setToken(token);
  setUser(user);
  $token.set(token);
  $user.set(user);
}

/**
 * Hapus semua data autentikasi (logout).
 * Membersihkan localStorage DAN reactive store.
 */
export function clearAuth(): void {
  clearAuthStorage();
  $token.set(null);
  $user.set(null);
}
