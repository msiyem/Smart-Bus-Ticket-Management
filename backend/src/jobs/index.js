import cron from "node-cron";
import { ensureTripsForDateRange } from "../services/tripGenerator.service.js";
import { dateRangeInclusive } from "../utils/weekday.js";

/**
 * Generate trips for [today, today + 9 days]. Runs at 00:05 every day.
 * Skips the lazy-safety check that's already in searchSchedules.
 */
export const runDailyTripGeneration = async () => {
  const today = new Date();
  const start = today.toISOString().slice(0, 10);
  const endDate = new Date(today.getTime() + 9 * 24 * 60 * 60 * 1000);
  const end = endDate.toISOString().slice(0, 10);

  const range = dateRangeInclusive(start, end);
  console.log(
    `[cron] runDailyTripGeneration start=${start} end=${end} (${range.length} days)`,
  );

  try {
    const result = await ensureTripsForDateRange(start, end);
    console.log(
      `[cron] runDailyTripGeneration done created=${result.created} skipped=${result.skipped}`,
    );
    return result;
  } catch (err) {
    console.error("[cron] runDailyTripGeneration failed:", err);
    throw err;
  }
};

const registeredTasks = [];

export const startCronJobs = () => {
  // Materialize the next 10 days of trips every night at 00:05.
  const task = cron.schedule(
    "5 0 * * *",
    () => {
      runDailyTripGeneration().catch((err) => {
        console.error("[cron] daily trip generation error:", err);
      });
    },
    { scheduled: true, timezone: "UTC" },
  );
  registeredTasks.push(task);
  console.log("[cron] started: daily trip generation at 00:05 UTC");

  return registeredTasks;
};

export const stopCronJobs = () => {
  for (const t of registeredTasks) {
    try {
      t.stop();
    } catch (_) {
      // ignore
    }
  }
  registeredTasks.length = 0;
};