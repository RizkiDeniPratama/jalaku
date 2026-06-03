/**
 * Jalaku — CartManager (React Island)
 *
 * Halaman checkout satu halaman (single-page):
 * Section 1: Ringkasan Keranjang — daftar item, qty +/-, hapus, total
 * Section 2: Form Checkout — nama, WA, alamat, metode bayar, catatan
 * Section 3: Success — order ID + link WA admin
 *
 * Integrasi: POST /orders
 */

import { useState, useEffect } from "react";
import { useStore } from "@nanostores/react";
import {
  $cartItems,
  $cartTotal,
  $cartCount,
  updateQty,
  removeFromCart,
  clearCart,
  initCart,
} from "../../stores/cartStore";
import { apiClient } from "../../lib/api";

type PaymentMethod = "cod" | "transfer_bank";

interface CheckoutForm {
  nama_pembeli: string;
  no_wa: string;
  alamat_kirim: string;
  metode_bayar: PaymentMethod;
  catatan: string;
}

const initialForm: CheckoutForm = {
  nama_pembeli: "",
  no_wa: "",
  alamat_kirim: "",
  metode_bayar: "cod",
  catatan: "",
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function CartManager() {
  const items = useStore($cartItems);
  const total = useStore($cartTotal);
  const count = useStore($cartCount);

  const [form, setForm] = useState<CheckoutForm>(initialForm);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [orderId, setOrderId] = useState("");
  const [step, setStep] = useState<"cart" | "checkout" | "success">("cart");

  useEffect(() => {
    initCart();
  }, []);

  function handleFormChange(field: keyof CheckoutForm, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmitOrder() {
    setError("");

    // Validasi
    if (!form.nama_pembeli.trim()) {
      setError("Nama pembeli wajib diisi.");
      return;
    }
    if (!form.no_wa.trim() || form.no_wa.length < 10) {
      setError("Nomor WhatsApp tidak valid (minimal 10 digit).");
      return;
    }
    if (!form.alamat_kirim.trim()) {
      setError("Alamat pengiriman wajib diisi.");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        nama_pembeli: form.nama_pembeli.trim(),
        no_wa: form.no_wa.trim(),
        alamat_kirim: form.alamat_kirim.trim(),
        metode_bayar: form.metode_bayar,
        items: items.map((item) => ({
          product_id: item.product_id,
          jumlah: item.jumlah,
        })),
        catatan: form.catatan.trim() || undefined,
      };

      const res = await apiClient.post<any>("/orders", payload, "order");

      if (res.data?.id) {
        setOrderId(res.data.id);
      } else {
        setOrderId("submitted");
      }
      clearCart();
      setStep("success");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal membuat pesanan.");
    } finally {
      setIsLoading(false);
    }
  }

  // ========================
  // SUCCESS STATE
  // ========================
  if (step === "success") {
    return (
      <div className="max-w-lg mx-auto animate-fade-in-scale">
        <div className="bg-white rounded-2xl shadow-sm border border-success/20 p-8 text-center space-y-5">
          <div className="w-20 h-20 bg-success/10 rounded-3xl flex items-center justify-center mx-auto">
            <svg className="w-10 h-10 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
              Pesanan Berhasil! 🎉
            </h2>
            <p className="text-sm text-text-light mt-2">
              Terima kasih! Pesanan Anda telah kami terima.
            </p>
          </div>

          {orderId !== "submitted" && (
            <div className="bg-gray-50 rounded-xl px-5 py-4">
              <p className="text-xs text-text-muted">Order ID</p>
              <p className="text-sm font-mono font-bold text-text mt-1">{orderId}</p>
            </div>
          )}

          <div className="bg-primary/5 rounded-xl px-5 py-4 text-left space-y-2">
            <p className="text-sm font-semibold text-text">Langkah selanjutnya:</p>
            <ul className="text-sm text-text-light space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">1.</span>
                <span>Kami akan mengkonfirmasi pesanan Anda via WhatsApp</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">2.</span>
                <span>
                  {form.metode_bayar === "cod"
                    ? "Siapkan pembayaran saat barang diantar"
                    : "Lakukan transfer sesuai instruksi yang dikirim via WA"}
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary font-bold mt-0.5">3.</span>
                <span>Lacak status pesanan di halaman Lacak Pesanan</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <a
              href="/lacak"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25"
              style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)" }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Lacak Pesanan
            </a>
            <a
              href="/produk"
              className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-text border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Belanja Lagi
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ========================
  // EMPTY CART
  // ========================
  if (count === 0 && step !== "success") {
    return (
      <div className="max-w-lg mx-auto text-center py-16 animate-fade-in">
        <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto mb-5">
          <svg className="w-10 h-10 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
          Keranjang Kosong
        </h2>
        <p className="text-sm text-text-light mt-2">
          Belum ada produk di keranjang Anda.
        </p>
        <a
          href="/produk"
          className="inline-flex items-center gap-2 mt-6 px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:shadow-lg hover:shadow-primary/25"
          style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)" }}
        >
          Jelajahi Katalog
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    );
  }

  // ========================
  // CART + CHECKOUT FORM
  // ========================
  return (
    <div className="max-w-4xl mx-auto animate-fade-in">
      {/* Steps indicator */}
      <div className="flex items-center justify-center gap-4 mb-8">
        <button
          onClick={() => setStep("cart")}
          className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
            step === "cart" ? "text-primary" : "text-text-muted"
          }`}
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            step === "cart" ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
          }`}>
            1
          </span>
          Keranjang
        </button>
        <div className="w-12 h-px bg-gray-200"></div>
        <button
          onClick={() => { if (count > 0) setStep("checkout"); }}
          className={`flex items-center gap-2 text-sm font-medium transition-colors cursor-pointer ${
            step === "checkout" ? "text-primary" : "text-text-muted"
          }`}
        >
          <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
            step === "checkout" ? "bg-primary text-white" : "bg-gray-200 text-gray-500"
          }`}>
            2
          </span>
          Checkout
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="animate-slide-down mb-6 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3">
          <svg className="w-5 h-5 text-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          {step === "cart" && (
            <>
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Keranjang Belanja ({count} item)
                  </h2>
                </div>

                <div className="divide-y divide-gray-50">
                  {items.map((item) => (
                    <div key={item.product_id} className="p-4 sm:p-5 flex gap-4">
                      {/* Thumbnail */}
                      <div className="shrink-0">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.nama}
                            className="w-20 h-20 rounded-xl object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-20 h-20 rounded-xl bg-gray-100 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <a href={`/produk/${item.slug}`} className="text-sm font-semibold text-text hover:text-primary transition-colors line-clamp-1">
                          {item.nama}
                        </a>
                        <p className="text-sm text-primary font-bold mt-1">
                          {formatRupiah(item.harga)}<span className="text-text-muted font-normal">/{item.satuan}</span>
                        </p>

                        {/* Qty Controls */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                            <button
                              onClick={() => updateQty(item.product_id, item.jumlah - 1)}
                              className="w-8 h-8 flex items-center justify-center text-text-light hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4" />
                              </svg>
                            </button>
                            <span className="w-10 h-8 flex items-center justify-center text-sm font-semibold text-text border-x border-gray-200">
                              {item.jumlah}
                            </span>
                            <button
                              onClick={() => updateQty(item.product_id, item.jumlah + 1)}
                              className="w-8 h-8 flex items-center justify-center text-text-light hover:bg-gray-50 transition-colors cursor-pointer"
                            >
                              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                              </svg>
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-text">
                              {formatRupiah(item.harga * item.jumlah)}
                            </span>
                            <button
                              onClick={() => removeFromCart(item.product_id)}
                              className="p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger/10 transition-colors cursor-pointer"
                              title="Hapus"
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Continue to Checkout */}
              <button
                onClick={() => setStep("checkout")}
                className="w-full py-3.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
                style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)" }}
              >
                Lanjut ke Checkout →
              </button>
            </>
          )}

          {step === "checkout" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
              <h2 className="text-lg font-bold text-text border-b border-gray-100 pb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
                Data Pengiriman
              </h2>

              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label htmlFor="co-nama" className="block text-sm font-medium text-text">
                    Nama Lengkap <span className="text-danger">*</span>
                  </label>
                  <input
                    id="co-nama"
                    type="text"
                    required
                    value={form.nama_pembeli}
                    onChange={(e) => handleFormChange("nama_pembeli", e.target.value)}
                    placeholder="Nama penerima"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="co-wa" className="block text-sm font-medium text-text">
                    Nomor WhatsApp <span className="text-danger">*</span>
                  </label>
                  <input
                    id="co-wa"
                    type="tel"
                    required
                    value={form.no_wa}
                    onChange={(e) => handleFormChange("no_wa", e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:bg-white transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="co-alamat" className="block text-sm font-medium text-text">
                    Alamat Pengiriman <span className="text-danger">*</span>
                  </label>
                  <textarea
                    id="co-alamat"
                    rows={3}
                    required
                    value={form.alamat_kirim}
                    onChange={(e) => handleFormChange("alamat_kirim", e.target.value)}
                    placeholder="Alamat lengkap (desa, kecamatan, kota...)"
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:bg-white transition-all resize-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm font-medium text-text">
                    Metode Pembayaran <span className="text-danger">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handleFormChange("metode_bayar", "cod")}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        form.metode_bayar === "cod"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="text-sm font-semibold text-text">COD</span>
                      </div>
                      <p className="text-xs text-text-muted">Bayar saat barang diterima</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleFormChange("metode_bayar", "transfer_bank")}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        form.metode_bayar === "transfer_bank"
                          ? "border-primary bg-primary/5"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <svg className="w-5 h-5 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                        </svg>
                        <span className="text-sm font-semibold text-text">Transfer</span>
                      </div>
                      <p className="text-xs text-text-muted">Transfer bank / e-wallet</p>
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="co-catatan" className="block text-sm font-medium text-text">
                    Catatan <span className="text-text-muted font-normal">(opsional)</span>
                  </label>
                  <textarea
                    id="co-catatan"
                    rows={2}
                    value={form.catatan}
                    onChange={(e) => handleFormChange("catatan", e.target.value)}
                    placeholder="Catatan tambahan untuk pesanan..."
                    className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:bg-white transition-all resize-none"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setStep("cart")}
                  className="px-5 py-3 rounded-xl text-sm font-semibold text-text border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  ← Kembali
                </button>
                <button
                  onClick={handleSubmitOrder}
                  disabled={isLoading}
                  className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)" }}
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
                    `Kirim Pesanan — ${formatRupiah(total)}`
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar: Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 sticky top-24 space-y-4">
            <h3 className="text-base font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
              Ringkasan
            </h3>

            <div className="space-y-3 text-sm">
              {items.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between gap-2">
                  <span className="text-text-light truncate">
                    {item.nama} × {item.jumlah}
                  </span>
                  <span className="text-text font-medium shrink-0">
                    {formatRupiah(item.harga * item.jumlah)}
                  </span>
                </div>
              ))}
            </div>

            <hr className="border-gray-100" />

            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-text">Total</span>
              <span className="text-xl font-bold text-primary" style={{ fontFamily: "Outfit, sans-serif" }}>
                {formatRupiah(total)}
              </span>
            </div>

            {step === "checkout" && (
              <div className="pt-2 text-xs text-text-muted space-y-1">
                <p>📦 {count} item</p>
                <p>💳 {form.metode_bayar === "cod" ? "COD (Bayar di tempat)" : "Transfer Bank"}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
