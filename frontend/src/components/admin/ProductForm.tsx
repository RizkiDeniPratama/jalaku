/**
 * Jalaku — ProductForm (React Island)
 *
 * Form untuk membuat atau mengedit produk.
 * Mendukung dua mode:
 * - Create: POST /products (tanpa productSlug)
 * - Edit:   GET /products/:slug + PATCH /products/:id
 *
 * Fitur:
 * - Auto-generate slug dari nama
 * - Conditional fields (catatan musim, tanggal tersedia)
 * - Validasi client-side
 * - Loading & error states
 */

import { useState, useEffect } from "react";
import { apiClient } from "../../lib/api";

interface ProductFormData {
  nama: string;
  slug: string;
  deskripsi: string;
  kategori: string;
  harga: number | "";
  satuan: string;
  stok: number | "";
  status: string;
  catatan_musim: string;
  tersedia_mulai: string;
}

interface ProductFormProps {
  /** Slug produk untuk mode edit. Jika kosong = mode create. */
  productSlug?: string;
}

const KATEGORI_OPTIONS = [
  { value: "gabah", label: "Gabah" },
  { value: "beras", label: "Beras" },
  { value: "kopi", label: "Kopi" },
  { value: "alpukat", label: "Alpukat" },
  { value: "jagung", label: "Jagung" },
  { value: "olahan_dapur", label: "Olahan Dapur" },
];

const STATUS_OPTIONS = [
  { value: "ready", label: "Ready Stock" },
  { value: "unavailable", label: "Habis / Tidak Tersedia" },
  { value: "pre_order", label: "Pre-Order" },
];

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const initialFormData: ProductFormData = {
  nama: "",
  slug: "",
  deskripsi: "",
  kategori: "beras",
  harga: "",
  satuan: "kg",
  stok: "",
  status: "ready",
  catatan_musim: "",
  tersedia_mulai: "",
};

