import { Request, Response } from "express";
import { supabase } from "../../../user-service/src/lib/supabase";

// ─────────────────────────────────────────────────────────
// GET /products
// Ambil semua produk (Mendukung Filter & Pagination)
// Contoh: GET /products?kategori=beras&page=1&limit=10
// ─────────────────────────────────────────────────────────
export async function getAllProducts(req: Request, res: Response) {
  try {
    const { kategori, status, page = "1", limit = "10" } = req.query;

    // Kalkulasi Pagination
    const pageNumber = parseInt(page as string);
    const limitNumber = parseInt(limit as string);
    const from = (pageNumber - 1) * limitNumber;
    const to = from + limitNumber - 1;

    let query = supabase
      .from("products")
      .select("*", { count: "exact" }) // Ambil juga total data keseluruhan
      .order("created_at", { ascending: false })
      .range(from, to); // Terapkan pembatasan halaman

    if (kategori) {
      query = query.eq("kategori", kategori as string);
    }
    if (status) {
      query = query.eq("status", status as string);
    }

    const { data, error, count } = await query;

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
    res.status(500).json({ error: "Gagal mengambil data produk" });
  }
}

// ─────────────────────────────────────────────────────────
// GET /products/:slug
// ─────────────────────────────────────────────────────────
export async function getProductBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const { data, error } = await supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) {
      res.status(404).json({ error: "Produk tidak ditemukan" });
      return;
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengambil data produk" });
  }
}

// ─────────────────────────────────────────────────────────
// POST /products (Admin Only)
// ─────────────────────────────────────────────────────────
export async function createProduct(req: Request, res: Response) {
  try {
    const {
      nama,
      slug,
      deskripsi,
      kategori,
      harga,
      satuan,
      stok,
      status,
      foto_url,
      catatan_musim,
      tersedia_mulai,
    } = req.body;

    if (!nama || !slug || !kategori || !harga || !satuan) {
      res.status(400).json({
        error: "Field wajib kurang: nama, slug, kategori, harga, satuan",
      });
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .insert({
        nama,
        slug,
        deskripsi,
        kategori,
        harga,
        satuan,
        foto_url,
        catatan_musim,
        tersedia_mulai,
        stok: stok ?? 0,
        status: status ?? "unavailable", // Mengikuti default schema yang aman
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Slug sudah digunakan produk lain" });
        return;
      }
      throw error;
    }
    res.status(201).json({ data });
  } catch (error) {
    res.status(500).json({ error: "Gagal membuat produk" });
  }
}

// ─────────────────────────────────────────────────────────
// PATCH /products/:id (Admin Only)
// ─────────────────────────────────────────────────────────
export async function updateProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Keamanan: Ekstrak hanya field yang diizinkan untuk diubah
    const {
      nama,
      slug,
      deskripsi,
      kategori,
      harga,
      satuan,
      stok,
      status,
      foto_url,
      catatan_musim,
      tersedia_mulai,
    } = req.body;

    // Buat object baru hanya dengan nilai yang tidak undefined
    const updates = JSON.parse(
      JSON.stringify({
        nama,
        slug,
        deskripsi,
        kategori,
        harga,
        satuan,
        stok,
        status,
        foto_url,
        catatan_musim,
        tersedia_mulai,
      }),
    );

    // Cek jika tidak ada data yang dikirim
    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "Tidak ada data untuk diupdate" });
      return;
    }

    const { data, error } = await supabase
      .from("products")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        res.status(409).json({ error: "Slug sudah digunakan produk lain" });
        return;
      }
      throw error;
    }
    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: "Gagal mengupdate produk" });
  }
}

// ─────────────────────────────────────────────────────────
// DELETE /products/:id (Admin Only)
// ─────────────────────────────────────────────────────────
export async function deleteProduct(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("products").delete().eq("id", id);

    if (error) throw error;
    res.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal menghapus produk" });
  }
}
