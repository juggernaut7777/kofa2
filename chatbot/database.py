import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# ========== DATABASE CONFIGURATION ==========
# SECURITY: All credentials MUST come from environment variables
# No hardcoded defaults for sensitive values

DB_TYPE = os.getenv("DB_TYPE", "mysql")

def get_required_env(key: str) -> str:
    """Get required environment variable or raise error."""
    value = os.getenv(key)
    if not value:
        raise ValueError(f"Missing required environment variable: {key}")
    return value

if DB_TYPE == "mysql":
    # ===== MySQL Configuration =====
    mysql_host = os.getenv("MYSQL_HOST", "kofa-mysql.mysql.database.azure.com")
    mysql_user = get_required_env("MYSQL_USER")
    mysql_password = get_required_env("MYSQL_PASSWORD")
    mysql_database = os.getenv("MYSQL_DATABASE", "kofa")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    
    conn_str = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}?ssl_verify_cert=false"
    
else:
    # ===== SQL Server Configuration =====
    server = os.getenv("DB_SERVER", "kofa-server-bane.database.windows.net")
    database = os.getenv("DB_NAME", "Kofa-db")
    username = get_required_env("DB_USER")
    password = get_required_env("DB_PASSWORD")
    port = os.getenv("DB_PORT", "1433")
    
    conn_str = f'mssql+pymssql://{username}:{password}@{server}:{port}/{database}'

# PERFORMANCE: Connection pooling
engine = create_engine(
    conn_str,
    poolclass=QueuePool,
    pool_size=5,
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=1800,
    pool_timeout=10,
    echo=False
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

