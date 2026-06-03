/**
 * Jalaku — LoginForm (React Island)
 *
 * Komponen React interaktif untuk autentikasi admin & customer.
 */

import { useState, useEffect, useRef } from "react";
import { useStore } from "@nanostores/react";
import { setAuth, initAuth, $isAuthenticated } from "../../stores/authStore";
import { apiClient } from "../../lib/api";
import type { AuthUser } from "../../lib/auth";

interface LoginResponse {
  token: string;
  user: AuthUser;
}

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [mounted, setMounted] = useState(false);
  const isAuth = useStore($isAuthenticated);
  
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    initAuth();
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    if (isAuth) {
      window.location.href = "/admin"; 
    }
  }, [isAuth]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasError(false);
    setIsLoading(true);

    try {
      const res = await apiClient.post<LoginResponse>(
        "/auth/login",
        { email, password },
        "user"
      );
      if (res.data) {
        setAuth(res.data.token, res.data.user);
      }
    } catch (err: unknown) {
      setHasError(true);
      setPassword("");
      // Using setTimeout to ensure focus happens after React renders the cleared state
      setTimeout(() => passwordRef.current?.focus(), 0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    console.log("Google Login clicked");
  };

  const handleFacebookLogin = () => {
    console.log("Facebook Login clicked");
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F0E8] relative overflow-hidden font-['Montserrat'] px-4 py-8">
      {/* Subtle Botanical Accents */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-[#A8C5A0]/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#D4A853]/10 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div
        className={`relative z-10 w-full max-w-[420px] transition-all duration-700 ease-out ${
          mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        }`}
      >
        {/* Header - Brand Name */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex items-center gap-2 text-[#2D5016]">
            <span className="text-3xl" aria-hidden="true">🌿</span>
            <span className="text-3xl font-bold font-['Lora'] tracking-tight">Jalaku</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#FFFFFF] rounded-2xl shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-gray-100 p-8">
          
          {/* Title Section */}
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-gray-900 font-['Lora'] mb-1.5">
              Masuk
            </h1>
            <p className="text-gray-500 text-sm">
              Akses akun Anda untuk melanjutkan.
            </p>
          </div>

          {/* Error Banner */}
          {hasError && (
            <div className="mb-6 px-4 py-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-3 animate-fade-in">
              <svg className="w-5 h-5 text-red-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-red-600 font-medium">Email atau kata sandi salah.</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email Field */}
            <div className="space-y-1.5">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@email.com"
                  disabled={isLoading}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C5A0] focus:border-[#2D5016] transition-all disabled:opacity-50 disabled:bg-gray-50"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-1.5">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Kata Sandi
              </label>
              <div className="relative">
                <input
                  id="password"
                  ref={passwordRef}
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={isLoading}
                  className="w-full pl-4 pr-12 py-3 rounded-xl bg-gray-50/50 border border-gray-200 text-gray-900 placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-[#A8C5A0] focus:border-[#2D5016] transition-all disabled:opacity-50 disabled:bg-gray-50"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-[#2D5016] transition-colors"
                  aria-label={showPassword ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                >
                  {showPassword ? (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Form Utilities */}
            <div className="flex items-center justify-between pt-1 pb-2">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="peer appearance-none w-4 h-4 rounded border border-gray-300 checked:bg-[#2D5016] checked:border-[#2D5016] transition-all cursor-pointer focus:ring-2 focus:ring-[#A8C5A0]/50"
                  />
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-sm text-gray-600 group-hover:text-gray-900 transition-colors select-none">Ingat saya</span>
              </label>
              <a href="#" className="text-sm text-[#2D5016] font-medium hover:text-[#A8C5A0] transition-colors focus:outline-none focus:underline">
                Lupa sandi?
              </a>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !email || !password}
              className="w-full py-3 px-6 rounded-xl font-semibold text-sm text-white bg-[#2D5016] hover:bg-[#1B4332] focus:ring-4 focus:ring-[#A8C5A0]/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Memproses...
                </>
              ) : (
                "Masuk"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-[#FFFFFF] text-gray-400">Atau masuk dengan</span>
            </div>
          </div>

          {/* Social Logins */}
          <div className="space-y-3">
            {/* Google OAuth Button */}
            <button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full py-3 px-4 rounded-xl bg-[#FFFFFF] border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Google
            </button>
            
            {/* Facebook OAuth Button */}
            <button
              type="button"
              onClick={handleFacebookLogin}
              className="w-full py-3 px-4 rounded-xl bg-[#FFFFFF] border border-gray-200 text-gray-700 font-medium text-sm hover:bg-gray-50 focus:outline-none focus:ring-4 focus:ring-gray-100 transition-all flex items-center justify-center gap-3"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" fill="#1877F2"/>
              </svg>
              Facebook
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-sm">
          <span className="text-gray-500">Belum memiliki akun? </span>
          <a href="/register" className="font-semibold text-[#D4A853] hover:text-[#C39A4A] transition-colors focus:outline-none focus:underline">
            Daftar Sekarang
          </a>
        </div>

      </div>
    </div>
  );
}
