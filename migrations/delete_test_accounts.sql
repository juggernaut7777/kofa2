-- Delete test accounts created during debugging
-- Run this in Azure SQL Query Editor

-- First check what users exist
SELECT id, email, business_name FROM users;

-- Delete test users (these were created during API testing)
DELETE FROM users WHERE email = 'test@kofa.app';
DELETE FROM users WHERE email = 'david@kofa.app';

-- Verify they're deleted
SELECT id, email, business_name FROM users;

PRINT 'Test accounts deleted successfully. You can now create your own account.';
