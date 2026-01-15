"""SQLAlchemy database models for KOFA Commerce Engine.
Compatible with both MySQL and SQL Server.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid
import os

# Use String(36) for UUIDs - works with both MySQL and SQL Server
# UNIQUEIDENTIFIER is SQL Server specific
GUID = String(36)

Base = declarative_base()


class User(Base):
    """User/Vendor model for merchants."""
    __tablename__ = "users"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)  # Stored permanently
    first_name = Column(String(100), nullable=True)  # User's first name
    business_name = Column(String(255), nullable=True)
    business_address = Column(Text, nullable=True)
    bank_name = Column(String(100), nullable=True)
    bank_account_number = Column(String(50), nullable=True)
    bank_account_name = Column(String(255), nullable=True)
    payment_method = Column(String(50), default="bank_transfer")
    bot_style = Column(String(20), default="corporate")  # corporate or street
    is_active = Column(Integer, default=1)  # 1 for active, 0 for inactive
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    products = relationship("Product", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="user", cascade="all, delete-orphan")


class Product(Base):
    """Product inventory model."""
    __tablename__ = "products"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    price_ngn = Column(Float, nullable=False)
    stock_level = Column(Integer, default=0, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    image_url = Column(Text, nullable=True)
    voice_tags = Column(Text, nullable=True)  # Stored as JSON string (SQL Server doesn't have native JSON)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")


class Order(Base):
    """Order model for customer purchases."""
    __tablename__ = "orders"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    customer_phone = Column(String(20), nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), nullable=False, default="pending", index=True)
    payment_ref = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    fulfilled_at = Column(DateTime, nullable=True)
    
    # Add check constraint for status
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'paid', 'fulfilled', 'cancelled')",
            name="check_order_status"
        ),
    )
    
    # Relationships
    user = relationship("User", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """Order items linking orders to products."""
    __tablename__ = "order_items"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(GUID, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(GUID, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(255), nullable=False)  # Denormalized for historical accuracy
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)  # Price at time of order
    total = Column(Float, nullable=False)  # quantity * price
    
    # Relationships
    order = relationship("Order", back_populates="order_items")
    product = relationship("Product", back_populates="order_items")


class Expense(Base):
    """Expense tracking model for vendors."""
    __tablename__ = "expenses"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    amount = Column(Float, nullable=False)
    description = Column(String(500), nullable=False)
    category = Column(String(100), nullable=False, default="misc")
    expense_type = Column(String(50), nullable=False, default="BUSINESS")
    date = Column(DateTime, default=datetime.utcnow, index=True)
    receipt_image_url = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

