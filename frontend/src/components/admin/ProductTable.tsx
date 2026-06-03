/**
 * Jalaku — ProductTable (React Island)
 *
 * Tabel daftar produk interaktif dengan fitur:
 * - Filter kategori & status
 * - Pagination
 * - Hapus produk (dengan konfirmasi)
 * - Status badges berwarna
 * - Thumbnail gambar
 */

import { useState, useEffect, useCallback } from "react";
import { apiClient } from "../../lib/api";

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
}

interface Product {
  id: string;
  nama: string;
  slug: string;
  kategori: string;
  harga: number;
  satuan: string;
  stok: number;
  status: string;
  product_images: ProductImage[];
}

interface PaginationMeta {
  total_items: number;
  current_page: number;
  total_pages: number;
}

const KATEGORI_LABELS: Record<string, string> = {
  gabah: "Gabah",
  beras: "Beras",
  kopi: "Kopi",
  alpukat: "Alpukat",
  jagung: "Jagung",
  olahan_dapur: "Olahan Dapur",
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  ready: { label: "Ready", className: "bg-success/15 text-success" },
  unavailable: { label: "Habis", className: "bg-danger/15 text-danger" },
  pre_order: { label: "Pre-Order", className: "bg-warning/15 text-warning" },
};

function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

export default function ProductTable() {
  const [products, setProducts] = useState<Product[]>([]);
  const [meta, setMeta] = useState<PaginationMeta>({ total_items: 0, current_page: 1, total_pages: 1 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filters
  const [filterKategori, setFilterKategori] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const limit = 10;

  // Delete state
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const params: Record<string, string | number> = {
        page: currentPage,
        limit,
      };
      if (filterKategori) params.kategori = filterKategori;
      if (filterStatus) params.status = filterStatus;

      const res = await apiClient.get<Product[]>("/products", "product", params);

      if (Array.isArray(res.data)) {
        setProducts(res.data);
      }
      if (res.meta) {
        setMeta({
          total_items: res.meta.total_items || 0,
          current_page: res.meta.current_page || 1,
          total_pages: res.meta.total_pages || 1,
        });
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal memuat data produk.");
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, filterKategori, filterStatus]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterKategori, filterStatus]);

  async function handleDelete(id: string) {
    setIsDeleting(true);
    try {
      await apiClient.delete(`/products/${id}`, "product");
      setDeleteId(null);
      fetchProducts();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : "Gagal menghapus produk.");
    } finally {
      setIsDeleting(false);
    }
  }

  // Skeleton row
  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-5 py-4"><div className="w-10 h-10 bg-gray-200 rounded-lg" /></td>
      <td className="px-5 py-4"><div className="w-32 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-24 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-12 h-4 bg-gray-200 rounded" /></td>
      <td className="px-5 py-4"><div className="w-16 h-6 bg-gray-200 rounded-full" /></td>
      <td className="px-5 py-4"><div className="w-20 h-4 bg-gray-200 rounded" /></td>
    </tr>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
            Daftar Produk
          </h2>
          <p className="text-sm text-text-light mt-0.5">
            {meta.total_items} produk terdaftar
          </p>
        </div>
        <a
          href="/admin/produk/tambah"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-lg hover:shadow-primary/25 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #2D6A4F 0%, #52B788 100%)" }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Tambah Produk
        </a>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select
          value={filterKategori}
          onChange={(e) => setFilterKategori(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 transition-all cursor-pointer"
        >
          <option value="">Semua Kategori</option>
          {Object.entries(KATEGORI_LABELS).map(([val, label]) => (
            <option key={val} value={val}>{label}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-white border border-gray-200 text-sm text-text focus:outline-none focus:ring-2 focus:ring-primary-light/50 focus:border-primary-light/50 transition-all cursor-pointer"
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
          <button onClick={fetchProducts} className="ml-auto text-sm font-medium text-danger hover:underline cursor-pointer">
            Coba lagi
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50">
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Foto</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Nama Produk</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Kategori</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Harga</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Stok</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Status</th>
                <th className="text-left text-xs font-semibold text-text-light uppercase tracking-wider px-5 py-3.5">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center">
                    <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                    <p className="text-text-light text-sm">Belum ada produk.</p>
                    <a href="/admin/produk/tambah" className="text-sm text-primary font-medium hover:underline mt-1 inline-block">
                      + Tambah produk pertama
                    </a>
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  const thumb = product.product_images?.[0]?.image_url;
                  const statusCfg = STATUS_CONFIG[product.status] || { label: product.status, className: "bg-gray-100 text-gray-600" };

                  return (
                    <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Thumbnail */}
                      <td className="px-5 py-3">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt={product.nama}
                            className="w-11 h-11 rounded-lg object-cover border border-gray-100"
                          />
                        ) : (
                          <div className="w-11 h-11 rounded-lg bg-gray-100 flex items-center justify-center">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                          </div>
                        )}
                      </td>

                      {/* Nama */}
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-text">{product.nama}</p>
                        <p className="text-xs text-text-muted mt-0.5">/{product.slug}</p>
                      </td>

                      {/* Kategori */}
                      <td className="px-5 py-3">
                        <span className="text-sm text-text-light">
                          {KATEGORI_LABELS[product.kategori] || product.kategori}
                        </span>
                      </td>

                      {/* Harga */}
                      <td className="px-5 py-3">
                        <span className="text-sm font-medium text-text">
                          {formatRupiah(product.harga)}
                        </span>
                        <span className="text-xs text-text-muted">/{product.satuan}</span>
                      </td>

                      {/* Stok */}
                      <td className="px-5 py-3">
                        <span className={`text-sm font-medium ${product.stok <= 5 ? "text-danger" : "text-text"}`}>
                          {product.stok}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusCfg.className}`}>
                          {statusCfg.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1">
                          <a
                            href={`/admin/produk/${product.slug}`}
                            className="p-2 rounded-lg hover:bg-primary/10 text-text-light hover:text-primary transition-colors"
                            title="Edit"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </a>
                          <button
                            onClick={() => setDeleteId(product.id)}
                            className="p-2 rounded-lg hover:bg-danger/10 text-text-light hover:text-danger transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
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
              Halaman {meta.current_page} dari {meta.total_pages} ({meta.total_items} item)
            </p>
            <div className="flex gap-1">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
                className="px-3 py-1.5 rounded-lg text-sm font-medium border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
              >
                ← Prev
              </button>
              {Array.from({ length: Math.min(meta.total_pages, 5) }).map((_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors cursor-pointer ${
                      currentPage === page
                        ? "bg-primary text-white"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
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
                Hapus Produk?
              </h3>
              <p className="text-sm text-text-light mt-2">
                Produk beserta semua foto akan dihapus permanen. Tindakan ini tidak dapat dibatalkan.
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
