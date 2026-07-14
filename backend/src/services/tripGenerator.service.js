import pool from "../config/db.js";
import {
  dateRangeInclusive,
  weekdayBitForDate,
} from "../utils/weekday.js";

export const ensureTripsForDateRange = async (startDate, endDate) => {
  const dates = dateRangeInclusive(startDate, endDate);
  if (dates.length === 0) {
    return { created: 0, skipped: 0, range: [] };
  }

  const [schedules] = await pool.execute(
    `SELECT id, fare, repeat_days
     FROM schedules
     WHERE status = 'SCHEDULED'`,
  );

  if (schedules.length === 0) {
    return { created: 0, skipped: 0, range: dates };
  }

  let created = 0;
  let skipped = 0;

  for (const schedule of schedules) {
    const matchingDates = dates.filter(
      (d) => (Number(schedule.repeat_days) & weekdayBitForDate(d)) !== 0,
    );

    if (matchingDates.length === 0) continue;

    const values = [];
    const placeholders = [];
    for (const tripDate of matchingDates) {
      placeholders.push("(?, ?, ?)");
      values.push(schedule.id, tripDate, schedule.fare);
    }

    // INSERT IGNORE — affectedRows counts only rows actually inserted
    const [result] = await pool.query(
      `INSERT IGNORE INTO trips (schedule_id, trip_date, fare)
       VALUES ${placeholders.join(", ")}`,
      values,
    );

    created += result.affectedRows;
    skipped += matchingDates.length - result.affectedRows;
  }

  return { created, skipped, range: dates };
};

export const ensureTripsForSchedule = async (scheduleId, startDate, endDate) => {
  const dates = dateRangeInclusive(startDate, endDate);
  if (dates.length === 0) return { created: 0, skipped: 0, range: [] };

  const [rows] = await pool.execute(
    `SELECT id, fare, repeat_days, status
     FROM schedules
     WHERE id = ?`,
    [scheduleId],
  );

  if (rows.length === 0) {
    return { created: 0, skipped: 0, range: dates };
  }

  const schedule = rows[0];
  if (schedule.status !== "SCHEDULED") {
    return { created: 0, skipped: 0, range: dates };
  }

  const matchingDates = dates.filter(
    (d) => (Number(schedule.repeat_days) & weekdayBitForDate(d)) !== 0,
  );

  if (matchingDates.length === 0) {
    return { created: 0, skipped: 0, range: dates };
  }

  const values = [];
  const placeholders = [];
  for (const tripDate of matchingDates) {
    placeholders.push("(?, ?, ?)");
    values.push(schedule.id, tripDate, schedule.fare);
  }

  const [result] = await pool.query(
    `INSERT IGNORE INTO trips (schedule_id, trip_date, fare)
     VALUES ${placeholders.join(", ")}`,
    values,
  );

  return {
    created: result.affectedRows,
    skipped: matchingDates.length - result.affectedRows,
    range: matchingDates,
  };
};
