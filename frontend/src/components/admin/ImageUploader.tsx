/**
 * Jalaku — ImageUploader (React Island)
 *
 * Komponen upload multi-foto untuk galeri produk.
 *
 * Fitur:
 * - Drag & drop zone
 * - Preview sebelum upload
 * - Upload ke POST /products/:productId/images (FormData)
 * - Tampilkan galeri existing images
 * - Reorder (PATCH /products/images/:imageId/reorder)
 * - Delete (DELETE /products/images/:imageId)
 * - Max 10 file, 2MB/file, format: jpeg/png/webp
 */

import { useState, useEffect, useRef } from "react";
import { apiClient } from "../../lib/api";

interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
}

interface ImageUploaderProps {
  /** Slug produk — digunakan untuk fetch data dan mendapatkan UUID */
  productSlug: string;
}

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const MAX_FILES = 10;

export default function ImageUploader({ productSlug }: ImageUploaderProps) {
  const [images, setImages] = useState<ProductImage[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * UUID produk yang sebenarnya — didapat dari GET /products/:slug.
   * Diperlukan untuk POST /products/:productId/images.
   */
  const [productId, setProductId] = useState<string>("");

  // Fetch product data (images + id) on mount
  useEffect(() => {
    if (productSlug) fetchProductData();
  }, [productSlug]);

  async function fetchProductData() {
    try {
      // GET /products/:slug — fetch by slug untuk mendapatkan UUID + images
      const res = await apiClient.get<any>(`/products/${productSlug}`, "product");
      if (res.data) {
        setProductId(res.data.id); // Simpan UUID asli
        if (res.data.product_images) {
          setImages(
            [...res.data.product_images].sort(
              (a: ProductImage, b: ProductImage) => a.display_order - b.display_order
            )
          );
        }
      }
    } catch {
      // Ignore — images will be empty, productId won't be set
    }
  }

  function validateFiles(files: FileList | File[]): File[] {
    const fileArray = Array.from(files);
    const errors: string[] = [];

    if (images.length + fileArray.length > MAX_FILES) {
      errors.push(`Maksimal ${MAX_FILES} foto per produk.`);
    }

    const valid = fileArray.filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Format tidak didukung (gunakan JPEG, PNG, atau WebP).`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Ukuran melebihi 2MB.`);
        return false;
      }
      return true;
    });

    if (errors.length > 0) {
      setError(errors.join(" "));
    }

    return valid;
  }

  async function handleUpload(files: File[]) {
    if (files.length === 0) return;

    if (!productId) {
      setError("Produk belum tersimpan. Simpan produk terlebih dahulu sebelum mengupload foto.");
      return;
    }

    setIsUploading(true);
    setError("");
    setSuccess("");
    setUploadProgress(0);

    const formData = new FormData();
    files.forEach((file) => formData.append("fotos", file));

    try {
      // POST /products/:productId/images — gunakan UUID
      await apiClient.post(
        `/products/${productId}/images`,
        formData,
        "product",
        true // isFormData
      );
      setSuccess(`${files.length} foto berhasil diupload!`);
      setUploadProgress(100);
      await fetchProductData(); // Refresh gallery
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengupload foto.");
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  }

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files) return;
    const valid = validateFiles(e.target.files);
    handleUpload(valid);
    e.target.value = ""; // Reset input
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setIsDragging(false);
    if (!e.dataTransfer.files.length) return;
    const valid = validateFiles(e.dataTransfer.files);
    handleUpload(valid);
  }

  async function handleReorder(imageId: string, direction: "up" | "down") {
    const idx = images.findIndex((img) => img.id === imageId);
    if (idx === -1) return;

    const newOrder = direction === "up" ? Math.max(0, idx - 1) : idx + 1;
    if (newOrder === idx || newOrder >= images.length) return;

    try {
      await apiClient.patch(`/products/images/${imageId}/reorder`, { newOrder }, "product");
      await fetchProductData();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal mengubah urutan foto.");
    }
  }

  async function handleDeleteImage(imageId: string) {
    try {
      await apiClient.delete(`/products/images/${imageId}`, "product");
      setImages((prev) => prev.filter((img) => img.id !== imageId));
      setSuccess("Foto berhasil dihapus.");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Gagal menghapus foto.");
    }
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8 space-y-6">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h3 className="text-lg font-bold text-text" style={{ fontFamily: "Outfit, sans-serif" }}>
            Galeri Foto
          </h3>
          <span className="text-sm text-text-muted">
            {images.length}/{MAX_FILES} foto
          </span>
        </div>

        {/* Alerts */}
        {error && (
          <div className="animate-slide-down px-4 py-3 rounded-xl bg-danger/10 border border-danger/20 flex items-start gap-3">
            <svg className="w-5 h-5 text-danger shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-danger">{error}</p>
            <button onClick={() => setError("")} className="ml-auto text-danger hover:text-danger-light cursor-pointer">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        {success && (
          <div className="animate-slide-down px-4 py-3 rounded-xl bg-success/10 border border-success/20 flex items-center gap-3">
            <svg className="w-5 h-5 text-success shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-success">{success}</p>
          </div>
        )}

        {/* Guard: tampilkan pesan jika productId belum tersedia */}
        {!productId && (
          <div className="px-4 py-3 rounded-xl bg-warning/10 border border-warning/20">
            <p className="text-sm text-warning">
              Menunggu data produk... Pastikan produk sudah tersimpan.
            </p>
          </div>
        )}

        {/* Drop Zone */}
        {productId && images.length < MAX_FILES && (
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
              isDragging
                ? "border-primary bg-primary/5 scale-[1.01]"
                : "border-gray-200 hover:border-primary/40 hover:bg-gray-50/50"
            } ${isUploading ? "pointer-events-none opacity-60" : ""}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(",")}
              onChange={handleFileInput}
              className="hidden"
            />

            <div className="flex flex-col items-center gap-3">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${
                isDragging ? "bg-primary/15 text-primary" : "bg-gray-100 text-gray-400"
              }`}>
                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>

              {isUploading ? (
                <div className="space-y-2 w-full max-w-xs">
                  <p className="text-sm font-medium text-primary">Mengupload...</p>
                  <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-500"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-text">
                    {isDragging ? "Lepaskan file di sini" : "Drag & drop foto atau klik untuk memilih"}
                  </p>
                  <p className="text-xs text-text-muted mt-1">
                    JPEG, PNG, WebP • Maks. 2MB/foto • Maks. {MAX_FILES - images.length} foto lagi
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Image Gallery */}
        {images.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((img, idx) => (
              <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
                <img
                  src={img.image_url}
                  alt={`Foto ${idx + 1}`}
                  className="w-full h-full object-cover"
                />

                {/* Order badge */}
                <div className="absolute top-2 left-2 w-6 h-6 bg-black/50 backdrop-blur-sm rounded-lg flex items-center justify-center">
                  <span className="text-xs font-bold text-white">{idx + 1}</span>
                </div>

                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                  {/* Move up */}
                  {idx > 0 && (
                    <button
                      onClick={() => handleReorder(img.id, "up")}
                      className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-text hover:bg-white transition-colors cursor-pointer"
                      title="Pindah ke depan"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                  )}

                  {/* Move down */}
                  {idx < images.length - 1 && (
                    <button
                      onClick={() => handleReorder(img.id, "down")}
                      className="w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-text hover:bg-white transition-colors cursor-pointer"
                      title="Pindah ke belakang"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteImage(img.id)}
                    className="w-8 h-8 bg-danger/90 rounded-lg flex items-center justify-center text-white hover:bg-danger transition-colors cursor-pointer"
                    title="Hapus foto"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Empty state */}
        {images.length === 0 && !isUploading && productId && (
          <p className="text-center text-sm text-text-muted py-4">
            Belum ada foto. Upload foto pertama untuk galeri produk ini.
          </p>
        )}
      </div>
    </div>
  );
}
