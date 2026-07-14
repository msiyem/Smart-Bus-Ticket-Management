import pool from "../config/db.js";
import { requireFields } from "../validations/requireFields.validate.js";
import { weekdayBitForDate } from "../utils/weekday.js";
import { computeTripDepartureArrival } from "../utils/trip-time.js";
import {
  ensureTripsForDateRange,
  ensureTripsForSchedule,
} from "../services/tripGenerator.service.js";

export const createSchedule = async (req, res) => {
  try {
    requireFields(
      req.body,
      "route_id",
      "bus_id",
      "departure_time",
      "arrival_time",
      "fare",
    );

    const {
      route_id,
      bus_id,
      departure_time,
      arrival_time,
      fare,
      repeat_days,
    } = req.body;

    // 127 = all 7 weekday bits set (every day).
    const repeatBitmask =
      repeat_days === undefined || repeat_days === null || repeat_days === ""
        ? 127
        : Number(repeat_days);

    const [result] = await pool.execute(
      `INSERT INTO schedules
      (route_id, bus_id, departure_time, arrival_time, fare, repeat_days)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [route_id, bus_id, departure_time, arrival_time, fare, repeatBitmask],
    );

    const scheduleId = result.insertId;

    try {
      const today = new Date();
      const end = new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000);
      await ensureTripsForSchedule(
        scheduleId,
        today.toISOString().slice(0, 10),
        end.toISOString().slice(0, 10),
      );
    } catch (e) {
      console.error(
        "[createSchedule] trip backfill failed for schedule",
        scheduleId,
        e,
      );
    }

    res.status(201).json({
      success: true,
      scheduleId,
    });
  } catch (error) {
    const status = Number(error?.statusCode) >= 400 && Number(error?.statusCode) < 600
      ? Number(error.statusCode)
      : 500;
    const rawMessage = String(error?.message || "").trim();
    const message =
      rawMessage ||
      (error?.code === "ER_NO_REFERENCED_ROW_2"
        ? "Referenced route or bus does not exist."
        : error?.code === "ER_DUP_ENTRY"
          ? "Schedule already exists for this route/bus/time."
          : "Failed to create schedule.");
    res.status(status).json({
      success: false,
      message,
    });
  }
};

export const searchSchedules = async (req, res) => {
  try {
    requireFields(req.query, "source", "destination", "date");
    const { source, destination, date } = req.query;

    const dayBit = weekdayBitForDate(date);
    if (dayBit === 0) {
      return res.status(400).json({
        success: false,
        message: "date must be a valid YYYY-MM-DD string",
      });
    }

    try {
      await ensureTripsForDateRange(date, date);
    } catch (e) {
      console.error("[searchSchedules] lazy generator failed:", e.message);
    }

    const [trips] = await pool.execute(
      `SELECT
          t.id AS trip_id,
          t.schedule_id,
          t.trip_date,
          t.fare AS actual_fare,
          t.status AS trip_status,
          t.actual_departure_time,
          t.actual_arrival_time,
          t.cancelled_reason,
          s.route_id,
          s.bus_id,
          s.departure_time,
          s.arrival_time,
          s.fare AS schedule_fare,
          s.repeat_days,
          s.status AS schedule_status,
          b.bus_number,
          b.bus_type,
          b.capacity,
          b.operator_name,
          b.operator_id,
          r.source_city,
          r.destination_city,
          (
            SELECT COUNT(*)
            FROM booking_seats bs
            WHERE bs.trip_id = t.id
          ) AS booked_seats
      FROM trips t
      JOIN schedules s ON t.schedule_id = s.id
      JOIN routes r ON s.route_id = r.id
      JOIN buses b ON s.bus_id = b.id
      WHERE t.trip_date = ?
      AND t.status = 'SCHEDULED'
      AND s.status = 'SCHEDULED'
      AND (s.repeat_days & ?) = ?
      AND r.source_city = ?
      AND r.destination_city = ?
      ORDER BY t.fare ASC, s.departure_time ASC`,
      [date, dayBit, dayBit, source, destination],
    );

    const data = trips.map((row) => {
      // The schedule's departure_time/arrival_time are DATETIMEs tied to the
      // schedule's original creation date. Each trip runs on its own
      // trip_date, so reconstruct the departure/arrival timestamps by
      // combining trip_date with the TIME portion of the schedule times.
      // This guarantees the search result displays the correct date when
      // schedules repeat across days.
      const { departure_time, arrival_time } = computeTripDepartureArrival(
        row,
      );

      return {
        ...row,
        // Keep the search API aligned with the client contract. A trip can
        // override its schedule fare, so prefer it when displaying a result.
        fare: Number(row.actual_fare ?? row.schedule_fare),
        status: row.trip_status,
        departure_time,
        arrival_time,
        available_seats: Math.max(
          0,
          Number(row.capacity) - Number(row.booked_seats || 0),
        ),
      };
    });

    res.json({
      success: true,
      date,
      data,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Failed to search schedules",
    });
  }
};

export const listSchedules = async (_req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT
          s.id,
          s.route_id,
          s.bus_id,
          s.departure_time,
          s.arrival_time,
          s.fare,
          s.status,
          s.repeat_days,
          s.created_at,
          s.updated_at,
          b.bus_number,
          b.bus_type,
          b.capacity,
          b.operator_name,
          r.source_city,
          r.destination_city
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      JOIN buses b ON s.bus_id = b.id
      ORDER BY s.created_at DESC`,
    );

    res.json({ success: true, data: rows });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to list schedules" });
  }
};

export const getScheduleById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid schedule id" });
    }

    const [rows] = await pool.execute(
      `SELECT
          s.id,
          s.route_id,
          s.bus_id,
          s.departure_time,
          s.arrival_time,
          s.fare,
          s.status,
          s.repeat_days,
          s.created_at,
          s.updated_at,
          b.bus_number,
          b.bus_type,
          b.capacity,
          b.operator_name,
          r.source_city,
          r.destination_city
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      JOIN buses b ON s.bus_id = b.id
      WHERE s.id = ?`,
      [id],
    );

    if (rows.length === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found" });
    }

    res.json({ success: true, data: rows[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch schedule" });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid schedule id" });
    }

    const allowed = [
      "route_id",
      "bus_id",
      "departure_time",
      "arrival_time",
      "fare",
      "status",
      "repeat_days",
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
      `UPDATE schedules SET ${fields.join(", ")} WHERE id = ?`,
      values,
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found" });
    }

    res.json({ success: true, scheduleId: id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to update schedule" });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid schedule id" });
    }

    const [bookings] = await pool.execute(
      `SELECT COUNT(*) AS c
       FROM bookings b
       JOIN trips t ON b.trip_id = t.id
       WHERE t.schedule_id = ?`,
      [id],
    );
    if (Number(bookings[0].c) > 0) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete a schedule with existing bookings. Mark it CANCELLED instead.",
      });
    }

    const [result] = await pool.execute(
      `DELETE FROM schedules WHERE id = ?`,
      [id],
    );

    if (result.affectedRows === 0) {
      return res
        .status(404)
        .json({ success: false, message: "Schedule not found" });
    }

    res.json({ success: true, scheduleId: id });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to delete schedule" });
  }
};
