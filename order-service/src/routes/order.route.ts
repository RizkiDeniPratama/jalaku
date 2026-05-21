import { Router } from "express";
import { createOrder, getOrderById } from "../controllers/order.controller";

const router = Router();

// Public — siapa saja bisa order (guest checkout)
router.post("/", createOrder);

// Public — customer cek status order mereka by ID
router.get("/:id", getOrderById);

export default router;
