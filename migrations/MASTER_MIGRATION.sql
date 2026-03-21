-- ============================================================
-- KOFA MASTER MIGRATION — Azure SQL (T-SQL)
-- Run this entire script in Azure Query Editor
-- It is fully IDEMPOTENT: safe to run multiple times
-- Last updated: 2026-03-21
-- ============================================================
-- HOW TO RUN:
--   1. Go to portal.azure.com
--   2. Open your SQL Database: Kofa-db
--   3. Click "Query editor (preview)" in the left menu
--   4. Paste this entire file and click Run
-- ============================================================

PRINT '======== KOFA MASTER MIGRATION STARTING ========';

-- ============================================================
-- TABLE 1: users
-- (Core user/vendor accounts)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
BEGIN
    CREATE TABLE users (
        id            VARCHAR(36)   NOT NULL PRIMARY KEY,
        phone         VARCHAR(20)   NULL,
        email         VARCHAR(255)  NULL,
        password_hash VARCHAR(255)  NULL,
        first_name    VARCHAR(100)  NULL,
        business_name VARCHAR(255)  NULL,
        business_address VARCHAR(MAX) NULL,
        bank_name     VARCHAR(100)  NULL,
        bank_account_number VARCHAR(50) NULL,
        bank_account_name   VARCHAR(255) NULL,
        payment_method      VARCHAR(50)  DEFAULT 'bank_transfer',
        bot_style     VARCHAR(20)   DEFAULT 'corporate',
        subscription_tier   VARCHAR(20)  DEFAULT 'free',
        subscription_expires_at DATETIME NULL,
        -- WhatsApp Business API
        whatsapp_phone_id    VARCHAR(100) NULL,
        whatsapp_access_token VARCHAR(500) NULL,
        whatsapp_business_id VARCHAR(100) NULL,
        whatsapp_connected   INT DEFAULT 0,
        -- Instagram API
        instagram_access_token VARCHAR(500) NULL,
        instagram_page_id      VARCHAR(100) NULL,
        instagram_connected    INT DEFAULT 0,
        is_active     INT DEFAULT 1,
        created_at    DATETIME DEFAULT GETDATE(),
        updated_at    DATETIME DEFAULT GETDATE()
    );
    CREATE INDEX IX_users_phone ON users(phone);
    CREATE INDEX IX_users_email ON users(email);
    CREATE INDEX IX_users_tier  ON users(subscription_tier);
    PRINT '  [CREATE] users table';
END
ELSE BEGIN
    -- Add any missing columns to users
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'business_address')
        ALTER TABLE users ADD business_address VARCHAR(MAX) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'bank_name')
        ALTER TABLE users ADD bank_name VARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'bank_account_number')
        ALTER TABLE users ADD bank_account_number VARCHAR(50) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'bank_account_name')
        ALTER TABLE users ADD bank_account_name VARCHAR(255) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'payment_method')
        ALTER TABLE users ADD payment_method VARCHAR(50) DEFAULT 'bank_transfer';
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'bot_style')
        ALTER TABLE users ADD bot_style VARCHAR(20) DEFAULT 'corporate';
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'subscription_tier')
        ALTER TABLE users ADD subscription_tier VARCHAR(20) DEFAULT 'free';
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'subscription_expires_at')
        ALTER TABLE users ADD subscription_expires_at DATETIME NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'whatsapp_phone_id')
        ALTER TABLE users ADD whatsapp_phone_id VARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'whatsapp_access_token')
        ALTER TABLE users ADD whatsapp_access_token VARCHAR(500) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'whatsapp_business_id')
        ALTER TABLE users ADD whatsapp_business_id VARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'whatsapp_connected')
        ALTER TABLE users ADD whatsapp_connected INT DEFAULT 0;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'instagram_access_token')
        ALTER TABLE users ADD instagram_access_token VARCHAR(500) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'instagram_page_id')
        ALTER TABLE users ADD instagram_page_id VARCHAR(100) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'instagram_connected')
        ALTER TABLE users ADD instagram_connected INT DEFAULT 0;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'is_active')
        ALTER TABLE users ADD is_active INT DEFAULT 1;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'updated_at')
        ALTER TABLE users ADD updated_at DATETIME DEFAULT GETDATE();
    PRINT '  [OK] users table — columns verified/added';
END
GO

