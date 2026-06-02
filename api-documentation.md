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

---

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
      "poin": 0
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
    "poin": 0
  }
}
```

---

# 2. Product Service

**Port:** `3002`

Menangani katalog produk dan galeri foto produk.

Penyimpanan file menggunakan:

- Supabase Storage
- AWS S3 (opsional)

---

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
    "product_images": []
  }
}
```

---

## POST /products

Membuat produk baru.

### Authentication

Admin

### Request Body

```json
{
  "nama": "Beras Organik",
  "slug": "beras-organik",
  "kategori": "beras",
  "harga": 15000,
  "stok": 100,
  "satuan": "kg"
}
```

---

## PATCH /products/:id

Mengubah data produk.

### Authentication

Admin

### Request Body

Kirim hanya field yang ingin diubah.

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

Admin

### Catatan

Selain menghapus data produk, sistem juga akan:

- Menghapus seluruh foto produk
- Membersihkan file dari cloud storage

---

## POST /products/:productId/images

Upload banyak foto sekaligus ke galeri produk.

### Authentication

Admin

### Content Type

```http
multipart/form-data
```

### Form Data

| Key   | Type   |
| ----- | ------ |
| fotos | File[] |

---

## PATCH /products/images/:imageId/reorder

Mengubah urutan tampilan foto.

### Authentication

Admin

### Request Body

```json
{
  "newOrder": 1
}
```

---

## DELETE /products/images/:imageId

Menghapus satu foto tertentu dari galeri.

### Authentication

Admin

---

# 3. Order Service

**Port:** `3003`

Menangani transaksi produk ready-stock.

Contoh:

- Beras
- Telur
- Produk olahan dapur

---

## POST /orders

Membuat pesanan baru.

### Authentication

Publik

### Fitur

- Guest Checkout
- Otomatis menghitung total
- Otomatis memotong stok produk

### Request Body

```json
{
  "nama_pembeli": "Budi",
  "no_wa": "08123456789",
  "alamat_kirim": "Sumbawa Besar",
  "metode_bayar": "cod",
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

## GET /orders

Melihat seluruh transaksi.

### Authentication

Admin

### Fitur

- Pagination
- Filter status (opsional)

---

## PATCH /orders/:id/status

Mengubah status pesanan.

### Authentication

Admin

### Request Body

```json
{
  "status": "confirmed"
}
```

### Status Tersedia

| Status    |
| --------- |
| new       |
| confirmed |
| completed |
| cancelled |

---

# 4. Booking Service

**Port:** `3004`

Menangani reservasi produk pre-order.

Contoh:

- Alpukat
- Mangga musiman
- Hasil panen yang belum tersedia

---

## POST /bookings

Membuat reservasi pre-order.

### Authentication

Publik

### Catatan

Belum memerlukan:

- Pembayaran
- Alamat pengiriman

### Request Body

```json
{
  "product_id": "uuid",
  "nama_pembeli": "Budi",
  "no_wa": "08123456789",
  "jumlah_pesan": 5
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

## GET /bookings

Melihat seluruh antrean reservasi.

### Authentication

Admin

### Data yang Ditampilkan

- Data booking
- Nama produk terkait
- Status reservasi

---

## PATCH /bookings/:id/status

Mengubah status reservasi.

### Authentication

Admin

### Request Body

```json
{
  "status": "confirmed"
}
```

### Status Tersedia

| Status    |
| --------- |
| menunggu  |
| confirmed |
| cancelled |

---

# Ringkasan Service

| Service         | Port | Fungsi                       |
| --------------- | ---- | ---------------------------- |
| User Service    | 3001 | Login & Profil Pengguna      |
| Product Service | 3002 | Katalog Produk & Galeri Foto |
| Order Service   | 3003 | Checkout Produk Ready Stock  |
| Booking Service | 3004 | Reservasi Produk Pre-Order   |
