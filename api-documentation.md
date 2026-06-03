# API Documentation

## Format Response Standar

Semua endpoint menggunakan format response berikut:

### Success Response

```json
{
  "data": {},
  "message": "Operasi berhasil",
  "meta": {}
}
```

### Error Response

```json
{
  "error": "Pesan error"
}
```

---

# 1. User Service

**Port:** `3001`

Menangani autentikasi dan profil pengguna.

> Catatan: Logout sepenuhnya ditangani oleh Frontend (Astro), sehingga tidak tersedia endpoint logout.

## POST /auth/login

Login menggunakan akun Supabase Auth.

### Authentication

Publik

### Request Body

```json
{
  "email": "user@email.com",
  "password": "password123"
}
```

### Response

```json
{
  "data": {
    "token": "...",
    "user": {
      "id": "...",
      "email": "...",
      "role": "customer",
      "poin": 0,
      "membership_expiry": null
    }
  },
  "message": "Login berhasil"
}
```

---

## GET /auth/me

Validasi token dan mengambil profil pengguna.

### Authentication

Bearer Token

### Headers

```http
Authorization: Bearer <access_token>
```

### Response

```json
{
  "data": {
    "id": "...",
    "email": "...",
    "role": "customer",
    "poin": 0,
    "membership_expiry": null
  }
}
```

---

# 2. Product Service

**Port:** `3002`

Menangani katalog produk dan galeri foto produk.

Penyimpanan file menggunakan:

- Supabase Storage

## GET /products

Mengambil daftar produk.

### Authentication

Publik

### Fitur

- Pagination
- Filter kategori
- Filter status

### Query Parameter

| Parameter | Contoh    | Keterangan              |
| --------- | --------- | ----------------------- |
| page      | 1         | Nomor halaman           |
| limit     | 10        | Jumlah data per halaman |
| kategori  | beras     | Filter kategori         |
| status    | available | Filter status           |

### Contoh Request

```http
GET /products?page=1&limit=10&kategori=beras
```

### Response

```json
{
  "data": [...],
  "meta": {
    "total_items": 50,
    "current_page": 1,
    "total_pages": 5
  }
}
```

---

## GET /products/:slug

Mengambil detail satu produk beserta galeri fotonya.

### Authentication

Publik

### Contoh

```http
GET /products/beras-organik-premium
```

### Response

```json
{
  "data": {
    "id": "...",
    "nama": "Beras Organik",
    "harga": 15000,
    "product_images": [
      {
        "id": "...",
        "image_url": "https://...",
        "display_order": 1
      }
    ]
  }
}
```

> Galeri foto diurutkan berdasarkan `display_order`. Jika belum ada foto, dikembalikan placeholder.

---

## POST /products

Membuat produk baru.

### Authentication

Admin (Bearer Token)

### Request Body

| Field          | Tipe   | Wajib | Keterangan                        |
| -------------- | ------ | ----- | --------------------------------- |
| nama           | string | Ya    | Nama produk                       |
| slug           | string | Ya    | Slug unik untuk URL               |
| kategori       | string | Ya    | Kategori produk (contoh: beras)   |
| harga          | number | Ya    | Harga satuan                      |
| satuan         | string | Ya    | Satuan (contoh: kg)               |
| stok           | number | Tidak | Default: 0                        |
| status         | string | Tidak | Default: "unavailable"            |
| deskripsi      | string | Tidak | Deskripsi produk                  |
| catatan_musim  | string | Tidak | Catatan musim panen               |
| tersedia_mulai | string | Tidak | Tanggal mulai tersedia (ISO date) |

```json
{
  "nama": "Beras Organik",
  "slug": "beras-organik",
  "kategori": "beras",
  "harga": 15000,
  "satuan": "kg",
  "stok": 100,
  "deskripsi": "Beras organik kualitas premium"
}
```

---

## PATCH /products/:id

Mengubah data produk.

### Authentication

Admin (Bearer Token)

### Request Body

Kirim hanya field yang ingin diubah. Field sama dengan POST.

```json
{
  "harga": 17000,
  "stok": 80
}
```

---

## DELETE /products/:id

Menghapus produk.

### Authentication

Admin (Bearer Token)

### Catatan

Selain menghapus data produk, sistem juga akan:

- Menghapus seluruh foto produk
- Membersihkan file dari cloud storage

---

## POST /products/:productId/images

Upload banyak foto sekaligus ke galeri produk.

### Authentication

Admin (Bearer Token)

### Content Type

```http
multipart/form-data
```

### Form Data

| Key   | Type   | Keterangan                  |
| ----- | ------ | --------------------------- |
| fotos | File[] | Maks. 10 file, 2MB per file |

### Format File yang Didukung

- `image/jpeg`
- `image/png`
- `image/webp`

---

## PATCH /products/images/:imageId/reorder

Mengubah urutan tampilan foto.

### Authentication

Admin (Bearer Token)

### Request Body

```json
{
  "newOrder": 1
}
```

> `newOrder` harus angka >= 0.

---

## DELETE /products/images/:imageId

Menghapus satu foto tertentu dari galeri.

### Authentication

Admin (Bearer Token)

---

# 3. Order Service

**Port:** `3003`

Menangani transaksi produk ready-stock.

Contoh:

- Beras
- Telur
- Produk olahan dapur

## POST /orders

Membuat pesanan baru.

### Authentication

Publik (Guest Checkout)

### Fitur

- Guest Checkout
- Otomatis menghitung total
- Otomatis memotong stok produk

### Request Body

