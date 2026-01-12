import sys
import os
import uuid
import json
import random

# Add project root to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from chatbot.database import SessionLocal
from chatbot.models import Product, Order
from chatbot.inventory import DEFAULT_USER_ID

def seed_products():
    db = SessionLocal()
    try:
        print("🌱 Seeding products...")

        # Clear existing products for this user (optional, but good for clean state)
        # db.query(Product).filter(Product.user_id == DEFAULT_USER_ID).delete()
        
        products_data = [
            {
                "name": "iPhone 15 Pro Max",
                "price_ngn": 1850000.00,
                "stock_level": 15,
                "category": "Electronics",
                "description": "Titanium design, A17 Pro chip, 256GB storage.",
                "voice_tags": ["iphone", "apple", "phone", "mobile"]
            },
            {
                "name": "Nike Air Force 1",
                "price_ngn": 45000.00,
                "stock_level": 4,  # Low stock
                "category": "Footwear",
                "description": "Classic white sneakers, size 42.",
                "voice_tags": ["nike", "sneakers", "shoes", "kicks"]
            },
            {
                "name": "Samsung 65\" QLED TV",
                "price_ngn": 950000.00,
                "stock_level": 8, # Low stock
                "category": "Electronics",
                "description": "4K Smart TV with Quantum Dot technology.",
                "voice_tags": ["tv", "television", "samsung", "screen"]
            },
            {
                "name": "Adidas Ultraboost",
                "price_ngn": 65000.00,
                "stock_level": 25,
                "category": "Footwear",
                "description": "Running shoes with boost midsole for comfort.",
                "voice_tags": ["adidas", "run", "shoes", "sports"]
            },
            {
                "name": "Leather Wallet",
                "price_ngn": 12000.00,
                "stock_level": 50,
                "category": "Accessories",
                "description": "Genuine leather wallet, brown, bi-fold.",
                "voice_tags": ["wallet", "purse", "leather", "money"]
            },
            {
                "name": "Sony WH-1000XM5",
                "price_ngn": 450000.00,
                "stock_level": 12,
                "category": "Electronics",
                "description": "Wireless noise-canceling headphones.",
                "voice_tags": ["sony", "headphones", "music", "audio"]
            },
            {
                "name": "MacBook Pro 14\" M3",
                "price_ngn": 2400000.00,
                "stock_level": 0, # Out of stock
                "category": "Electronics",
                "description": "Space Black, 16GB RAM, 512GB SSD.",
                "voice_tags": ["macbook", "laptop", "apple", "computer"]
            },
            {
                "name": "Gaming Chair",
                "price_ngn": 180000.00,
                "stock_level": 5, # Low Stock
                "category": "Furniture",
                "description": "Ergonomic chair with lumbar support.",
                "voice_tags": ["chair", "seat", "gaming", "furniture"]
            },
            {
                "name": "PlayStation 5 Slim",
                "price_ngn": 750000.00,
                "stock_level": 20,
                "category": "Gaming",
                "description": "1TB SSD, Disc Edition.",
                "voice_tags": ["ps5", "playstation", "console", "game"]
            },
            {
                "name": "Royal Kludge RK61",
                "price_ngn": 55000.00,
                "stock_level": 30,
                "category": "Electronics",
                "description": "Mechanical keyboard, 60% layout, red switches.",
                "voice_tags": ["keyboard", "typing", "computer", "rk61"]
            }
        ]

        created_count = 0
        for p_data in products_data:
            # Check if exists to avoid duplicates
            exists = db.query(Product).filter(
                Product.user_id == DEFAULT_USER_ID, 
                Product.name == p_data["name"]
            ).first()
            
            if not exists:
                new_product = Product(
                    id=str(uuid.uuid4()),
                    user_id=DEFAULT_USER_ID,
                    name=p_data["name"],
                    price_ngn=p_data["price_ngn"],
                    stock_level=p_data["stock_level"],
                    category=p_data["category"],
                    description=p_data["description"],
                    voice_tags=json.dumps(p_data["voice_tags"])
                )
                db.add(new_product)
                created_count += 1
                print(f"  + Added: {p_data['name']}")
            else:
                print(f"  . Skipped (exists): {p_data['name']}")

        db.commit()
        print(f"✅ Seeding complete. Added {created_count} products.")

    except Exception as e:
        print(f"❌ Error seeding products: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_products()
