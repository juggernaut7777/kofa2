"""Database connection for Azure SQL using SQLAlchemy."""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import urllib.parse
import os

# Construct connection string
params = urllib.parse.quote_plus(
    'Driver={ODBC Driver 18 for SQL Server};'
    'Server=tcp:kofa-server-bane.database.windows.net,1433;'
    'Database=Kofa-db;'
    'Uid=Admin-david;'
    'Pwd=' + os.getenv("DB_PASSWORD", "") + ';'
    'Encrypt=yes;'
    'TrustServerCertificate=no;'
    'Connection Timeout=30;'
)
conn_str = 'mssql+pyodbc:///?odbc_connect={}'.format(params)
engine = create_engine(conn_str)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

