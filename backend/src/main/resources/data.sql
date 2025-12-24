-- ============================================
-- DATABASE SCHEMA & SEED DATA
-- ============================================

-- Drop all tables first to ensure clean state
DROP TABLE IF EXISTS order_items;
DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS cart_items;
DROP TABLE IF EXISTS wishlists;
DROP TABLE IF EXISTS logs;
DROP TABLE IF EXISTS product_sizes;
DROP TABLE IF EXISTS product_images;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS users;

-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ============================================
-- CATEGORIES TABLE
-- ============================================
CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- PRODUCTS TABLE (Updated)
-- ============================================
DROP TABLE IF EXISTS cart_items;
CREATE TABLE products (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DOUBLE NOT NULL,
    image VARCHAR(500),
    stock_quantity INT DEFAULT 0,
    category_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ============================================
-- PRODUCT_IMAGES TABLE
-- ============================================
CREATE TABLE product_images (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    display_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_images FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- PRODUCT_SIZES TABLE
-- ============================================
CREATE TABLE product_sizes (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    product_id BIGINT NOT NULL,
    size INT NOT NULL,
    stock_quantity INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_product_sizes FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_product_size (product_id, size)
);

-- ============================================
-- CART_ITEMS TABLE
-- ============================================
CREATE TABLE cart_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    product_id BIGINT NOT NULL,
    size INT,
    quantity INT NOT NULL DEFAULT 1,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_cart FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_cart FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE orders (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    order_number VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    total_amount DOUBLE NOT NULL,
    shipping_address VARCHAR(500),
    phone_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_orders FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ============================================
-- ORDER_ITEMS TABLE
-- ============================================
CREATE TABLE order_items (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    size INT,
    quantity INT NOT NULL,
    unit_price DOUBLE NOT NULL,
    subtotal DOUBLE NOT NULL,
    CONSTRAINT fk_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================
-- LOGS TABLE
-- ============================================
CREATE TABLE logs (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id BIGINT,
    description VARCHAR(500),
    ip_address VARCHAR(50),
    status VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_logs FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- ============================================
-- WISHLIST TABLE
-- ============================================
CREATE TABLE wishlists (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_wishlist FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_product_wishlist FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_product (user_id, product_id)
);

-- ============================================
-- INSERT CATEGORIES
-- ============================================
INSERT IGNORE INTO categories (name, description) VALUES
('Running Shoes', 'High-performance shoes for running enthusiasts'),
('Casual Shoes', 'Comfortable everyday wear'),
('Sports Shoes', 'Professional sports footwear'),
('Formal Shoes', 'Elegant shoes for formal occasions'),
('Kids Shoes', 'Comfortable and durable shoes for children');

-- ============================================
-- INSERT SAMPLE PRODUCTS (Nike Shoes from Example)
-- ============================================
INSERT IGNORE INTO products (name, description, price, image, stock_quantity, category_id) VALUES
('Wild Berry', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look. Solid rubber outsole for greater traction on different types of surfaces. Color Shown: Palomino/White/Wild Berry. Model: 553558-215.', 160.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike1.png', 50, 3),
('Air Force 1', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look. Solid rubber outsole for greater traction on different types of surfaces.', 169.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike2.png', 55, 3),
('Nike Cosmic', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 129.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike3.png', 60, 3),
('Retro High', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 119.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike4.png', 45, 3),
('Pegas Turbo', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 95.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike5.png', 70, 1),
('Nike Blazer', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 200.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike6.png', 40, 3),
('Nike Waffle', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 154.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike7.png', 35, 3),
('Nike Reax', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 123.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike8.png', 48, 1),
('Nike Dunk', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 119.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike9.png', 52, 3),
('Nike Air Penny', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 149.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike10.png', 38, 3),
('Court Vision', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 132.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike11.png', 44, 3),
('Nike Immortality', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 88.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike12.png', 65, 1),
('Nike Aura', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 201.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike13.png', 32, 3),
('Nike Zoom', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 104.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike14.png', 58, 1),
('Nike Delta', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 128.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike15.png', 46, 3),
('Nike React', 'Inspired by the original that debuted in 1985, the Air Jordan 1 Low delivers a clean, classic look. Encapsulated Air-Sole unit for lightweight cushioning. Genuine leather on the upper for durability and a premium look.', 157.00, 'https://notjustdev-dummy.s3.us-east-2.amazonaws.com/nike/nike16.png', 50, 3);

-- ============================================
-- INSERT PRODUCT SIZES (Nike Shoe Sizes)
-- ============================================
INSERT IGNORE INTO product_sizes (product_id, size, stock_quantity) VALUES
(1, 39, 8), (1, 40, 10), (1, 41, 12),
(2, 39, 10), (2, 40, 12), (2, 41, 12), (2, 42, 12), (2, 43, 9),
(3, 38, 12), (3, 39, 12), (3, 40, 12), (3, 41, 12), (3, 42, 12),
(4, 39, 10), (4, 40, 10), (4, 41, 10), (4, 42, 10), (4, 45, 5),
(5, 36, 15), (5, 40, 15), (5, 41, 15), (5, 42, 15), (5, 47, 8),
(6, 37, 10), (6, 38, 10), (6, 40, 10), (6, 41, 10), (6, 42, 10),
(7, 39, 10), (7, 40, 10), (7, 41, 10),
(8, 40, 10), (8, 41, 10), (8, 42, 10),
(9, 40, 12), (9, 41, 12), (9, 42, 14), (9, 43, 14),
(10, 37, 10), (10, 40, 10), (10, 41, 10), (10, 42, 10),
(11, 39, 10), (11, 41, 10), (11, 42, 12),
(12, 39, 15), (12, 40, 15), (12, 41, 15), (12, 45, 8),
(13, 39, 8), (13, 41, 8), (13, 42, 8), (13, 45, 8),
(14, 39, 14), (14, 41, 14), (14, 42, 14), (14, 43, 14), (14, 46, 2),
(15, 39, 12), (15, 41, 12), (15, 42, 12), (15, 46, 10),
(16, 39, 10), (16, 41, 14), (16, 43, 14), (16, 45, 12), (16, 46, 10);

-- ============================================
-- INSERT SAMPLE USERS
-- ============================================
INSERT IGNORE INTO users (username, email, password, first_name, last_name, phone, is_admin) VALUES
('admin', 'admin@shoestore.com', 'admin123', 'Admin', 'User', '+1234567890', TRUE),
('john_doe', 'john@example.com', 'john123', 'John', 'Doe', '+1234567891', FALSE),
('jane_smith', 'jane@example.com', 'jane123', 'Jane', 'Smith', '+1234567892', FALSE),
('mike_wilson', 'mike@example.com', 'mike123', 'Mike', 'Wilson', '+1234567893', FALSE),
('sarah_jones', 'sarah@example.com', 'sarah123', 'Sarah', 'Jones', '+1234567894', FALSE);

-- ============================================
-- INSERT SAMPLE ORDERS
-- ============================================
INSERT IGNORE INTO orders (user_id, order_number, status, total_amount, shipping_address, phone_number) VALUES
(2, 'ORD-001', 'COMPLETED', 225.00, '123 Main St, City, State 12345', '+1234567891'),
(3, 'ORD-002', 'SHIPPED', 305.00, '456 Oak Ave, Town, State 67890', '+1234567892'),
(4, 'ORD-003', 'PENDING', 140.00, '789 Pine Rd, Village, State 11111', '+1234567893'),
(5, 'ORD-004', 'COMPLETED', 185.00, '321 Elm St, City, State 22222', '+1234567894');

-- ============================================
-- INSERT ORDER ITEMS
-- ============================================
INSERT IGNORE INTO order_items (order_id, product_id, size, quantity, unit_price, subtotal) VALUES
(1, 1, 42, 1, 150.00, 150.00),
(1, 2, 40, 1, 75.00, 75.00),
(2, 3, 41, 1, 180.00, 180.00),
(2, 7, 40, 1, 95.00, 95.00),
(3, 4, 41, 1, 140.00, 140.00),
(4, 5, 32, 2, 65.00, 130.00),
(4, 10, 41, 1, 110.00, 110.00);

-- ============================================
-- INSERT SAMPLE LOGS
-- ============================================
INSERT IGNORE INTO logs (user_id, action, resource_type, resource_id, description, ip_address, status) VALUES
(1, 'LOGIN', 'USER', 1, 'Admin logged in', '192.168.1.1', 'SUCCESS'),
(2, 'PURCHASE', 'ORDER', 1, 'User purchased 2 items', '192.168.1.2', 'SUCCESS'),
(3, 'ADD_CART', 'CART_ITEM', 2, 'Added product to cart', '192.168.1.3', 'SUCCESS'),
(1, 'DELETE_PRODUCT', 'PRODUCT', 5, 'Admin deleted product', '192.168.1.1', 'SUCCESS'),
(4, 'VIEW_PRODUCT', 'PRODUCT', 3, 'User viewed product details', '192.168.1.4', 'SUCCESS'),
(2, 'UPDATE_PROFILE', 'USER', 2, 'User updated profile', '192.168.1.2', 'SUCCESS');
