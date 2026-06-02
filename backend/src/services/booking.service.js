import pool from "../config/db.js";

const MAX_SEATS_PER_BOOKING = 4;

export const createBookingService = async ({
  userId,
  scheduleId,
  seatNumbers,
}) => {
  if (!Array.isArray(seatNumbers) || seatNumbers.length === 0) {
    throw new Error("At least one seat is required");
  }

  if (seatNumbers.length > MAX_SEATS_PER_BOOKING) {
    throw new Error(`You can only book up to ${MAX_SEATS_PER_BOOKING} seats.`);
  }

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

export const getBookingDetailsService = async ({ bookingId, userId, role }) => {
  const connection = await pool.getConnection();

  try {
    const [bookingRows] = await connection.execute(
      `SELECT
        b.id,
        b.user_id,
        b.schedule_id,
        b.booking_status,
        b.payment_status,
        b.total_amount,
        b.booking_time,
        s.departure_time,
        s.arrival_time,
        s.fare,
        s.status AS schedule_status,
        r.source_city,
        r.destination_city,
        bu.bus_number,
        bu.bus_type,
        bu.capacity,
        bu.operator_name
      FROM bookings b
      INNER JOIN schedules s ON b.schedule_id = s.id
      INNER JOIN routes r ON s.route_id = r.id
      INNER JOIN buses bu ON s.bus_id = bu.id
      WHERE b.id = ?
      AND (? = 'admin' OR b.user_id = ?)
      LIMIT 1`,
      [bookingId, role, userId],
    );

    if (bookingRows.length === 0) {
      throw new Error("Booking not found");
    }

    const [seatRows] = await connection.execute(
      `SELECT seat_number, price
       FROM booking_seats
       WHERE booking_id = ?
       ORDER BY seat_number ASC`,
      [bookingId],
    );

    return {
      booking: bookingRows[0],
      seats: seatRows,
    };
  } finally {
    connection.release();
  }
};

export const getMyBookingsService = async ({ userId }) => {
  const connection = await pool.getConnection();

  try {
    const [rows] = await connection.execute(
      `SELECT
        b.id,
        b.schedule_id,
        b.booking_status,
        b.payment_status,
        b.total_amount,
        b.booking_time,
        s.departure_time,
        s.arrival_time,
        s.fare,
        s.status AS schedule_status,
        r.source_city,
        r.destination_city,
        bu.bus_number,
        bu.bus_type,
        bu.capacity,
        bu.operator_name,
        bs.seat_number,
        bs.price
      FROM bookings b
      INNER JOIN schedules s ON b.schedule_id = s.id
      INNER JOIN routes r ON s.route_id = r.id
      INNER JOIN buses bu ON s.bus_id = bu.id
      LEFT JOIN booking_seats bs ON bs.booking_id = b.id
      WHERE b.user_id = ?
      ORDER BY s.departure_time DESC, b.booking_time DESC, bs.seat_number ASC`,
      [userId],
    );

    const bookingMap = new Map();

    for (const row of rows) {
      if (!bookingMap.has(row.id)) {
        bookingMap.set(row.id, {
          booking: {
            id: row.id,
            schedule_id: row.schedule_id,
            booking_status: row.booking_status,
            payment_status: row.payment_status,
            total_amount: Number(row.total_amount),
            booking_time: row.booking_time,
            departure_time: row.departure_time,
            arrival_time: row.arrival_time,
            fare: Number(row.fare),
            schedule_status: row.schedule_status,
            source_city: row.source_city,
            destination_city: row.destination_city,
            bus_number: row.bus_number,
            bus_type: row.bus_type,
            capacity: row.capacity,
            operator_name: row.operator_name,
          },
          seats: [],
        });
      }

      if (row.seat_number) {
        bookingMap.get(row.id).seats.push({
          seat_number: row.seat_number,
          price: Number(row.price),
        });
      }
    }

    const now = Date.now();
    const fifteenDaysAgo = now - 15 * 24 * 60 * 60 * 1000;

    const upcomingTrips = [];
    const recentPastTrips = [];

    for (const ticket of bookingMap.values()) {
      const departureTime = new Date(ticket.booking.departure_time).getTime();

      if (Number.isNaN(departureTime)) {
        continue;
      }

      const ticketWithMeta = {
        ...ticket,
        trip_status: departureTime >= now ? "UPCOMING" : "PAST",
      };

      if (departureTime >= now) {
        upcomingTrips.push(ticketWithMeta);
      } else if (departureTime >= fifteenDaysAgo) {
        recentPastTrips.push(ticketWithMeta);
      }
    }

    return {
      upcomingTrips,
      recentPastTrips,
    };
  } finally {
    connection.release();
  }
};

export const getBusesWithBookingsByDateService = async ({ date }) => {
  const connection = await pool.getConnection();

  try {
    // Accept a date string (YYYY-MM-DD) and find schedules whose departure_time falls on that date
    const [rows] = await connection.execute(
      `SELECT
        s.id AS schedule_id,
        s.departure_time,
        s.arrival_time,
        s.fare,
        s.status AS schedule_status,
        r.source_city,
        r.destination_city,
        bu.id AS bus_id,
        bu.bus_number,
        bu.bus_type,
        bu.operator_name,
        b.id AS booking_id,
        b.user_id,
        b.booking_status,
        b.payment_status,
        b.total_amount,
        b.booking_time,
        u.name AS user_name,
        u.email AS user_email,
        bs.seat_number
      FROM schedules s
      INNER JOIN routes r ON s.route_id = r.id
      INNER JOIN buses bu ON s.bus_id = bu.id
      LEFT JOIN bookings b ON b.schedule_id = s.id
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN booking_seats bs ON bs.booking_id = b.id
      WHERE DATE(s.departure_time) = ?
      ORDER BY s.departure_time ASC, bu.bus_number ASC, b.booking_time ASC, bs.seat_number ASC`,
      [date],
    );

    const scheduleMap = new Map();

    for (const row of rows) {
      if (!scheduleMap.has(row.schedule_id)) {
        scheduleMap.set(row.schedule_id, {
          schedule: {
            id: row.schedule_id,
            departure_time: row.departure_time,
            arrival_time: row.arrival_time,
            fare: Number(row.fare),
            schedule_status: row.schedule_status,
            source_city: row.source_city,
            destination_city: row.destination_city,
            bus: {
              id: row.bus_id,
              bus_number: row.bus_number,
              bus_type: row.bus_type,
              operator_name: row.operator_name,
            },
          },
          bookings: [],
        });
      }

      if (row.booking_id) {
        let scheduleEntry = scheduleMap.get(row.schedule_id);

        let booking = scheduleEntry.bookings.find(
          (b) => b.id === row.booking_id,
        );

        if (!booking) {
          booking = {
            id: row.booking_id,
            user_id: row.user_id,
            user_name: row.user_name,
            user_email: row.user_email,
            booking_status: row.booking_status,
            payment_status: row.payment_status,
            total_amount: Number(row.total_amount),
            booking_time: row.booking_time,
            seats: [],
          };

          scheduleEntry.bookings.push(booking);
        }

        if (row.seat_number) {
          booking.seats.push({ seat_number: row.seat_number });
        }
      }
    }

    return Array.from(scheduleMap.values());
  } finally {
    connection.release();
  }
};
