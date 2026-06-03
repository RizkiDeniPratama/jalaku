# Panduan Integrasi Frontend & Mega-Prompt AI jalaku

Sebagai AI Assistant (Claude Opus 4.6), tugas Anda adalah bertindak sebagai Senior Frontend Engineer yang ahli dalam **Astro, React, dan Tailwind CSS**. Anda akan memandu saya membangun antarmuka pengguna (UI) untuk aplikasi e-commerce B2C bernama "Jalaku".

Pondasi Backend (Microservices) sudah **100% SELESAI dan TERKUNCI**. Anda dilarang menyarankan perubahan pada arsitektur backend. Fokus Anda murni pada Frontend.

Bacalah seluruh konteks proyek di bawah ini dengan teliti sebelum memberikan instruksi atau kode apa pun.

---

## 1. Gambaran Umum Aplikasi

- **Nama Aplikasi:** Jalaku
- **Tujuan:** Platform B2C untuk menjual hasil tani (beras, jagung), kebun (alpukat musiman), dan olahan dapur keluarga.
- **Arsitektur Frontend:** Astro (sebagai framework utama SSG/SSR), React (untuk komponen interaktif / _Astro Islands_), Tailwind CSS (Styling).
- **Arsitektur Backend:** 4 Microservices (Express.js + Bun Monorepo).
- **Database & Auth:** Supabase (PostgreSQL, Auth, Storage).

---

## 2. Aturan Teknis & Arsitektur Frontend (WAJIB DIIKUTI)

1.  **Pemilihan Komponen (Astro vs React):**
    - Gunakan file `.astro` untuk layout, halaman statis, SEO, dan UI yang tidak butuh state kompleks (Header, Footer, Card statis).
    - Gunakan file `.tsx` (React) HANYA untuk komponen interaktif (_forms_, _upload_ multi-foto, _state management_ keranjang, filter dinamis). Gunakan direktif `client:load` atau `client:visible` saat memanggil komponen React di Astro.
2.  **Aturan Autentikasi:**
    - **Login:** Via endpoint backend `user-service`. Token JWT disimpan di `localStorage` atau `cookies` di sisi klien.
    - **Logout:** Ditangani 100% di Frontend menggunakan fungsi bawaan Supabase `await supabase.auth.signOut()`. JANGAN memanggil backend untuk urusan _logout_.
    - Semua _request_ mutasi/admin ke Express wajib menyertakan header: `Authorization: Bearer <token_jwt>`.
3.  **Akses Data:**
    - Untuk membaca katalog publik langsung dari Supabase di Frontend, gunakan _Anon Key_ (`sb_publishable_key`).
    - Untuk interaksi dengan Microservices, gunakan `fetch` API standar.
4.  **Shared Types:**
    - Frontend akan mengambil definisi tipe TypeScript (Interfaces) dari monorepo `@repo/shared-types`.

---

## 3. Struktur Model Data (TypeScript Interfaces)

```typescript
// @repo/shared-types/src/database.types.ts (Simulasi)

export interface Product {
  id: string; // UUID
  nama: string;
  slug: string;
  deskripsi: string;
  kategori: "gabah" | "beras" | "kopi" | "alpukat" | "jagung" | "olahan_dapur";
  harga: number;
  satuan: string;
  stok: number;
  status: "ready" | "unavailable" | "pre_order";
  catatan_musim?: string;
  tersedia_mulai?: string;
  product_images: ProductImage[]; // Relasi galeri foto
}

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  display_order: number;
}

export interface Order {
  id: string; // UUID
  user_id?: string | null; // Nullable (Mendukung Guest Checkout)
  nama_pembeli: string;
  no_wa: string;
  alamat_kirim: string;
  metode_bayar: "cod" | "transfer_bank";
  catatan?: string;
  items: { product_id: string; jumlah: number }[]; // JSONB
  total: number;
  status: "new" | "confirmed" | "completed" | "cancelled";
  cancel_reason?: string;
}

export interface Booking {
  id: string; // UUID
  product_id: string;
  nama_pembeli: string;
  no_wa: string;
  jumlah_pesan: number;
  catatan?: string;
  status: "pending" | "confirmed" | "cancelled";
  cancel_reason?: string;
  deleted_at?: string | null; // Soft Delete Marker
}
```

---

## 4. Daftar Endpoint API Backend (Base URL: localhost)

Berikut adalah daftar endpoint API yang akan diintegrasikan dengan Frontend. Semua endpoint menggunakan format respons standar (Success: `{ data: {}, message: "Operasi berhasil", meta: {} }`, Error: `{ error: "Pesan error" }`).

### A. User Service (Port 3001)

- **`POST /auth/login`**
  - **Deskripsi:** Autentikasi pengguna/admin.
  - **Authentication:** Publik
  - **Request Body:** `{ email: string, password: string }`
  - **Response:** `{ data: { token: string, user: { id: string, email: string, role: string, poin: number, membership_expiry: string | null } }, message: string }`
