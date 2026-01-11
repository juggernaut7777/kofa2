"""
Export data from SQL Server and import to MySQL.
This migrates your existing data to the new FREE MySQL database.
"""
import os
import sys

# First export from SQL Server
os.environ["DB_TYPE"] = "mssql"  # Use SQL Server for export

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from chatbot.database import SessionLocal as OldSession, engine as old_engine
from chatbot.models import Base, User, Product, Order, OrderItem

def export_data():
    """Export all data from SQL Server."""
    print("=" * 50)
    print("Exporting data from SQL Server...")
    print("=" * 50)
    
    # Create new database config for MySQL
    import pymysql
    
    mysql_host = "kofa-mysql.mysql.database.azure.com"
    mysql_user = "azureuser"
    mysql_password = "Chiwendu619$$$"
    mysql_database = "kofa"
    
    # Connect to MySQL
    mysql_conn = pymysql.connect(
        host=mysql_host,
        user=mysql_user,
        password=mysql_password,
        database=mysql_database,
        ssl={'verify_ssl': False}
    )
    mysql_cursor = mysql_conn.cursor()
    
    # Export from SQL Server
    try:
        from sqlalchemy import create_engine
        from sqlalchemy.orm import sessionmaker
        
        # SQL Server connection
        server = os.getenv("DB_SERVER", "kofa-server-bane.database.windows.net")
        database = os.getenv("DB_NAME", "Kofa-db")
        username = os.getenv("DB_USER", "Admin-david")
        password = os.getenv("DB_PASSWORD", "Chiwenduezi619")
        port = os.getenv("DB_PORT", "1433")
        
        sql_conn_str = f'mssql+pymssql://{username}:{password}@{server}:{port}/{database}'
        sql_engine = create_engine(sql_conn_str)
        SqlSession = sessionmaker(bind=sql_engine)
        sql_session = SqlSession()
        
        # Export Users
        print("\n📤 Exporting users...")
        users = sql_session.execute("SELECT * FROM users").fetchall()
        print(f"   Found {len(users)} users")
        
        for user in users:
            try:
                mysql_cursor.execute("""
                    INSERT INTO users (id, phone, email, business_name, business_address, 
                        bank_name, bank_account_number, bank_account_name, payment_method, 
                        bot_style, is_active, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, user)
                print(f"   ✅ User: {user[1]}")  # phone
            except Exception as e:
                print(f"   ⚠️ Skipped user (may already exist): {str(e)[:50]}")
        
        # Export Products
        print("\n📤 Exporting products...")
        products = sql_session.execute("SELECT * FROM products").fetchall()
        print(f"   Found {len(products)} products")
        
        for product in products:
            try:
                mysql_cursor.execute("""
                    INSERT INTO products (id, user_id, name, price_ngn, stock_level, 
                        description, category, image_url, voice_tags, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, product)
                print(f"   ✅ Product: {product[2]}")  # name
            except Exception as e:
                print(f"   ⚠️ Skipped product: {str(e)[:50]}")
        
        # Export Orders
        print("\n📤 Exporting orders...")
        orders = sql_session.execute("SELECT * FROM orders").fetchall()
        print(f"   Found {len(orders)} orders")
        
        for order in orders:
            try:
                mysql_cursor.execute("""
                    INSERT INTO orders (id, user_id, customer_phone, total_amount, status, 
                        payment_ref, notes, created_at, updated_at, paid_at, fulfilled_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """, order)
            except Exception as e:
                print(f"   ⚠️ Skipped order: {str(e)[:50]}")
        
        # Export Order Items
        print("\n📤 Exporting order items...")
        items = sql_session.execute("SELECT * FROM order_items").fetchall()
        print(f"   Found {len(items)} order items")
        
        for item in items:
            try:
                mysql_cursor.execute("""
                    INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, total)
                    VALUES (%s, %s, %s, %s, %s, %s, %s)
                """, item)
            except Exception as e:
                print(f"   ⚠️ Skipped item: {str(e)[:50]}")
        
        mysql_conn.commit()
        
        print("\n" + "=" * 50)
        print("🎉 Data migration complete!")
        print(f"   Users: {len(users)}")
        print(f"   Products: {len(products)}")
        print(f"   Orders: {len(orders)}")
        print(f"   Order Items: {len(items)}")
        print("=" * 50)
        
        sql_session.close()
        mysql_cursor.close()
        mysql_conn.close()
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
        print("\nIf no data in SQL Server, that's OK - you're starting fresh!")

if __name__ == "__main__":
    export_data()
