import os
import urllib.parse
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# 1. READ CREDENTIALS FROM HEROKU "SAFE BOX"
# (If these are missing, it defaults to the values you provided)
server = os.getenv("DB_SERVER", "kofa-server-bane.database.windows.net")
database = os.getenv("DB_NAME", "Kofa-db")
username = os.getenv("DB_USER", "Admin-david")
password = os.getenv("DB_PASSWORD", "Chiwenduezi619")
driver = os.getenv("DB_DRIVER", "ODBC Driver 18 for SQL Server")

# 2. BUILD THE KEY
# We MUST use TrustServerCertificate=yes for Heroku to talk to Azure
connection_string = (
    f"Driver={{{driver}}};"
    f"Server=tcp:{server},1433;"
    f"Database={database};"
    f"Uid={username};"
    f"Pwd={password};"
    "Encrypt=yes;"
    "TrustServerCertificate=yes;"
    "Connection Timeout=30;"
)

# 3. UNLOCK THE DOOR
params = urllib.parse.quote_plus(connection_string)
conn_str = 'mssql+pyodbc:///?odbc_connect={}'.format(params)

engine = create_engine(conn_str)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

