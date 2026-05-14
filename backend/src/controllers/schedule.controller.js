import pool from "../config/db.js";
import { requireFields } from "../validations/requireFields.validate.js";

export const createSchedule = async (req, res) => {
  try {
    requireFields(
      req.body,
      "route_id",
      "bus_id",
      "departure_time",
      "arrival_time",
      "fare"
    );

    const {
      route_id,
      bus_id,
      departure_time,
      arrival_time,
      fare,
    } = req.body;

    const [result] = await pool.execute(
      `INSERT INTO schedules
      (route_id, bus_id, departure_time, arrival_time, fare)
      VALUES (?, ?, ?, ?, ?)`,
      [
        route_id,
        bus_id,
        departure_time,
        arrival_time,
        fare,
      ]
    );

    res.status(201).json({
      success: true,
      scheduleId: result.insertId,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const searchSchedules = async (req, res) => {
  try {
    requireFields(req.query, "source", "destination", "date");
    const { source, destination, date } = req.query;

    const [schedules] = await pool.execute(
      `SELECT
          s.id,
          s.departure_time,
          s.arrival_time,
          s.fare,
          b.bus_number,
          b.bus_type,
          r.source_city,
          r.destination_city
      FROM schedules s
      JOIN routes r ON s.route_id = r.id
      JOIN buses b ON s.bus_id = b.id
      WHERE r.source_city = ?
      AND r.destination_city = ?
      AND DATE(s.departure_time) = ?
      AND s.status = 'SCHEDULED'`,
      [source, destination, date]
    );

    res.json({
      success: true,
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};