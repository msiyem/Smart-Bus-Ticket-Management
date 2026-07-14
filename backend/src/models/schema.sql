
-- mysql -u root -p your_database_name < schema.sql

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `bio` text,
  `role` enum('user','admin','operator') DEFAULT 'user',
  `is_verified` tinyint(1) DEFAULT '0',
  `is_active` tinyint(1) DEFAULT '1',
  `last_login_at` timestamp NULL DEFAULT NULL,
  `password_changed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP 
    ON UPDATE CURRENT_TIMESTAMP,
  `address` varchar(255) DEFAULT NULL,
  `provider` enum('local','google') DEFAULT 'local',
  `provider_id` varchar(255) DEFAULT NULL,

  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;



CREATE TABLE IF NOT EXISTS routes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    source_city VARCHAR(100) NOT NULL,
    destination_city VARCHAR(100) NOT NULL,
    
    distance_km DECIMAL(8,2),
    estimated_duration INT COMMENT 'Duration in minutes',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS buses (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    bus_number VARCHAR(50) NOT NULL UNIQUE,
    bus_type ENUM('AC', 'NON_AC', 'SLEEPER', 'VIP') DEFAULT 'NON_AC',

    capacity INT NOT NULL,

    operator_name VARCHAR(100),
    operator_id bigint NOT NULL,

    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE')
        DEFAULT 'ACTIVE',

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
);


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


CREATE TABLE IF NOT EXISTS schedules (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    route_id BIGINT NOT NULL,
    bus_id BIGINT NOT NULL,

    departure_time DATETIME NOT NULL,
    arrival_time DATETIME NOT NULL,

    fare DECIMAL(10,2) NOT NULL,

    status ENUM('SCHEDULED', 'COMPLETED', 'CANCELLED')
        DEFAULT 'SCHEDULED',

    repeat_days TINYINT UNSIGNED NOT NULL DEFAULT 127,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP,

    CONSTRAINT fk_schedules_route
        FOREIGN KEY (route_id)
        REFERENCES routes(id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_schedules_bus
        FOREIGN KEY (bus_id)
        REFERENCES buses(id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_schedules_repeat_days
        CHECK (repeat_days BETWEEN 0 AND 127)
);

CREATE TABLE IF NOT EXISTS bookings (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    user_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,
    
    booking_status ENUM('PENDING', 'CONFIRMED', 'CANCELLED') 
        DEFAULT 'PENDING',
        
    payment_status ENUM('UNPAID', 'PAID', 'REFUNDED') 
        DEFAULT 'UNPAID',
    
    total_amount DECIMAL(10,2) NOT NULL,
    
    booking_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_bookings_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE,
        
    CONSTRAINT fk_bookings_schedule
        FOREIGN KEY (schedule_id)
        REFERENCES schedules(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS  booking_seats (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,

    booking_id BIGINT NOT NULL,
    schedule_id BIGINT NOT NULL,

    seat_number VARCHAR(10) NOT NULL,

    price DECIMAL(10,2) NOT NULL,

    CONSTRAINT fk_booking_seats_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_seats_schedule
        FOREIGN KEY (schedule_id)
        REFERENCES schedules(id)
        ON DELETE CASCADE,

    CONSTRAINT unique_schedule_seat
        UNIQUE (schedule_id, seat_number)
);

CREATE TABLE IF NOT EXISTS payments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    booking_id BIGINT NOT NULL,
    
    amount DECIMAL(10,2) NOT NULL,
    
    payment_method ENUM(
        'CASH',
        'BKASH',
        'NAGAD',
        'CARD'
    ) NOT NULL,
    
    transaction_id VARCHAR(100) UNIQUE,
    
    status ENUM(
        'PENDING',
        'SUCCESS',
        'FAILED',
        'REFUNDED'
    ) DEFAULT 'PENDING',
    
    paid_at TIMESTAMP NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_payments_booking
        FOREIGN KEY (booking_id)
        REFERENCES bookings(id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    
    admin_id BIGINT NOT NULL,
    
    action VARCHAR(255) NOT NULL,
    
    table_name VARCHAR(100),
    
    record_id BIGINT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_admin_logs_admin
        FOREIGN KEY (admin_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
-- ----------------------------------------------------------------------
-- Add operator_id column to buses (idempotent ALTER).
-- ----------------------------------------------------------------------
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

CREATE INDEX idx_buses_operator_id ON buses (operator_id);

-- ----------------------------------------------------------------------
-- Trips: materialized instances of a recurring schedule for a given date.
-- The schedule defines the template (route + bus + times + weekday mask);
-- the trip is the actual bookable unit on a specific date, with its own
-- fare / status / cancellation.
-- ----------------------------------------------------------------------
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