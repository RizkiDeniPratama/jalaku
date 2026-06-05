/**
 * Jalaku — NavbarActions (React Island)
 *
 * Komponen navbar kanan yang menangani:
 * - Notification bell + badge
 * - Cart icon + badge (jumlah item)
 * - Profile avatar + dropdown (Pesanan Saya, Profil, Logout)
 * - Login button untuk user yang belum login
 * - Toast notification untuk aksi yang butuh login
 *
 * Menggunakan Nano Stores untuk shared state (auth + cart).
 */

import { useEffect, useState, useRef } from "react";
import { useStore } from "@nanostores/react";
import { $cartCount, initCart } from "../../stores/cartStore";
import {
  $isAuthenticated,
  $user,
  initAuth,
  clearAuth,
} from "../../stores/authStore";

export default function NavbarActions() {
  const isAuth = useStore($isAuthenticated);
  const user = useStore($user);
  const cartCount = useStore($cartCount);

  const [showDropdown, setShowDropdown] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    initAuth();
    initCart();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setToast(null), 3000);
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, [toast]);

  function showLoginRequired(feature: string) {
    setToast(`Silakan login terlebih dahulu untuk mengakses ${feature}.`);
  }

  function handleNotificationClick() {
    if (!isAuth) {
      showLoginRequired("notifikasi");
    }
    // For now, notifications are not implemented — just show a message
  }

  function handleCartClick() {
    if (!isAuth) {
      showLoginRequired("keranjang");
      return;
    }
    window.location.href = "/checkout";
  }

  function handleLogout() {
    clearAuth();
    setShowDropdown(false);
    window.location.href = "/";
  }

  // Get user initials for avatar
  const userInitial = user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <div className="flex items-center gap-1">
        {/* ---- Notification Bell ---- */}
        <button
          onClick={handleNotificationClick}
          className="relative p-2 rounded-xl hover:bg-sage/10 transition-colors group cursor-pointer"
          aria-label="Notifikasi"
        >
          <span className="material-symbols-outlined text-[22px] text-on-surface/70 group-hover:text-primary transition-colors">
            notifications
          </span>
          {/* Static badge — always show for visual */}
          {isAuth && (
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-amber-accent rounded-full border-2 border-surface" />
          )}
        </button>

        {/* ---- Divider (desktop) ---- */}
        <div className="hidden md:block w-px h-6 bg-sage/30 mx-1" />

        {/* ---- Cart Icon ---- */}
        <button
          onClick={handleCartClick}
          className="relative p-2 rounded-xl hover:bg-sage/10 transition-colors group cursor-pointer"
          aria-label={`Keranjang: ${cartCount} item`}
        >
          <span className="material-symbols-outlined text-[22px] text-on-surface/70 group-hover:text-primary transition-colors">
            shopping_cart
          </span>
          {cartCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[20px] h-5 flex items-center justify-center rounded-full bg-amber-accent text-white text-[11px] font-bold px-1 animate-fade-in-scale">
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </button>

        {/* ---- Divider (desktop) ---- */}
        <div className="hidden md:block w-px h-6 bg-sage/30 mx-1" />

        {/* ---- Profile / Login ---- */}
        {isAuth ? (
          <div ref={dropdownRef} className="relative hidden md:block">
            <button
              onClick={() => setShowDropdown((prev) => !prev)}
              className="flex items-center gap-2 cursor-pointer group p-1 rounded-xl hover:bg-sage/10 transition-all"
              aria-expanded={showDropdown}
              aria-haspopup="true"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-sage/50 to-primary/30 flex items-center justify-center ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                <span className="text-sm font-bold text-primary">
                  {userInitial}
                </span>
              </div>
              <span className="material-symbols-outlined text-[18px] text-on-surface/50 group-hover:text-primary transition-colors">
                {showDropdown ? "expand_less" : "expand_more"}
              </span>
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-52 bg-white rounded-xl shadow-xl border border-sage/15 animate-fade-in-scale z-50 overflow-hidden">
                {/* User info header */}
                <div className="px-4 py-3 bg-beige-bg/50 border-b border-sage/10">
                  <p className="text-sm font-bold text-primary truncate">
                    {user?.email || "User"}
                  </p>
                  <p className="text-xs text-on-surface/50 mt-0.5">
                    {user?.poin || 0} poin
                  </p>
                </div>

                <div className="py-1.5">
                  <a
                    href="/lacak"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface/80 hover:bg-sage/10 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      local_shipping
                    </span>
                    Pesanan Saya
                  </a>
                  <a
                    href="#"
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-on-surface/80 hover:bg-sage/10 hover:text-primary transition-colors"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      person
                    </span>
                    Profil
                  </a>
                </div>

                <div className="border-t border-sage/10 py-1.5">
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      logout
                    </span>
                    Keluar
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <a
            href="/admin/login"
            className="hidden md:inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-all shadow-sm hover:shadow-md"
          >
            <span className="material-symbols-outlined text-[18px]">login</span>
            Masuk
          </a>
        )}
      </div>

      {/* ---- Toast Notification ---- */}
      {toast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-slide-down">
          <div className="bg-white border border-sage/20 rounded-xl shadow-xl px-5 py-3.5 flex items-center gap-3 max-w-sm">
            <span className="material-symbols-outlined text-amber-accent text-xl shrink-0">
              info
            </span>
            <p className="text-sm text-on-surface/80">{toast}</p>
            <button
              onClick={() => setToast(null)}
              className="text-on-surface/40 hover:text-on-surface/70 transition-colors shrink-0 cursor-pointer"
            >
              <span className="material-symbols-outlined text-[18px]">
                close
              </span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
