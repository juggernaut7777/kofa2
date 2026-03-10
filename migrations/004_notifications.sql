-- Notifications table — in-app alerts for vendors
-- Run this migration to add the notifications table

CREATE TABLE IF NOT EXISTS notifications (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read TINYINT DEFAULT 0,
    link VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_notif_user (user_id),
    INDEX idx_notif_type (type),
    INDEX idx_notif_read (is_read),
    INDEX idx_notif_created (created_at)
);
