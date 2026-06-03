/**
 * Jalaku — BookingForm (React Island)
 *
 * Form pre-order untuk produk berstatus `pre_order`.
 * Guest-friendly — tidak perlu login.
 *
 * Fitur:
 * - Input: nama, no WA, jumlah, catatan
 * - Validasi client-side
 * - Submit ke POST /bookings
 * - Success card dengan booking ID
 */

import { useState } from "react";
import { apiClient } from "../../lib/api";

interface BookingFormProps {
  productId: string;
  productName: string;
  satuan: string;
}

export default function BookingForm({ productId, productName, satuan }: BookingFormProps) {
  const [nama, setNama] = useState("");
  const [noWa, setNoWa] = useState("");
  const [jumlah, setJumlah] = useState(1);
  const [catatan, setCatatan] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [bookingId, setBookingId] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validasi
    if (!nama.trim()) {
      setError("Nama pembeli wajib diisi.");
      return;
    }
    if (!noWa.trim() || noWa.length < 10) {
      setError("Nomor WhatsApp tidak valid (minimal 10 digit).");
      return;
    }
    if (jumlah <= 0) {
      setError("Jumlah harus lebih dari 0.");
      return;
    }

    setIsLoading(true);

    try {
      const res = await apiClient.post<any>(
        "/bookings",
        {
          product_id: productId,
          nama_pembeli: nama.trim(),
          no_wa: noWa.trim(),
          jumlah_pesan: jumlah,
          catatan: catatan.trim() || undefined,
        },
        "booking"
      );

      if (res.data?.id) {
        setBookingId(res.data.id);
      } else {
        setBookingId("submitted");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal membuat booking.");
    } finally {
      setIsLoading(false);
    }
  }

  // Success state
  if (bookingId) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-success/20 p-6 text-center space-y-4 animate-fade-in-scale">
        <div className="w-16 h-16 bg-success/10 rounded-2xl flex items-center justify-center mx-auto">
          <svg className="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 className="text-lg font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
            Pre-Order Berhasil! 🎉
          </h3>
          <p className="text-sm text-text-light mt-1">
            Reservasi Anda untuk <strong>{productName}</strong> telah tercatat.
          </p>
        </div>
        {bookingId !== "submitted" && (
          <div className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-xs text-text-muted">Booking ID</p>
            <p className="text-sm font-mono font-semibold text-text mt-0.5">{bookingId}</p>
          </div>
        )}
        <p className="text-xs text-text-muted">
          Kami akan menghubungi Anda via WhatsApp saat produk tersedia.
        </p>
        <a
          href="/produk"
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          ← Lihat produk lainnya
        </a>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5 animate-fade-in">
      <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
        <div className="w-10 h-10 bg-warning/10 rounded-xl flex items-center justify-center">
          <svg className="w-5 h-5 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h3 className="text-base font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
            Pesan Pre-Order
          </h3>
          <p className="text-xs text-text-muted">Reservasi tanpa pembayaran awal</p>
        </div>
      </div>

      {error && (
        <div className="animate-slide-down px-4 py-3 rounded-xl bg-danger/10 border border-danger/20">
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <label htmlFor="booking-nama" className="block text-sm font-medium text-text">
            Nama Lengkap <span className="text-danger">*</span>
          </label>
          <input
            id="booking-nama"
            type="text"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder="Nama Anda"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="booking-wa" className="block text-sm font-medium text-text">
            Nomor WhatsApp <span className="text-danger">*</span>
          </label>
          <input
            id="booking-wa"
            type="tel"
            required
            value={noWa}
            onChange={(e) => setNoWa(e.target.value)}
            placeholder="08xxxxxxxxxx"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="booking-jumlah" className="block text-sm font-medium text-text">
            Jumlah ({satuan}) <span className="text-danger">*</span>
          </label>
          <input
            id="booking-jumlah"
            type="number"
            required
            min={1}
            value={jumlah}
            onChange={(e) => setJumlah(Number(e.target.value))}
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:bg-white transition-all"
          />
        </div>

        <div className="space-y-1.5">
          <label htmlFor="booking-catatan" className="block text-sm font-medium text-text">
            Catatan <span className="text-text-muted font-normal">(opsional)</span>
          </label>
          <textarea
            id="booking-catatan"
            rows={2}
            value={catatan}
            onChange={(e) => setCatatan(e.target.value)}
            placeholder="Catatan tambahan..."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:bg-white transition-all resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-warning/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          style={{ background: "linear-gradient(135deg, #E76F51 0%, #F4A261 100%)" }}
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Memproses...
            </span>
          ) : (
            "Pesan Pre-Order Sekarang"
          )}
        </button>
      </form>
    </div>
  );
}
