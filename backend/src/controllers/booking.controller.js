import { createBookingService } from "../services/booking.service.js";
import { requireFields } from "../validations/requireFields.validate.js";

export const createBooking = async (req, res) => {
  try {
    const userId = req.user?.userId;
    
    requireFields(req.body, "scheduleId", "seatNumbers");

    const {
      scheduleId,
      seatNumbers,
    } = req.body;

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