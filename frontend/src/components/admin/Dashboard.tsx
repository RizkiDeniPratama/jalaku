/**
 * Jalaku — Admin Dashboard (React Island)
 *
 * Enhanced dashboard with:
 * - 6 stat cards (4 existing + 2 new: Total Users, Total Reviews)
 * - Month-over-month comparison on each card
 * - Recent orders (5 most recent) with skeleton loading
 * - Quick actions section
 * - Analytics charts (separate component)
 *
 * Mengambil data dari 3 service: Product, Order, Booking.
 * Dark mode aware via Tailwind dark: classes.
 */

import { useState, useEffect, lazy, Suspense } from "react";
import { useStore } from "@nanostores/react";
import { $user, initAuth } from "../../stores/authStore";
import { apiClient } from "../../lib/api";

// Lazy load charts — Recharts is ~200KB, no need to block initial paint
const DashboardCharts = lazy(() => import("./DashboardCharts"));

interface DashboardStats {
  totalProduk: number;
  pesananBaru: number;
  bookingAktif: number;
  totalPendapatan: number;
}

interface RecentOrder {
  id: string;
  nama_pembeli: string;
  total: number;
  status: string;
  metode_bayar: string;
}

const STATUS_COLORS: Record<string, string> = {
  new: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300",
  confirmed:
    "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300",
  completed:
    "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300",
  cancelled: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300",
  pending:
    "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300",
};

