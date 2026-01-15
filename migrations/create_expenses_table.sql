-- Create expenses table for expense tracking
-- Run this manually on Azure SQL Database

IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'expenses')
BEGIN
    CREATE TABLE expenses (
        id NVARCHAR(100) PRIMARY KEY,
        user_id NVARCHAR(100) NOT NULL,
        amount FLOAT NOT NULL,
        description NVARCHAR(500) NOT NULL,
        category NVARCHAR(100) NOT NULL DEFAULT 'misc',
        expense_type NVARCHAR(50) NOT NULL DEFAULT 'BUSINESS',
        date DATETIME DEFAULT GETUTCDATE(),
        receipt_image_url NVARCHAR(MAX) NULL,
        created_at DATETIME DEFAULT GETUTCDATE(),
        
        CONSTRAINT FK_expenses_users FOREIGN KEY (user_id) REFERENCES users(id)
    );
    
    -- Add indexes for common queries
    CREATE INDEX IX_expenses_user_id ON expenses(user_id);
    CREATE INDEX IX_expenses_date ON expenses(date);
    CREATE INDEX IX_expenses_category ON expenses(category);
    
    PRINT 'Expenses table created successfully';
END
ELSE
BEGIN
    PRINT 'Expenses table already exists';
END
