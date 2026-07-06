import pool from "../config/db.js";
import { generateSeats } from "../utils/seatGenerator.js";

export const getAvailableSeats = async (req, res) => {
  try {
    const { tripId } = req.params;

    const [[trip]] = await pool.execute(
      `SELECT b.capacity
      FROM trips t
      JOIN schedules s ON t.schedule_id = s.id
      JOIN buses b ON s.bus_id = b.id
      WHERE t.id = ?`,
      [tripId]
    );

    if (!trip) {
      return res.status(404).json({
        success: false,
        message: "Trip not found",
      });
    }

    const allSeats = generateSeats(trip.capacity);

    const [booked] = await pool.execute(
      `SELECT seat_number
      FROM booking_seats
      WHERE trip_id = ?`,
      [tripId]
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