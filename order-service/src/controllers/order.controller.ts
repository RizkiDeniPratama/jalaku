// order-service/src/controllers/order.controller.ts
import { Request, Response } from "express";
import { supabase } from "../lib/supabase";

type OrderItem = {
  product_id: string;
  jumlah: number;
};

// ─── ADMIN ──────────────────────────
export async function getAllOrders(req: Request, res: Response) {
  try {
    const { page = "1", limit = "10" } = req.query;
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const from = (pageNumber - 1) * limitNumber;
    const to = from + limitNumber - 1;

    const { data, error, count } = await supabase
      .from("orders")
      .select("*", { count: "exact" })
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
    res.status(500).json({ error: "Gagal mengambil data pesanan" });
  }
}

export async function updateOrderStatus(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ["new", "confirmed", "completed", "cancelled"];
    if (!validStatuses.includes(status)) {
      res.status(400).json({ error: "Status tidak valid" });
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    if (!data) {
      res.status(404).json({ error: "Order tidak ditemukan" });
      return;
    }

    res.json({ data, message: "Status pesanan berhasil diperbarui" });
  } catch (error) {
    res.status(500).json({ error: "Gagal memperbarui status" });
  }
}

// ─────────────────────────────────────────────────────────
// POST /orders
// Buat order baru (Guest Checkout & Logged In User)
// ─────────────────────────────────────────────────────────
export async function createOrder(req: Request, res: Response) {
  try {
    const {
      user_id, // Opsional: null jika guest, isi uuid jika login
      nama_pembeli,
      no_wa,
      alamat_kirim,
      metode_bayar,
      catatan,
      items,
    }: {
      user_id?: string;
      nama_pembeli: string;
      no_wa: string;
      alamat_kirim: string;
      metode_bayar: "cod" | "transfer_bank";
      catatan?: string;
      items: OrderItem[];
    } = req.body;

    // ── 1. Validasi Field Wajib ──────────────────────────
    if (
      !nama_pembeli ||
      !no_wa ||
      !alamat_kirim ||
      !metode_bayar ||
      !items?.length
    ) {
      res.status(400).json({
        error:
          "Field wajib kurang: nama_pembeli, no_wa, alamat_kirim, metode_bayar, items",
      });
      return;
    }

    if (!["cod", "transfer_bank"].includes(metode_bayar)) {
      res.status(400).json({ error: "Metode bayar tidak valid" });
      return;
    }

    // ── 2. Ambil Data Produk (Verifikasi Harga & Stok) ───
    const productIds = items.map((item) => item.product_id);
    const { data: products, error: productError } = await supabase
      .from("products")
      .select("id, nama, harga, stok, status")
      .in("id", productIds);

    if (productError || !products?.length) {
      res
        .status(400)
        .json({ error: "Satu atau lebih produk tidak ditemukan di database" });
      return;
    }

    // ── 3. Validasi Stok & Hitung Total Subtotal ─────────
    let total = 0;
    const validatedItems = [];

    for (const item of items) {
      const product = products.find((p) => p.id === item.product_id);
      if (!product) {
        res
          .status(400)
          .json({ error: `Produk ID ${item.product_id} tidak valid` });
        return;
      }
      if (product.status === "unavailable") {
        res
          .status(400)
          .json({ error: `Produk "${product.nama}" sedang tidak tersedia` });
        return;
      }
      if (product.stok < item.jumlah) {
        res.status(400).json({
          error: `Stok "${product.nama}" tidak cukup. Sisa: ${product.stok}`,
        });
        return;
      }

      const subtotal = product.harga * item.jumlah;
      total += subtotal;

      validatedItems.push({
        product_id: product.id,
        nama_produk: product.nama,
        harga_satuan: product.harga,
        jumlah: item.jumlah,
        subtotal,
      });
    }

    // ── 4. Simpan Order (Nota) ke Supabase ───────────────
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        user_id: user_id ?? null,
        nama_pembeli,
        no_wa,
        alamat_kirim,
        metode_bayar,
        catatan: catatan ?? null,
        items: validatedItems,
        total,
        status: "new",
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // ── 5. POTONG STOK PRODUK SECARA OTOMATIS ────────────
    // Ini langkah krusial yang dilewatkan Claude
    for (const item of validatedItems) {
      const product = products.find((p) => p.id === item.product_id);
      if (product) {
        await supabase
          .from("products")
          .update({ stok: product.stok - item.jumlah })
          .eq("id", item.product_id);
      }
    }

    res.status(201).json({ data: order, message: "Pesanan berhasil dibuat!" });
  } catch (error) {
    res.status(500).json({ error: "Gagal membuat order sistem" });
  }
}

// ─── CUSTOMER: Cek order via nomor WA ───────────────────────────────────────
export async function getOrdersByWa(req: Request, res: Response) {
  try {
    const { no_wa } = req.query;
    if (!no_wa || typeof no_wa !== "string") {
      res.status(400).json({ error: "Parameter no_wa wajib diisi" });
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("id, status, total, items, created_at, nama_pembeli") // Filter kolom sensitif
      .eq("no_wa", no_wa)
      .order("created_at", { ascending: false });

    if (error) throw error;

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil riwayat pesanan" });
  }
}

// ─────────────────────────────────────────────────────────
// GET /orders/:id
// Customer cek status order via ID Order
// ─────────────────────────────────────────────────────────
export async function getOrderById(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      res.status(404).json({ error: "Order tidak ditemukan" });
      return;
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data order" });
  }
}

export async function cancelOrder(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { no_wa, cancel_reason } = req.body;

    if (!no_wa) {
      res
        .status(400)
        .json({ error: "Nomor WA wajib diisi untuk membatalkan pesanan" });
      return;
    }

    // 1. Cari order
    const { data: order, error: findError } = await supabase
      .from("orders")
      .select("id, status, no_wa, items")
      .eq("id", id)
      .eq("no_wa", no_wa)
      .single();

    if (findError || !order) {
      res
        .status(404)
        .json({ error: "Pesanan tidak ditemukan atau nomor WA salah" });
      return;
    }

    // 2. Validasi status
    if (order.status !== "new") {
      res.status(400).json({
        error: `Pesanan tidak bisa dibatalkan karena sudah masuk tahap: ${order.status}`,
      });
      return;
    }

    // 3. Kembalikan stok (Pendekatan JS Loop untuk MVP)
    const items = order.items as Array<{ product_id: string; jumlah: number }>;

    for (const item of items) {
      const { data: product } = await supabase
        .from("products")
        .select("stok")
        .eq("id", item.product_id)
        .single();

      if (product) {
        await supabase
          .from("products")
          .update({ stok: product.stok + item.jumlah })
          .eq("id", item.product_id);
      }
    }

    // 4. Update status & alasan
    const { data, error } = await supabase
      .from("orders")
      .update({
        status: "cancelled",
        cancel_reason: cancel_reason || "Dibatalkan oleh pelanggan",
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    res.json({
      data,
      message: "Pesanan berhasil dibatalkan dan stok telah dikembalikan",
    });
  } catch (error) {
    res.status(500).json({ error: "Gagal membatalkan pesanan" });
  }
}
