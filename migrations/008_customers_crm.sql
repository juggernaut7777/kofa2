-- 008_customers_crm.sql
-- Creates the customers CRM table and adds missing columns to orders table.
-- Run in Azure SQL Query Editor.

-- 1. Create customers table
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'customers') AND type = 'U')
BEGIN
    CREATE TABLE customers (
        id NVARCHAR(36) NOT NULL PRIMARY KEY,
        user_id NVARCHAR(36) NOT NULL,
        name NVARCHAR(255) NULL,
        phone NVARCHAR(20) NULL,
        email NVARCHAR(255) NULL,
        whatsapp_id NVARCHAR(50) NULL,
        instagram_id NVARCHAR(100) NULL,
        channel NVARCHAR(20) DEFAULT 'walkin',
        tags NVARCHAR(MAX) NULL,
        notes NVARCHAR(MAX) NULL,
        total_orders INT DEFAULT 0,
        total_spent FLOAT DEFAULT 0,
        last_order_date DATETIME2 NULL,
        created_at DATETIME2 DEFAULT GETDATE(),
        updated_at DATETIME2 DEFAULT GETDATE(),
        CONSTRAINT FK_customers_user FOREIGN KEY (user_id) REFERENCES users(id)
    );

    -- Indexes for fast lookups
    CREATE INDEX IX_customers_user_id ON customers(user_id);
    CREATE INDEX IX_customers_phone ON customers(phone);
    CREATE INDEX IX_customers_whatsapp_id ON customers(whatsapp_id);
    CREATE INDEX IX_customers_instagram_id ON customers(instagram_id);
    CREATE INDEX IX_customers_created_at ON customers(created_at);

    PRINT '✅ Created customers table';
END
ELSE
    PRINT '⏭️ customers table already exists';

-- 2. Add customer_name to orders (if missing)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'customer_name')
BEGIN
    ALTER TABLE orders ADD customer_name NVARCHAR(255) NULL;
    PRINT '✅ Added customer_name to orders';
END

-- 3. Add customer_id to orders (CRM link)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'customer_id')
BEGIN
    ALTER TABLE orders ADD customer_id NVARCHAR(36) NULL;
    CREATE INDEX IX_orders_customer_id ON orders(customer_id);
    PRINT '✅ Added customer_id to orders';
END

-- 4. Add payment_method to orders (if missing — fixes existing bug)
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'payment_method')
BEGIN
    ALTER TABLE orders ADD payment_method NVARCHAR(50) NULL;
    PRINT '✅ Added payment_method to orders';
END

PRINT '🎉 Migration 008 complete — CRM ready!';
