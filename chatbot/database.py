import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# ========== DATABASE CONFIGURATION ==========
# Supports both MySQL (free tier) and SQL Server (legacy)
# Set DB_TYPE environment variable to switch: "mysql" or "mssql"

DB_TYPE = os.getenv("DB_TYPE", "mysql")  # Default to MySQL (FREE!)

if DB_TYPE == "mysql":
    # ===== MySQL Flexible Server (FREE 750 hours/month) =====
    mysql_host = os.getenv("MYSQL_HOST", "kofa-mysql.mysql.database.azure.com")
    mysql_user = os.getenv("MYSQL_USER", "azureuser")
    mysql_password = os.getenv("MYSQL_PASSWORD", "Chiwendu619$$$")
    mysql_database = os.getenv("MYSQL_DATABASE", "kofa")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    
    # MySQL connection string with SSL (required by Azure)
    conn_str = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}?ssl_verify_cert=false"
    
else:
    # ===== SQL Server (Legacy - costs money) =====
    server = os.getenv("DB_SERVER", "kofa-server-bane.database.windows.net")
    database = os.getenv("DB_NAME", "Kofa-db")
    username = os.getenv("DB_USER", "Admin-david")
    password = os.getenv("DB_PASSWORD", "Chiwenduezi619")
    port = os.getenv("DB_PORT", "1433")
    
    conn_str = f'mssql+pymssql://{username}:{password}@{server}:{port}/{database}'

# PERFORMANCE OPTIMIZATION: Connection pooling
engine = create_engine(
    conn_str,
    poolclass=QueuePool,
    pool_size=5,           # Keep 5 connections ready
    max_overflow=10,       # Allow up to 15 total during peaks
    pool_pre_ping=True,    # Check if connection is alive before using
    pool_recycle=1800,     # Recycle every 30 minutes
    pool_timeout=10,       # Wait max 10 sec for a connection
    echo=False             # Don't log SQL (set True for debugging)
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
