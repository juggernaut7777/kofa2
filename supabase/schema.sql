-- KOFA Commerce Engine - Supabase Schema (Multi-Vendor Edition)
-- Run this in Supabase SQL Editor: https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- ===========================================
-- VENDORS TABLE (Multi-Vendor Support)
-- ===========================================
CREATE TABLE IF NOT EXISTS vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    phone TEXT UNIQUE,
    email TEXT,
    business_name TEXT,
    business_address TEXT,
    bank_account_number TEXT,
    bank_name TEXT,
    bank_account_name TEXT,
    bot_style TEXT DEFAULT 'corporate' CHECK (bot_style IN ('corporate', 'street')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create default vendor for existing data
INSERT INTO vendors (id, name, phone, business_name) 
VALUES ('00000000-0000-0000-0000-000000000001', 'Default Vendor', '+234000000000', 'KOFA Store')
ON CONFLICT DO NOTHING;

-- ===========================================
-- PRODUCTS TABLE (with vendor_id)
-- ===========================================
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    name TEXT NOT NULL,
    price_ngn DECIMAL(12, 2) NOT NULL,
    stock_level INTEGER NOT NULL DEFAULT 0,
    description TEXT,
    category TEXT,
    image_url TEXT,
    voice_tags TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================================
-- ORDERS TABLE (with vendor_id)
-- ===========================================
CREATE TABLE IF NOT EXISTS orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    customer_phone TEXT,
    items JSONB NOT NULL DEFAULT '[]',
    total_amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'fulfilled', 'cancelled')),
    payment_ref TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================================
-- EXPENSES TABLE (with vendor_id)
-- ===========================================
CREATE TABLE IF NOT EXISTS expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    description TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    category TEXT,
    expense_type TEXT NOT NULL DEFAULT 'business' CHECK (expense_type IN ('business', 'personal')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================================
-- MANUAL SALES TABLE (with vendor_id)
-- ===========================================
CREATE TABLE IF NOT EXISTS manual_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    amount_ngn DECIMAL(12, 2) NOT NULL,
    channel TEXT NOT NULL DEFAULT 'other' CHECK (channel IN ('instagram', 'walk-in', 'whatsapp', 'other')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================================
-- DEVICE TOKENS (for Push Notifications)
-- ===========================================
CREATE TABLE IF NOT EXISTS device_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) NOT NULL,
    expo_token TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('ios', 'android')),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(vendor_id, expo_token)
);

-- ===========================================
-- OFFLINE SYNC QUEUE (for Offline Mode)
-- ===========================================
CREATE TABLE IF NOT EXISTS sync_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) NOT NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('create_order', 'create_sale', 'update_stock', 'create_expense')),
    payload JSONB NOT NULL,
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    synced_at TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- BOT STATE TRACKING (with vendor reference)
-- ===========================================
CREATE TABLE IF NOT EXISTS vendor_bot_state (
    vendor_id UUID REFERENCES vendors(id) PRIMARY KEY,
    is_paused BOOLEAN DEFAULT FALSE,
    paused_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================================
-- PLATFORM MESSAGE TRACKING (with vendor_id)
-- ===========================================
CREATE TABLE IF NOT EXISTS platform_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) DEFAULT '00000000-0000-0000-0000-000000000001',
    platform TEXT NOT NULL CHECK (platform IN ('whatsapp', 'instagram', 'tiktok')),
    customer_id TEXT NOT NULL,
    message_type TEXT CHECK (message_type IN ('customer', 'bot', 'vendor')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================================
-- VENDOR ACTIVITY TRACKING (for auto-silence)
-- ===========================================
CREATE TABLE IF NOT EXISTS vendor_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) NOT NULL,
    customer_id TEXT NOT NULL,
    platform TEXT NOT NULL,
    active_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    silenced_until TIMESTAMP WITH TIME ZONE
);

