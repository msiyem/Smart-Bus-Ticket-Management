import express from "express";
import { Authenticate } from "../middleware/auth.middleware.js";
import { Authorize } from "../middleware/role.middleware.js";
import { getAvailableSeats } from "../controllers/seat.controller.js";
import {
  createBooking,
  getMyBookings,
  getBookingDetails,
  getBookingsByDay,
} from "../controllers/booking.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { createBookingSchema } from "../validations/booking.validation.js";

const router = express.Router();

router.get("/available-seats/:tripId", getAvailableSeats);
router.post("/", Authenticate, validate(createBookingSchema), createBooking);
router.get("/me", Authenticate, getMyBookings);
// Admin: all buses + bookings for a specific day (query: ?date=YYYY-MM-DD)
router.get("/admin/day", Authenticate, Authorize("admin"), getBookingsByDay);
router.get("/:bookingId", Authenticate, getBookingDetails);
export default router;