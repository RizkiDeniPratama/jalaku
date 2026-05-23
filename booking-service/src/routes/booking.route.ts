import { Router } from "express";
import {
  createBooking,
  getBookingById,
  getAllBookings,
  updateBookingStatus,
} from "../controllers/booking.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Customer
router.post("/", createBooking);
router.get("/:id", getBookingById);

// Admin
router.get("/", requireAdmin, getAllBookings);
router.patch("/:id/status", requireAdmin, updateBookingStatus);

export default router;
