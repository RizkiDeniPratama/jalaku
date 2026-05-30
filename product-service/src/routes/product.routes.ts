import { Router } from "express";
import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  uploadFotoProduk,
  updateProduct,
  deleteProduct,
  upload,
} from "../controllers/product.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// ─── PUBLIC ROUTES ─────────────────────────────────────
router.get("/", getAllProducts);
router.get("/:slug", getProductBySlug);

// ─── ADMIN ONLY ROUTES ─────────────────────────────────
router.post("/", requireAdmin, createProduct);
router.post(
  "/upload-foto",
  requireAdmin,
  upload.single("foto"),
  uploadFotoProduk,
);
router.patch("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
