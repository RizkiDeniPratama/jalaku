import { Router } from "express";
import {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrdersByWa,
} from "../controllers/order.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Customer
router.post("/", createOrder);
router.get("/cek", getOrdersByWa);
router.get("/:id", getOrderById);

// Admin
router.get("/", requireAdmin, getAllOrders);
router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
