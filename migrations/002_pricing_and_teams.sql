-- KOFA Pricing & Team Members Migration
-- Run this on Azure SQL (kofa-db)
-- Adds: usage_tracking, team_members tables
-- Adds: subscription_tier + subscription_expires_at to users

-- =============================================
-- 1. Usage Tracking table (persists across restarts)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'usage_tracking')
CREATE TABLE usage_tracking (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    period VARCHAR(7) NOT NULL,             -- "2026-03" (year-month)
    orders_count INT DEFAULT 0,
    ai_queries_count INT DEFAULT 0,
    whatsapp_messages_count INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE(),
    CONSTRAINT FK_usage_user FOREIGN KEY (user_id) REFERENCES users(id),
    CONSTRAINT UQ_user_period UNIQUE (user_id, period)
);

CREATE INDEX IX_usage_user_period ON usage_tracking(user_id, period);

-- =============================================
-- 2. Team Members table (Pro tier only)
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'team_members')
CREATE TABLE team_members (
    id VARCHAR(36) PRIMARY KEY,
    owner_id VARCHAR(36) NOT NULL,          -- Vendor who owns the account
    member_email VARCHAR(255) NOT NULL,
    member_user_id VARCHAR(36) NULL,        -- Linked after they accept invite
    role VARCHAR(20) DEFAULT 'staff',       -- "staff", "manager"
    status VARCHAR(20) DEFAULT 'pending',   -- "pending", "active", "revoked"
    invited_at DATETIME DEFAULT GETDATE(),
    accepted_at DATETIME NULL,
    CONSTRAINT FK_team_owner FOREIGN KEY (owner_id) REFERENCES users(id),
    CONSTRAINT FK_team_member FOREIGN KEY (member_user_id) REFERENCES users(id)
);

CREATE INDEX IX_team_owner ON team_members(owner_id);
CREATE INDEX IX_team_member ON team_members(member_user_id);

-- =============================================
-- 3. Subscription columns on users
-- =============================================
IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'subscription_tier')
    ALTER TABLE users ADD subscription_tier VARCHAR(20) DEFAULT 'free';

IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('users') AND name = 'subscription_expires_at')
    ALTER TABLE users ADD subscription_expires_at DATETIME NULL;

PRINT 'KOFA pricing & team members migration completed successfully.';
