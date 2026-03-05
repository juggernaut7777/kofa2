-- =============================================
-- KOFA Exchange (Blind Fulfillment) Migration
-- Run this against your Azure MySQL database
-- =============================================

-- Step 1: Add location + exchange columns to users table
ALTER TABLE users ADD COLUMN latitude FLOAT NULL;
ALTER TABLE users ADD COLUMN longitude FLOAT NULL;
ALTER TABLE users ADD COLUMN kofa_exchange_enabled INT DEFAULT 0;

-- Step 2: Create exchange_orders table
CREATE TABLE IF NOT EXISTS exchange_orders (
    id VARCHAR(36) PRIMARY KEY,
    original_order_id VARCHAR(36) NULL,
    seller_id VARCHAR(36) NOT NULL,
    supplier_id VARCHAR(36) NOT NULL,
    product_name VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    seller_price FLOAT NOT NULL,
    supplier_price FLOAT NOT NULL,
    kofa_fee FLOAT NOT NULL DEFAULT 0,
    seller_profit FLOAT NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    supplier_notified_at DATETIME NULL,
    supplier_responded_at DATETIME NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (seller_id) REFERENCES users(id),
    FOREIGN KEY (supplier_id) REFERENCES users(id),

    INDEX idx_exchange_seller (seller_id),
    INDEX idx_exchange_supplier (supplier_id),
    INDEX idx_exchange_status (status)
);

-- Step 3: Index for geo-queries on users
CREATE INDEX idx_users_location ON users (latitude, longitude);
CREATE INDEX idx_users_exchange ON users (kofa_exchange_enabled);
