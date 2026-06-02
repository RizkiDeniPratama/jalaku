import multer from "multer";
import { Request, Response } from "express";
import { supabase } from "../lib/supabase";

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
// ─────────────────────────────────────────────────────────
// GET /products/:slug
// ─────────────────────────────────────────────────────────
export async function getProductBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const { data, error } = await supabase
      .from("products")
      .select(
        `
        *,
        product_images (
          id,
          image_url,
          display_order
        )
      `,
      )
      .eq("slug", slug)
      .single();

    if (error) {
      res.status(404).json({ error: "Produk tidak ditemukan" });
      return;
    }

    // Urutkan galeri foto berdasarkan display_order
    if (data.product_images) {
      data.product_images.sort(
        (a: any, b: any) => a.display_order - b.display_order,
      );
    } else {
      data.product_images = [];
    }

    // Fallback jika belum ada foto
    if (data.product_images.length === 0) {
      data.product_images = [
        {
          id: "default-image",
          image_url: "https://placehold.co/600x400?text=Foto+Belum+Tersedia",
          display_order: 1,
        },
      ];
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

    // 1. Ambil semua image_url dari product_images
    const { data: images } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("product_id", id);

    // 2. Hapus file dari storage (jika ada)
    if (images && images.length > 0) {
      const filePaths = images
        .map((img) => {
          const parts = img.image_url.split(
            "/storage/v1/object/public/product-images/",
          );
          return parts.length === 2 ? parts[1] : null;
        })
        .filter(Boolean) as string[];
      if (filePaths.length) {
        await supabase.storage.from("product-images").remove(filePaths);
      }
    }

    // 3. Hapus produk (cascade akan hapus record product_images)
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    res.json({ message: "Produk berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal hapus produk" });
  }
}
