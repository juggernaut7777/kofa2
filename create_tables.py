"""Script to create database tables in Azure SQL."""
from chatbot.database import engine
from chatbot.models import Base

def create_tables():
    """Create all tables defined in models.py."""
    print("Creating tables in Azure SQL database...")
    try:
        Base.metadata.create_all(bind=engine)
        print("✅ Tables created successfully!")
        print("\nCreated tables:")
        for table in Base.metadata.tables:
            print(f"  - {table}")
    except Exception as e:
        print(f"❌ Error creating tables: {e}")
        raise

if __name__ == "__main__":
    create_tables()





