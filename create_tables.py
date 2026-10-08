"""Script to create all database tables in the configured database."""
from chatbot.database import engine
from chatbot.models import Base

def create_tables():
    """Create all tables defined in models.py."""
    db_name = engine.url.database or "database"
    db_driver = engine.url.drivername
    print(f"Creating tables for {db_driver} ({db_name})...")
    try:
        Base.metadata.create_all(bind=engine)
        print("[SUCCESS] Tables created successfully!")
        print("\nActive tables:")
        for table in sorted(Base.metadata.tables.keys()):
            print(f"  - {table}")
        return True
    except Exception as e:
        print(f"[ERROR] Error creating tables: {e}")
        raise

if __name__ == "__main__":
    create_tables()





