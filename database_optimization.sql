-- KOFA DATABASE OPTIMIZATION SCRIPT
-- Run this in Azure SQL to significantly improve API performance
-- These indexes will speed up common queries

-- =====================================================
-- STEP 1: Add indexes for Products table
-- =====================================================
CREATE INDEX IX_products_user_id ON products(user_id);
CREATE INDEX IX_products_category ON products(category);
CREATE INDEX IX_products_name ON products(name);

-- =====================================================
-- STEP 2: Add indexes for Orders table
-- =====================================================
CREATE INDEX IX_orders_user_id ON orders(user_id);
CREATE INDEX IX_orders_status ON orders(status);
CREATE INDEX IX_orders_created_at ON orders(created_at DESC);
CREATE INDEX IX_orders_user_status ON orders(user_id, status);

-- =====================================================
-- STEP 3: Add indexes for Expenses table
-- =====================================================
CREATE INDEX IX_expenses_user_id ON expenses(user_id);
CREATE INDEX IX_expenses_category ON expenses(category);
CREATE INDEX IX_expenses_date ON expenses(date DESC);

-- =====================================================
-- STEP 4: Add indexes for Users table
-- =====================================================
CREATE INDEX IX_users_email ON users(email);
CREATE INDEX IX_users_phone ON users(phone);

-- =====================================================
-- VERIFICATION: Check indexes were created
-- =====================================================
SELECT 
    t.name AS TableName,
    i.name AS IndexName,
    i.type_desc AS IndexType
FROM sys.indexes i
INNER JOIN sys.tables t ON i.object_id = t.object_id
WHERE i.name LIKE 'IX_%'
ORDER BY t.name, i.name;

-- EXPECTED IMPROVEMENT:
-- - Dashboard API: 10+ seconds → < 1 second
-- - Products list: 2+ seconds → < 300ms
-- - Orders list: 2+ seconds → < 300ms
