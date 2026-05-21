// order-service/src/controllers/order.controller.ts
import { Request, Response } from "express";
import { supabase } from "../lib/supabase";

type OrderItem = {
  product_id: string;
  jumlah: number;
};

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
