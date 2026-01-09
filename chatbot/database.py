import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# Read credentials from environment variables
server = os.getenv("DB_SERVER", "kofa-server-bane.database.windows.net")
database = os.getenv("DB_NAME", "Kofa-db")
username = os.getenv("DB_USER", "Admin-david")
password = os.getenv("DB_PASSWORD", "Chiwenduezi619")
port = os.getenv("DB_PORT", "1433")

# Build pymssql connection string (no ODBC driver needed!)
# Format: mssql+pymssql://username:password@server:port/database
conn_str = f'mssql+pymssql://{username}:{password}@{server}:{port}/{database}'

# PERFORMANCE OPTIMIZATION: Connection pooling
# - pool_size: Number of connections to keep open (reduces cold start latency)
# - max_overflow: Extra connections allowed during high load
# - pool_pre_ping: Test connections before use (prevents stale connection errors)
# - pool_recycle: Recycle connections after 30 min (Azure SQL has 30-min timeout)
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
