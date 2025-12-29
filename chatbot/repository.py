"""
Database repository for KOFA - handles all CRUD operations with Azure SQL.
Uses the existing database.py connection.
"""
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid
from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError
import logging

from .database import SessionLocal

logger = logging.getLogger(__name__)


def get_db():
    """Get database session."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# =============================================
# PRODUCTS REPOSITORY
# =============================================

def get_all_products(vendor_id: str = "default") -> List[Dict]:
    """Get all products for a vendor from database."""
    try:
        db = SessionLocal()
        result = db.execute(text("""
            SELECT id, name, price_ngn, stock_level, description, category, image_url, voice_tags
            FROM products
            WHERE vendor_id = :vendor_id
            ORDER BY created_at DESC
        """), {"vendor_id": vendor_id})
        
        products = []
        for row in result:
            products.append({
                "id": row.id,
                "name": row.name,
                "price_ngn": float(row.price_ngn),
                "stock_level": row.stock_level,
                "description": row.description,
                "category": row.category,
                "image_url": row.image_url,
                "voice_tags": row.voice_tags.split(",") if row.voice_tags else []
            })
        db.close()
        return products
    except SQLAlchemyError as e:
        logger.error(f"Failed to get products: {e}")
        return []


def get_product_by_id(product_id: str) -> Optional[Dict]:
    """Get a single product by ID."""
    try:
        db = SessionLocal()
        result = db.execute(text("""
            SELECT id, name, price_ngn, stock_level, description, category, image_url, voice_tags
            FROM products
            WHERE id = :id
        """), {"id": product_id})
        
        row = result.fetchone()
        db.close()
        
        if row:
            return {
                "id": row.id,
                "name": row.name,
                "price_ngn": float(row.price_ngn),
                "stock_level": row.stock_level,
                "description": row.description,
                "category": row.category,
                "image_url": row.image_url,
                "voice_tags": row.voice_tags.split(",") if row.voice_tags else []
            }
        return None
    except SQLAlchemyError as e:
        logger.error(f"Failed to get product: {e}")
        return None


def create_product(product_data: Dict, vendor_id: str = "default") -> Optional[Dict]:
    """Create a new product in database."""
    try:
        db = SessionLocal()
        product_id = str(uuid.uuid4())
        
        voice_tags_str = ",".join(product_data.get("voice_tags", [])) if product_data.get("voice_tags") else None
        
        db.execute(text("""
            INSERT INTO products (id, vendor_id, name, price_ngn, stock_level, description, category, image_url, voice_tags)
            VALUES (:id, :vendor_id, :name, :price_ngn, :stock_level, :description, :category, :image_url, :voice_tags)
        """), {
            "id": product_id,
            "vendor_id": vendor_id,
            "name": product_data["name"],
            "price_ngn": product_data["price_ngn"],
            "stock_level": product_data.get("stock_level", 0),
            "description": product_data.get("description", ""),
            "category": product_data.get("category", ""),
            "image_url": product_data.get("image_url", ""),
            "voice_tags": voice_tags_str
        })
        db.commit()
        db.close()
        
        return {"id": product_id, **product_data}
    except SQLAlchemyError as e:
        logger.error(f"Failed to create product: {e}")
        return None


def update_product_stock(product_id: str, new_stock: int) -> bool:
    """Update product stock level."""
    try:
        db = SessionLocal()
        db.execute(text("""
            UPDATE products 
            SET stock_level = :stock_level, updated_at = GETDATE()
            WHERE id = :id
        """), {"id": product_id, "stock_level": new_stock})
        db.commit()
        db.close()
        return True
    except SQLAlchemyError as e:
        logger.error(f"Failed to update stock: {e}")
        return False


def decrement_product_stock(product_id: str, quantity: int) -> bool:
    """Decrement product stock by quantity (with validation)."""
    try:
        db = SessionLocal()
        # Check current stock first
        result = db.execute(text("SELECT stock_level FROM products WHERE id = :id"), {"id": product_id})
        row = result.fetchone()
        
        if not row or row.stock_level < quantity:
            db.close()
            return False
        
        db.execute(text("""
            UPDATE products 
            SET stock_level = stock_level - :quantity, updated_at = GETDATE()
            WHERE id = :id AND stock_level >= :quantity
        """), {"id": product_id, "quantity": quantity})
        db.commit()
        db.close()
        return True
    except SQLAlchemyError as e:
        logger.error(f"Failed to decrement stock: {e}")
        return False


# =============================================
# ORDERS REPOSITORY
# =============================================

def create_order(order_data: Dict, items: List[Dict], vendor_id: str = "default") -> Optional[str]:
    """Create a new order with items."""
    try:
        db = SessionLocal()
        order_id = str(uuid.uuid4())
        
        # Insert order
        db.execute(text("""
            INSERT INTO orders (id, vendor_id, customer_phone, total_amount, status, platform)
            VALUES (:id, :vendor_id, :customer_phone, :total_amount, :status, :platform)
        """), {
            "id": order_id,
            "vendor_id": vendor_id,
            "customer_phone": order_data["customer_phone"],
            "total_amount": order_data["total_amount"],
            "status": order_data.get("status", "pending"),
            "platform": order_data.get("platform", "WhatsApp")
        })
        
        # Insert order items
        for item in items:
            item_id = str(uuid.uuid4())
            db.execute(text("""
                INSERT INTO order_items (id, order_id, product_id, product_name, quantity, price, total)
                VALUES (:id, :order_id, :product_id, :product_name, :quantity, :price, :total)
            """), {
                "id": item_id,
                "order_id": order_id,
                "product_id": item["product_id"],
                "product_name": item["product_name"],
                "quantity": item["quantity"],
                "price": item["price"],
                "total": item["total"]
            })
        
        db.commit()
        db.close()
        return order_id
    except SQLAlchemyError as e:
        logger.error(f"Failed to create order: {e}")
        return None


def get_all_orders(vendor_id: str = "default", status: str = None) -> List[Dict]:
    """Get all orders for a vendor."""
    try:
        db = SessionLocal()
        
        query = """
            SELECT id, customer_phone, total_amount, status, payment_ref, platform, created_at, paid_at
            FROM orders
            WHERE vendor_id = :vendor_id
        """
        params = {"vendor_id": vendor_id}
        
        if status:
            query += " AND status = :status"
            params["status"] = status
        
        query += " ORDER BY created_at DESC"
        
        result = db.execute(text(query), params)
        
        orders = []
        for row in result:
            orders.append({
                "id": row.id,
                "customer_phone": row.customer_phone,
                "total_amount": float(row.total_amount),
                "status": row.status,
                "payment_ref": row.payment_ref,
                "platform": row.platform,
                "created_at": row.created_at.isoformat() if row.created_at else None,
                "paid_at": row.paid_at.isoformat() if row.paid_at else None
            })
        
        db.close()
        return orders
    except SQLAlchemyError as e:
        logger.error(f"Failed to get orders: {e}")
        return []


def update_order_status(order_id: str, status: str, payment_ref: str = None) -> bool:
    """Update order status."""
    try:
        db = SessionLocal()
        
        if status == "paid":
            db.execute(text("""
                UPDATE orders 
                SET status = :status, payment_ref = :payment_ref, paid_at = GETDATE()
                WHERE id = :id
            """), {"id": order_id, "status": status, "payment_ref": payment_ref})
        elif status == "fulfilled":
            db.execute(text("""
                UPDATE orders 
                SET status = :status, fulfilled_at = GETDATE()
                WHERE id = :id
            """), {"id": order_id, "status": status})
        else:
            db.execute(text("""
                UPDATE orders 
                SET status = :status
                WHERE id = :id
            """), {"id": order_id, "status": status})
        
        db.commit()
        db.close()
        return True
    except SQLAlchemyError as e:
        logger.error(f"Failed to update order status: {e}")
        return False


# =============================================
# BOT SETTINGS REPOSITORY
# =============================================

def get_bot_settings(vendor_id: str = "default") -> Dict:
    """Get bot settings for a vendor."""
    try:
        db = SessionLocal()
        result = db.execute(text("""
            SELECT is_active, style FROM bot_settings WHERE vendor_id = :vendor_id
        """), {"vendor_id": vendor_id})
        
        row = result.fetchone()
        db.close()
        
        if row:
            return {"is_active": bool(row.is_active), "style": row.style}
        return {"is_active": True, "style": "professional"}
    except SQLAlchemyError as e:
        logger.error(f"Failed to get bot settings: {e}")
        return {"is_active": True, "style": "professional"}


def update_bot_settings(vendor_id: str, is_active: bool = None, style: str = None) -> bool:
    """Update bot settings (upsert)."""
    try:
        db = SessionLocal()
        
        # Check if exists
        result = db.execute(text("SELECT vendor_id FROM bot_settings WHERE vendor_id = :vendor_id"), {"vendor_id": vendor_id})
        exists = result.fetchone() is not None
        
        if exists:
            updates = []
            params = {"vendor_id": vendor_id}
            
            if is_active is not None:
                updates.append("is_active = :is_active")
                params["is_active"] = 1 if is_active else 0
            if style is not None:
                updates.append("style = :style")
                params["style"] = style
            
            if updates:
                updates.append("updated_at = GETDATE()")
                query = f"UPDATE bot_settings SET {', '.join(updates)} WHERE vendor_id = :vendor_id"
                db.execute(text(query), params)
        else:
            db.execute(text("""
                INSERT INTO bot_settings (vendor_id, is_active, style)
                VALUES (:vendor_id, :is_active, :style)
            """), {
                "vendor_id": vendor_id,
                "is_active": 1 if is_active else 0,
                "style": style or "professional"
            })
        
        db.commit()
        db.close()
        return True
    except SQLAlchemyError as e:
        logger.error(f"Failed to update bot settings: {e}")
        return False


# =============================================
# VENDOR SETTINGS REPOSITORY
# =============================================

def get_vendor_settings(vendor_id: str = "default") -> Dict:
    """Get vendor payment and connection settings."""
    try:
        db = SessionLocal()
        result = db.execute(text("""
            SELECT bank_name, account_number, account_name, business_name,
                   is_whatsapp_connected, is_instagram_connected, is_tiktok_connected
            FROM vendor_settings WHERE vendor_id = :vendor_id
        """), {"vendor_id": vendor_id})
        
        row = result.fetchone()
        db.close()
        
        if row:
            return {
                "bank_name": row.bank_name or "",
                "account_number": row.account_number or "",
                "account_name": row.account_name or "",
                "business_name": row.business_name or "",
                "is_whatsapp_connected": bool(row.is_whatsapp_connected),
                "is_instagram_connected": bool(row.is_instagram_connected),
                "is_tiktok_connected": bool(row.is_tiktok_connected)
            }
        return {}
    except SQLAlchemyError as e:
        logger.error(f"Failed to get vendor settings: {e}")
        return {}


def update_vendor_settings(vendor_id: str, settings: Dict) -> bool:
    """Update vendor settings (upsert)."""
    try:
        db = SessionLocal()
        
        # Check if exists
        result = db.execute(text("SELECT vendor_id FROM vendor_settings WHERE vendor_id = :vendor_id"), {"vendor_id": vendor_id})
        exists = result.fetchone() is not None
        
        if exists:
            updates = []
            params = {"vendor_id": vendor_id}
            
            for key, value in settings.items():
                if key in ["bank_name", "account_number", "account_name", "business_name"]:
                    updates.append(f"{key} = :{key}")
                    params[key] = value
                elif key in ["is_whatsapp_connected", "is_instagram_connected", "is_tiktok_connected"]:
                    updates.append(f"{key} = :{key}")
                    params[key] = 1 if value else 0
            
            if updates:
                updates.append("updated_at = GETDATE()")
                query = f"UPDATE vendor_settings SET {', '.join(updates)} WHERE vendor_id = :vendor_id"
                db.execute(text(query), params)
        else:
            db.execute(text("""
                INSERT INTO vendor_settings (vendor_id, bank_name, account_number, account_name, business_name)
                VALUES (:vendor_id, :bank_name, :account_number, :account_name, :business_name)
            """), {
                "vendor_id": vendor_id,
                "bank_name": settings.get("bank_name", ""),
                "account_number": settings.get("account_number", ""),
                "account_name": settings.get("account_name", ""),
                "business_name": settings.get("business_name", "")
            })
        
        db.commit()
        db.close()
        return True
    except SQLAlchemyError as e:
        logger.error(f"Failed to update vendor settings: {e}")
        return False


# =============================================
# EXPENSES REPOSITORY
# =============================================

def create_expense(expense_data: Dict, vendor_id: str = "default") -> Optional[str]:
    """Create a new expense."""
    try:
        db = SessionLocal()
        expense_id = str(uuid.uuid4())
        
        db.execute(text("""
            INSERT INTO expenses (id, vendor_id, description, amount, category, expense_date)
            VALUES (:id, :vendor_id, :description, :amount, :category, :expense_date)
        """), {
            "id": expense_id,
            "vendor_id": vendor_id,
            "description": expense_data["description"],
            "amount": expense_data["amount"],
            "category": expense_data["category"],
            "expense_date": expense_data.get("date", datetime.now().date())
        })
        
        db.commit()
        db.close()
        return expense_id
    except SQLAlchemyError as e:
        logger.error(f"Failed to create expense: {e}")
        return None


def get_all_expenses(vendor_id: str = "default") -> List[Dict]:
    """Get all expenses for a vendor."""
    try:
        db = SessionLocal()
        result = db.execute(text("""
            SELECT id, description, amount, category, expense_date, created_at
            FROM expenses
            WHERE vendor_id = :vendor_id
            ORDER BY expense_date DESC
        """), {"vendor_id": vendor_id})
        
        expenses = []
        for row in result:
            expenses.append({
                "id": row.id,
                "description": row.description,
                "amount": float(row.amount),
                "category": row.category,
                "date": row.expense_date.isoformat() if row.expense_date else None,
                "created_at": row.created_at.isoformat() if row.created_at else None
            })
        
        db.close()
        return expenses
    except SQLAlchemyError as e:
        logger.error(f"Failed to get expenses: {e}")
        return []
