import { Router } from "express";
import {
  getAllProducts,
  getProductBySlug,
  createProduct,
  updateProduct,
  deleteProduct,
} from "../controllers/product.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// ─── PUBLIC ROUTES ─────────────────────────────────────
router.get("/", getAllProducts);
router.get("/:slug", getProductBySlug);

// ─── ADMIN ONLY ROUTES ─────────────────────────────────
router.post("/", requireAdmin, createProduct);
router.patch("/:id", requireAdmin, updateProduct);
router.delete("/:id", requireAdmin, deleteProduct);

export default router;
