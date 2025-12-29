-- KOFA Tables - Run ONE section at a time in Azure Query Editor
-- Copy and run each section separately

-- ========== SECTION 1: Products Table ==========
CREATE TABLE products (
    id NVARCHAR(50) PRIMARY KEY,
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