const STATUS_LABELS: Record<string, string> = {
  new: "Baru",
  confirmed: "Dikonfirmasi",
  completed: "Selesai",
  cancelled: "Dibatalkan",
  pending: "Menunggu",
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Month-over-month comparison component.
 * Displays dummy MoM data since we don't have historical API data yet.
 */
function MoMBadge({ percent, label }: { percent: number; label: string }) {
  const isUp = percent >= 0;
  return (
    <div className="flex items-center gap-1 mt-3">
      <span
        className={`inline-flex items-center gap-0.5 text-xs font-semibold px-2 py-0.5 rounded-full ${
          isUp
            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
            : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
        }`}
      >
        {isUp ? "↑" : "↓"} {Math.abs(percent)}%
      </span>
      <span className="text-[11px] text-gray-400 dark:text-gray-500">
        {label}
      </span>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalProduk: 0,
    pesananBaru: 0,
    bookingAktif: 0,
    totalPendapatan: 0,
  });
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const user = useStore($user);

  useEffect(() => {
    initAuth();
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setIsLoading(true);
    setError("");

    try {
      // Fetch data dari 3 service secara paralel
      const [productsRes, ordersRes, bookingsRes] = await Promise.allSettled([
        apiClient.get<unknown>("/products?limit=1", "product"),
        apiClient.get<RecentOrder[]>("/orders?limit=5", "order"),
        apiClient.get<unknown>("/bookings?limit=1", "booking"),
      ]);

      let totalProduk = 0;
      let pesananBaru = 0;
      let bookingAktif = 0;
      const orders: RecentOrder[] = [];

      if (productsRes.status === "fulfilled" && productsRes.value.meta) {
        totalProduk = productsRes.value.meta.total_items || 0;
      }

      if (ordersRes.status === "fulfilled") {
        pesananBaru = ordersRes.value.meta?.total_items || 0;
        if (Array.isArray(ordersRes.value.data)) {
          orders.push(...ordersRes.value.data);
        }
      }

      if (bookingsRes.status === "fulfilled" && bookingsRes.value.meta) {
        bookingAktif = bookingsRes.value.meta.total_items || 0;
      }

      // Hitung total pendapatan dari orders yang completed
      let totalPendapatan = 0;
      try {
        const completedRes = await apiClient.get<RecentOrder[]>(
          "/orders?status=completed&limit=999",
          "order",
        );
        if (Array.isArray(completedRes.data)) {
          totalPendapatan = completedRes.data.reduce(
            (sum, o) => sum + (o.total || 0),
            0,
          );
        }
      } catch {
        // Ignore — pendapatan opsional
      }

      setStats({ totalProduk, pesananBaru, bookingAktif, totalPendapatan });
      setRecentOrders(orders);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Gagal memuat data dashboard.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }

  // Skeleton loader
  const SkeletonCard = () => (
    <div className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="w-20 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded" />
          <div className="w-24 h-4 bg-gray-200 dark:bg-gray-700 rounded-full" />
        </div>
        <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-xl" />
      </div>
    </div>
  );

  // Order row skeleton
  const SkeletonRow = () => (
    <div className="animate-pulse flex items-center gap-4 px-6 py-4">
      <div className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-xl shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="w-32 h-4 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
      <div className="w-20 h-6 bg-gray-200 dark:bg-gray-700 rounded-full" />
    </div>
  );

  // Stat cards config — 6 cards total
  // The MoM percentages are DUMMY data since no historical API exists yet
  const statCards = [
    {
      label: "Total Produk",
      value: stats.totalProduk,
      format: (v: number) => v.toString(),
      momPercent: 12,
      momLabel: "dari bulan lalu",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />
        </svg>
      ),
      iconBg: "bg-emerald-100 dark:bg-emerald-900/30",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
    {
      label: "Total Pesanan",
      value: stats.pesananBaru,
      format: (v: number) => v.toString(),
      momPercent: 8,
      momLabel: "dari bulan lalu",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
      ),
      iconBg: "bg-blue-100 dark:bg-blue-900/30",
      iconColor: "text-blue-600 dark:text-blue-400",
    },
    {
      label: "Booking Aktif",
      value: stats.bookingAktif,
      format: (v: number) => v.toString(),
      momPercent: -5,
      momLabel: "dari bulan lalu",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      ),
      iconBg: "bg-amber-100 dark:bg-amber-900/30",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      label: "Pendapatan",
      value: stats.totalPendapatan,
      format: (v: number) => formatRupiah(v),
      momPercent: 24,
      momLabel: "dari bulan lalu",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-violet-100 dark:bg-violet-900/30",
      iconColor: "text-violet-600 dark:text-violet-400",
    },
    {
      label: "Total Pengunjung",
      value: 1247, // DUMMY — no visitor tracking API yet
      format: (v: number) => v.toLocaleString("id-ID"),
      momPercent: 18,
      momLabel: "dari bulan lalu",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      iconBg: "bg-cyan-100 dark:bg-cyan-900/30",
      iconColor: "text-cyan-600 dark:text-cyan-400",
    },
    {
      label: "Total Review",
      value: 105, // DUMMY — no review API yet
      format: (v: number) => v.toString(),
      momPercent: 15,
      momLabel: "dari bulan lalu",
      // Show average rating as sub-text
      subText: "⭐ 4.6 rata-rata",
      icon: (
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          strokeWidth="1.75"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
          />
        </svg>
      ),
      iconBg: "bg-yellow-100 dark:bg-yellow-900/30",
      iconColor: "text-yellow-600 dark:text-yellow-400",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting */}
      <div>
        <h2
          className="text-2xl font-bold text-gray-900 dark:text-white"
          style={{ fontFamily: "Outfit, Montserrat, sans-serif" }}
        >
          Selamat datang kembali
          {user?.email ? `, ${user.email.split("@")[0]}` : ""}
        </h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Berikut ringkasan aktivitas toko Anda hari ini.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="animate-slide-down px-4 py-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 flex items-center gap-3">
          <svg
            className="w-5 h-5 text-red-500 shrink-0"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="ml-auto text-sm font-medium text-red-600 dark:text-red-400 hover:underline cursor-pointer"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* Stats Cards — 6 cards in responsive grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card) => (
              <div
                key={card.label}
                className="bg-white dark:bg-gray-800/60 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-gray-700/50 hover:shadow-md hover:border-gray-200 dark:hover:border-gray-600 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                      {card.label}
                    </p>
                    <p
                      className="text-2xl font-bold text-gray-900 dark:text-white mt-2"
                      style={{ fontFamily: "Outfit, Montserrat, sans-serif" }}
                    >
                      {card.format(card.value)}
                    </p>
                    {/* Subtxt for review avg rating */}
                    {"subText" in card && card.subText && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {card.subText}
                      </p>
                    )}
                    <MoMBadge percent={card.momPercent} label={card.momLabel} />
                  </div>
                  <div
                    className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center ${card.iconColor} group-hover:scale-110 transition-transform duration-300`}
                  >
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700/50 flex items-center justify-between">
          <h3
            className="text-lg font-bold text-gray-900 dark:text-white"
            style={{ fontFamily: "Outfit, Montserrat, sans-serif" }}
          >
            Pesanan Terbaru
          </h3>
          <a
            href="/admin/pesanan"
            className="text-sm font-medium text-primary hover:text-primary-dark dark:text-green-400 dark:hover:text-green-300 transition-colors"
          >
            Lihat semua →
          </a>
        </div>

        {isLoading ? (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/30">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonRow key={i} />
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <svg
              className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="1.5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            <p className="text-gray-400 dark:text-gray-500 text-sm">
              Belum ada pesanan masuk.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50 dark:divide-gray-700/30">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors"
              >
                <div className="w-10 h-10 bg-primary/8 dark:bg-green-900/30 rounded-xl flex items-center justify-center shrink-0">
                  <svg
                    className="w-5 h-5 text-primary dark:text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    strokeWidth="1.75"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                    {order.nama_pembeli}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                    {order.metode_bayar === "cod" ? "COD" : "Transfer Bank"} •{" "}
                    {formatRupiah(order.total)}
                  </p>
                </div>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"}`}
                >
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Analytics Charts Section ===== */}
      <div>
        <h3
          className="text-lg font-bold text-gray-900 dark:text-white mb-5"
          style={{ fontFamily: "Outfit, Montserrat, sans-serif" }}
        >
          📊 Analitik
        </h3>
        <Suspense
          fallback={
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-800/60 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 h-80 animate-pulse"
                >
                  <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700/50">
                    <div className="w-36 h-5 bg-gray-200 dark:bg-gray-700 rounded" />
                  </div>
                  <div className="p-5 flex items-center justify-center h-56">
                    <div className="w-full h-full bg-gray-100 dark:bg-gray-700/50 rounded-xl" />
                  </div>
                </div>
              ))}
            </div>
          }
        >
          <DashboardCharts />
        </Suspense>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="/admin/produk/tambah"
          className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-800/60 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:border-primary/30 dark:hover:border-green-700/50 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-10 h-10 bg-primary/10 dark:bg-green-900/30 rounded-xl flex items-center justify-center text-primary dark:text-green-400 group-hover:bg-primary group-hover:text-white dark:group-hover:bg-green-600 transition-all duration-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Tambah Produk
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Buat produk baru
            </p>
          </div>
        </a>

        <a
          href="/admin/pesanan"
          className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-800/60 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:border-blue-300 dark:hover:border-blue-700/50 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white dark:group-hover:bg-blue-600 transition-all duration-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Kelola Pesanan
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Pantau transaksi
            </p>
          </div>
        </a>

        <a
          href="/admin/booking"
          className="flex items-center gap-4 px-6 py-4 bg-white dark:bg-gray-800/60 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700/50 hover:border-amber-300 dark:hover:border-amber-700/50 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-xl flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-500 group-hover:text-white dark:group-hover:bg-amber-600 transition-all duration-300">
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              strokeWidth="2"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              Kelola Booking
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Antrean pre-order
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
