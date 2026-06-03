/**
 * Jalaku — OrderTracker (React Island)
 *
 * Fitur lacak pesanan & booking berdasarkan nomor WhatsApp.
 *
 * Langkah:
 * 1. Input nomor WA → search
 * 2. Tampilkan list pesanan (orders) yang ditemukan
 * 3. Expand detail + opsi batalkan (jika status new/pending)
 *
 * Integrasi:
 * - GET /orders/cek?no_wa=...
 * - PATCH /orders/:id/cancel
 */

import { useState } from "react";
import { apiClient } from "../../lib/api";

interface OrderItem {
  product_id: string;
  jumlah: number;
}

interface Order {
  id: string;
  nama_pembeli: string;
  no_wa: string;
  alamat_kirim: string;
  metode_bayar: string;
  catatan?: string;
  items: OrderItem[];
  total: number;
  status: string;
  cancel_reason?: string;
  created_at?: string;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: string }> = {
  new: { label: "Menunggu Konfirmasi", color: "text-info bg-info/10 border-info/20", icon: "🕐" },
  confirmed: { label: "Dikonfirmasi", color: "text-primary bg-primary/10 border-primary/20", icon: "✅" },
  completed: { label: "Selesai", color: "text-success bg-success/10 border-success/20", icon: "🎉" },
  cancelled: { label: "Dibatalkan", color: "text-danger bg-danger/10 border-danger/20", icon: "❌" },
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return "-";
  return new Date(dateStr).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function OrderTracker() {
  const [noWa, setNoWa] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Cancel state
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setOrders([]);
    setHasSearched(false);

    const cleaned = noWa.trim();
    if (!cleaned || cleaned.length < 10) {
      setError("Masukkan nomor WhatsApp yang valid (minimal 10 digit).");
      return;
    }

    setIsSearching(true);

    try {
      const res = await apiClient.get<Order[]>("/orders/cek", "order", { no_wa: cleaned });
      const data = Array.isArray(res.data) ? res.data : [];
      setOrders(data);
      setHasSearched(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mencari pesanan.");
    } finally {
      setIsSearching(false);
    }
  }

  async function handleCancel() {
    if (!cancelId || !cancelReason.trim()) {
      setError("Alasan pembatalan wajib diisi.");
      return;
    }

    setIsCancelling(true);
    setError("");

    try {
      await apiClient.patch(
        `/orders/${cancelId}/cancel`,
        { no_wa: noWa.trim(), cancel_reason: cancelReason.trim() },
        "order"
      );

      // Update local state
      setOrders((prev) =>
        prev.map((o) =>
          o.id === cancelId
            ? { ...o, status: "cancelled", cancel_reason: cancelReason.trim() }
            : o
        )
      );
      setCancelId(null);
      setCancelReason("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal membatalkan pesanan.");
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">

      {/* Search Form */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
              Lacak Pesanan
            </h2>
            <p className="text-xs text-text-muted">Cari pesanan menggunakan nomor WhatsApp Anda</p>
          </div>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3">
          <div className="flex-1 relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2">
              <svg className="w-5 h-5 text-text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <input
              type="tel"
              value={noWa}
              onChange={(e) => setNoWa(e.target.value)}
              placeholder="08xxxxxxxxxx"
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:bg-white transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={isSearching}
            className="px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer shrink-0"
            style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)" }}
          >
            {isSearching ? (
              <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : (
              "Cari"
            )}
          </button>
        </form>
      </div>

      {/* Error */}
      {error && (
        <div className="animate-slide-down px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3">
          <svg className="w-5 h-5 text-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {/* Empty Result */}
      {hasSearched && orders.length === 0 && (
        <div className="text-center py-12 animate-fade-in">
          <svg className="w-14 h-14 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-text-light text-sm">
            Tidak ditemukan pesanan untuk nomor <strong>{noWa}</strong>
          </p>
          <p className="text-xs text-text-muted mt-1">
            Pastikan nomor WhatsApp yang dimasukkan sudah benar.
          </p>
        </div>
      )}

      {/* Orders List */}
      {orders.length > 0 && (
        <div className="space-y-4">
          <p className="text-sm text-text-light">
            Ditemukan <strong className="text-text">{orders.length}</strong> pesanan
          </p>

          {orders.map((order) => {
            const cfg = STATUS_CONFIG[order.status] || { label: order.status, color: "text-gray-600 bg-gray-100", icon: "📦" };
            const isExpanded = expandedId === order.id;
            const canCancel = order.status === "new";

            return (
              <div key={order.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                {/* Header (clickable) */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  className="w-full px-5 py-4 flex items-center justify-between gap-3 hover:bg-gray-50/50 transition-colors cursor-pointer text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl">{cfg.icon}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-text truncate">
                        {formatRupiah(order.total)}
                      </p>
                      <p className="text-xs text-text-muted mt-0.5">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    <svg
                      className={`w-4 h-4 text-text-muted transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-gray-100 animate-slide-down">
                    <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-text-muted text-xs">Penerima</p>
                        <p className="text-text font-medium">{order.nama_pembeli}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">WhatsApp</p>
                        <p className="text-text font-medium">{order.no_wa}</p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-text-muted text-xs">Alamat</p>
                        <p className="text-text font-medium">{order.alamat_kirim}</p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">Pembayaran</p>
                        <p className="text-text font-medium">
                          {order.metode_bayar === "cod" ? "COD" : "Transfer Bank"}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-muted text-xs">Order ID</p>
                        <p className="text-text font-mono text-xs">{order.id}</p>
                      </div>
                    </div>

                    {order.items && order.items.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-dashed border-gray-200">
                        <p className="text-xs text-text-muted mb-2">Item pesanan ({order.items.length})</p>
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm py-1">
                            <span className="text-text-light">Produk #{idx + 1}</span>
                            <span className="text-text font-medium">× {item.jumlah}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {order.catatan && (
                      <div className="mt-3 px-3 py-2 rounded-lg bg-gray-50 text-xs text-text-light">
                        💬 {order.catatan}
                      </div>
                    )}

                    {order.cancel_reason && (
                      <div className="mt-3 px-3 py-2 rounded-lg bg-danger/5 border border-danger/10 text-xs text-danger">
                        ❌ Alasan: {order.cancel_reason}
                      </div>
                    )}

                    {/* Cancel Button */}
                    {canCancel && cancelId !== order.id && (
                      <button
                        onClick={() => setCancelId(order.id)}
                        className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-danger border border-danger/20 hover:bg-danger/5 transition-colors cursor-pointer"
                      >
                        Batalkan Pesanan
                      </button>
                    )}

                    {/* Cancel Form */}
                    {cancelId === order.id && (
                      <div className="mt-4 p-4 rounded-xl bg-danger/5 border border-danger/10 space-y-3 animate-slide-down">
                        <p className="text-sm font-semibold text-danger">Batalkan pesanan ini?</p>
                        <textarea
                          rows={2}
                          value={cancelReason}
                          onChange={(e) => setCancelReason(e.target.value)}
                          placeholder="Alasan pembatalan..."
                          className="w-full px-3 py-2 rounded-lg bg-white border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-danger/30 resize-none"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setCancelId(null); setCancelReason(""); }}
                            disabled={isCancelling}
                            className="px-4 py-2 rounded-lg text-xs font-medium border border-gray-200 text-text hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            Batal
                          </button>
                          <button
                            onClick={handleCancel}
                            disabled={isCancelling}
                            className="px-4 py-2 rounded-lg text-xs font-semibold bg-danger text-white hover:bg-danger/90 transition-colors disabled:opacity-50 cursor-pointer"
                          >
                            {isCancelling ? "Memproses..." : "Ya, Batalkan"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
