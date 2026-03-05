-- KOFA Platform Upgrade Migration
-- Adds: product_variants, audit_logs, refresh_tokens tables
-- Adds: new columns to products, orders, order_items, users
-- Compatible with SQL Server and MySQL

-- =============================================
-- 1. Product Variants table (Size S/M/L, Color Red/Blue)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'product_variants')
CREATE TABLE product_variants (
    id NVARCHAR(36) PRIMARY KEY,
    product_id NVARCHAR(36) NOT NULL,
    variant_type NVARCHAR(50) NOT NULL,     -- "size", "color", "material"
    variant_value NVARCHAR(100) NOT NULL,   -- "S", "M", "L", "Red"
    sku NVARCHAR(100) NULL,
    price_adjustment FLOAT DEFAULT 0,       -- +/- from base price
    stock_level INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_variant_product FOREIGN KEY (product_id) REFERENCES products(id)
);

-- =============================================
-- 2. Audit Log table (who changed what, when)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
CREATE TABLE audit_logs (
    id NVARCHAR(36) PRIMARY KEY,
    user_id NVARCHAR(36) NOT NULL,
    action NVARCHAR(100) NOT NULL,          -- "product.create", "order.update"
    entity_type NVARCHAR(50) NOT NULL,      -- "product", "order", "expense"
    entity_id NVARCHAR(36) NULL,
    details NVARCHAR(MAX) NULL,             -- JSON with change details
    ip_address NVARCHAR(45) NULL,
    created_at DATETIME DEFAULT GETDATE()
);

CREATE INDEX IX_audit_user ON audit_logs(user_id);
CREATE INDEX IX_audit_action ON audit_logs(action);
CREATE INDEX IX_audit_created ON audit_logs(created_at);

-- =============================================
-- 3. Refresh Tokens table (JWT token rotation)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'refresh_tokens')
CREATE TABLE refresh_tokens (
    id NVARCHAR(36) PRIMARY KEY,
    user_id NVARCHAR(36) NOT NULL,
    token_hash NVARCHAR(255) NOT NULL UNIQUE,
    expires_at DATETIME NOT NULL,
    revoked INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    last_used_at DATETIME NULL,
    CONSTRAINT FK_refresh_user FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IX_refresh_user ON refresh_tokens(user_id);

-- =============================================
-- 4. New columns on existing tables
-- =============================================

-- Products: cost_price for accurate P&L, has_variants flag
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'cost_price')
    ALTER TABLE products ADD cost_price FLOAT NULL;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'has_variants')
    ALTER TABLE products ADD has_variants INT DEFAULT 0;

-- Orders: multi-currency support, sales channel tracking
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'currency')
    ALTER TABLE orders ADD currency NVARCHAR(3) DEFAULT 'NGN';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'exchange_rate')
    ALTER TABLE orders ADD exchange_rate FLOAT DEFAULT 1.0;

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'channel')
    ALTER TABLE orders ADD channel NVARCHAR(20) DEFAULT 'whatsapp';

-- Order Items: variant info
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_items') AND name = 'variant_info')
    ALTER TABLE order_items ADD variant_info NVARCHAR(255) NULL;

-- Users: default currency preference
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'default_currency')
    ALTER TABLE users ADD default_currency NVARCHAR(3) DEFAULT 'NGN';

PRINT 'KOFA platform upgrade migration completed successfully.';