-- ============================================================
-- TABLE 2: products
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'products')
BEGIN
    CREATE TABLE products (
        id          VARCHAR(36)  NOT NULL PRIMARY KEY,
        user_id     VARCHAR(36)  NOT NULL,
        name        VARCHAR(255) NOT NULL,
        price_ngn   FLOAT        NOT NULL,
        cost_price  FLOAT        NULL,
        stock_level INT          NOT NULL DEFAULT 0,
        has_variants INT         DEFAULT 0,
        description VARCHAR(MAX) NULL,
        category    VARCHAR(100) NULL,
        image_url   VARCHAR(MAX) NULL,
        voice_tags  VARCHAR(MAX) NULL,
        created_at  DATETIME     DEFAULT GETDATE(),
        updated_at  DATETIME     DEFAULT GETDATE(),
        CONSTRAINT FK_products_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_products_user ON products(user_id);
    CREATE INDEX IX_products_category ON products(category);
    PRINT '  [CREATE] products table';
END
ELSE BEGIN
    -- Handle migration from vendor_id to user_id
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'user_id')
    BEGIN
        ALTER TABLE products ADD user_id VARCHAR(36) NULL;
        -- Use EXEC() so T-SQL doesn't parse vendor_id at compile time
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'vendor_id')
            EXEC('UPDATE products SET user_id = vendor_id WHERE user_id IS NULL');
        PRINT '  [MIGRATE] products: added user_id (copied from vendor_id)';
    END
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'cost_price')
        ALTER TABLE products ADD cost_price FLOAT NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'has_variants')
        ALTER TABLE products ADD has_variants INT DEFAULT 0;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'voice_tags')
        ALTER TABLE products ADD voice_tags VARCHAR(MAX) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('products') AND name = 'updated_at')
        ALTER TABLE products ADD updated_at DATETIME DEFAULT GETDATE();
    PRINT '  [OK] products table — columns verified/added';
END
GO

-- ============================================================
-- TABLE 3: product_variants
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'product_variants')
BEGIN
    CREATE TABLE product_variants (
        id              VARCHAR(36)  NOT NULL PRIMARY KEY,
        product_id      VARCHAR(36)  NOT NULL,
        variant_type    VARCHAR(50)  NOT NULL,
        variant_value   VARCHAR(100) NOT NULL,
        sku             VARCHAR(100) NULL,
        price_adjustment FLOAT       DEFAULT 0,
        stock_level     INT          DEFAULT 0,
        created_at      DATETIME     DEFAULT GETDATE(),
        CONSTRAINT FK_variant_product FOREIGN KEY (product_id) REFERENCES products(id)
    );
    CREATE INDEX IX_variants_product ON product_variants(product_id);
    PRINT '  [CREATE] product_variants table';
END
ELSE
    PRINT '  [OK] product_variants table';
GO

-- ============================================================
-- TABLE 4: orders
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'orders')
BEGIN
    CREATE TABLE orders (
        id              VARCHAR(36)  NOT NULL PRIMARY KEY,
        user_id         VARCHAR(36)  NOT NULL,
        customer_name   VARCHAR(255) NULL,
        customer_phone  VARCHAR(20)  NOT NULL DEFAULT '',
        customer_id     VARCHAR(36)  NULL,
        total_amount    FLOAT        NOT NULL,
        currency        VARCHAR(3)   DEFAULT 'NGN',
        exchange_rate   FLOAT        DEFAULT 1.0,
        status          VARCHAR(20)  NOT NULL DEFAULT 'pending',
        payment_ref     VARCHAR(100) NULL,
        payment_method  VARCHAR(50)  NULL,
        notes           VARCHAR(MAX) NULL,
        channel         VARCHAR(20)  DEFAULT 'whatsapp',
        sales_channel   VARCHAR(20)  NULL,
        created_at      DATETIME     DEFAULT GETDATE(),
        updated_at      DATETIME     DEFAULT GETDATE(),
        paid_at         DATETIME     NULL,
        fulfilled_at    DATETIME     NULL,
        CONSTRAINT FK_orders_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_orders_user    ON orders(user_id);
    CREATE INDEX IX_orders_status  ON orders(status);
    CREATE INDEX IX_orders_phone   ON orders(customer_phone);
    CREATE INDEX IX_orders_created ON orders(created_at);
    PRINT '  [CREATE] orders table';
END
ELSE BEGIN
    -- Handle migration from vendor_id to user_id
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'user_id')
    BEGIN
        ALTER TABLE orders ADD user_id VARCHAR(36) NULL;
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'vendor_id')
            EXEC('UPDATE orders SET user_id = vendor_id WHERE user_id IS NULL');
        PRINT '  [MIGRATE] orders: added user_id (copied from vendor_id)';
    END
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'customer_name')
        ALTER TABLE orders ADD customer_name VARCHAR(255) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'customer_id')
        ALTER TABLE orders ADD customer_id VARCHAR(36) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'payment_method')
        ALTER TABLE orders ADD payment_method VARCHAR(50) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'currency')
        ALTER TABLE orders ADD currency VARCHAR(3) DEFAULT 'NGN';
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'exchange_rate')
        ALTER TABLE orders ADD exchange_rate FLOAT DEFAULT 1.0;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'notes')
        ALTER TABLE orders ADD notes VARCHAR(MAX) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'channel')
        ALTER TABLE orders ADD channel VARCHAR(20) DEFAULT 'whatsapp';
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'sales_channel')
        ALTER TABLE orders ADD sales_channel VARCHAR(20) NULL;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('orders') AND name = 'updated_at')
        ALTER TABLE orders ADD updated_at DATETIME DEFAULT GETDATE();
    PRINT '  [OK] orders table — columns verified/added';
