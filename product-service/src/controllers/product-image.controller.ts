import { Request, Response } from "express";
import multer from "multer";
import { supabase } from "../lib/supabase";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const uploadMultiple = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024, files: 10 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) cb(null, true);
    else cb(new Error("Format tidak didukung"));
  },
});

// POST /products/:productId/images
export async function uploadProductImages(req: Request, res: Response) {
  try {
    const { productId } = req.params;
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .single();
    if (productError || !product) {
      res.status(404).json({ error: "Produk tidak ditemukan" });
      return;
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: "Tidak ada file" });
      return;
    }

    const { data: existing } = await supabase
      .from("product_images")
      .select("display_order")
      .eq("product_id", productId)
      .order("display_order", { ascending: false })
      .limit(1);
    let nextOrder = (existing?.[0]?.display_order ?? 0) + 1;

    const uploaded = [];
    for (const file of files) {
      const ext = file.mimetype.split("/")[1];
      const fileName = `products/${productId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, file.buffer, { contentType: file.mimetype });
      if (uploadError) continue;

      const { data: urlData } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);
      const { data: inserted, error: insertError } = await supabase
        .from("product_images")
        .insert({
          product_id: productId,
          image_url: urlData.publicUrl,
          display_order: nextOrder++,
        })
        .select()
        .single();
      if (!insertError && inserted) uploaded.push(inserted);
    }

    if (uploaded.length === 0) {
      res.status(500).json({ error: "Gagal upload semua foto" });
      return;
    }
    res.status(201).json({ data: uploaded });
  } catch (error) {
    res.status(500).json({ error: "Gagal upload foto" });
  }
}

// DELETE /products/images/:imageId
export async function deleteProductImage(req: Request, res: Response) {
  try {
    const { imageId } = req.params;
    const { data: image, error: fetchError } = await supabase
      .from("product_images")
      .select("image_url")
      .eq("id", imageId)
      .single();
    if (fetchError || !image) {
      res.status(404).json({ error: "Foto tidak ditemukan" });
      return;
    }

    const urlParts = image.image_url.split(
      "/storage/v1/object/public/product-images/",
    );
    if (urlParts.length === 2) {
      await supabase.storage.from("product-images").remove([urlParts[1]]);
    }

    await supabase.from("product_images").delete().eq("id", imageId);
    res.json({ message: "Foto dihapus" });
  } catch (error) {
    res.status(500).json({ error: "Gagal hapus foto" });
  }
}

// PATCH /products/images/:imageId/reorder
export async function reorderProductImage(req: Request, res: Response) {
  try {
    const { imageId } = req.params;
    const { newOrder } = req.body;
    if (typeof newOrder !== "number" || newOrder < 0) {
      res.status(400).json({ error: "newOrder harus angka >= 0" });
      return;
    }
    await supabase
      .from("product_images")
      .update({ display_order: newOrder })
      .eq("id", imageId);
    res.json({ message: "Urutan diubah" });
  } catch (error) {
    res.status(500).json({ error: "Gagal ubah urutan" });
  }
}
