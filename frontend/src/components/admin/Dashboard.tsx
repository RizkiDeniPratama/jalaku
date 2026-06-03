/**
 * Jalaku — Admin Dashboard (React Island)
 *
 * Menampilkan overview statistik dan aktivitas terbaru.
 * Mengambil data dari 3 service: Product, Order, Booking.
 */

import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import { $user, initAuth } from "../../stores/authStore";
import { apiClient } from "../../lib/api";

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
  new: "bg-info/15 text-info",
  confirmed: "bg-primary/15 text-primary",
  completed: "bg-success/15 text-success",
  cancelled: "bg-danger/15 text-danger",
  pending: "bg-warning/15 text-warning",
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
          "order"
        );
        if (Array.isArray(completedRes.data)) {
          totalPendapatan = completedRes.data.reduce(
            (sum, o) => sum + (o.total || 0),
            0
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
    <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="space-y-3 flex-1">
          <div className="w-20 h-4 bg-gray-200 rounded" />
          <div className="w-16 h-8 bg-gray-200 rounded" />
        </div>
        <div className="w-12 h-12 bg-gray-200 rounded-xl" />
      </div>
    </div>
  );

  const statCards = [
    {
      label: "Total Produk",
      value: stats.totalProduk,
      format: (v: number) => v.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      color: "bg-primary/10 text-primary",
      iconBg: "bg-primary/10",
    },
    {
      label: "Total Pesanan",
      value: stats.pesananBaru,
      format: (v: number) => v.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
      ),
      color: "bg-info/10 text-info",
      iconBg: "bg-info/10",
    },
    {
      label: "Booking Aktif",
      value: stats.bookingAktif,
      format: (v: number) => v.toString(),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      color: "bg-warning/10 text-warning",
      iconBg: "bg-warning/10",
    },
    {
      label: "Pendapatan",
      value: stats.totalPendapatan,
      format: (v: number) => formatRupiah(v),
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      color: "bg-secondary/10 text-secondary",
      iconBg: "bg-secondary/10",
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Greeting */}
      <div>
        <h2
          className="text-2xl font-bold text-text"
          style={{ fontFamily: "Outfit, sans-serif" }}
        >
          Selamat datang kembali{user?.email ? `, ${user.email.split("@")[0]}` : ""} 👋
        </h2>
        <p className="text-text-light mt-1">
          Berikut ringkasan aktivitas toko Anda hari ini.
        </p>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="animate-slide-down px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3">
          <svg className="w-5 h-5 text-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-danger">{error}</p>
          <button onClick={fetchDashboardData} className="ml-auto text-sm font-medium text-danger hover:underline cursor-pointer">
            Coba lagi
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
          : statCards.map((card) => (
              <div
                key={card.label}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:border-gray-200 transition-all duration-300 group"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-text-light">{card.label}</p>
                    <p
                      className="text-2xl font-bold text-text mt-2"
                      style={{ fontFamily: "Outfit, sans-serif" }}
                    >
                      {card.format(card.value)}
                    </p>
                  </div>
                  <div className={`w-12 h-12 ${card.iconBg} rounded-xl flex items-center justify-center ${card.color} group-hover:scale-110 transition-transform duration-300`}>
                    {card.icon}
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Recent Orders */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between">
          <h3
            className="text-lg font-bold text-text"
            style={{ fontFamily: "Outfit, sans-serif" }}
          >
            Pesanan Terbaru
          </h3>
          <a
            href="/admin/pesanan"
            className="text-sm font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Lihat semua →
          </a>
        </div>

        {isLoading ? (
          <div className="p-6 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-200 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <div className="w-32 h-4 bg-gray-200 rounded" />
                  <div className="w-20 h-3 bg-gray-200 rounded" />
                </div>
                <div className="w-24 h-6 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : recentOrders.length === 0 ? (
          <div className="p-12 text-center">
            <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <p className="text-text-light text-sm">Belum ada pesanan masuk.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors"
              >
                <div className="w-10 h-10 bg-primary/8 rounded-xl flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text truncate">{order.nama_pembeli}</p>
                  <p className="text-xs text-text-muted mt-0.5">
                    {order.metode_bayar === "cod" ? "COD" : "Transfer Bank"} • {formatRupiah(order.total)}
                  </p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[order.status] || order.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <a
          href="/admin/produk/tambah"
          className="flex items-center gap-4 px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-primary/30 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Tambah Produk</p>
            <p className="text-xs text-text-muted">Buat produk baru</p>
          </div>
        </a>

        <a
          href="/admin/pesanan"
          className="flex items-center gap-4 px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-info/30 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-10 h-10 bg-info/10 rounded-xl flex items-center justify-center text-info group-hover:bg-info group-hover:text-white transition-all duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Kelola Pesanan</p>
            <p className="text-xs text-text-muted">Pantau transaksi</p>
          </div>
        </a>

        <a
          href="/admin/booking"
          className="flex items-center gap-4 px-6 py-4 bg-white rounded-2xl shadow-sm border border-gray-100 hover:border-warning/30 hover:shadow-md transition-all duration-300 group"
        >
          <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center text-warning group-hover:bg-warning group-hover:text-white transition-all duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-semibold text-text">Kelola Booking</p>
            <p className="text-xs text-text-muted">Antrean pre-order</p>
          </div>
        </a>
      </div>
    </div>
  );
}
