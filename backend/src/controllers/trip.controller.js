import pool from "../config/db.js";

const JOIN_BASE = `
  FROM trips t
  JOIN schedules s ON t.schedule_id = s.id
  JOIN routes r ON s.route_id = r.id
  JOIN buses b ON s.bus_id = b.id
`;

const SELECT_BASE = `
  SELECT
    t.id AS trip_id,
    t.schedule_id,
    t.trip_date,
    t.fare,
    t.status,
    t.actual_departure_time,
    t.actual_arrival_time,
    t.cancelled_reason,
    t.created_at,
    t.updated_at,
    s.route_id,
    s.bus_id,
    s.departure_time,
    s.arrival_time,
    s.fare AS schedule_fare,
    s.repeat_days,
    s.status AS schedule_status,
    r.source_city,
    r.destination_city,
    b.bus_number,
    b.bus_type,
    b.capacity,
    b.operator_name,
    b.operator_id,
    (
      SELECT COUNT(*)
      FROM booking_seats bs
      WHERE bs.trip_id = t.id
    ) AS booked_seats
`;

const shapeRow = (row) => ({
  ...row,
  available_seats: Math.max(
    0,
    Number(row.capacity) - Number(row.booked_seats || 0),
  ),
});

/**
 * GET /api/trips
 * Admin: list any trip (with filters).
 * Operator: list only trips on buses they operate.
 */
export const listTrips = async (req, res) => {
  try {
    const { role, bus_operator_id } = req.user || {};
    const filters = [];
    const values = [];

    if (req.query.schedule_id !== undefined) {
      const sid = Number(req.query.schedule_id);
      if (!Number.isInteger(sid) || sid <= 0) {
        return res.status(400).json({
          success: false,
          message: "schedule_id must be a positive integer",
        });
      }
      filters.push("t.schedule_id = ?");
      values.push(sid);
    }
    if (req.query.date) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.query.date))) {
        return res.status(400).json({
          success: false,
          message: "date must be in YYYY-MM-DD format",
        });
      }
      filters.push("t.trip_date = ?");
      values.push(req.query.date);
    }
    if (req.query.status) {
      const allowed = ["SCHEDULED", "CANCELLED", "COMPLETED"];
      if (!allowed.includes(String(req.query.status))) {
        return res.status(400).json({
          success: false,
          message: `status must be one of ${allowed.join(", ")}`,
        });
      }
      filters.push("t.status = ?");
      values.push(req.query.status);
    }

    if (role === "operator") {
      if (!bus_operator_id) {
        return res.status(403).json({
          success: false,
          message: "Operator account is not linked to a bus_operator",
        });
      }
      filters.push("b.operator_id = ?");
      values.push(bus_operator_id);
    }

    const where = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    const [rows] = await pool.execute(
      `${SELECT_BASE} ${JOIN_BASE} ${where} ORDER BY t.trip_date DESC, s.departure_time DESC`,
      values,
    );

    res.json({ success: true, data: rows.map(shapeRow) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * GET /api/trips/:id
 */
export const getTripById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid trip id" });
    }

    const [rows] = await pool.execute(
      `${SELECT_BASE} ${JOIN_BASE} WHERE t.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    res.json({ success: true, data: shapeRow(rows[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * PATCH /api/trips/:id
 * Admin or operator (scoped). Mutable: fare, status, actual_* times,
 * cancelled_reason.
 */
export const updateTrip = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid trip id" });
    }

    const allowed = [
      "fare",
      "status",
      "actual_departure_time",
      "actual_arrival_time",
      "cancelled_reason",
    ];

    const fields = [];
    const values = [];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        fields.push(`${key} = ?`);
        values.push(req.body[key]);
      }
    }
    if (fields.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No fields to update" });
    }

    values.push(id);
    const [result] = await pool.execute(
      `UPDATE trips SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    res.json({ success: true, tripId: id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * POST /api/trips/:id/cancel
 * Convenience: same as PATCH {status:'CANCELLED', cancelled_reason}.
 */
export const cancelTrip = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid trip id" });
    }

    const cancelled_reason = req.body?.cancelled_reason || null;

    const [result] = await pool.execute(
      `UPDATE trips SET status = 'CANCELLED', cancelled_reason = ? WHERE id = ?`,
      [cancelled_reason, id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    res.json({ success: true, tripId: id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * DELETE /api/trips/:id
 * Refuses with 409 if any booking_seats reference this trip.
 */
export const deleteTrip = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid trip id" });
    }

    const [bookings] = await pool.execute(
      `SELECT COUNT(*) AS c FROM bookings WHERE trip_id = ?`,
      [id],
    );
    if (Number(bookings[0].c) > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete a trip with existing bookings. Cancel it instead.",
      });
    }

    // booking_seats may have rows even if bookings were deleted; clean up.
    await pool.execute(`DELETE FROM booking_seats WHERE trip_id = ?`, [id]);

    const [result] = await pool.execute(`DELETE FROM trips WHERE id = ?`, [id]);

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Trip not found" });
    }

    res.json({ success: true, tripId: id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