END
GO

-- ============================================================
-- TABLE 5: order_items
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'order_items')
BEGIN
    CREATE TABLE order_items (
        id           VARCHAR(36)  NOT NULL PRIMARY KEY,
        order_id     VARCHAR(36)  NOT NULL,
        product_id   VARCHAR(36)  NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        variant_info VARCHAR(255) NULL,
        quantity     INT          NOT NULL,
        price        FLOAT        NOT NULL,
        total        FLOAT        NOT NULL,
        CONSTRAINT FK_items_order   FOREIGN KEY (order_id)   REFERENCES orders(id),
        CONSTRAINT FK_items_product FOREIGN KEY (product_id) REFERENCES products(id)
    );
    CREATE INDEX IX_items_order ON order_items(order_id);
    PRINT '  [CREATE] order_items table';
END
ELSE BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('order_items') AND name = 'variant_info')
        ALTER TABLE order_items ADD variant_info VARCHAR(255) NULL;
    PRINT '  [OK] order_items table — columns verified';
END
GO

-- ============================================================
-- TABLE 6: expenses
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'expenses')
BEGIN
    CREATE TABLE expenses (
        id            VARCHAR(36)  NOT NULL PRIMARY KEY,
        user_id       VARCHAR(36)  NOT NULL,
        amount        FLOAT        NOT NULL,
        description   VARCHAR(500) NOT NULL,
        category      VARCHAR(100) NOT NULL DEFAULT 'misc',
        expense_type  VARCHAR(50)  NOT NULL DEFAULT 'BUSINESS',
        date          DATETIME     DEFAULT GETDATE(),
        receipt_image_url VARCHAR(MAX) NULL,
        created_at    DATETIME     DEFAULT GETDATE(),
        CONSTRAINT FK_expenses_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_expenses_user ON expenses(user_id);
    CREATE INDEX IX_expenses_date ON expenses(date);
    PRINT '  [CREATE] expenses table';
END
ELSE BEGIN
    -- Handle migration from vendor_id to user_id
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('expenses') AND name = 'user_id')
    BEGIN
        ALTER TABLE expenses ADD user_id VARCHAR(36) NULL;
        IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('expenses') AND name = 'vendor_id')
            EXEC('UPDATE expenses SET user_id = vendor_id WHERE user_id IS NULL');
        PRINT '  [MIGRATE] expenses: added user_id';
    END
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('expenses') AND name = 'expense_type')
        ALTER TABLE expenses ADD expense_type VARCHAR(50) NOT NULL DEFAULT 'BUSINESS';
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('expenses') AND name = 'date')
        ALTER TABLE expenses ADD date DATETIME DEFAULT GETDATE();
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('expenses') AND name = 'receipt_image_url')
        ALTER TABLE expenses ADD receipt_image_url VARCHAR(MAX) NULL;
    PRINT '  [OK] expenses table — columns verified/added';
END
GO

-- ============================================================
-- TABLE 7: verification_codes
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'verification_codes')
BEGIN
    CREATE TABLE verification_codes (
        id            VARCHAR(36)  NOT NULL PRIMARY KEY,
        email         VARCHAR(255) NOT NULL UNIQUE,
        code          VARCHAR(10)  NOT NULL,
        password      VARCHAR(255) NOT NULL,
        first_name    VARCHAR(100) NOT NULL,
        business_name VARCHAR(255) NOT NULL,
        phone         VARCHAR(50)  NULL,
        expires_at    DATETIME     NOT NULL,
        created_at    DATETIME     DEFAULT GETDATE()
    );
    CREATE INDEX IX_vcodes_email ON verification_codes(email);
    PRINT '  [CREATE] verification_codes table';
END
ELSE
    PRINT '  [OK] verification_codes table';
GO

