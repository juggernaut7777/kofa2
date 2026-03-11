-- ============================================
-- KOFA FULL DATABASE UPDATE — Azure SQL (T-SQL)
-- Paste this into Azure Query Editor and hit Run
-- Uses VARCHAR to match existing users table
-- ============================================

-- 003: Credit Sales table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'credit_sales')
BEGIN
    CREATE TABLE credit_sales (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(20),
        amount FLOAT NOT NULL,
        amount_paid FLOAT DEFAULT 0,
        items_description VARCHAR(MAX),
        due_date DATETIME,
        status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
        notes VARCHAR(MAX),
        created_at DATETIME DEFAULT GETDATE(),
        paid_at DATETIME,
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX idx_credit_user ON credit_sales(user_id);
    CREATE INDEX idx_credit_status ON credit_sales(status);
    CREATE INDEX idx_credit_phone ON credit_sales(customer_phone);
    CREATE INDEX idx_credit_created ON credit_sales(created_at);
END;
GO

-- 004: Notifications table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'notifications')
BEGIN
    CREATE TABLE notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        type VARCHAR(50) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message VARCHAR(MAX) NOT NULL,
        is_read INT DEFAULT 0,
        link VARCHAR(255),
        created_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX idx_notif_user ON notifications(user_id);
    CREATE INDEX idx_notif_type ON notifications(type);
    CREATE INDEX idx_notif_read ON notifications(is_read);
    CREATE INDEX idx_notif_created ON notifications(created_at);
END;
GO

-- 005: AI Conversations table
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'ai_conversations')
BEGIN
    CREATE TABLE ai_conversations (
        id VARCHAR(36) PRIMARY KEY,
        conversation_id VARCHAR(36) NOT NULL UNIQUE,
        user_id VARCHAR(36) NOT NULL,
        messages VARCHAR(MAX) NOT NULL DEFAULT '[]',
        created_at DATETIME DEFAULT GETDATE(),
        updated_at DATETIME DEFAULT GETDATE(),
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE INDEX idx_aiconv_conversation ON ai_conversations(conversation_id);
    CREATE INDEX idx_aiconv_user ON ai_conversations(user_id);
END;
GO

-- 006: Bot connection columns on users table
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'whatsapp_phone_id')
    ALTER TABLE users ADD whatsapp_phone_id VARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'whatsapp_access_token')
    ALTER TABLE users ADD whatsapp_access_token VARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'whatsapp_business_id')
    ALTER TABLE users ADD whatsapp_business_id VARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'whatsapp_connected')
    ALTER TABLE users ADD whatsapp_connected INT DEFAULT 0;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'instagram_access_token')
    ALTER TABLE users ADD instagram_access_token VARCHAR(500) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'instagram_page_id')
    ALTER TABLE users ADD instagram_page_id VARCHAR(100) NULL;
GO
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'instagram_connected')
    ALTER TABLE users ADD instagram_connected INT DEFAULT 0;
GO
