-- MySQL Setup Script for Shoestore Database
-- Run this in MySQL command line or MySQL Workbench
-- Date: November 27, 2025

-- ============================================
-- CREATE DATABASE
-- ============================================
CREATE DATABASE IF NOT EXISTS shoestore 
CHARACTER SET utf8mb4 
COLLATE utf8mb4_unicode_ci;

-- ============================================
-- CREATE USER
-- ============================================
CREATE USER IF NOT EXISTS 'shoestore_user'@'localhost' 
IDENTIFIED BY 'shoestorepass123.';

-- ============================================
-- GRANT PRIVILEGES
-- ============================================
GRANT ALL PRIVILEGES ON shoestore.* 
TO 'shoestore_user'@'localhost';

FLUSH PRIVILEGES;

-- ============================================
-- VERIFY SETUP
-- ============================================
SELECT VERSION() AS MySQLVersion;
SELECT User, Host FROM mysql.user WHERE User='shoestore_user';
SHOW DATABASES LIKE 'shoestore';

-- ============================================
-- OPTIONAL: Sample Data (after Spring Boot creates tables)
-- ============================================
-- Uncomment and run these after backend starts for first time:

/*
USE shoestore;

-- Insert sample products
INSERT INTO products (name, description, price, image) VALUES
('Running Shoes', 'Comfortable running shoes for daily use', 50.0, 'shoe1.jpg'),
('Sneakers', 'Casual sneakers for everyday wear', 40.0, 'shoe2.jpg'),
('Leather Boots', 'Premium leather boots for style', 80.0, 'boots.jpg');

-- View the data
SELECT * FROM products;
SELECT * FROM cart_items;
*/

-- ============================================
-- NOTES
-- ============================================
-- 
-- After running this script:
-- 1. Start your Spring Boot backend
-- 2. Backend will auto-create tables:
--    - products
--    - cart_items
--    - product_images
--    - product_sizes
-- 3. You can view these tables with:
--    USE shoestore;
--    SHOW TABLES;
--
-- ============================================
