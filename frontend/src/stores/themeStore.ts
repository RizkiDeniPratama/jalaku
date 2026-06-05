/**
 * Jalaku — Theme Store (Nano Stores)
 *
 * Mengelola dark/light mode preference untuk Admin Panel.
 * Persists ke localStorage agar user preference tetap tersimpan.
 * Menggunakan Nano Stores supaya reactive di semua React Island.
 *
 * IMPORTANT: Dark mode is scoped to the Admin Panel only (#admin-root).
 * Public pages always remain in light mode.
 */

import { atom, computed } from "nanostores";

const THEME_KEY = "jalaku_theme";

export type Theme = "light" | "dark";

/** Current theme atom */
export const $theme = atom<Theme>("light");

/** Computed boolean for convenience */
export const $isDark = computed($theme, (t) => t === "dark");

/**
 * Initialize theme from localStorage or system preference.
 * Call once on admin mount. Only applies dark class to #admin-root.
 */
export function initTheme(): void {
  if (typeof window === "undefined") return;

  const stored = localStorage.getItem(THEME_KEY) as Theme | null;
  if (stored === "dark" || stored === "light") {
    $theme.set(stored);
  } else {
    // Fallback to system preference
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    $theme.set(prefersDark ? "dark" : "light");
  }

  applyThemeToDOM($theme.get());
}

/**
 * Toggle between light and dark mode.
 */
export function toggleTheme(): void {
  const next: Theme = $theme.get() === "light" ? "dark" : "light";
  $theme.set(next);
  localStorage.setItem(THEME_KEY, next);
  applyThemeToDOM(next);
}

/**
 * Apply the theme class to the #admin-root element (scoped to Admin Panel).
 * Does NOT touch document.documentElement, so public pages stay light.
 */
function applyThemeToDOM(theme: Theme): void {
  if (typeof document === "undefined") return;
  const adminRoot = document.getElementById("admin-root");
  if (adminRoot) {
    adminRoot.classList.toggle("dark", theme === "dark");
  }
}