-- ============================================================
-- TABLE 8: credit_sales
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'credit_sales')
BEGIN
    CREATE TABLE credit_sales (
        id                VARCHAR(36)  NOT NULL PRIMARY KEY,
        user_id           VARCHAR(36)  NOT NULL,
        customer_name     VARCHAR(255) NOT NULL,
        customer_phone    VARCHAR(20)  NULL,
        amount            FLOAT        NOT NULL,
        amount_paid       FLOAT        DEFAULT 0,
        items_description VARCHAR(MAX) NULL,
        due_date          DATETIME     NULL,
        status            VARCHAR(20)  NOT NULL DEFAULT 'unpaid',
        notes             VARCHAR(MAX) NULL,
        created_at        DATETIME     DEFAULT GETDATE(),
        paid_at           DATETIME     NULL,
        updated_at        DATETIME     DEFAULT GETDATE(),
        CONSTRAINT FK_credit_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_credit_user    ON credit_sales(user_id);
    CREATE INDEX IX_credit_status  ON credit_sales(status);
    CREATE INDEX IX_credit_phone   ON credit_sales(customer_phone);
    CREATE INDEX IX_credit_created ON credit_sales(created_at);
    PRINT '  [CREATE] credit_sales table';
END
ELSE BEGIN
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('credit_sales') AND name = 'amount_paid')
        ALTER TABLE credit_sales ADD amount_paid FLOAT DEFAULT 0;
    IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('credit_sales') AND name = 'due_date')
        ALTER TABLE credit_sales ADD due_date DATETIME NULL;
    PRINT '  [OK] credit_sales table';
END
GO

