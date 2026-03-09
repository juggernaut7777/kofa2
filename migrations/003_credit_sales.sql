-- Credit Sales table — tracks customers who owe money
-- Run this migration to add credit_sales table

CREATE TABLE IF NOT EXISTS credit_sales (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36) NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(20),
    amount FLOAT NOT NULL,
    amount_paid FLOAT DEFAULT 0,
    items_description TEXT,
    due_date DATETIME,
    status VARCHAR(20) NOT NULL DEFAULT 'unpaid',
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    paid_at DATETIME,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    INDEX idx_credit_user (user_id),
    INDEX idx_credit_status (status),
    INDEX idx_credit_phone (customer_phone),
    INDEX idx_credit_created (created_at),
    CONSTRAINT check_credit_status CHECK (status IN ('unpaid', 'partial', 'paid'))
);
