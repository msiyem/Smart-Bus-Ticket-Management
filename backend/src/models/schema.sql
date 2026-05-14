
-- mysql -u root -p your_database_name < schema.sql

CREATE TABLE IF NOT EXISTS `users` (
  `id` bigint NOT NULL AUTO_INCREMENT,
  `name` varchar(100) DEFAULT NULL,
  `username` varchar(50) DEFAULT NULL,
  `email` varchar(150) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `profile_image` varchar(255) DEFAULT NULL,
  `bio` text,
  `role` enum('user','admin') DEFAULT 'user',
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


CREATE TABLE IF NOT EXISTS `refresh_tokens` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` bigint NOT NULL,
  `token` varchar(255) NOT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `session_id` varchar(255) NOT NULL,
  `max_age` datetime NOT NULL,
  `is_revoked` tinyint(1) DEFAULT '0',
  `replace_by_token` varchar(255) DEFAULT NULL,

  PRIMARY KEY (`id`),

  CONSTRAINT `refresh_tokens_ibfk_1`
    FOREIGN KEY (`user_id`)
    REFERENCES `users` (`id`)
    ON DELETE CASCADE
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
    
    status ENUM('ACTIVE', 'INACTIVE', 'MAINTENANCE') 
        DEFAULT 'ACTIVE',
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
        ON UPDATE CURRENT_TIMESTAMP
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
        ON DELETE RESTRICT
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