- **`GET /auth/me`**
  - **Deskripsi:** Validasi token & ambil profil pengguna.
  - **Authentication:** Bearer Token (`Authorization: Bearer <access_token>`)
  - **Response:** `{ data: { id: string, email: string, role: string, poin: number, membership_expiry: string | null } }`

### B. Product Service (Port 3002)

- **`GET /products`**
  - **Deskripsi:** Mengambil daftar produk dengan fitur paginasi, filter kategori, dan filter status.
  - **Authentication:** Publik
  - **Query Parameters:** `page` (number), `limit` (number), `kategori` (string), `status` (string)
  - **Response:** `{ data: Product[], meta: { total_items: number, current_page: number, total_pages: number } }`
- **`GET /products/:slug`**
  - **Deskripsi:** Mengambil detail satu produk beserta galeri fotonya.
  - **Authentication:** Publik
  - **Response:** `{ data: Product }` (termasuk `product_images` yang sudah diurutkan)
- **`POST /products`**
  - **Deskripsi:** Membuat produk baru.
  - **Authentication:** Admin (Bearer Token)
  - **Request Body:** `{ nama: string, slug: string, kategori: string, harga: number, satuan: string, stok?: number, status?: string, deskripsi?: string, catatan_musim?: string, tersedia_mulai?: string }`
- **`PATCH /products/:id`**
  - **Deskripsi:** Mengubah data produk.
  - **Authentication:** Admin (Bearer Token)
  - **Request Body:** Partial dari `POST /products` body.
- **`DELETE /products/:id`**
  - **Deskripsi:** Menghapus produk, foto produk, dan membersihkan file dari cloud storage.
  - **Authentication:** Admin (Bearer Token)
- **`POST /products/:productId/images`**
  - **Deskripsi:** Upload banyak foto sekaligus ke galeri produk.
  - **Authentication:** Admin (Bearer Token)
  - **Content Type:** `multipart/form-data`
  - **Form Data:** `fotos` (File[], maks. 10 file, 2MB/file, format: `image/jpeg`, `image/png`, `image/webp`)
- **`PATCH /products/images/:imageId/reorder`**
  - **Deskripsi:** Mengubah urutan tampilan foto.
  - **Authentication:** Admin (Bearer Token)
  - **Request Body:** `{ newOrder: number }` (angka >= 0)
- **`DELETE /products/images/:imageId`**
  - **Deskripsi:** Menghapus satu foto tertentu dari galeri.
  - **Authentication:** Admin (Bearer Token)

### C. Order Service (Port 3003) - Barang Ready Stock

- **`POST /orders`**
  - **Deskripsi:** Membuat pesanan baru (mendukung Guest Checkout). Otomatis menghitung total dan memotong stok.
  - **Authentication:** Publik
  - **Request Body:** `{ nama_pembeli: string, no_wa: string, alamat_kirim: string, metode_bayar: 'cod' | 'transfer_bank', items: { product_id: string, jumlah: number }[], user_id?: string, catatan?: string }`
- **`GET /orders/cek?no_wa=...`**
  - **Deskripsi:** Melihat histori pesanan berdasarkan nomor WhatsApp.
  - **Authentication:** Publik
  - **Query Parameters:** `no_wa` (string)
- **`GET /orders/:id`**
  - **Deskripsi:** Melihat detail pesanan.
  - **Authentication:** Publik
- **`PATCH /orders/:id/cancel`**
  - **Deskripsi:** Membatalkan pesanan oleh pelanggan (hanya jika status `new`). Stok produk akan dikembalikan.
  - **Authentication:** Publik (verifikasi via nomor WA)
  - **Request Body:** `{ no_wa: string, cancel_reason: string }`
- **`GET /orders`**
  - **Deskripsi:** Melihat seluruh transaksi (Admin).
  - **Authentication:** Admin (Bearer Token)
  - **Query Parameters:** `page` (number), `limit` (number), `status` (string, opsional)
- **`PATCH /orders/:id/status`**
  - **Deskripsi:** Mengubah status pesanan (Admin).
  - **Authentication:** Admin (Bearer Token)
  - **Request Body:** `{ status: 'new' | 'confirmed' | 'completed' | 'cancelled' }`

### D. Booking Service (Port 3004) - Barang Pre-Order

- **`POST /bookings`**
  - **Deskripsi:** Membuat reservasi pre-order (tanpa pembayaran/alamat awal).
  - **Authentication:** Publik
  - **Request Body:** `{ product_id: string, nama_pembeli: string, no_wa: string, jumlah_pesan: number, catatan?: string }`
- **`GET /bookings/:id`**
  - **Deskripsi:** Melihat detail reservasi.
  - **Authentication:** Publik
