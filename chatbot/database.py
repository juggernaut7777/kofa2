import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Read credentials from environment variables
server = os.getenv("DB_SERVER", "kofa-server-bane.database.windows.net")
database = os.getenv("DB_NAME", "Kofa-db")
username = os.getenv("DB_USER", "Admin-david")
password = os.getenv("DB_PASSWORD", "Chiwenduezi619")
port = os.getenv("DB_PORT", "1433")

# Build pymssql connection string (no ODBC driver needed!)
# Format: mssql+pymssql://username:password@server:port/database
conn_str = f'mssql+pymssql://{username}:{password}@{server}:{port}/{database}'

engine = create_engine(conn_str)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
