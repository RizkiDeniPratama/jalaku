/**
 * Jalaku — Admin Topbar (React Island)
 *
 * Interactive topbar with:
 * - Dark/Light mode toggle (sun/moon icon)
 * - Notification bell with badge & popover
 * - User profile dropdown (Profile + Logout)
 *
 * Menggunakan Nano Stores untuk theme & notification state.
 */

import { useState, useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { $theme, toggleTheme, initTheme } from "../../stores/themeStore";
import {
  $notifications,
  $unreadCount,
  markAllAsRead,
  markAsRead,
  type Notification,
} from "../../stores/notificationStore";

// Notification type icon & color mapping
const NOTIF_TYPE_STYLES: Record<string, { bg: string; icon: string }> = {
  order: { bg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400", icon: "🛒" },
  booking: { bg: "bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400", icon: "📅" },
  review: { bg: "bg-yellow-100 dark:bg-yellow-900/40 text-yellow-600 dark:text-yellow-400", icon: "⭐" },
  system: { bg: "bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400", icon: "⚠️" },
};

export default function AdminTopbar() {
  const theme = useStore($theme);
  const notifications = useStore($notifications);
  const unreadCount = useStore($unreadCount);

  const [showNotifs, setShowNotifs] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [userEmail, setUserEmail] = useState("");

  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Init theme on mount & read user email from localStorage
  useEffect(() => {
    initTheme();
    try {
      const raw = localStorage.getItem("jalaku_user");
      if (raw) {
        const user = JSON.parse(raw);
        setUserEmail(user.email || "");
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifs(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowProfile(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("jalaku_token");
    localStorage.removeItem("jalaku_user");
    window.location.href = "/admin/login";
  };

  return (
    <div className="flex items-center gap-2">
      {/* ---- Dark/Light Mode Toggle ---- */}
      <button
        id="btn-theme-toggle"
        onClick={toggleTheme}
        className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer group"
        title={theme === "light" ? "Mode Gelap" : "Mode Terang"}
      >
        {/* Sun icon */}
        <svg
          className={`w-5 h-5 transition-all duration-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 ${
            theme === "light"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 rotate-90 scale-50"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
        {/* Moon icon */}
        <svg
          className={`w-5 h-5 transition-all duration-500 ${
            theme === "dark"
              ? "opacity-100 rotate-0 scale-100"
              : "opacity-0 -rotate-90 scale-50"
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="2"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />
        </svg>
      </button>

      {/* ---- Notification Bell ---- */}
      <div ref={notifRef} className="relative">
        <button
          id="btn-notifications"
          onClick={() => {
            setShowNotifs(!showNotifs);
            setShowProfile(false);
          }}
          className="relative p-2.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer group"
          title="Notifikasi"
        >
          <svg
            className="w-5 h-5 text-gray-600 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
            />
          </svg>

          {/* Badge */}
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 animate-pulse-soft shadow-lg shadow-red-500/30">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Notification Popover */}
        {showNotifs && (
          <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-scale z-50">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Notifikasi
              </h3>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllAsRead()}
                  className="text-xs font-medium text-primary hover:text-primary-dark dark:text-green-400 dark:hover:text-green-300 transition-colors cursor-pointer"
                >
                  Tandai semua dibaca
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-80 overflow-y-auto divide-y divide-gray-50 dark:divide-gray-700/50">
              {notifications.map((n: Notification) => {
                const style = NOTIF_TYPE_STYLES[n.type] || NOTIF_TYPE_STYLES.system;
                return (
                  <button
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                    className={`w-full text-left px-5 py-3.5 flex items-start gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !n.isRead ? "bg-primary/5 dark:bg-green-900/10" : ""
                    }`}
                  >
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm shrink-0 mt-0.5 ${style.bg}`}>
                      {style.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {n.title}
                        </p>
                        {!n.isRead && (
                          <span className="w-2 h-2 bg-primary dark:bg-green-400 rounded-full shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                        {n.message}
                      </p>
                      <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                        {n.time}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 dark:border-gray-700">
              <button className="w-full text-center text-xs font-medium text-primary hover:text-primary-dark dark:text-green-400 dark:hover:text-green-300 transition-colors cursor-pointer py-1">
                Lihat semua notifikasi →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ---- User Profile Dropdown ---- */}
      <div ref={profileRef} className="relative">
        <button
          id="btn-user-profile"
          onClick={() => {
            setShowProfile(!showProfile);
            setShowNotifs(false);
          }}
          className="flex items-center gap-2.5 pl-3 pr-2 py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-300 cursor-pointer group"
        >
          <span className="text-sm font-medium text-gray-700 dark:text-gray-200 hidden sm:block max-w-[160px] truncate group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            {userEmail || "Admin"}
          </span>
          <div className="w-9 h-9 bg-gradient-to-br from-primary to-primary-light rounded-full flex items-center justify-center shadow-md shadow-primary/20 group-hover:shadow-lg group-hover:shadow-primary/30 transition-shadow">
            <svg
              className="w-5 h-5 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
          </div>
          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-gray-400 dark:text-gray-500 transition-transform duration-300 ${
              showProfile ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Profile Dropdown */}
        {showProfile && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl shadow-black/10 dark:shadow-black/40 border border-gray-100 dark:border-gray-700 overflow-hidden animate-fade-in-scale z-50">
            {/* User card */}
            <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
              <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {userEmail ? userEmail.split("@")[0] : "Admin"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                {userEmail || "admin@jalaku.com"}
              </p>
            </div>

            {/* Menu items */}
            <div className="p-2">
              <a
                href="/admin"
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
              >
                <svg className="w-4.5 h-4.5 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                Profile
              </a>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full cursor-pointer"
              >
                <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
