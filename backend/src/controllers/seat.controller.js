import pool from "../config/db.js";
import { generateSeats } from "../utils/seatGenerator.js";

export const getAvailableSeats = async (req, res) => {
  try {
    const { scheduleId } = req.params;

    const [[schedule]] = await pool.execute(
      `SELECT b.capacity
      FROM schedules s
      JOIN buses b ON s.bus_id = b.id
      WHERE s.id = ?`,
      [scheduleId]
    );

    if (!schedule) {
      return res.status(404).json({
        success: false,
        message: "Schedule not found",
      });
    }

    const allSeats = generateSeats(schedule.capacity);

    const [booked] = await pool.execute(
      `SELECT seat_number
      FROM booking_seats
      WHERE schedule_id = ?`,
      [scheduleId]
    );

    const bookedSeats = booked.map(
      (seat) => seat.seat_number
    );

    const availableSeats = allSeats.filter(
      (seat) => !bookedSeats.includes(seat)
    );

    res.json({
      success: true,
      data: availableSeats,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};