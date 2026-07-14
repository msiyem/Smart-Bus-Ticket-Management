import { ensureTripsForDateRange } from "../services/tripGenerator.service.js";
import { dateRangeInclusive } from "../utils/weekday.js";

export const runDailyTripGeneration = async () => {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000);
  const end = endDate.toISOString().slice(0, 10);

  const range = dateRangeInclusive(start, end);
  console.log(
    `[trip-gen] runDailyTripGeneration start=${start} end=${end} (${range.length} days)`,
  );

  try {
    const result = await ensureTripsForDateRange(start, end);
    console.log(
      `[trip-gen] runDailyTripGeneration done created=${result.created} skipped=${result.skipped}`,
    );
    return result;
  } catch (err) {
    console.error("[trip-gen] runDailyTripGeneration failed:", err);
    throw err;
  }
};