export default function ProductForm({ productSlug }: ProductFormProps) {
  const isEdit = !!productSlug;
  const [form, setForm] = useState<ProductFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(isEdit);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [autoSlug, setAutoSlug] = useState(true);

  /**
   * ID produk yang sebenarnya (UUID).
   * Didapat dari response GET /products/:slug.
   * Diperlukan untuk PATCH /products/:id.
   */
  const [productId, setProductId] = useState<string>("");

  // Fetch existing product data for edit mode
  useEffect(() => {
    if (!isEdit || !productSlug) return;
    fetchProduct();
  }, [productSlug]);

  async function fetchProduct() {
    setIsFetching(true);
    setError("");
    try {
      // API: GET /products/:slug — fetch by slug, bukan by ID
      const res = await apiClient.get<any>(`/products/${productSlug}`, "product");
      if (res.data) {
        const p = res.data;
        // Simpan UUID asli untuk operasi PATCH/DELETE
        setProductId(p.id);
        setForm({
          nama: p.nama || "",
          slug: p.slug || "",
          deskripsi: p.deskripsi || "",
          kategori: p.kategori || "beras",
          harga: p.harga ?? "",
          satuan: p.satuan || "kg",
          stok: p.stok ?? "",
          status: p.status || "ready",
          catatan_musim: p.catatan_musim || "",
          tersedia_mulai: p.tersedia_mulai || "",
        });
        setAutoSlug(false); // Don't auto-generate slug for existing products
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data produk.");
    } finally {
      setIsFetching(false);
    }
  }

  function handleChange(field: keyof ProductFormData, value: string | number) {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      // Auto-generate slug from nama
      if (field === "nama" && autoSlug) {
        updated.slug = generateSlug(value as string);
      }
      return updated;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Client-side validation
    if (!form.nama.trim()) {
      setError("Nama produk wajib diisi.");
      return;
    }
    if (!form.slug.trim()) {
      setError("Slug wajib diisi.");
      return;
    }
    if (form.harga === "" || Number(form.harga) <= 0) {
      setError("Harga harus lebih dari 0.");
      return;
    }
    if (!form.satuan.trim()) {
      setError("Satuan wajib diisi.");
      return;
    }

    setIsLoading(true);

    // Build payload — hanya kirim field yang terisi
    const payload: Record<string, unknown> = {
      nama: form.nama.trim(),
      slug: form.slug.trim(),
      kategori: form.kategori,
      harga: Number(form.harga),
      satuan: form.satuan.trim(),
      status: form.status,
    };

    // Optional fields — hanya kirim jika ada nilai
    if (form.deskripsi.trim()) payload.deskripsi = form.deskripsi.trim();
    if (form.stok !== "") payload.stok = Number(form.stok);
    if (form.catatan_musim.trim()) payload.catatan_musim = form.catatan_musim.trim();
    if (form.tersedia_mulai) payload.tersedia_mulai = form.tersedia_mulai;

    try {
      if (isEdit && productId) {
        // PATCH /products/:id — gunakan UUID, bukan slug
        await apiClient.patch(`/products/${productId}`, payload, "product");
        setSuccess("Produk berhasil diperbarui!");
      } else {
        // POST /products — buat produk baru
        const res = await apiClient.post<any>("/products", payload, "product");
        setSuccess("Produk berhasil dibuat! Mengalihkan ke halaman edit...");

        // Redirect ke halaman edit menggunakan SLUG (bukan ID)
        // agar bisa fetch data produk via GET /products/:slug
        const createdSlug = res.data?.slug || form.slug;
        setTimeout(() => {
          window.location.href = `/admin/produk/${createdSlug}`;
        }, 1500);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menyimpan produk.");
    } finally {
      setIsLoading(false);
    }
  }

  const showSeasonField = form.status === "pre_order" || ["alpukat"].includes(form.kategori);

  if (isFetching) {
    return (
      <div className="max-w-2xl space-y-6 animate-pulse">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="w-24 h-4 bg-gray-200 rounded" />
            <div className="w-full h-11 bg-gray-200 rounded-xl" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl animate-fade-in">
      {/* Back link */}
      <a
        href="/admin/produk"
        className="inline-flex items-center gap-2 text-sm text-text-light hover:text-primary transition-colors mb-6 group"
      >
        <svg className="w-4 h-4 transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Kembali ke Daftar Produk
      </a>

      {/* Alerts */}
      {error && (
        <div className="animate-slide-down mb-6 px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 flex items-center gap-3">
          <svg className="w-5 h-5 text-danger shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
          <p className="text-sm text-danger">{error}</p>
        </div>
      )}

      {success && (
        <div className="animate-slide-down mb-6 px-4 py-3 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
          <svg className="w-5 h-5 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-sm text-success">{success}</p>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
          <h3 className="text-lg font-bold text-text border-b border-gray-100 pb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
            Informasi Produk
          </h3>

          {/* Nama */}
          <div className="space-y-2">
            <label htmlFor="form-nama" className="block text-sm font-medium text-text">
              Nama Produk <span className="text-danger">*</span>
            </label>
            <input
              id="form-nama"
              type="text"
              required
              value={form.nama}
              onChange={(e) => handleChange("nama", e.target.value)}
              placeholder="Contoh: Beras Putih Premium"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 focus:bg-white transition-all"
            />
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <label htmlFor="form-slug" className="flex items-center gap-2 text-sm font-medium text-text">
              Slug (URL)
              <button
                type="button"
                onClick={() => {
                  setAutoSlug(!autoSlug);
                  if (!autoSlug) handleChange("slug", generateSlug(form.nama));
                }}
                className="text-xs text-primary hover:underline cursor-pointer"
              >
                {autoSlug ? "Edit manual" : "Auto-generate"}
              </button>
            </label>
            <input
              id="form-slug"
              type="text"
              required
              value={form.slug}
              onChange={(e) => {
                setAutoSlug(false);
                handleChange("slug", e.target.value);
              }}
              placeholder="beras-putih-premium"
              disabled={autoSlug}
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 focus:bg-white transition-all disabled:opacity-60 disabled:bg-gray-100"
            />
          </div>

          {/* Deskripsi */}
          <div className="space-y-2">
            <label htmlFor="form-deskripsi" className="block text-sm font-medium text-text">
              Deskripsi
            </label>
            <textarea
              id="form-deskripsi"
              rows={4}
              value={form.deskripsi}
              onChange={(e) => handleChange("deskripsi", e.target.value)}
              placeholder="Deskripsikan produk Anda..."
              className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Kategori + Status (2-column) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label htmlFor="form-kategori" className="block text-sm font-medium text-text">
                Kategori <span className="text-danger">*</span>
              </label>
              <select
                id="form-kategori"
                value={form.kategori}
                onChange={(e) => handleChange("kategori", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 focus:bg-white transition-all cursor-pointer"
              >
                {KATEGORI_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label htmlFor="form-status" className="block text-sm font-medium text-text">
                Status <span className="text-danger">*</span>
              </label>
              <select
                id="form-status"
                value={form.status}
                onChange={(e) => handleChange("status", e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 focus:bg-white transition-all cursor-pointer"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Harga + Satuan + Stok (3-column) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            <div className="space-y-2">
              <label htmlFor="form-harga" className="block text-sm font-medium text-text">
                Harga (Rp) <span className="text-danger">*</span>
              </label>
              <input
                id="form-harga"
                type="number"
                required
                min={1}
                value={form.harga}
                onChange={(e) => handleChange("harga", e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="50000"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="form-satuan" className="block text-sm font-medium text-text">
                Satuan <span className="text-danger">*</span>
              </label>
              <input
                id="form-satuan"
                type="text"
                required
                value={form.satuan}
                onChange={(e) => handleChange("satuan", e.target.value)}
                placeholder="kg"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 focus:bg-white transition-all"
              />
            </div>

            <div className="space-y-2">
              <label htmlFor="form-stok" className="block text-sm font-medium text-text">
                Stok
              </label>
              <input
                id="form-stok"
                type="number"
                min={0}
                value={form.stok}
                onChange={(e) => handleChange("stok", e.target.value === "" ? "" : Number(e.target.value))}
                placeholder="100"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 focus:bg-white transition-all"
              />
            </div>
          </div>

          {/* Season fields (conditional) */}
          {showSeasonField && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 pt-2 border-t border-dashed border-gray-200 animate-slide-down">
              <div className="space-y-2">
                <label htmlFor="form-catatan-musim" className="block text-sm font-medium text-text">
                  Catatan Musim 🌿
                </label>
                <input
                  id="form-catatan-musim"
                  type="text"
                  value={form.catatan_musim}
                  onChange={(e) => handleChange("catatan_musim", e.target.value)}
                  placeholder="Contoh: Musim panen Maret-Mei"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 focus:bg-white transition-all"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="form-tersedia-mulai" className="block text-sm font-medium text-text">
                  Tersedia Mulai 📅
                </label>
                <input
                  id="form-tersedia-mulai"
                  type="date"
                  value={form.tersedia_mulai}
                  onChange={(e) => handleChange("tersedia_mulai", e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-text placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 focus:bg-white transition-all cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-3">
          <a
            href="/admin/produk"
            className="px-6 py-3 rounded-xl text-sm font-semibold border border-gray-200 text-text hover:bg-gray-50 transition-colors"
          >
            Batal
          </a>
          <button
            type="submit"
            disabled={isLoading}
            className="px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer relative overflow-hidden group"
            style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)" }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative flex items-center gap-2">
              {isLoading ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Menyimpan...
                </>
              ) : (
                <>
                  {isEdit ? "Perbarui Produk" : "Simpan Produk"}
                  <svg className="w-4 h-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </>
              )}
            </span>
          </button>
        </div>
      </form>
    </div>
  );
}
