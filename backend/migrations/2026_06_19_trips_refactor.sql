-- ============================================================
-- Migration: 2026_06_19_trips_refactor.sql
--
-- Purpose: introduce the trips table and retarget the booking
-- model from schedule_id -> trip_id. This migration is intended
-- to be applied once on the existing dev / production database
-- (schema.sql is CREATE-only and is not sufficient on its own
-- because MySQL has no ALTER TABLE ... RENAME CONSTRAINT IF
-- EXISTS).
--
-- Order of operations:
--   1. Ensure bus_operators + trips tables exist (idempotent).
--   2. Extend users.role enum to include 'operator' (idempotent).
--   3. Add operator_id column + FK to buses (idempotent).
--   4. Drop FK on bookings.schedule_id + booking_seats.schedule_id.
--   5. Rename columns schedule_id -> trip_id on both tables.
--   6. Re-add FKs targeting trips(id) with ON DELETE RESTRICT.
--   7. Replace unique_schedule_seat with unique_trip_seat.
--
-- Safe to re-run: every step checks information_schema first.
-- ============================================================

-- 1a. bus_operators
CREATE TABLE IF NOT EXISTS bus_operators (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30),
    email VARCHAR(150),
    address VARCHAR(255),
    owner_user_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_bus_operators_owner
        FOREIGN KEY (owner_user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
    UNIQUE KEY uniq_bus_operators_owner (owner_user_id)
);

-- 1b. trips
CREATE TABLE IF NOT EXISTS trips (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    schedule_id BIGINT NOT NULL,
    trip_date DATE NOT NULL,
    fare DECIMAL(10,2) NOT NULL,
    status ENUM('SCHEDULED', 'CANCELLED', 'COMPLETED')
        DEFAULT 'SCHEDULED',
    actual_departure_time DATETIME NULL,
    actual_arrival_time DATETIME NULL,
    cancelled_reason VARCHAR(255) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_trips_schedule
        FOREIGN KEY (schedule_id)
        REFERENCES schedules(id)
        ON DELETE CASCADE,
    UNIQUE KEY uniq_trips_schedule_date (schedule_id, trip_date),
    KEY idx_trips_trip_date (trip_date)
);

-- 2. Extend users.role enum to include 'operator' (idempotent).
SET @col_def := (
    SELECT COLUMN_TYPE FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'users'
      AND COLUMN_NAME = 'role'
);
SET @sql := IF(@col_def NOT LIKE '%operator%',
    "ALTER TABLE users MODIFY COLUMN `role` enum('user','admin','operator') DEFAULT 'user'",
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3a. Add operator_id column to buses (idempotent).
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'buses'
      AND COLUMN_NAME = 'operator_id'
);
SET @sql := IF(@col_exists = 0,
    'ALTER TABLE buses ADD COLUMN operator_id BIGINT NULL AFTER operator_name',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3b. Add fk_buses_operator (idempotent).
SET @fk_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'buses'
      AND CONSTRAINT_NAME = 'fk_buses_operator'
);
SET @sql := IF(@fk_exists = 0,
    'ALTER TABLE buses ADD CONSTRAINT fk_buses_operator FOREIGN KEY (operator_id) REFERENCES bus_operators(id) ON DELETE SET NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'buses'
      AND INDEX_NAME = 'idx_buses_operator_id'
);
SET @sql := IF(@idx_exists = 0,
    'CREATE INDEX idx_buses_operator_id ON buses (operator_id)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4a. Drop bookings.schedule_id FK if it still references schedules.
SET @fk_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND CONSTRAINT_NAME = 'fk_bookings_schedule'
);
SET @sql := IF(@fk_exists > 0,
    'ALTER TABLE bookings DROP FOREIGN KEY fk_bookings_schedule',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4b. Drop booking_seats.schedule_id FK if it still references schedules.
SET @fk_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'booking_seats'
      AND CONSTRAINT_NAME = 'fk_booking_seats_schedule'
);
SET @sql := IF(@fk_exists > 0,
    'ALTER TABLE booking_seats DROP FOREIGN KEY fk_booking_seats_schedule',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 4c. Drop booking_seats.unique_schedule_seat index.
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'booking_seats'
      AND INDEX_NAME = 'unique_schedule_seat'
);
SET @sql := IF(@idx_exists > 0,
    'ALTER TABLE booking_seats DROP INDEX unique_schedule_seat',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5a. Rename bookings.schedule_id -> bookings.trip_id if column still named schedule_id.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND COLUMN_NAME = 'schedule_id'
);
SET @sql := IF(@col_exists > 0,
    'ALTER TABLE bookings CHANGE COLUMN schedule_id trip_id BIGINT NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 5b. Rename booking_seats.schedule_id -> booking_seats.trip_id if column still named schedule_id.
SET @col_exists := (
    SELECT COUNT(*) FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'booking_seats'
      AND COLUMN_NAME = 'schedule_id'
);
SET @sql := IF(@col_exists > 0,
    'ALTER TABLE booking_seats CHANGE COLUMN schedule_id trip_id BIGINT NOT NULL',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6a. Re-add bookings.trip_id -> trips(id) FK.
SET @fk_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'bookings'
      AND CONSTRAINT_NAME = 'fk_bookings_trip'
);
SET @sql := IF(@fk_exists = 0,
    'ALTER TABLE bookings ADD CONSTRAINT fk_bookings_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE RESTRICT',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 6b. Re-add booking_seats.trip_id -> trips(id) FK.
SET @fk_exists := (
    SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'booking_seats'
      AND CONSTRAINT_NAME = 'fk_booking_seats_trip'
);
SET @sql := IF(@fk_exists = 0,
    'ALTER TABLE booking_seats ADD CONSTRAINT fk_booking_seats_trip FOREIGN KEY (trip_id) REFERENCES trips(id) ON DELETE RESTRICT',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 7. Replace unique_schedule_seat with unique_trip_seat on booking_seats.
SET @idx_exists := (
    SELECT COUNT(*) FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'booking_seats'
      AND INDEX_NAME = 'unique_trip_seat'
);
SET @sql := IF(@idx_exists = 0,
    'ALTER TABLE booking_seats ADD CONSTRAINT unique_trip_seat UNIQUE (trip_id, seat_number)',
    'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