-- ===========================================
-- INDEXES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_products_vendor ON products(vendor_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_vendor ON orders(vendor_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer_phone ON orders(customer_phone);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_ref ON orders(payment_ref);
CREATE INDEX IF NOT EXISTS idx_expenses_vendor ON expenses(vendor_id);
CREATE INDEX IF NOT EXISTS idx_expenses_type ON expenses(expense_type);
CREATE INDEX IF NOT EXISTS idx_manual_sales_vendor ON manual_sales(vendor_id);
CREATE INDEX IF NOT EXISTS idx_manual_sales_channel ON manual_sales(channel);
CREATE INDEX IF NOT EXISTS idx_device_tokens_vendor ON device_tokens(vendor_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_vendor ON sync_queue(vendor_id);
CREATE INDEX IF NOT EXISTS idx_sync_queue_synced ON sync_queue(synced);
CREATE INDEX IF NOT EXISTS idx_platform_messages_vendor ON platform_messages(vendor_id);
CREATE INDEX IF NOT EXISTS idx_platform_messages_platform ON platform_messages(platform);
CREATE INDEX IF NOT EXISTS idx_platform_messages_created ON platform_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_vendor ON vendor_activity(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_activity_customer ON vendor_activity(customer_id);

-- ===========================================
-- AUTO-UPDATE TIMESTAMP TRIGGER
-- ===========================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers
DROP TRIGGER IF EXISTS update_vendors_updated_at ON vendors;
CREATE TRIGGER update_vendors_updated_at 
    BEFORE UPDATE ON vendors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at 
    BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orders_updated_at ON orders;
CREATE TRIGGER update_orders_updated_at 
    BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===========================================
-- SAMPLE DATA (Nigerian market optimized)
-- ===========================================
INSERT INTO products (vendor_id, name, price_ngn, stock_level, voice_tags, description, category) VALUES
    (
        '00000000-0000-0000-0000-000000000001',
        'Nike Air Max Red',
        45000,
        12,
        ARRAY['red canvas', 'red sneakers', 'canvas', 'kicks', 'gym shoes', 'running shoes', 'red kicks', 'sport shoe', 'nike red', 'air max'],
        'Premium Nike Air Max running shoes in red',
        'Footwear'
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'Adidas White Sneakers',
        38000,
        10,
        ARRAY['white canvas', 'canvas', 'white sneakers', 'white kicks', 'adidas white', 'clean white', 'all white', 'white shoe'],
        'Classic white Adidas sneakers',
        'Footwear'
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'Men Formal Shirt White',
        15000,
        20,
        ARRAY['packing shirt', 'button down', 'office wear', 'white shirt', 'formal shirt', 'top', 'office top', 'work shirt'],
        'Professional white formal shirt for office',
        'Clothing'
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'Designer Blue Jeans',
        25000,
        15,
        ARRAY['jeans', 'blue jeans', 'denim', 'trouser', 'jean trouser', 'pants', 'blue trouser', 'designer jeans'],
        'Premium designer blue denim jeans',
        'Clothing'
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'Black Leather Bag',
        35000,
        5,
        ARRAY['bag', 'leather bag', 'handbag', 'black bag', 'purse', 'side bag', 'hand bag', 'designer bag'],
        'Premium black leather handbag',
        'Accessories'
    ),
    (
        '00000000-0000-0000-0000-000000000001',
        'Plain Round Neck T-Shirt',
        8000,
        50,
        ARRAY['round neck', 'polo', 'top', 'plain tee', 't-shirt', 'tshirt', 'plain top', 'round neck top', 'casual top'],
        'Comfortable plain t-shirt for casual wear',
        'Clothing'
    )
ON CONFLICT DO NOTHING;

-- ===========================================
-- ATOMIC STOCK DECREMENT RPC FUNCTION
-- ===========================================
CREATE OR REPLACE FUNCTION decrement_product_stock(
    p_product_id UUID,
    p_vendor_id UUID,
    p_quantity INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    rows_affected INTEGER;
BEGIN
    -- Atomic update: check stock and decrement in one statement
    UPDATE products
    SET stock_level = stock_level - p_quantity,
        updated_at = NOW()
    WHERE id = p_product_id
      AND vendor_id = p_vendor_id
      AND stock_level >= p_quantity;

    GET DIAGNOSTICS rows_affected = ROW_COUNT;

    -- Return true if update succeeded (stock was available)
    RETURN rows_affected > 0;
END;
$$;

-- ===========================================
-- MIGRATION SCRIPT (for existing data)
-- Run this separately if you have existing data
-- ===========================================
-- UPDATE products SET vendor_id = '00000000-0000-0000-0000-000000000001' WHERE vendor_id IS NULL;
-- UPDATE orders SET vendor_id = '00000000-0000-0000-0000-000000000001' WHERE vendor_id IS NULL;
-- UPDATE expenses SET vendor_id = '00000000-0000-0000-0000-000000000001' WHERE vendor_id IS NULL;
-- UPDATE manual_sales SET vendor_id = '00000000-0000-0000-0000-000000000001' WHERE vendor_id IS NULL;
