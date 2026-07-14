-- ============================================================
-- Fix: rename bookings/booking_seats.schedule_id -> trip_id
-- ============================================================
-- This migration makes the existing dev DB consistent with the
-- post-refactor code (bookings/booking_seats now reference trips.id
-- instead of schedules.id). It is idempotent: every step checks
-- information_schema first.

SET FOREIGN_KEY_CHECKS = 0;

-- 0. Drop operator_id FK on buses (it required operator_id NOT NULL,
-- but the post-refactor FK needs SET NULL -> column must be nullable).
SET @fk_exists := (
  SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'buses'
    AND CONSTRAINT_NAME = 'fk_buses_operator'
);
SET @sql := IF(@fk_exists > 0,
  'ALTER TABLE buses DROP FOREIGN KEY fk_buses_operator',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Make operator_id nullable so we can re-add the FK with SET NULL.
SET @col_nullable := (
  SELECT IS_NULLABLE FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'buses'
    AND COLUMN_NAME = 'operator_id'
);
SET @sql := IF(@col_nullable = 'NO',
  'ALTER TABLE buses MODIFY COLUMN operator_id BIGINT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 1a. Drop bookings.schedule_id FK.
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

-- 1b. Drop booking_seats.schedule_id FK.
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

-- 1c. Drop booking_seats.unique_schedule_seat index.
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

-- 2a. Rename bookings.schedule_id -> bookings.trip_id.
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

-- 2b. Rename booking_seats.schedule_id -> booking_seats.trip_id.
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

-- 3a. Re-add buses.operator_id -> bus_operators(id) FK with SET NULL.
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

-- 3b. Re-add bookings.trip_id -> trips(id) FK.
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

-- 3c. Re-add booking_seats.trip_id -> trips(id) FK.
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

-- 3d. Add booking_seats.unique_trip_seat index.
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

SET FOREIGN_KEY_CHECKS = 1;
