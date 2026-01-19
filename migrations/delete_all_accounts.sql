-- ============================================
-- KOFA: Delete All Test Accounts
-- Run this in Azure SQL to clear all users
-- ============================================

-- WARNING: This will delete ALL data!
-- Make sure you want to do this before running.

-- Step 1: Delete expenses (references users)
DELETE FROM expenses;

-- Step 2: Delete orders (references users)
DELETE FROM orders;

-- Step 3: Delete products (references users)
DELETE FROM products;

-- Step 4: Delete users
DELETE FROM users;

-- Verify deletion
SELECT 
    (SELECT COUNT(*) FROM users) as users_count,
    (SELECT COUNT(*) FROM products) as products_count,
    (SELECT COUNT(*) FROM orders) as orders_count,
    (SELECT COUNT(*) FROM expenses) as expenses_count;

-- After running this, all accounts are deleted.
-- You can now create a fresh account with email verification.
