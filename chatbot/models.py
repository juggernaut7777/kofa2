"""SQLAlchemy database models for KOFA Commerce Engine.
Compatible with both MySQL and SQL Server.
"""
from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Text, CheckConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
from datetime import datetime
import uuid

# Use String(36) for UUIDs - works with both MySQL and SQL Server
GUID = String(36)

Base = declarative_base()


class User(Base):
    """User/Vendor model for merchants."""
    __tablename__ = "users"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    phone = Column(String(20), unique=True, nullable=False, index=True)
    email = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True)
    first_name = Column(String(100), nullable=True)
    business_name = Column(String(255), nullable=True)
    business_address = Column(Text, nullable=True)
    bank_name = Column(String(100), nullable=True)
    bank_account_number = Column(String(50), nullable=True)
    bank_account_name = Column(String(255), nullable=True)
    payment_method = Column(String(50), default="bank_transfer")
    bot_style = Column(String(20), default="corporate")
    is_active = Column(Integer, default=1)
    default_currency = Column(String(3), default="NGN")  # Multi-currency support
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
    cost_price = Column(Float, nullable=True)  # Cost of goods for accurate P&L
    stock_level = Column(Integer, default=0, nullable=False)
    description = Column(Text, nullable=True)
    category = Column(String(100), nullable=True, index=True)
    image_url = Column(Text, nullable=True)
    voice_tags = Column(Text, nullable=True)  # JSON string
    has_variants = Column(Integer, default=0)  # 1 if product has size/color variants
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    user = relationship("User", back_populates="products")
    order_items = relationship("OrderItem", back_populates="product")
    variants = relationship("ProductVariant", back_populates="product", cascade="all, delete-orphan")


class ProductVariant(Base):
    """Product variants for size/color combinations (e.g. Size S/M/L, Color Red/Blue)."""
    __tablename__ = "product_variants"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    product_id = Column(GUID, ForeignKey("products.id"), nullable=False, index=True)
    variant_type = Column(String(50), nullable=False)  # "size", "color", "material"
    variant_value = Column(String(100), nullable=False)  # "S", "M", "L", "Red", "Blue"
    sku = Column(String(100), nullable=True)
    price_adjustment = Column(Float, default=0)  # +/- from base price
    stock_level = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    product = relationship("Product", back_populates="variants")


class Order(Base):
    """Order model for customer purchases."""
    __tablename__ = "orders"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    customer_phone = Column(String(20), nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    currency = Column(String(3), default="NGN")  # Multi-currency support
    exchange_rate = Column(Float, default=1.0)  # Rate to NGN at time of order
    status = Column(String(20), nullable=False, default="pending", index=True)
    payment_ref = Column(String(100), nullable=True)
    notes = Column(Text, nullable=True)
    channel = Column(String(20), default="whatsapp")  # whatsapp, instagram, web, walkin
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    paid_at = Column(DateTime, nullable=True)
    fulfilled_at = Column(DateTime, nullable=True)
    
    __table_args__ = (
        CheckConstraint(
            "status IN ('pending', 'paid', 'fulfilled', 'cancelled')",
            name="check_order_status"
        ),
    )
    
    user = relationship("User", back_populates="orders")
    order_items = relationship("OrderItem", back_populates="order", cascade="all, delete-orphan")


class OrderItem(Base):
    """Order items linking orders to products."""
    __tablename__ = "order_items"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    order_id = Column(GUID, ForeignKey("orders.id"), nullable=False, index=True)
    product_id = Column(GUID, ForeignKey("products.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    variant_info = Column(String(255), nullable=True)  # e.g. "Size: L, Color: Red"
    quantity = Column(Integer, nullable=False)
    price = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    
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


class VerificationCode(Base):
    """Email verification codes for registration."""
    __tablename__ = "verification_codes"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    email = Column(String(255), nullable=False, unique=True, index=True)
    code = Column(String(10), nullable=False)
    password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    business_name = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)


# ============== NEW MODELS ==============

class AuditLog(Base):
    """Audit log — tracks every action (who changed what, when)."""
    __tablename__ = "audit_logs"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, nullable=False, index=True)
    action = Column(String(100), nullable=False, index=True)  # "product.create", "order.update"
    entity_type = Column(String(50), nullable=False)  # "product", "order", "expense"
    entity_id = Column(GUID, nullable=True)
    details = Column(Text, nullable=True)  # JSON string with change details
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)


class RefreshToken(Base):
    """JWT refresh tokens for secure token rotation."""
    __tablename__ = "refresh_tokens"
    
    id = Column(GUID, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(GUID, ForeignKey("users.id"), nullable=False, index=True)
    token_hash = Column(String(255), nullable=False, unique=True)
    expires_at = Column(DateTime, nullable=False)
    revoked = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_used_at = Column(DateTime, nullable=True)
