"""
Initialize MySQL database with tables.
Run this script to create the KOFA database and tables in MySQL.
"""
import os
import sys

# Set environment to use MySQL
os.environ["DB_TYPE"] = "mysql"
os.environ["MYSQL_HOST"] = "your-mysql-server.mysql.database.azure.com"
os.environ["MYSQL_USER"] = "azureuser"
os.environ["MYSQL_PASSWORD"] = "<YOUR_DB_PASSWORD>"
os.environ["MYSQL_DATABASE"] = "kofa"

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chatbot.database import engine
from chatbot.models import Base

def init_database():
    """Create all tables in MySQL database."""
    print("=" * 50)
    print("KOFA MySQL Database Initialization")
    print("=" * 50)
    
    print(f"\n🔌 Connecting to: your-mysql-server.mysql.database.azure.com")
    print(f"📦 Database: kofa")
    print(f"👤 User: azureuser")
    
    try:
        # Create all tables
        print("\n📋 Creating tables...")
        Base.metadata.create_all(bind=engine)
        
        print("✅ Tables created successfully!")
        print("\nTables created:")
        for table in Base.metadata.tables:
            print(f"  - {table}")
        
        print("\n🎉 Database initialization complete!")
        print("=" * 50)
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        print("\nTroubleshooting:")
        print("1. Make sure MySQL server is running")
        print("2. Check firewall allows your IP")
        print("3. Verify credentials are correct")
        print("4. Create 'kofa' database manually if it doesn't exist:")
        print("   CREATE DATABASE kofa;")
        raise

if __name__ == "__main__":
    init_database()
