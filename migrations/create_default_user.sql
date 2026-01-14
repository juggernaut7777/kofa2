-- KOFA: Create Default Vendor User
-- Run this SQL in Azure Portal Query Editor to fix the FK constraint error

-- Create the default vendor user that products reference
IF NOT EXISTS (SELECT 1 FROM users WHERE id = '00000000-0000-0000-0000-000000000001')
BEGIN
    INSERT INTO users (id, phone, type, name, whatsapp_connected, auto_reply_enabled, business_name, business_address, bank_account_number, bank_code, created_at, updated_at)
    VALUES (
        '00000000-0000-0000-0000-000000000001',
        '+2348000000000',
        'vendor',
        'KOFA Demo Vendor',
        0,
        1,
        'KOFA Business',
        'Lagos, Nigeria',
        NULL,
        NULL,
        GETDATE(),
        GETDATE()
    );
    PRINT 'Default vendor user created successfully';
END
ELSE
BEGIN
    PRINT 'Default vendor user already exists';
END
GO
