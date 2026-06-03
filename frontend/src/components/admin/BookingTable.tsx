/**
 * Jalaku — BookingTable (React Island)
 *
 * Tabel booking / reservasi pre-order untuk admin.
 *
 * Fitur:
 * - Pagination
 * - Ubah status booking (pending → confirmed/cancelled)
 * - Soft delete (tombol hapus → menyuntikkan deleted_at)
 * - Detail expandable
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../lib/api";

interface Booking {
  id: string;
  product_id: string;
  nama_pembeli: string;
  no_wa: string;
  jumlah_pesan: number;
  catatan?: string;
  status: string;
  cancel_reason?: string;
  deleted_at?: string | null;
}

interface PaginationMeta {
  total_items: number;
  current_page: number;
  total_pages: number;
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pending: { label: "Menunggu", className: "bg-warning/15 text-warning" },
  confirmed: { label: "Dikonfirmasi", className: "bg-primary/15 text-primary" },
  cancelled: { label: "Dibatalkan", className: "bg-danger/15 text-danger" },
};

const STATUS_OPTIONS = ["pending", "confirmed", "cancelled"];

export default function BookingTable() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total_items: 0, current_page: 1, total_pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [changingStatus, setChangingStatus] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const limit = 10;

  const fetchBookings = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const params: Record<string, string | number> = { page: currentPage, limit };
      const res = await apiClient.get<Booking[]>("/bookings", "booking", params);
      if (Array.isArray(res.data)) setBookings(res.data);
      if (res.meta) {
        setMeta({
          total_items: res.meta.total_items || 0,
          current_page: res.meta.current_page || 1,
          total_pages: res.meta.total_pages || 1,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data booking.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage]);

  useEffect(() => { fetchBookings(); }, [fetchBookings]);

  async function handleStatusChange(bookingId: string, newStatus: string) {
    setChangingStatus(bookingId);
    try {
      await apiClient.patch(`/bookings/${bookingId}/status`, { status: newStatus }, "booking");
      fetchBookings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal mengubah status.");
    } finally {
      setChangingStatus(null);
    }
  }

  async function handleDelete(bookingId: string) {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/bookings/${bookingId}`, "booking");
      setDeleteId(null);
      fetchBookings();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus booking.");
    } finally {
      setIsDeleting(false);
    }
  }

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-5 py-4"><div className="w-28 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-12 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-20 h-6 bg-gray-200 rounded-full" /></td>
      <td className="px-5 py-4"><div className="w-32 h-8 bg-gray-200 rounded-lg" /></td>
    </tr>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
          Kelola Booking
        </h2>
        <p className="text-sm text-text-light mt-0.5">
          {meta.total_items} booking — antrean pre-order
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="animate-slide-down px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3">
          <svg className="w-5 h-5 text-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-danger">{error}</p>
          <button onClick={fetchBookings} className="ml-auto text-sm font-medium text-danger hover:underline cursor-pointer">Coba lagi</button>
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
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Jumlah</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-5 py-16 text-center">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-text-light text-sm">Belum ada booking.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const statusCfg = STATUS_CONFIG[booking.status] || { label: booking.status, className: "bg-gray-100 text-gray-600" };
                  const isExpanded = expandedId === booking.id;

                  return (
                    <>
                      <tr key={booking.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-5 py-3">
                          <button
                            onClick={() => setExpandedId(isExpanded ? null : booking.id)}
                            className="flex items-center gap-2 text-left cursor-pointer group"
                          >
                            <svg className={`w-4 h-4 text-text-muted transition-transform ${isExpanded ? "rotate-90" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                            </svg>
                            <span className="text-sm font-semibold text-text group-hover:text-primary transition-colors">{booking.nama_pembeli}</span>
                          </button>
                        </td>
                        <td className="px-5 py-3 text-sm text-text-light">{booking.no_wa}</td>
                        <td className="px-5 py-3 text-sm font-medium text-text">{booking.jumlah_pesan}</td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.className}`}>
                            {statusCfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <select
                              value={booking.status}
                              onChange={(e) => handleStatusChange(booking.id, e.target.value)}
                              disabled={changingStatus === booking.id}
                              className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-text bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary-light/50 transition-all cursor-pointer disabled:opacity-50"
                            >
                              {STATUS_OPTIONS.map((s) => (
                                <option key={s} value={s}>{STATUS_CONFIG[s]?.label || s}</option>
                              ))}
                            </select>
                            <button
                              onClick={() => setDeleteId(booking.id)}
                              className="p-1.5 rounded-lg hover:bg-danger/10 text-text-muted hover:text-danger transition-colors cursor-pointer"
                              title="Hapus (soft delete)"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Detail */}
                      {isExpanded && (
                        <tr key={`${booking.id}-detail`}>
                          <td colSpan={5} className="px-5 py-4 bg-gray-50/50">
                            <div className="animate-slide-down grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm max-w-xl">
                              <div>
                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Product ID</p>
                                <p className="text-text font-mono text-xs">{booking.product_id}</p>
                              </div>
                              {booking.catatan && (
                                <div>
                                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Catatan</p>
                                  <p className="text-text">{booking.catatan}</p>
                                </div>
                              )}
                              {booking.cancel_reason && (
                                <div>
                                  <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Alasan Batal</p>
                                  <p className="text-danger">{booking.cancel_reason}</p>
                                </div>
                              )}
                              <div>
                                <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Booking ID</p>
                                <p className="text-text font-mono text-xs">{booking.id}</p>
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

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !isDeleting && setDeleteId(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-fade-in-scale">
            <div className="text-center">
              <div className="w-14 h-14 bg-danger/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg className="w-7 h-7 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
                Hapus Booking?
              </h3>
              <p className="text-sm text-text-light mt-2">
                Data booking akan di-arsipkan (soft delete). Anda dapat memulihkannya nanti jika diperlukan.
              </p>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setDeleteId(null)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-text hover:bg-gray-50 transition-colors disabled:opacity-40 cursor-pointer"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteId)}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl text-sm font-semibold bg-danger text-white hover:bg-danger/90 transition-colors disabled:opacity-60 cursor-pointer flex items-center justify-center gap-2"
              >
                {isDeleting ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Menghapus...
                  </>
                ) : (
                  "Ya, Hapus"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
