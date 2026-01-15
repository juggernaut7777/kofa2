-- Migration: Add password_hash and first_name columns to users table
-- Run this in Azure Portal -> Query Editor BEFORE deploying the new code

-- Add password_hash column for permanent password storage
ALTER TABLE users ADD password_hash NVARCHAR(255) NULL;

-- Add first_name column for user's first name
ALTER TABLE users ADD first_name NVARCHAR(100) NULL;

-- Verify columns were added
SELECT COLUMN_NAME, DATA_TYPE, IS_NULLABLE 
FROM INFORMATION_SCHEMA.COLUMNS 
WHERE TABLE_NAME = 'users' 
AND COLUMN_NAME IN ('password_hash', 'first_name');
