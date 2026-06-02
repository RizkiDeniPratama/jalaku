import { Router } from "express";
import {
  createOrder,
  getOrderById,
  getAllOrders,
  updateOrderStatus,
  getOrdersByWa,
  cancelOrder,
} from "../controllers/order.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Customer
router.post("/", createOrder);
router.get("/cek", getOrdersByWa);
router.get("/:id", getOrderById);
router.patch("/:id/cancel", cancelOrder);

// Admin
router.get("/", requireAdmin, getAllOrders);
router.patch("/:id/status", requireAdmin, updateOrderStatus);

export default router;
