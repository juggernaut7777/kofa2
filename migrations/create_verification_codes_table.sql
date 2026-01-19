-- ============================================
-- KOFA: Create Verification Codes Table
-- Stores email verification codes in database
-- instead of in-memory (lost on Heroku restart)
-- ============================================

-- Create verification_codes table
CREATE TABLE verification_codes (
    id NVARCHAR(100) PRIMARY KEY,
    email NVARCHAR(255) NOT NULL UNIQUE,
    code NVARCHAR(10) NOT NULL,
    password NVARCHAR(255) NOT NULL,
    first_name NVARCHAR(100) NOT NULL,
    business_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT GETUTCDATE()
);

-- Index for faster lookups
CREATE INDEX IX_verification_codes_email ON verification_codes(email);

-- Clean up expired codes (optional - run periodically)
-- DELETE FROM verification_codes WHERE expires_at < GETUTCDATE();
