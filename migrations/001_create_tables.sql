-- KOFA Database Migration: Orders and Products Persistence
-- Run this script manually on Azure SQL (Kofa-db)
-- Date: 2024-12-29

-- =============================================
-- 1. PRODUCTS TABLE
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'products')
BEGIN
    CREATE TABLE products (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        vendor_id NVARCHAR(50) NOT NULL DEFAULT 'default',
        name NVARCHAR(255) NOT NULL,
        price_ngn DECIMAL(15, 2) NOT NULL,
        stock_level INT NOT NULL DEFAULT 0,
        description NVARCHAR(MAX) NULL,
        category NVARCHAR(100) NULL,
        image_url NVARCHAR(500) NULL,
        voice_tags NVARCHAR(500) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_products_vendor ON products(vendor_id);
    CREATE INDEX idx_products_category ON products(category);
    
    PRINT 'Created products table';
END
ELSE
    PRINT 'Products table already exists';
GO

-- =============================================
-- 2. ORDERS TABLE
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orders')
BEGIN
    CREATE TABLE orders (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        vendor_id NVARCHAR(50) NOT NULL DEFAULT 'default',
        customer_phone NVARCHAR(50) NOT NULL,
        total_amount DECIMAL(15, 2) NOT NULL,
        status NVARCHAR(20) NOT NULL DEFAULT 'pending',
        payment_ref NVARCHAR(100) NULL,
        platform NVARCHAR(50) NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        paid_at DATETIME2 NULL,
        fulfilled_at DATETIME2 NULL
    );
    
    CREATE INDEX idx_orders_vendor ON orders(vendor_id);
    CREATE INDEX idx_orders_status ON orders(status);
    CREATE INDEX idx_orders_customer ON orders(customer_phone);
    
    PRINT 'Created orders table';
END
ELSE
    PRINT 'Orders table already exists';
GO

-- =============================================
-- 3. ORDER ITEMS TABLE
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'order_items')
BEGIN
    CREATE TABLE order_items (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        order_id NVARCHAR(50) NOT NULL,
        product_id NVARCHAR(50) NOT NULL,
        product_name NVARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        price DECIMAL(15, 2) NOT NULL,
        total DECIMAL(15, 2) NOT NULL,
        FOREIGN KEY (order_id) REFERENCES orders(id)
    );
    
    CREATE INDEX idx_order_items_order ON order_items(order_id);
    
    PRINT 'Created order_items table';
END
ELSE
    PRINT 'Order_items table already exists';
GO

-- =============================================
-- 4. EXPENSES TABLE (if not exists)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'expenses')
BEGIN
    CREATE TABLE expenses (
        id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
        vendor_id NVARCHAR(50) NOT NULL DEFAULT 'default',
        description NVARCHAR(255) NOT NULL,
        amount DECIMAL(15, 2) NOT NULL,
        category NVARCHAR(50) NOT NULL,
        expense_date DATE NOT NULL,
        created_at DATETIME2 DEFAULT GETDATE()
    );
    
    CREATE INDEX idx_expenses_vendor ON expenses(vendor_id);
    CREATE INDEX idx_expenses_date ON expenses(expense_date);
    
    PRINT 'Created expenses table';
END
ELSE
    PRINT 'Expenses table already exists';
GO

-- =============================================
-- 5. BOT SETTINGS TABLE
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'bot_settings')
BEGIN
    CREATE TABLE bot_settings (
        vendor_id NVARCHAR(50) PRIMARY KEY,
        is_active BIT NOT NULL DEFAULT 1,
        style NVARCHAR(20) NOT NULL DEFAULT 'professional',
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    PRINT 'Created bot_settings table';
END
ELSE
    PRINT 'Bot_settings table already exists';
GO

-- =============================================
-- 6. VENDOR SETTINGS TABLE
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'vendor_settings')
BEGIN
    CREATE TABLE vendor_settings (
        vendor_id NVARCHAR(50) PRIMARY KEY,
        bank_name NVARCHAR(100) NULL,
        account_number NVARCHAR(20) NULL,
        account_name NVARCHAR(100) NULL,
        business_name NVARCHAR(100) NULL,
        is_whatsapp_connected BIT DEFAULT 0,
        is_instagram_connected BIT DEFAULT 0,
        is_tiktok_connected BIT DEFAULT 0,
        updated_at DATETIME2 DEFAULT GETDATE()
    );
    
    PRINT 'Created vendor_settings table';
END
ELSE
    PRINT 'Vendor_settings table already exists';
GO

PRINT '========================================';
PRINT 'Migration complete!';
PRINT '========================================';
