import {
  createBookingService,
  getBookingDetailsService,
  getMyBookingsService,
  getBusesWithBookingsByDateService,
} from "../services/booking.service.js";
import { requireFields } from "../validations/requireFields.validate.js";

export const createBooking = async (req, res) => {
  try {
    const userId = req.user?.userId;

    requireFields(req.body, "scheduleId", "seatNumbers");

    const { scheduleId, seatNumbers } = req.body;

    const bookingId = await createBookingService({
      userId,
      scheduleId,
      seatNumbers,
    });

    res.status(201).json({
      success: true,
      message: "Booking created successfully",
      bookingId: bookingId,
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBookingDetails = async (req, res) => {
  try {
    const userId = req.user?.userId;
    const role = req.user?.role;
    const bookingId = Number(req.params.bookingId);

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking id",
      });
    }

    const data = await getBookingDetailsService({ bookingId, userId, role });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const userId = req.user?.userId;

    const data = await getMyBookingsService({ userId });

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    res.status(404).json({
      success: false,
      message: error.message,
    });
  }
};

export const getBookingsByDay = async (req, res) => {
  try {
    // date expected as YYYY-MM-DD in query, default to today
    const { date } = req.query;

    const day = date || new Date().toISOString().slice(0, 10);

    const data = await getBusesWithBookingsByDateService({ date: day });

    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