- **`PATCH /bookings/:id/cancel`**
  - **Deskripsi:** Membatalkan reservasi oleh pelanggan (hanya jika status `pending`).
  - **Authentication:** Publik (verifikasi via nomor WA)
  - **Request Body:** `{ no_wa: string, cancel_reason: string }`
- **`GET /bookings`**
  - **Deskripsi:** Melihat seluruh antrean reservasi (Admin).
  - **Authentication:** Admin (Bearer Token)
  - **Query Parameters:** `page` (number), `limit` (number)
- **`PATCH /bookings/:id/status`**
  - **Deskripsi:** Mengubah status reservasi (Admin).
  - **Authentication:** Admin (Bearer Token)
  - **Request Body:** `{ status: 'pending' | 'confirmed' | 'cancelled' }`
- **`DELETE /bookings/:id`**
  - **Deskripsi:** Soft delete data antrean (menyuntikkan timestamp ke `deleted_at`).
  - **Authentication:** Admin (Bearer Token)

---

## 5. Alur Pengguna (User Flows) yang Akan Dibangun

### Fase 1: Portal Admin (Prioritas Utama)

1.  **Login Admin:** Antarmuka form login untuk masuk ke Dashboard.
2.  **Kelola Produk:** Tabel daftar produk, Form penambahan produk (Data JSON), dan UI Upload Galeri Foto (menggunakan FormData di React).
3.  **Kelola Transaksi:** Tabel pemantauan Orders (Ready Stock) dan Bookings (Pre-Order) beserta tombol aksi ubah status.

### Fase 2: Portal Customer (B2C)

1.  **Katalog & Detail:** Menampilkan produk berdesain menarik dengan carousel galeri foto.
2.  **Guest Checkout:** Form satu halaman untuk order (tanpa registrasi), menghitung keranjang, dan mencatat ke database.
3.  **Lacak Pesanan:** Fitur tracking sederhana berbasis pencarian Nomor WhatsApp.

---

## 6. Instruksi & Alur Kerja untuk AI (Workflow Iterasi)

Dalam memandu saya, terapkan prinsip ini:

- **Modular & Terukur:** Jangan berikan seluruh kode sistem dalam satu balasan. Kerjakan komponen demi komponen.
- **Utamakan Astro:** Buat struktur Routing dan Layout menggunakan Astro terlebih dahulu.
- **Desain UI:** Gunakan warna khas alam (Hijau Daun, Coklat Tanah). Gunakan Tailwind CSS murni, hindari library komponen berat (seperti MUI atau Bootstrap).
- **Berikan Analogi:** Jika ada konsep yang rumit (seperti integrasi React Hook Form di dalam Astro Island), jelaskan dengan analogi sederhana.

### Penyesuaian Workflow Iterasi (Versi Astro + React)

1.  **Fase 1: UI & Layouting Murni (.astro)**
    - **Tujuan:** Merancang kerangka halaman (Header, Sidebar Admin, Footer) menggunakan file `.astro` dan Tailwind CSS. Fokus murni pada tampilan visual yang responsif dan SEO.
    - **Output:** Kode `.astro` dan Tailwind CSS.
2.  **Fase 2: Injeksi Interaktivitas (.tsx)**
    - **Tujuan:** Membangun komponen yang membutuhkan interaksi pengguna (seperti form unggah multi-foto, tombol ganti status pesanan) sebagai komponen React terisolasi (Astro Islands) agar state management lebih mudah.
    - **Output:** Kode `.tsx` (React) dengan direktif `client:load` atau `client:visible`.
3.  **Fase 3: Integrasi API Microservices**
    - **Tujuan:** Menyambungkan komponen UI yang sudah jadi dengan endpoint Express.js (Port 3001-3004) menggunakan `fetch` standar, serta menyisipkan token JWT admin di bagian Headers.
    - **Output:** Kode JavaScript/TypeScript untuk interaksi API.

### Komitmen Optimasi Token (SOP Kerja Kita)

- **Fokus per Fitur:** Kita akan memecah pekerjaan per fitur. (Contoh: Selesaikan antarmuka Login Admin terlebih dahulu sampai berfungsi 100%, baru beralih ke Halaman Kelola Produk).
- **Output Kode Minimalis:** Saya hanya akan memberikan blok kode untuk komponen yang sedang kita kerjakan, tanpa mengulang kode boilerplate yang tidak berubah.
- **Debugging Spesifik:** Jika ada bug, kita akan fokus melakukan debugging di area yang bermasalah secara spesifik.

---

**TUGAS PERTAMA ANDA:**

Berdasarkan dokumen ini, rancanglah usulan Struktur Folder (Directory Tree) untuk proyek frontend/Astro kita. Tunjukkan di mana komponen React diletakkan, di mana layout Astro disimpan, dan di mana konfigurasi fetch API diletakkan. Setelah saya menyetujui struktur foldernya, kita akan langsung membuat Halaman Login Admin sebagai langkah coding pertama. Berikan respons Anda!
