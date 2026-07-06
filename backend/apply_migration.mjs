// Apply the 2026_06_19_trips_refactor.sql migration using the same
// connection pool the running backend uses. Idempotent — every step
// checks information_schema first.
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";
import mysql from "mysql2/promise";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sql = fs.readFileSync(
  path.join(__dirname, "migrations", "2026_06_19_trips_refactor.sql"),
  "utf8",
);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 3306,
  waitForConnections: true,
  connectionLimit: 1,
  multipleStatements: true,
});

async function main() {
  const conn = await pool.getConnection();
  try {
    console.log("[migrate] applying 2026_06_19_trips_refactor.sql ...");
    await conn.query(sql);

    const [cols] = await conn.query(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'booking_seats'
         AND COLUMN_NAME IN ('trip_id','schedule_id')`,
    );
    console.log("[migrate] booking_seats columns:", cols.map((r) => r.COLUMN_NAME));

    const [usersRole] = await conn.query(
      `SELECT COLUMN_TYPE FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'users' AND COLUMN_NAME='role'`,
    );
    console.log("[migrate] users.role =", usersRole[0]?.COLUMN_TYPE);

    const [trips] = await conn.query(`SELECT COUNT(*) AS c FROM trips`);
    console.log("[migrate] trips row count =", trips[0].c);

    console.log("[migrate] DONE");
  } finally {
    conn.release();
    await pool.end();
  }
}

main().catch((e) => {
  console.error("[migrate] FAILED:", e);
  process.exit(1);
});
