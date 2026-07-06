// Weekday bitmask helpers.
// Mirrors `schedules.repeat_days TINYINT UNSIGNED` where Mon=1, Tue=2, ... Sun=64.
// `date` arguments are 'YYYY-MM-DD' strings.

export const WEEKDAY_BITS = Object.freeze({
  MON: 1,
  TUE: 2,
  WED: 4,
  THU: 8,
  FRI: 16,
  SAT: 32,
  SUN: 64,
});

export const WEEKDAY_NAMES = Object.freeze([
  "SUN",
  "MON",
  "TUE",
  "WED",
  "THU",
  "FRI",
  "SAT",
]);

/**
 * Convert a YYYY-MM-DD string into the bit for that day-of-week.
 * Returns 0 for unparseable input.
 *
 * JavaScript Date.getUTCDay(): 0 = Sunday, 1 = Monday, ..., 6 = Saturday.
 * We normalize to MON=1..SUN=64.
 */
export const weekdayBitForDate = (date) => {
  if (typeof date !== "string") return 0;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!m) return 0;
  const [, y, mo, d] = m;
  const parsed = new Date(Date.UTC(Number(y), Number(mo) - 1, Number(d)));
  if (Number.isNaN(parsed.getTime())) return 0;
  const dow = parsed.getUTCDay(); // 0..6 with 0=Sun
  if (dow === 0) return WEEKDAY_BITS.SUN;
  return 1 << (dow - 1);
};

/**
 * Returns true if the date's weekday bit is set in repeatDays.
 * repeatDays=0 means "never"; repeatDays=127 means "every day".
 */
export const dateIsInRepeatDays = (date, repeatDays) => {
  const bit = weekdayBitForDate(date);
  if (bit === 0) return false;
  const mask = Number(repeatDays ?? 0);
  if (!Number.isInteger(mask) || mask < 0) return false;
  return (mask & bit) !== 0;
};

/**
 * Generate an inclusive list of 'YYYY-MM-DD' strings between two dates.
 * Returns [] if either arg is malformed or start > end.
 */
export const dateRangeInclusive = (startDate, endDate) => {
  if (
    typeof startDate !== "string" ||
    typeof endDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(startDate) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(endDate)
  ) {
    return [];
  }
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];
  if (start > end) return [];

  const out = [];
  const cursor = new Date(start);
  while (cursor <= end) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cursor.getUTCDate()).padStart(2, "0");
    out.push(`${y}-${m}-${d}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
};