-- ============================================================
-- TABLE 9: notifications
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    CREATE TABLE notifications (
        id         VARCHAR(36)  NOT NULL PRIMARY KEY,
        user_id    VARCHAR(36)  NOT NULL,
        type       VARCHAR(50)  NOT NULL,
        title      VARCHAR(255) NOT NULL,
        message    VARCHAR(MAX) NOT NULL,
        is_read    INT          DEFAULT 0,
        link       VARCHAR(255) NULL,
        created_at DATETIME     DEFAULT GETDATE(),
        CONSTRAINT FK_notif_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_notif_user    ON notifications(user_id);
    CREATE INDEX IX_notif_type    ON notifications(type);
    CREATE INDEX IX_notif_read    ON notifications(is_read);
    CREATE INDEX IX_notif_created ON notifications(created_at);
    PRINT '  [CREATE] notifications table';
END
ELSE
    PRINT '  [OK] notifications table';
GO

-- ============================================================
-- TABLE 10: ai_conversations
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ai_conversations')
BEGIN
    CREATE TABLE ai_conversations (
        id              VARCHAR(36)  NOT NULL PRIMARY KEY,
        conversation_id VARCHAR(36)  NOT NULL UNIQUE,
        user_id         VARCHAR(36)  NOT NULL,
        messages        VARCHAR(MAX) NOT NULL DEFAULT '[]',
        created_at      DATETIME     DEFAULT GETDATE(),
        updated_at      DATETIME     DEFAULT GETDATE(),
        CONSTRAINT FK_aiconv_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_aiconv_conv ON ai_conversations(conversation_id);
    CREATE INDEX IX_aiconv_user ON ai_conversations(user_id);
    PRINT '  [CREATE] ai_conversations table';
END
ELSE
    PRINT '  [OK] ai_conversations table';
GO

-- ============================================================
-- TABLE 11: customers (CRM)
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'customers')
BEGIN
    CREATE TABLE customers (
        id              VARCHAR(36)  NOT NULL PRIMARY KEY,
        user_id         VARCHAR(36)  NOT NULL,
        name            VARCHAR(255) NULL,
        phone           VARCHAR(20)  NULL,
        email           VARCHAR(255) NULL,
        whatsapp_id     VARCHAR(50)  NULL,
        instagram_id    VARCHAR(100) NULL,
        channel         VARCHAR(20)  DEFAULT 'walkin',
        tags            VARCHAR(MAX) NULL,
        notes           VARCHAR(MAX) NULL,
        total_orders    INT          DEFAULT 0,
        total_spent     FLOAT        DEFAULT 0,
        last_order_date DATETIME     NULL,
        created_at      DATETIME     DEFAULT GETDATE(),
        updated_at      DATETIME     DEFAULT GETDATE(),
        CONSTRAINT FK_customers_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_cust_user      ON customers(user_id);
    CREATE INDEX IX_cust_phone     ON customers(phone);
    CREATE INDEX IX_cust_whatsapp  ON customers(whatsapp_id);
    CREATE INDEX IX_cust_instagram ON customers(instagram_id);
    CREATE INDEX IX_cust_created   ON customers(created_at);
    PRINT '  [CREATE] customers table';
END
ELSE
    PRINT '  [OK] customers table';
GO

-- ============================================================
-- TABLE 12: audit_logs
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'audit_logs')
BEGIN
    CREATE TABLE audit_logs (
        id          VARCHAR(36)  NOT NULL PRIMARY KEY,
        user_id     VARCHAR(36)  NOT NULL,
        action      VARCHAR(100) NOT NULL,
        entity_type VARCHAR(50)  NOT NULL,
        entity_id   VARCHAR(36)  NULL,
        details     VARCHAR(MAX) NULL,
        ip_address  VARCHAR(45)  NULL,
        created_at  DATETIME     DEFAULT GETDATE()
    );
    CREATE INDEX IX_audit_user    ON audit_logs(user_id);
    CREATE INDEX IX_audit_action  ON audit_logs(action);
    CREATE INDEX IX_audit_created ON audit_logs(created_at);
    PRINT '  [CREATE] audit_logs table';
END
ELSE
    PRINT '  [OK] audit_logs table';
GO

-- ============================================================
-- TABLE 13: refresh_tokens
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'refresh_tokens')
BEGIN
    CREATE TABLE refresh_tokens (
        id           VARCHAR(36)  NOT NULL PRIMARY KEY,
        user_id      VARCHAR(36)  NOT NULL,
        token_hash   VARCHAR(255) NOT NULL UNIQUE,
        expires_at   DATETIME     NOT NULL,
        revoked      INT          DEFAULT 0,
        created_at   DATETIME     DEFAULT GETDATE(),
        last_used_at DATETIME     NULL,
        CONSTRAINT FK_refresh_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_refresh_user ON refresh_tokens(user_id);
    PRINT '  [CREATE] refresh_tokens table';
END
ELSE
    PRINT '  [OK] refresh_tokens table';
GO

-- ============================================================
-- TABLE 14: usage_tracking
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'usage_tracking')
BEGIN
    CREATE TABLE usage_tracking (
        id                       VARCHAR(36) NOT NULL PRIMARY KEY,
        user_id                  VARCHAR(36) NOT NULL,
        period                   VARCHAR(7)  NOT NULL,
        orders_count             INT         DEFAULT 0,
        ai_queries_count         INT         DEFAULT 0,
        whatsapp_messages_count  INT         DEFAULT 0,
        created_at               DATETIME    DEFAULT GETDATE(),
        updated_at               DATETIME    DEFAULT GETDATE(),
        CONSTRAINT FK_usage_user FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_usage_user   ON usage_tracking(user_id);
    CREATE INDEX IX_usage_period ON usage_tracking(period);
    PRINT '  [CREATE] usage_tracking table';
END
ELSE
    PRINT '  [OK] usage_tracking table';
GO

-- ============================================================
-- TABLE 15: team_members
-- ============================================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'team_members')
BEGIN
    CREATE TABLE team_members (
        id             VARCHAR(36)  NOT NULL PRIMARY KEY,
        owner_id       VARCHAR(36)  NOT NULL,
        member_email   VARCHAR(255) NOT NULL,
        member_user_id VARCHAR(36)  NULL,
        role           VARCHAR(20)  DEFAULT 'staff',
        status         VARCHAR(20)  DEFAULT 'pending',
        invited_at     DATETIME     DEFAULT GETDATE(),
        accepted_at    DATETIME     NULL,
        CONSTRAINT FK_team_owner  FOREIGN KEY (owner_id)       REFERENCES users(id),
        CONSTRAINT FK_team_member FOREIGN KEY (member_user_id) REFERENCES users(id)
    );
    CREATE INDEX IX_team_owner ON team_members(owner_id);
    PRINT '  [CREATE] team_members table';
END
ELSE
    PRINT '  [OK] team_members table';
GO

-- ============================================================
-- DONE
-- ============================================================
PRINT '';
PRINT '======== KOFA MASTER MIGRATION COMPLETE ========';
PRINT 'Tables covered:';
PRINT '  users, products, product_variants, orders, order_items';
PRINT '  expenses, verification_codes, credit_sales, notifications';
PRINT '  ai_conversations, customers, audit_logs, refresh_tokens';
PRINT '  usage_tracking, team_members';
PRINT '';
PRINT 'IMPORTANT: Check the output above for any [ERROR] lines.';
PRINT 'If orders/products/expenses had vendor_id, data has been';
PRINT 'copied to user_id automatically.';
PRINT '================================================';
