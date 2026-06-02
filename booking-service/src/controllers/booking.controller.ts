// booking-service/src/controllers/booking.controller.ts
import { Request, Response } from "express";
import { supabase } from "../lib/supabase";

// ─── ADMIN: Lihat semua booking (Dengan Pagination) ─────────────────────────
export async function getAllBookings(req: Request, res: Response) {
  try {
    const { page = "1", limit = "10" } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const from = (pageNumber - 1) * limitNumber;
    const to = from + limitNumber - 1;

    const { data, error, count } = await supabase
      .from("bookings")
      .select("*, products(nama, satuan)", { count: "exact" }) // Relasi ke nama produk
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .range(from, to);

    if (error) throw error;

    res.json({
      data,
      meta: {
        total_items: count,
        current_page: pageNumber,
        total_pages: count ? Math.ceil(count / limitNumber) : 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data reservasi" });
  }
}

// ─── ADMIN: Update status booking ───────────────────────────────────────────
export async function updateBookingStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["pending", "confirmed", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Status reservasi tidak valid" });
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "Data reservasi tidak ditemukan" });
      return;
    }

    res.json({ data, message: "Status reservasi berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui status reservasi" });
  }
}

// ─────────────────────────────────────────────────────────
// POST /bookings
// Buat booking baru untuk produk pre_order.
// Body: { product_id, nama_pembeli, no_wa, jumlah_pesan, catatan }
// ─────────────────────────────────────────────────────────
export async function createBooking(req: Request, res: Response) {
  try {
    const { product_id, nama_pembeli, no_wa, jumlah_pesan, catatan } = req.body;

    // ── 1. Validasi field wajib ──────────────────────────
    if (!product_id || !nama_pembeli || !no_wa || !jumlah_pesan) {
      res.status(400).json({
        error:
          "Field wajib kurang: product_id, nama_pembeli, no_wa, jumlah_pesan",
      });
      return;
    }
    if (typeof jumlah_pesan !== "number" || jumlah_pesan < 1) {
      res
        .status(400)
        .json({ error: "jumlah_pesan harus berupa angka minimal 1" });
      return;
    }

    // ── 2. Cek produk — harus ada dan statusnya pre_order ─
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, nama, status")
      .eq("id", product_id)
      .single();

    if (productError || !product) {
      res.status(404).json({ error: "Produk tidak ditemukan di database" });
      return;
    }

    if (product.status !== "pre_order") {
      res.status(400).json({
        error: `Produk "${product.nama}" saat ini tidak dalam status pre_order. Silakan gunakan menu pemesanan langsung.`,
      });
      return;
    }

    // ── 3. Simpan booking ────────────────────────────────
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .insert({
        product_id,
        nama_pembeli,
        no_wa,
        jumlah_pesan,
        catatan: catatan ?? null,
        // CATATAN PERBAIKAN:
        // Baris status:"pending" dihapus.
        // Database akan secara otomatis mengisi 'menunggu' sesuai aturan default.
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    res.status(201).json({
      data: booking,
      message:
        "Booking berhasil dibuat! Admin akan menghubungi kamu via WhatsApp saat panen tiba.",
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal membuat reservasi pre-order" });
  }
}

// ─────────────────────────────────────────────────────────
// GET /bookings/:id
// Ambil detail booking by ID.
// ─────────────────────────────────────────────────────────
export async function getBookingById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .is("deleted_at", null)
      .single();

    if (error) {
      res.status(404).json({ error: "Data Booking tidak ditemukan" });
      return;
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data reservasi" });
  }
}

export async function cancelBooking(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { no_wa, cancel_reason } = req.body;

    if (!no_wa) {
      res
        .status(400)
        .json({ error: "Nomor WA wajib diisi untuk cancel booking" });
      return;
    }

    const { data: booking, error: findError } = await supabase
      .from("bookings")
      .select("id, status, no_wa")
      .eq("id", id)
      .eq("no_wa", no_wa)
      .is("deleted_at", null)
      .single();

    if (findError || !booking) {
      res.status(404).json({ error: "Booking tidak ditemukan" });
      return;
    }

    if (booking.status !== "pending") {
      res.status(400).json({
        error: `Booking tidak bisa dibatalkan. Status saat ini: ${booking.status}`,
      });
      return;
    }

    const { data, error } = await supabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancel_reason: cancel_reason || null,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({ data, message: "Booking berhasil dibatalkan" });
  } catch (error) {
    res.status(500).json({ error: "Gagal membatalkan booking" });
  }
}
