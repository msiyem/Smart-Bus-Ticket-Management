import pool from "../config/db.js";

export const createBookingService = async ({
  userId,
  scheduleId,
  seatNumbers,
}) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [scheduleRows] = await connection.execute(
      `SELECT fare
       FROM schedules
       WHERE id = ?`,
      [scheduleId],
    );

    const seatPrice = Number(scheduleRows[0].fare);

    const totalAmount = seatPrice * seatNumbers.length;

    if (scheduleRows.length === 0) {
      throw new Error("Schedule not found");
    }

    for (const seat of seatNumbers) {
      const [existing] = await connection.execute(
        `SELECT id
        FROM booking_seats
        WHERE schedule_id = ?
        AND seat_number = ?
        FOR UPDATE`,
        [scheduleId, seat],
      );

      if (existing.length > 0) {
        throw new Error(`Seat ${seat} already booked`);
      }
    }

    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings
      (user_id, schedule_id, booking_status, payment_status, total_amount)
      VALUES (?, ?, 'CONFIRMED', 'PAID', ?)`,
      [userId, scheduleId, totalAmount],
    );

    const bookingId = bookingResult.insertId;

    for (const seat of seatNumbers) {
      await connection.execute(
        `INSERT INTO booking_seats
        (booking_id, schedule_id, seat_number, price)
        VALUES (?, ?, ?, ?)`,
        [bookingId, scheduleId, seat, seatPrice],
      );
    }

    await connection.commit();

    return bookingId;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};
