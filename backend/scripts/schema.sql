-- Gaming Voice Chat Platform Database Schema
-- This schema supports user management, room creation, and channel organization

-- Drop tables in reverse order to handle foreign key constraints
DROP TABLE IF EXISTS user_channels;
DROP TABLE IF EXISTS room_members;
DROP TABLE IF EXISTS channels;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS users;

-- Users table: Core user authentication and profile data
CREATE TABLE users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Rooms table: Gaming voice chat rooms with access control
CREATE TABLE rooms (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    access_token VARCHAR(36) NOT NULL UNIQUE, -- UUID format
    creator_id INT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_access_token (access_token),
    INDEX idx_creator_id (creator_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Channels table: Voice channels within rooms (e.g., General, Team A, Team B)
CREATE TABLE channels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    room_id INT NOT NULL,
    is_main_lobby BOOLEAN DEFAULT FALSE,
    livekit_room_name VARCHAR(255) NOT NULL UNIQUE, -- Maps to LiveKit room identifier
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    INDEX idx_room_id (room_id),
    INDEX idx_livekit_room_name (livekit_room_name),
    INDEX idx_is_main_lobby (is_main_lobby)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Room Members table: Junction table tracking which users belong to which rooms
CREATE TABLE room_members (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    room_id INT NOT NULL,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_room (user_id, room_id),
    INDEX idx_user_id (user_id),
    INDEX idx_room_id (room_id),
    INDEX idx_is_active (is_active)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User Channels table: Tracking which users are currently connected to which channels
CREATE TABLE user_channels (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    channel_id INT NOT NULL,
    connected_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    livekit_participant_id VARCHAR(255), -- LiveKit participant identifier
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (channel_id) REFERENCES channels(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_channel (user_id, channel_id),
    INDEX idx_user_id (user_id),
    INDEX idx_channel_id (channel_id),
    INDEX idx_livekit_participant_id (livekit_participant_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data for development
-- Default test user
INSERT INTO users (username, email, password_hash) VALUES
('testuser', 'test@example.com', '$2a$10$dummy.hash.for.development.only');

-- Default test room
INSERT INTO rooms (name, access_token, creator_id) VALUES
('Gaming Lobby', 'test-room-uuid-12345', 1);

-- Default channels for the test room
INSERT INTO channels (name, room_id, is_main_lobby, livekit_room_name) VALUES
('General', 1, TRUE, 'room-1-general'),
('Team Alpha', 1, FALSE, 'room-1-team-alpha'),
('Team Beta', 1, FALSE, 'room-1-team-beta');

-- Add test user to test room
INSERT INTO room_members (user_id, room_id) VALUES (1, 1);