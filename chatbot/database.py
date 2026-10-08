import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import QueuePool

# Load env vars from .env file (must be before any os.getenv calls)
load_dotenv()

# ========== DATABASE CONFIGURATION ==========
# Supports:
# 1. DATABASE_URL (Supabase, Neon, Render, Railway, etc.)
# 2. SQLite (local development & testing: DB_TYPE=sqlite)
# 3. PostgreSQL (DB_TYPE=postgres / DB_TYPE=postgresql)
# 4. MySQL (DB_TYPE=mysql)
# 5. SQL Server (DB_TYPE=mssql)

from sqlalchemy.pool import StaticPool, NullPool

DATABASE_URL = os.getenv("DATABASE_URL")
DB_TYPE = os.getenv("DB_TYPE", "sqlite" if not DATABASE_URL and not os.getenv("DB_USER") else os.getenv("DB_TYPE", "mssql")).lower()

connect_args = {}
engine_kwargs = {"echo": False}

if DATABASE_URL:
    # Handle standard cloud PostgreSQL URL conventions
    if DATABASE_URL.startswith("postgres://"):
        conn_str = DATABASE_URL.replace("postgres://", "postgresql://", 1)
    else:
        conn_str = DATABASE_URL

    if "sqlite" in conn_str:
        connect_args = {"check_same_thread": False}
        engine_kwargs["connect_args"] = connect_args
    else:
        engine_kwargs.update({
            "poolclass": QueuePool,
            "pool_size": int(os.getenv("DB_POOL_SIZE", "5")),
            "max_overflow": int(os.getenv("DB_MAX_OVERFLOW", "10")),
            "pool_pre_ping": True,
            "pool_recycle": 1800,
            "pool_timeout": 10
        })

elif DB_TYPE == "sqlite":
    sqlite_path = os.getenv("SQLITE_PATH", "kofa.db")
    conn_str = f"sqlite:///{sqlite_path}"
    connect_args = {"check_same_thread": False}
    engine_kwargs.update({
        "connect_args": connect_args,
        "pool_pre_ping": True
    })

elif DB_TYPE in ("postgres", "postgresql"):
    pg_host = os.getenv("PG_HOST", os.getenv("POSTGRES_HOST", "localhost"))
    pg_user = os.getenv("PG_USER", os.getenv("POSTGRES_USER", "postgres"))
    pg_password = os.getenv("PG_PASSWORD", os.getenv("POSTGRES_PASSWORD", ""))
    pg_database = os.getenv("PG_DATABASE", os.getenv("POSTGRES_DB", "kofa"))
    pg_port = os.getenv("PG_PORT", os.getenv("POSTGRES_PORT", "5432"))
    
    conn_str = f"postgresql://{pg_user}:{pg_password}@{pg_host}:{pg_port}/{pg_database}"
    engine_kwargs.update({
        "poolclass": QueuePool,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 1800,
        "pool_timeout": 10
    })

elif DB_TYPE == "mysql":
    mysql_host = os.getenv("MYSQL_HOST", "localhost")
    mysql_user = os.getenv("MYSQL_USER", "root")
    mysql_password = os.getenv("MYSQL_PASSWORD", "")
    mysql_database = os.getenv("MYSQL_DATABASE", "kofa")
    mysql_port = os.getenv("MYSQL_PORT", "3306")
    
    conn_str = f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_database}?ssl_verify_cert=false"
    engine_kwargs.update({
        "poolclass": QueuePool,
        "pool_size": 5,
        "max_overflow": 10,
        "pool_pre_ping": True,
        "pool_recycle": 1800,
        "pool_timeout": 10
    })

else:
    # Default to SQL Server if configured, otherwise fallback to SQLite
    server = os.getenv("DB_SERVER")
    username = os.getenv("DB_USER")
    password = os.getenv("DB_PASSWORD")
    database = os.getenv("DB_NAME", "Kofa-db")
    port = os.getenv("DB_PORT", "1433")

    if server and username and password:
        conn_str = f'mssql+pymssql://{username}:{password}@{server}:{port}/{database}'
        engine_kwargs.update({
            "poolclass": QueuePool,
            "pool_size": 5,
            "max_overflow": 10,
            "pool_pre_ping": True,
            "pool_recycle": 1800,
            "pool_timeout": 10
        })
    else:
        # Graceful local fallback if DB credentials not provided
        conn_str = "sqlite:///kofa.db"
        connect_args = {"check_same_thread": False}
        engine_kwargs.update({
            "connect_args": connect_args,
            "pool_pre_ping": True
        })

# Initialize Engine and Session
engine = create_engine(conn_str, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