| Field        | Tipe   | Wajib | Keterangan                      |
| ------------ | ------ | ----- | ------------------------------- |
| nama_pembeli | string | Ya    | Nama pembeli                    |
| no_wa        | string | Ya    | Nomor WhatsApp                  |
| alamat_kirim | string | Ya    | Alamat pengiriman               |
| metode_bayar | string | Ya    | "cod" atau "transfer_bank"      |
| items        | array  | Ya    | Array objek product_id & jumlah |
| user_id      | string | Tidak | UUID user (jika login)          |
| catatan      | string | Tidak | Catatan tambahan                |

```json
{
  "nama_pembeli": "Budi",
  "no_wa": "08123456789",
  "alamat_kirim": "Sumbawa Besar",
  "metode_bayar": "cod",
  "catatan": "Pagi hari",
  "items": [
    {
      "product_id": "uuid",
      "jumlah": 2
    }
  ]
}
```

---

## GET /orders/cek

Melihat histori pesanan berdasarkan nomor WhatsApp.

### Authentication

Publik

### Query Parameter

```http
GET /orders/cek?no_wa=08123456789
```

### Response

```json
{
  "data": [
    {
      "id": "...",
      "status": "new",
      "total": 30000,
      "items": [...],
      "created_at": "...",
      "nama_pembeli": "Budi"
    }
  ]
}
```

---

## GET /orders/:id

Melihat detail pesanan.

### Authentication

Publik

### Contoh

```http
GET /orders/550e8400-e29b
```

---

## PATCH /orders/:id/cancel

Membatalkan pesanan oleh pelanggan.

### Authentication

Publik (verifikasi via nomor WA)

### Request Body

```json
{
  "no_wa": "08123456789",
  "cancel_reason": "Berubah pikiran"
}
```

### Catatan

- Hanya pesanan dengan status `new` yang dapat dibatalkan
- Stok produk akan dikembalikan secara otomatis

---

## GET /orders

Melihat seluruh transaksi (Admin).

### Authentication

Admin (Bearer Token)

### Fitur

- Pagination
- Filter status (opsional)

### Query Parameter

| Parameter | Contoh | Keterangan              |
| --------- | ------ | ----------------------- |
| page      | 1      | Nomor halaman           |
| limit     | 10     | Jumlah data per halaman |

---

## PATCH /orders/:id/status

Mengubah status pesanan (Admin).

### Authentication

Admin (Bearer Token)

### Request Body

```json
{
  "status": "confirmed"
}
```

### Status Tersedia

| Status    | Keterangan         |
| --------- | ------------------ |
| new       | Pesanan baru       |
| confirmed | Dikonfirmasi admin |
| completed | Pesanan selesai    |
| cancelled | Dibatalkan         |

---

# 4. Booking Service

**Port:** `3004`

Menangani reservasi produk pre-order.

Contoh:

- Alpukat
- Mangga musiman
- Hasil panen yang belum tersedia

## POST /bookings

Membuat reservasi pre-order.

### Authentication

Publik

### Catatan

Belum memerlukan:

- Pembayaran
- Alamat pengiriman

### Request Body

| Field        | Tipe   | Wajib | Keterangan                     |
| ------------ | ------ | ----- | ------------------------------ |
| product_id   | string | Ya    | UUID produk (status pre_order) |
| nama_pembeli | string | Ya    | Nama pembeli                   |
| no_wa        | string | Ya    | Nomor WhatsApp                 |
| jumlah_pesan | number | Ya    | Jumlah pesan (min. 1)          |
| catatan      | string | Tidak | Catatan tambahan               |

```json
{
  "product_id": "uuid",
  "nama_pembeli": "Budi",
  "no_wa": "08123456789",
  "jumlah_pesan": 5,
  "catatan": "Panen bulan depan"
}
```

---

## GET /bookings/:id

Melihat detail reservasi.

### Authentication

Publik

### Contoh

```http
GET /bookings/550e8400-e29b
```

---

## PATCH /bookings/:id/cancel

Membatalkan reservasi oleh pelanggan.

### Authentication

Publik (verifikasi via nomor WA)

### Request Body

```json
{
  "no_wa": "08123456789",
  "cancel_reason": "Tidak jadi pesan"
}
```

### Catatan

- Hanya booking dengan status `pending` yang dapat dibatalkan

---

## GET /bookings

Melihat seluruh antrean reservasi (Admin).

### Authentication

Admin (Bearer Token)

### Data yang Ditampilkan

- Data booking
- Nama produk terkait (`products(nama, satuan)`)
- Status reservasi

### Query Parameter

| Parameter | Contoh | Keterangan              |
| --------- | ------ | ----------------------- |
| page      | 1      | Nomor halaman           |
| limit     | 10     | Jumlah data per halaman |

---

## PATCH /bookings/:id/status

Mengubah status reservasi (Admin).

### Authentication

Admin (Bearer Token)

### Request Body

```json
{
  "status": "confirmed"
}
```

### Status Tersedia

| Status    | Keterangan          |
| --------- | ------------------- |
| pending   | Menunggu konfirmasi |
| confirmed | Dikonfirmasi        |
| cancelled | Dibatalkan          |

---

# Ringkasan Service

| Service         | Port |     | Fungsi                       |
| --------------- | ---- | --- | ---------------------------- |
| User Service    | 3001 |     | Login & Profil Pengguna      |
| Product Service | 3002 |     | Katalog Produk & Galeri Foto |
| Order Service   | 3003 |     | Checkout Produk Ready Stock  |
| Booking Service | 3004 |     | Reservasi Produk Pre-Order   |
