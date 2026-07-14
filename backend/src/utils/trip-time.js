/**
 * Combine a trip_date (DATE) with the TIME portion of a schedule's
 * departure_time/arrival_time (DATETIME) to produce the actual
 * timestamp for a trip on that date.
 *
 * This is needed because `schedules.departure_time` / `arrival_time`
 * are DATETIMEs tied to the schedule's original creation date. When a
 * schedule repeats across multiple days, the raw schedule times would
 * show the wrong calendar date for any trip not running on the original
 * creation day.
 *
 * mysql2 quirk: when reading from a MySQL connection that does NOT
 * configure `timezone`, DATE values come back as JS Date objects in
 * the SERVER's local timezone (so `getDate()` reflects the stored
 * calendar date), while DATETIME values come back as Date objects in
 * UTC (so `getUTCHours()` reflects the stored wall-clock time). The
 * helper handles both consistently below.
 *
 * We emit an ISO-8601 string WITHOUT a timezone suffix. The frontend
 * parses it with `new Date(iso)` and treats it as the user's local
 * time, which preserves the wall-clock time the bus actually runs at.
 *
 * If arrival_time's time-of-day is earlier than departure_time's, the
 * trip crosses midnight and the arrival is bumped by one day.
 */
export const computeTripDepartureArrival = ({
  trip_date,
  departure_time,
  arrival_time,
}) => {
  const tripDateStr = toDateString(trip_date);
  const departureTimeOfDay = toTimeOfDayString(departure_time);
  const arrivalTimeOfDay = toTimeOfDayString(arrival_time);

  if (!tripDateStr || !departureTimeOfDay) {
    return {
      departure_time: toSafeIso(departure_time),
      arrival_time: toSafeIso(arrival_time),
    };
  }

  let arrivalDateStr = tripDateStr;
  if (
    arrivalTimeOfDay &&
    arrivalTimeOfDay < departureTimeOfDay
  ) {
    // Trip crosses midnight — bump the arrival to the next calendar day.
    const [y, mo, d] = tripDateStr.split("-").map(Number);
    const next = new Date(Date.UTC(y, mo - 1, d + 1));
    arrivalDateStr = `${next.getUTCFullYear()}-${String(
      next.getUTCMonth() + 1,
    ).padStart(2, "0")}-${String(next.getUTCDate()).padStart(2, "0")}`;
  }

  return {
    departure_time: `${tripDateStr}T${departureTimeOfDay}`,
    arrival_time: arrivalTimeOfDay
      ? `${arrivalDateStr}T${arrivalTimeOfDay}`
      : toSafeIso(arrival_time),
  };
};

const toDateString = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    // DATE values come back from mysql2 in the SERVER's local timezone,
    // so local-time accessors reflect the stored calendar date.
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, "0");
    const d = String(value.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const str = String(value);
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(str);
  return m ? m[1] : null;
};

const toTimeOfDayString = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    // DATETIME values come back from mysql2 as UTC Date objects whose
    // UTC components reflect the stored wall-clock time verbatim.
    const h = String(value.getUTCHours()).padStart(2, "0");
    const mi = String(value.getUTCMinutes()).padStart(2, "0");
    const s = String(value.getUTCSeconds()).padStart(2, "0");
    return `${h}:${mi}:${s}`;
  }
  const str = String(value);
  // ISO format: "YYYY-MM-DDTHH:MM:SS..."
  if (str.length >= 19 && (str[10] === "T" || str[10] === " ")) {
    return str.slice(11, 19);
  }
  // "HH:MM:SS"
  if (/^\d{2}:\d{2}:\d{2}$/.test(str)) {
    return str;
  }
  return null;
};

const toSafeIso = (value) => {
  if (!value) return value;
  if (value instanceof Date) {
    // For DATE we use local components; for DATETIME we use UTC
    // components — match the same conventions as the helpers above.
    if (
      value.getUTCHours() === 0 &&
      value.getUTCMinutes() === 0 &&
      value.getUTCSeconds() === 0
    ) {
      // Likely a DATE value (midnight).
      const y = value.getFullYear();
      const m = String(value.getMonth() + 1).padStart(2, "0");
      const d = String(value.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    }
    const y = value.getUTCFullYear();
    const m = String(value.getUTCMonth() + 1).padStart(2, "0");
    const d = String(value.getUTCDate()).padStart(2, "0");
    const h = String(value.getUTCHours()).padStart(2, "0");
    const mi = String(value.getUTCMinutes()).padStart(2, "0");
    const s = String(value.getUTCSeconds()).padStart(2, "0");
    return `${y}-${m}-${d}T${h}:${mi}:${s}`;
  }
  return value;
};