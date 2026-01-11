-- KOFA Performance Optimization - Database Indexes
-- Add indexes for frequently queried fields to speed up database operations
-- Run this script manually against your Azure SQL database

-- ===================================================================
-- PRODUCTS TABLE INDEXES
-- ===================================================================

-- Index for product name searches (used in search_product, get_product_by_name)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_products_name' AND object_id = OBJECT_ID('products'))
BEGIN
    CREATE INDEX idx_products_name ON products(name);
    PRINT 'Created index: idx_products_name';
END
ELSE
BEGIN
    PRINT 'Index already exists: idx_products_name';
END;
GO

-- Composite index for user's products (most common query pattern)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_products_user_id' AND object_id = OBJECT_ID('products'))
BEGIN
    CREATE INDEX idx_products_user_id ON products(user_id) INCLUDE (name, price_ngn, stock_level, category);
    PRINT 'Created index: idx_products_user_id';
END
ELSE
BEGIN
    PRINT 'Index already exists: idx_products_user_id';
END;
GO

-- Index for category filtering (used in frontend filters)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_products_category' AND object_id = OBJECT_ID('products'))
BEGIN
    CREATE INDEX idx_products_category ON products(category);
    PRINT 'Created index: idx_products_category';
END
ELSE
BEGIN
    PRINT 'Index already exists: idx_products_category';
END;
GO

-- ===================================================================
-- ORDERS TABLE INDEXES
-- ===================================================================

-- Index for orders by created_at descending (dashboard default sort)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_created_at_desc' AND object_id = OBJECT_ID('orders'))
BEGIN
    CREATE INDEX idx_orders_created_at_desc ON orders(created_at DESC);
    PRINT 'Created index: idx_orders_created_at_desc';
END
ELSE
BEGIN
    PRINT 'Index already exists: idx_orders_created_at_desc';
END;
GO

-- Index for order status filtering
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_status' AND object_id = OBJECT_ID('orders'))
BEGIN
    CREATE INDEX idx_orders_status ON orders(status);
    PRINT 'Created index: idx_orders_status';
END
ELSE
BEGIN
    PRINT 'Index already exists: idx_orders_status';
END;
GO

-- Composite index for user's orders (most common query pattern)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_user_status' AND object_id = OBJECT_ID('orders'))
BEGIN
    CREATE INDEX idx_orders_user_status ON orders(user_id, status, created_at DESC);
    PRINT 'Created index: idx_orders_user_status';
END
ELSE
BEGIN
    PRINT 'Index already exists: idx_orders_user_status';
END;
GO

-- Index for customer phone lookups
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orders_customer_phone' AND object_id = OBJECT_ID('orders'))
BEGIN
    CREATE INDEX idx_orders_customer_phone ON orders(customer_phone);
    PRINT 'Created index: idx_orders_customer_phone';
END
ELSE
BEGIN
    PRINT 'Index already exists: idx_orders_customer_phone';
END;
GO

-- ===================================================================
-- ORDER_ITEMS TABLE INDEXES
-- ===================================================================

-- Index for order items by order_id (for eager loading)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_orderitems_order_id' AND object_id = OBJECT_ID('order_items'))
BEGIN
    CREATE INDEX idx_orderitems_order_id ON order_items(order_id);
    PRINT 'Created index: idx_orderitems_order_id';
END
ELSE
BEGIN
    PRINT 'Index already exists: idx_orderitems_order_id';
END;
GO

-- ===================================================================
-- UPDATE STATISTICS
-- ===================================================================
-- Update statistics to help the query optimizer make better decisions

UPDATE STATISTICS products;
UPDATE STATISTICS orders;
UPDATE STATISTICS order_items;
GO

PRINT '========================================';
PRINT 'Database indexes created successfully!';
PRINT 'Performance optimization complete.';
PRINT '========================================';
GO
