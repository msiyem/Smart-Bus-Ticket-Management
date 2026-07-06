import pool from "../config/db.js";

const MAX_SEATS_PER_BOOKING = 4;

export const createBookingService = async ({
  userId,
  tripId,
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

    const [tripRows] = await connection.execute(
      `SELECT id, fare, status, trip_date, schedule_id
       FROM trips
       WHERE id = ?`,
      [tripId],
    );

    if (tripRows.length === 0) {
      throw new Error("Trip not found");
    }

    const trip = tripRows[0];

    if (trip.status !== "SCHEDULED") {
      throw new Error(`Trip is ${trip.status} and cannot be booked`);
    }

    const seatPrice = Number(trip.fare);
    const totalAmount = seatPrice * seatNumbers.length;

    for (const seat of seatNumbers) {
      const [existing] = await connection.execute(
        `SELECT id
        FROM booking_seats
        WHERE trip_id = ?
        AND seat_number = ?
        FOR UPDATE`,
        [tripId, seat],
      );

      if (existing.length > 0) {
        throw new Error(`Seat ${seat} already booked`);
      }
    }

    const [bookingResult] = await connection.execute(
      `INSERT INTO bookings
      (user_id, trip_id, booking_status, payment_status, total_amount)
      VALUES (?, ?, 'CONFIRMED', 'PAID', ?)`,
      [userId, tripId, totalAmount],
    );

    const bookingId = bookingResult.insertId;

    for (const seat of seatNumbers) {
      await connection.execute(
        `INSERT INTO booking_seats
        (booking_id, trip_id, seat_number, price)
        VALUES (?, ?, ?, ?)`,
        [bookingId, tripId, seat, seatPrice],
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
        b.trip_id,
        b.booking_status,
        b.payment_status,
        b.total_amount,
        b.booking_time,
        t.trip_date,
        t.fare,
        t.status AS trip_status,
        t.actual_departure_time,
        t.actual_arrival_time,
        t.cancelled_reason,
        s.departure_time,
        s.arrival_time,
        s.status AS schedule_status,
        r.source_city,
        r.destination_city,
        bu.bus_number,
        bu.bus_type,
        bu.capacity,
        bu.operator_name
      FROM bookings b
      INNER JOIN trips t ON b.trip_id = t.id
      INNER JOIN schedules s ON t.schedule_id = s.id
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
        b.trip_id,
        b.booking_status,
        b.payment_status,
        b.total_amount,
        b.booking_time,
        t.trip_date,
        t.fare,
        t.status AS trip_status,
        t.actual_departure_time,
        t.actual_arrival_time,
        t.cancelled_reason,
        s.departure_time,
        s.arrival_time,
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
      INNER JOIN trips t ON b.trip_id = t.id
      INNER JOIN schedules s ON t.schedule_id = s.id
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
            trip_id: row.trip_id,
            booking_status: row.booking_status,
            payment_status: row.payment_status,
            total_amount: Number(row.total_amount),
            booking_time: row.booking_time,
            trip_date: row.trip_date,
            fare: Number(row.fare),
            trip_status: row.trip_status,
            actual_departure_time: row.actual_departure_time,
            actual_arrival_time: row.actual_arrival_time,
            cancelled_reason: row.cancelled_reason,
            departure_time: row.departure_time,
            arrival_time: row.arrival_time,
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
    // Accept a date string (YYYY-MM-DD) and find trips whose trip_date matches.
    const [rows] = await connection.execute(
      `SELECT
        t.id AS trip_id,
        t.trip_date,
        t.fare,
        t.status AS trip_status,
        t.actual_departure_time,
        t.actual_arrival_time,
        t.cancelled_reason,
        s.id AS schedule_id,
        s.departure_time,
        s.arrival_time,
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
      FROM trips t
      INNER JOIN schedules s ON t.schedule_id = s.id
      INNER JOIN routes r ON s.route_id = r.id
      INNER JOIN buses bu ON s.bus_id = bu.id
      LEFT JOIN bookings b ON b.trip_id = t.id
      LEFT JOIN users u ON u.id = b.user_id
      LEFT JOIN booking_seats bs ON bs.booking_id = b.id
      WHERE t.trip_date = ?
      ORDER BY s.departure_time ASC, bu.bus_number ASC, b.booking_time ASC, bs.seat_number ASC`,
      [date],
    );

    const tripMap = new Map();

    for (const row of rows) {
      if (!tripMap.has(row.trip_id)) {
        tripMap.set(row.trip_id, {
          trip: {
            id: row.trip_id,
            trip_date: row.trip_date,
            fare: Number(row.fare),
            trip_status: row.trip_status,
            actual_departure_time: row.actual_departure_time,
            actual_arrival_time: row.actual_arrival_time,
            cancelled_reason: row.cancelled_reason,
            schedule_id: row.schedule_id,
            departure_time: row.departure_time,
            arrival_time: row.arrival_time,
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
        let tripEntry = tripMap.get(row.trip_id);

        let booking = tripEntry.bookings.find(
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

          tripEntry.bookings.push(booking);
        }

        if (row.seat_number) {
          booking.seats.push({ seat_number: row.seat_number });
        }
      }
    }

    return Array.from(tripMap.values());
  } finally {
    connection.release();
  }
};
