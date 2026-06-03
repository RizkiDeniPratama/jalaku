/**
 * Jalaku — OrderTable (React Island)
 *
 * Tabel pesanan (Ready Stock) untuk admin.
 *
 * Fitur:
 * - Filter berdasarkan status
 * - Pagination
 * - Detail pesanan expandable
 * - Ubah status pesanan (dropdown)
 * - Format mata uang Rupiah
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../lib/api";

interface Order {
  id: string;
  user_id?: string | null;
  nama_pembeli: string;
  no_wa: string;
  alamat_kirim: string;
  metode_bayar: string;
  catatan?: string;
  items: { product_id: string; jumlah: number }[];
  total: number;
  status: string;
  cancel_reason?: string;
}

interface PaginationMeta {
  total_items: number;
  current_page: number;
  total_pages: number;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  new: { label: "Baru", className: "bg-info/15 text-info" },
  confirmed: { label: "Dikonfirmasi", className: "bg-primary/15 text-primary" },
  completed: { label: "Selesai", className: "bg-success/15 text-success" },
  cancelled: { label: "Dibatalkan", className: "bg-danger/15 text-danger" },
};

const STATUS_OPTIONS = ["new", "confirmed", "completed", "cancelled"];

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function OrderTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total_items: 0, current_page: 1, total_pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const limit = 10;

  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page: currentPage, limit };
      if (filterStatus) params.status = filterStatus;

      const res = await apiClient.get<Order[]>("/orders", "order", params);
      if (Array.isArray(res.data)) setOrders(res.data);
      if (res.meta) {
        setMeta({
          total_items: res.meta.total_items || 0,
          current_page: res.meta.current_page || 1,
          total_pages: res.meta.total_pages || 1,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat pesanan.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);
  useEffect(() => { setCurrentPage(1); }, [filterStatus]);

  async function handleStatusChange(orderId: string, newStatus: string) {
    setChangingStatus(orderId);
    try {
      await apiClient.patch(`/orders/${orderId}/status`, { status: newStatus }, "order");
      fetchOrders();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status.");
    } finally {
      setChangingStatus(null);
    }
  }

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-5 py-4"><div className="w-28 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-24 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-16 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-20 h-6 bg-gray-200 rounded-full" /></td>
      <td className="px-5 py-4"><div className="w-24 h-8 bg-gray-200 rounded-lg" /></td>
    </tr>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
          Kelola Pesanan
        </h2>
        <p className="text-sm text-text-light mt-0.5">
          {meta.total_items} pesanan — barang ready stock
        </p>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-light/50 transition-all cursor-pointer"
        >
          <option value="">Semua Status</option>
          {Object.entries(STATUS_CONFIG).map(([val, cfg]) => (
            <option key={val} value={val}>{cfg.label}</option>
          ))}
        </select>
      </div>

      {/* Error */}
      {error && (
        <div className="animate-slide-down px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3">
          <svg className="w-5 h-5 text-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-danger">{error}</p>
          <button onClick={fetchOrders} className="ml-auto text-sm font-medium text-danger hover:underline cursor-pointer">Coba lagi</button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Pembeli</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">No. WA</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Total</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Bayar</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                    </svg>
                    <p className="text-text-light text-sm">Belum ada pesanan.</p>
                  </td>
                </tr>
              ) : (
                orders.map((order) => {
                  const statusCfg = STATUS_CONFIG[order.status] || { label: order.status, className: "bg-gray-100 text-gray-600" };
                  const isExpanded = expandedId === order.id;

                  return (
                    <>
                      <tr key={order.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : order.id)}
                            className="flex items-center gap-2 text-left cursor-pointer group"
                          >
                            <svg className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors">{order.nama_pembeli}</span>
                          </button>
                        </td>
                        <td className="px-5 py-3 text-sm text-text-light">{order.no_wa}</td>
                        <td className="px-5 py-3 text-sm font-medium text-text">{formatRupiah(order.total)}</td>
                        <td className="px-5 py-3">
                          <span className="text-sm text-text-light">
                            {order.metode_bayar === "cod" ? "COD" : "Transfer"}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={changingStatus === order.id}
                            className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-text bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-light/50 transition-all cursor-pointer disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                            ))}
                          </select>
                        </td>
                      </tr>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <tr key={`${order.id}-detail`}>
                          <td colSpan={6} className="px-5 py-4 bg-gray-50/50">
                            <div className="animate-slide-down grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm max-w-2xl">
                              <div>
                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Alamat Kirim</p>
                                <p className="text-text">{order.alamat_kirim}</p>
                              </div>
                              <div>
                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Items</p>
                                <p className="text-text">{order.items?.length || 0} item</p>
                              </div>
                              {order.catatan && (
                                <div>
                                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Catatan</p>
                                  <p className="text-text">{order.catatan}</p>
                                </div>
                              )}
                              {order.cancel_reason && (
                                <div>
                                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Alasan Batal</p>
                                  <p className="text-danger">{order.cancel_reason}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Order ID</p>
                                <p className="text-text font-mono text-xs">{order.id}</p>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {meta.total_pages > 1 && (
          <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between">
            <p className="text-sm text-text-light">
              Halaman {meta.current_page} dari {meta.total_pages}
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                ← Prev
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(meta.total_pages, p + 1))}
                disabled={currentPage >= meta.total_pages}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
