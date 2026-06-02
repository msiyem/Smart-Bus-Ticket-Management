import express from "express";
import { Authenticate } from "../middleware/auth.middleware.js";
import { Authorize } from "../middleware/role.middleware.js";
import { getAvailableSeats } from "../controllers/seat.controller.js";
import {
  createBooking,
  getMyBookings,
  getBookingDetails,
} from "../controllers/booking.controller.js";
import { getBookingsByDay } from "../controllers/booking.controller.js";

const router = express.Router();

router.get("/available-seats/:scheduleId", getAvailableSeats);
router.post("/", Authenticate, createBooking);
router.get("/me", Authenticate, getMyBookings);
// Admin: get all buses + bookings for a specific day (query: ?date=YYYY-MM-DD)
router.get("/admin/day", Authenticate, Authorize("admin"), getBookingsByDay);
router.get("/:bookingId", Authenticate, getBookingDetails);

export default router;
