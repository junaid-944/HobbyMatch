-- HobbyMatch Database Schema
-- Create Database
CREATE DATABASE IF NOT EXISTS `hobbymatch`;
USE `hobbymatch`;

-- Users Table
CREATE TABLE `users` (
  `user_id` INT(11) NOT NULL AUTO_INCREMENT,
  `username` VARCHAR(50) NOT NULL UNIQUE,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `location` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Hobbies Table
CREATE TABLE `hobbies` (
  `hobby_id` INT(11) NOT NULL AUTO_INCREMENT,
  `hobby_name` VARCHAR(100) NOT NULL UNIQUE,
  PRIMARY KEY (`hobby_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- User-Hobby Relationship Table
CREATE TABLE `user_hobbies` (
  `user_id` INT(11) NOT NULL,
  `hobby_id` INT(11) NOT NULL,
  PRIMARY KEY (`user_id`, `hobby_id`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`user_id`) ON DELETE CASCADE,
  FOREIGN KEY (`hobby_id`) REFERENCES `hobbies`(`hobby_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- this is Matches Table 
CREATE TABLE `matches` (
  `match_id` INT(11) NOT NULL AUTO_INCREMENT,
  `user1_id` INT(11) NOT NULL,
  `user2_id` INT(11) NOT NULL,
  `matched_on` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`match_id`),
  FOREIGN KEY (`user1_id`) REFERENCES `users`(`user_id`),
  FOREIGN KEY (`user2_id`) REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Messages Table
CREATE TABLE `messages` (
  `message_id` INT(11) NOT NULL AUTO_INCREMENT,
  `sender_id` INT(11) NOT NULL,
  `receiver_id` INT(11) NOT NULL,
  `message_text` TEXT NOT NULL,
  `sent_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`message_id`),
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`user_id`),
  FOREIGN KEY (`receiver_id`) REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reviews Table
CREATE TABLE `reviews` (
  `review_id` INT(11) NOT NULL AUTO_INCREMENT,
  `reviewer_id` INT(11) NOT NULL,
  `reviewed_user_id` INT(11) NOT NULL,
  `rating` INT CHECK (`rating` BETWEEN 1 AND 5),
  `comments` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`review_id`),
  FOREIGN KEY (`reviewer_id`) REFERENCES `users`(`user_id`),
  FOREIGN KEY (`reviewed_user_id`) REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Events Table
CREATE TABLE `events` (
  `event_id` INT(11) NOT NULL AUTO_INCREMENT,
  `event_name` VARCHAR(100) NOT NULL,
  `event_date` DATE NOT NULL,
  `location` VARCHAR(100),
  `created_by` INT(11),
  PRIMARY KEY (`event_id`),
  FOREIGN KEY (`created_by`) REFERENCES `users`(`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ========== INSERT DATA ==========

-- Insert Users
INSERT INTO `users` (`username`, `email`, `password_hash`, `location`) VALUES
('junaid', 'junaid@example.com', 'hashedpassword1', 'London'),
('sarah', 'sarah@example.com', 'hashedpassword2', 'Manchester'),
('alex', 'alex@example.com', 'hashedpassword3', 'Birmingham'),
('emma', 'emma@example.com', 'hashedpassword4', 'Leeds'),
('mike', 'mike@example.com', 'hashedpassword5', 'Liverpool');

-- Insert Hobbies
INSERT INTO `hobbies` (`hobby_name`) VALUES
('Photography'),
('Cooking'),
('Cycling'),
('Gaming'),
('Painting'),
('Reading'),
('Hiking'),
('Music'),
('Gardening'),
('Traveling');

-- Insert User-Hobby Relationships
INSERT INTO `user_hobbies` (`user_id`, `hobby_id`) VALUES
(1, 1), (1, 4), (1, 10),
(2, 2), (2, 6), (2, 9),
(3, 3), (3, 4), (3, 7),
(4, 5), (4, 6), (4, 8),
(5, 2), (5, 4), (5, 10);

-- Insert Matches
INSERT INTO `matches` (`user1_id`, `user2_id`) VALUES
(1, 3),
(1, 5),
(2, 4);

-- Insert Messages
INSERT INTO `messages` (`sender_id`, `receiver_id`, `message_text`) VALUES
(1, 3, 'Hey Alex! Want to join for a gaming session this weekend?'),
(3, 1, 'Sure Junaid! Sounds fun.'),
(2, 4, 'Hi Emma, would you like to share some painting tips?');

-- Insert Reviews
INSERT INTO `reviews` (`reviewer_id`, `reviewed_user_id`, `rating`, `comments`) VALUES
(1, 3, 5, 'Alex is a great gaming partner!'),
(2, 4, 4, 'Emma shared amazing painting techniques.'),
(5, 1, 5, 'Junaid is very friendly and helpful.');

-- Insert Events
INSERT INTO `events` (`event_name`, `event_date`, `location`, `created_by`) VALUES
('Photography Meetup', '2025-12-15', 'London', 1),
('Cooking Workshop', '2025-12-20', 'Manchester', 2),
('Gaming Tournament', '2026-01-10', 'Birmingham', 3);
