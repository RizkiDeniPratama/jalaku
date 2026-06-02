import { Router } from "express";
import {
  uploadMultiple,
  uploadProductImages,
  deleteProductImage,
  reorderProductImage,
} from "../controllers/product-image.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

router.post(
  "/:productId/images",
  requireAdmin,
  uploadMultiple.array("fotos", 10),
  uploadProductImages,
);
router.patch("/images/:imageId/reorder", requireAdmin, reorderProductImage);
router.delete("/images/:imageId", requireAdmin, deleteProductImage);

export default router;
