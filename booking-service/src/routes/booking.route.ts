import { Router } from "express";
import {
  createBooking,
  getBookingById,
  getAllBookings,
  updateBookingStatus,
  cancelBooking,
} from "../controllers/booking.controller";
import { requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// Customer
router.post("/", createBooking);
router.get("/:id", getBookingById);
router.patch("/:id/cancel", cancelBooking);

// Admin
router.get("/", requireAdmin, getAllBookings);
router.patch("/:id/status", requireAdmin, updateBookingStatus);

export default router;
