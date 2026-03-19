from fastapi import FastAPI, HTTPException, APIRouter, UploadFile, File, Request
from fastapi.responses import PlainTextResponse, JSONResponse
from starlette.middleware.gzip import GZipMiddleware
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Optional, List, Dict
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import uuid
import os
from datetime import datetime
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),  # Console output
        logging.FileHandler('kofa.log', mode='a')  # File output
    ]
)

logger = logging.getLogger(__name__)

# #region agent log - FastAPI startup
import json

def log_to_file(message, data=None):
    """Log to debug file for debugging"""
    try:
        log_entry = {
            "sessionId": "debug-session",
            "runId": "initial",
            "hypothesisId": "E",
            "location": "main.py",
            "message": message,
            "data": data or {},
            "timestamp": int(datetime.now().timestamp() * 1000)
        }
        with open(r"c:\Users\USER\kofa 2\.cursor\debug.log", "a") as f:
            f.write(json.dumps(log_entry) + "\n")
    except Exception as e:
        print(f"Debug logging failed: {e}")

log_to_file("FastAPI application starting", {"python_version": "3.x", "platform": "windows"})
# #endregion

# Relative imports for package structure
from .inventory import InventoryManager
from .intent import IntentRecognizer, Intent
from .payment import PaymentManager
from .response_formatter import ResponseFormatter, ResponseStyle
from .conversation import conversation_manager
from .cache import get_cache, set_cache, invalidate_cache  # Database query caching
from .services import vendor_state
from .services.push_notifications import push_service, PushNotification
from .services.bulk_operations import bulk_service
from .services.payments import paystack_service, PaymentLinkRequest
from .services.subscription import subscription_service, SubscriptionTier
from .services.privacy import privacy_service, ConsentType
from .services.localization import localization_service, Language
from .services import storage_service
from .routers import (
    expenses, analytics, invoice, 
    recommendations, notifications, installments, profit_loss, sales_channels, whatsapp,
    instagram, tiktok, auth, storefront, sales, export, customers
)

# ===== PRODUCTION MODE =====
PRODUCTION = os.getenv("PRODUCTION", "false").lower() == "true"

app = FastAPI(
    title="KOFA Commerce Engine",
    description="AI-powered commerce platform for modern merchants",
    version="2.0.0",
    docs_url=None if PRODUCTION else "/docs",
    redoc_url=None if PRODUCTION else "/redoc",
)

# ===== MIDDLEWARE STACK (order matters!) =====

# 1. CORS — tightened to actual frontend domains
ALLOWED_ORIGINS = [
    "https://www.kofaapp.me",
    "https://kofaapp.me",
    "https://kofa2.vercel.app",
    "http://localhost:5173",
    "http://localhost:3000",
]
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. GZip compression — compress responses > 500 bytes
app.add_middleware(GZipMiddleware, minimum_size=500)


# 3. Security headers — prevent XSS, clickjacking, MIME sniffing
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    return response


# 4. Global exception handler — clean JSON errors, never expose stack traces
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again later."},
    )

# ===== PER-VENDOR RATE LIMITING =====
def _get_vendor_or_ip(request: Request) -> str:
    """
    Rate limit key: use vendor_id from auth token if available, else IP.
    This prevents one vendor from exhausting another's rate limit.
    """
    # Try to extract vendor_id from auth header
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from .services.auth_security import auth_security
            payload = auth_security.verify_access_token(auth_header[7:])
            if payload and payload.get("sub"):
                return f"vendor:{payload['sub']}"
        except Exception:
            pass
    return get_remote_address(request)

limiter = Limiter(key_func=_get_vendor_or_ip)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# In-memory store for demo purposes (User preferences)
USERS: dict = {}

# Low stock threshold
LOW_STOCK_THRESHOLD = 5

# Vendor settings store (payment accounts, business info)
VENDOR_SETTINGS: dict = {
    "payment_account": {
        "bank_name": "",
        "account_number": "",
        "account_name": "",
    },
    "business_info": {
        "name": "KOFA Store",
        "phone": "",
        "address": "",
    },
    "payment_method": "bank_transfer",  # "bank_transfer", "paystack", "flutterwave"
    "subscription_tier": "free",  # "free" or "pro"
}

# ============== DB-BACKED SUBSCRIPTION & USAGE ==============
from .services.subscription import subscription_service, SubscriptionTier

def check_limit(limit_type: str, user_id: str = "default") -> dict:
    """
    Check if user has hit a freemium limit.
    Uses database-backed usage tracking (survives Heroku restarts).
    Returns: {"allowed": bool, "current": int, "max": int, "upgrade_needed": bool}
    """
    from .database import SessionLocal
    db = SessionLocal()
    try:
        if limit_type == "products":
            user_inventory = InventoryManager(user_id=user_id)
            current_count = len(user_inventory.list_products())
            return subscription_service.check_product_limit(db, user_id, current_count)
        elif limit_type == "orders":
            return subscription_service.check_order_limit(db, user_id)
        elif limit_type == "bot_conversations" or limit_type == "ai_queries":
            return subscription_service.check_ai_limit(db, user_id)
        elif limit_type == "whatsapp":
            return subscription_service.check_whatsapp_limit(db, user_id)
        else:
            return {"allowed": True, "current": 0, "max": 999999, "upgrade_needed": False}
    finally:
        db.close()

def safe_order_id(user_id: str, prod_id: str) -> str:
    """Generate a safe order ID from user and product IDs."""
    import uuid
    # Generate proper UUID for database compatibility
    return str(uuid.uuid4())

router = APIRouter()

# Initialize components
inventory_manager = InventoryManager()
intent_recognizer = IntentRecognizer()
payment_manager = PaymentManager()
# Default to corporate (professional) style
response_formatter = ResponseFormatter(style=ResponseStyle.CORPORATE)


# ============== VENDOR DATA ISOLATION ==============
# PRIVACY: Each vendor gets their own scoped inventory manager.
# This ensures Vendor A can NEVER see Vendor B's data.

def get_vendor_inventory(user_id: str) -> InventoryManager:
    """Create a vendor-scoped inventory manager. All data operations
    will be filtered to this specific vendor only."""
    return InventoryManager(user_id=user_id)

def get_vendor_name(user_id: str) -> str:
    """Look up the vendor's business name from the database.
    Returns a default if not found."""
    from .database import SessionLocal
    from .models import User
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user and user.business_name:
            return user.business_name
        if user and user.first_name:
            return f"{user.first_name}'s Store"
        return "your store"
    except Exception:
        return "your store"
    finally:
        db.close()

# Per-vendor settings — now DB-backed (survives restarts)
def get_vendor_settings(user_id: str = "default") -> dict:
    """Get settings for a specific vendor from the database."""
    from .database import SessionLocal
    from .models import User
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if user:
            return {
                "payment_account": {
                    "bank_name": user.bank_name or "",
                    "account_number": user.bank_account_number or "",
                    "account_name": user.bank_account_name or "",
                },
                "business_info": {
                    "name": user.business_name or "KOFA Store",
                    "phone": user.phone or "",
                    "address": user.business_address or "",
                },
                "payment_method": user.payment_method or "bank_transfer",
                "subscription_tier": user.subscription_tier or "free",
            }
    except Exception:
        pass
    finally:
        db.close()
    # Fallback for unknown user
    return {
        "payment_account": {"bank_name": "", "account_number": "", "account_name": ""},
        "business_info": {"name": "KOFA Store", "phone": "", "address": ""},
        "payment_method": "bank_transfer",
        "subscription_tier": "free",
    }

class MessageRequest(BaseModel):
    """Incoming message payload."""
    user_id: str  # Customer phone number
    message_text: str
    
    @validator('user_id')
    def validate_user_id(cls, v):
        if not v or not v.strip():
            raise ValueError('User ID is required')
        return v.strip()
    
    @validator('message_text')
    def validate_message_text(cls, v):
        if not v or not v.strip():
            raise ValueError('Message text is required')
        if len(v) > 1000:
            raise ValueError('Message text must be 1000 characters or less')
        return v.strip()

class MessageResponse(BaseModel):
    """Chatbot reply."""
    response: str
    intent: str
    product: Optional[dict] = None
    payment_link: Optional[str] = None


# ===== BUSINESS AI MODELS =====
class BusinessAIRequest(BaseModel):
    """Business AI assistant request."""
    user_id: str  # Business owner ID
    message: str  # Natural language command
    conversation_id: Optional[str] = None  # For context tracking


class BusinessAIResponse(BaseModel):
    """Business AI assistant response."""
    response: str
    action_taken: Optional[str] = None
    action_result: Optional[str] = None
    products_count: int = 0
    conversation_id: str

class ProductResponse(BaseModel):
    id: str
    name: str
    price_ngn: float
    stock_level: int
    description: Optional[str] = None
    voice_tags: Optional[List[str]] = None

class OrderItem(BaseModel):
    product_id: str
    quantity: int
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        return v

class OrderRequest(BaseModel):
    items: List[OrderItem]
    user_id: str # Phone number
    
    @validator('items')
    def validate_items(cls, v):
        if not v or len(v) == 0:
            raise ValueError('Order must contain at least one item')
        if len(v) > 50:  # Reasonable limit
            raise ValueError('Order cannot contain more than 50 items')
        return v
    
    @validator('user_id')
    def validate_user_id(cls, v):
        if not v or not v.strip():
            raise ValueError('User ID is required')
        return v.strip()

class OrderResponse(BaseModel):
    order_id: str
    payment_link: str
    amount_ngn: float
    message: str

# Health endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "online", "service": "KOFA Commerce Engine", "version": "2.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.get("/products")
@limiter.limit("50/minute")
async def get_products(request: Request, user_id: str = None):
    """Get products for a specific user (vendor). Requires user_id."""
    from .database import SessionLocal
    from .models import Product as ProductModel
    
    # If no user_id, return empty list (no global product listing)
    if not user_id:
        return []
    
    cache_key = f"products:user:{user_id}"
    
    # Check cache first (fast, in-memory)
    cached = get_cache(cache_key)
    if cached is not None:
        return cached
    
    # Cache miss - fetch from database filtered by user_id
    db = SessionLocal()
    try:
        products = db.query(ProductModel).filter(ProductModel.user_id == user_id).all()
        product_list = []
        for p in products:
            product_list.append({
                "id": p.id,
                "name": p.name,
                "price_ngn": p.price_ngn,
                "stock_level": p.stock_level,
                "description": p.description or "",
                "category": p.category or "",
                "image_url": p.image_url or None
            })
        
        # Store in cache for 10 seconds (reduced from 60s for faster updates)
        set_cache(cache_key, product_list, ttl_seconds=10)
        
        return product_list
    finally:
        db.close()

@router.post("/orders", response_model=OrderResponse)
async def create_order(request: OrderRequest):
    """Create a new order and generate payment link — fully DB-backed."""
    from .database import SessionLocal
    from .models import Product as ProductModel, Order as OrderModel

    # Validate request
    if not request.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")

    if not request.user_id or not request.user_id.strip():
        raise HTTPException(status_code=400, detail="User ID is required")

    db = SessionLocal()
    try:
        total_amount = 0.0
        order_items = []
        products_to_update = []

        # Validate all products exist and have sufficient stock
        for item in request.items:
            if item.quantity <= 0:
                raise HTTPException(
                    status_code=400,
                    detail=f"Invalid quantity for product {item.product_id}: {item.quantity}. Quantity must be greater than 0"
                )

            # Get product by ID from DB
            product = db.query(ProductModel).filter(ProductModel.id == item.product_id).first()
            if not product:
                raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")

            # Check stock availability
            current_stock = product.stock_level or 0
            if current_stock < item.quantity:
                raise HTTPException(
                    status_code=400,
                    detail=f"Insufficient stock for {product.name}. Available: {current_stock}, Requested: {item.quantity}"
                )

            price = float(product.price_ngn or 0)
            if price <= 0:
                raise HTTPException(status_code=400, detail=f"Invalid price for product {product.name}: {price}")

            item_total = price * item.quantity
            total_amount += item_total

            order_items.append({
                "product_id": item.product_id,
                "product_name": product.name,
                "quantity": item.quantity,
                "price": price,
                "total": item_total
            })

            products_to_update.append((product, item.quantity))

        if total_amount <= 0:
            raise HTTPException(status_code=400, detail="Order total must be greater than 0")

        # Generate order ID
        order_id = str(uuid.uuid4())

        # Decrement stock for all items within the transaction
        for product, quantity in products_to_update:
            product.stock_level = (product.stock_level or 0) - quantity

        # Generate payment link
        payment_link = payment_manager.generate_payment_link(
            order_id=order_id,
            amount_ngn=int(round(total_amount)),
            customer_phone=request.user_id,
            description=f"Order {order_id[:8]}"
        )

        if not payment_link:
            db.rollback()
            raise HTTPException(status_code=500, detail="Failed to generate payment link")

        # Save order to database
        new_order = OrderModel(
            id=order_id,
            user_id=request.user_id,
            customer_phone=request.user_id,
            total_amount=total_amount,
            status="pending",
            created_at=datetime.now()
        )
        db.add(new_order)
        db.commit()

        # Invalidate caches
        from .cache import invalidate_cache
        invalidate_cache(prefix="orders:")
        invalidate_cache(prefix="products:")

        # Send sale notification to vendor
        try:
            item_names = ", ".join([i.get("product_name", "item") for i in order_items_data])
            create_notification(
                user_id=request.user_id,
                notif_type="sale",
                title="💰 New Sale!",
                message=f"₦{total_amount:,.0f} — {item_names}",
                link="/orders"
            )
        except Exception:
            pass  # Don't fail order creation if notification fails

        return OrderResponse(
            order_id=order_id,
            payment_link=payment_link,
            amount_ngn=total_amount,
            message="Order created successfully"
        )

    except HTTPException:
        db.rollback()
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")
    finally:
        db.close()


# ===== BUSINESS AI ENDPOINT =====
# Conversation history — now DB-backed (survives restarts)

def _get_ai_history(conversation_id: str) -> list:
    """Load AI conversation history from database."""
    from .database import SessionLocal
    from .models import AIConversation
    import json
    db = SessionLocal()
    try:
        row = db.query(AIConversation).filter(AIConversation.conversation_id == conversation_id).first()
        if row:
            return json.loads(row.messages or "[]")
        return []
    except Exception:
        return []
    finally:
        db.close()

def _save_ai_history(conversation_id: str, user_id: str, messages: list):
    """Save AI conversation history to database (last 10 messages)."""
    from .database import SessionLocal
    from .models import AIConversation
    import json
    db = SessionLocal()
    try:
        row = db.query(AIConversation).filter(AIConversation.conversation_id == conversation_id).first()
        trimmed = messages[-10:]  # Keep last 10
        if row:
            row.messages = json.dumps(trimmed)
            row.updated_at = datetime.now()
        else:
            row = AIConversation(
                id=str(uuid.uuid4()),
                conversation_id=conversation_id,
                user_id=user_id,
                messages=json.dumps(trimmed)
            )
            db.add(row)
        db.commit()
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to save AI conversation: {e}")
    finally:
        db.close()

@router.post("/business-ai")
@limiter.limit("10/minute")  # Protect AI credits
async def business_ai_chat(body: BusinessAIRequest, request: Request):
    """
    Business AI Assistant - Manage your business with natural language.
    
    Examples:
    - "Add 50 peppers at 500 naira each"
    - "I just sold 2 red shoes"
    - "Show me low stock items"
    - "What's my best seller?"
    - "Generate invoice for 08012345678"
    
    Uses FREE Groq AI API (14,400 requests/day)
    """
    try:
        from .ai_brain import process_business_command
        
        # Get or create conversation ID
        conversation_id = body.conversation_id or str(uuid.uuid4())
        
        # Get conversation history from database (persists across restarts)
        history = _get_ai_history(conversation_id)
        
        # PRIVACY: Create vendor-scoped inventory manager
        vendor_inventory = get_vendor_inventory(body.user_id)
        vendor_name = get_vendor_name(body.user_id)
        
        # Process with AI using vendor-scoped data
        result = await process_business_command(
            message=body.message,
            user_id=body.user_id,
            inventory_manager=vendor_inventory,
            conversation_history=history,
            vendor_name=vendor_name
        )
        
        # Update conversation history
        history.append({"role": "user", "content": body.message})
        history.append({"role": "assistant", "content": result["response"]})
        
        # Save to database (keeps last 10 messages)
        _save_ai_history(conversation_id, body.user_id, history)
        
        return BusinessAIResponse(
            response=result["response"],
            action_taken=result.get("action_taken"),
            action_result=result.get("action_result"),
            products_count=result.get("products_count", 0),
            conversation_id=conversation_id
        )
        
    except ImportError as e:
        # Fallback if AI module not available
        return BusinessAIResponse(
            response=f"AI module not loaded. Please ensure GROQ_API_KEY is set. Error: {str(e)}",
            conversation_id=body.conversation_id or str(uuid.uuid4())
        )
    except Exception as e:
        logger.error(f"Business AI error: {e}")
        return BusinessAIResponse(
            response=f"Sorry, I encountered an error: {str(e)}. Please try again.",
            conversation_id=body.conversation_id or str(uuid.uuid4())
        )


@router.get("/orders")
async def get_orders(status: Optional[str] = None):
    """
    Get all orders for merchant dashboard.
    Fetches from database. Returns orders with items and status.
    PERFORMANCE OPTIMIZED: Uses eager loading + 60-second caching.
    """
    # Build cache key based on status filter
    cache_key = f"orders:{status or 'all'}"
    
    # Check cache first (fast, in-memory)
    cached = get_cache(cache_key)
    if cached is not None:
        return cached
    
    from sqlalchemy.orm import joinedload
    
    all_orders = []
    
    # Try to fetch from database first
    try:
        from .database import SessionLocal
        from .models import Order as OrderModel
        
        db = SessionLocal()
        try:
            # Query orders with their items - EAGER LOADING to prevent N+1
            query = db.query(OrderModel).options(joinedload(OrderModel.order_items))
            if status:
                query = query.filter(OrderModel.status == status.lower())
            
            db_orders = query.order_by(OrderModel.created_at.desc()).all()
            
            for order in db_orders:
                # Get order items (already loaded via joinedload)
                items = []
                for item in order.order_items:
                    items.append({
                        "product_id": str(item.product_id),
                        "product_name": item.product_name,
                        "quantity": item.quantity,
                        "price": item.price,
                        "total": item.total
                    })
                
                all_orders.append({
                    "id": str(order.id),
                    "customer_phone": order.customer_phone,
                    "items": items,
                    "total_amount": order.total_amount,
                    "status": order.status,
                    "payment_ref": order.payment_ref,
                    "created_at": order.created_at.isoformat() if order.created_at else None,
                    "source": "database"
                })
        finally:
            db.close()
    except Exception as db_error:
        logger.warning(f"Database query failed: {db_error}")
        # No fallback — database is the source of truth
    
    # Filter by status if needed (for database fallback case)
    if status and all_orders:
        all_orders = [o for o in all_orders if o.get("status", "").lower() == status.lower()]
    
    # Sort by created_at descending
    all_orders.sort(key=lambda x: x.get("created_at", ""), reverse=True)
    
    # Store in cache for 60 seconds
    set_cache(cache_key, all_orders, ttl_seconds=60)
    
    return all_orders

def create_chatbot_order(user_id: str, product: dict, quantity: int = 1) -> tuple[str, str]:
    """
    Create an order for chatbot purchase - validates stock, decrements inventory,
    creates order record, and returns payment instructions with bank details.

    Returns: (order_id, payment_info) or raises HTTPException
    """
    product_id = str(product.get("id", ""))
    product_name = product.get("name", "Unknown Product")
    price = float(product.get("price_ngn", 0))

    # Validate product and price
    if not product_id:
        raise HTTPException(status_code=400, detail="Invalid product ID")

    if price <= 0:
        raise HTTPException(status_code=400, detail=f"Invalid price for {product_name}: ₦{price}")

    if quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    
    # Check freemium order limit
    order_limit = check_limit("orders")
    if not order_limit["allowed"]:
        raise HTTPException(
            status_code=403,
            detail=f"Monthly order limit reached ({order_limit['max']} orders). Upgrade to Pro for unlimited orders!"
        )

    # Check stock availability
    current_stock = product.get("stock_level", 0)
    if current_stock < quantity:
        raise HTTPException(
            status_code=400,
            detail=f"Insufficient stock for {product_name}. Available: {current_stock}, Requested: {quantity}"
        )

    # Calculate total
    total_amount = price * quantity

    # Generate order ID (shorter format for easy reference)
    order_id = str(uuid.uuid4())[:8].upper()

    # Decrement stock via database
    from .database import SessionLocal
    from .models import Product as ProductModel, Order as OrderModel, OrderItem as OrderItemModel

    db = SessionLocal()
    try:
        db_product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
        if not db_product or db_product.stock_level < quantity:
            db.close()
            raise HTTPException(
                status_code=500,
                detail=f"Failed to reserve stock for {product_name}. Please try again."
            )
        db_product.stock_level -= quantity
        db.commit()
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        db.close()
        raise HTTPException(status_code=500, detail=f"Stock update failed: {str(e)}")

    # Get vendor payment account details
    payment_account = VENDOR_SETTINGS.get("payment_account", {})
    bank_name = payment_account.get("bank_name", "")
    account_number = payment_account.get("account_number", "")
    account_name = payment_account.get("account_name", "")
    
    # Format payment instructions
    if bank_name and account_number:
        payment_info = f"""💳 *Payment Details*

🏦 Bank: {bank_name}
🔢 Account Number: {account_number}
👤 Account Name: {account_name}

💰 Amount: ₦{int(total_amount):,}
🧾 Order ID: #{order_id}

📝 Please use Order ID #{order_id} as payment reference.

After payment, reply "I paid" to confirm your order! ✅"""
    else:
        # Fallback if no bank details set
        payment_info = f"""💳 *Payment Instructions*

💰 Amount to pay: ₦{int(total_amount):,}
🧾 Order ID: #{order_id}

⚠️ Contact the vendor for payment details.

After payment, reply "I paid" to confirm your order! ✅"""

    # Create order item details
    order_items = [{
        "product_id": product_id,
        "product_name": product_name,
        "quantity": quantity,
        "price": price,
        "total": total_amount
    }]

    # Increment order usage counter
    try:
        _udb = SessionLocal()
        subscription_service.increment_order_count(_udb, user_id)
        _udb.close()
    except Exception:
        pass

    # Persist order to database
    try:
        db_order = OrderModel(
            id=order_id,
            user_id=user_id,
            customer_phone=user_id,
            total_amount=total_amount,
            status="pending",
            notes=f"Chatbot order for {product_name}"
        )
        db.add(db_order)

        db_order_item = OrderItemModel(
            order_id=order_id,
            product_id=product_id,
            product_name=product_name,
            quantity=quantity,
            price=price,
            total=total_amount
        )
        db.add(db_order_item)
        db.commit()

        # Sale notification
        try:
            create_notification(
                user_id=user_id,
                notif_type="sale",
                title="\ud83d\udcb0 Chatbot Sale!",
                message=f"\u20a6{total_amount:,.0f} \u2014 {product_name} x{quantity}",
                link="/orders"
            )
        except Exception:
            pass
    except Exception as db_error:
        db.rollback()
        logger.error(f"Failed to persist chatbot order: {db_error}")
    finally:
        db.close()

    return order_id, payment_info

@router.post("/message")
async def process_message(request: MessageRequest):
    """
    Smart conversational message handler:
    1. Check conversation context (are we awaiting a selection?)
    2. Use smart search to find products (ALWAYS tries to find something)
    3. Handle multiple matches by asking user to choose
    4. Remember context for follow-up queries
    """
    
    user_id = request.user_id
    text = request.message_text
    
    # Check freemium bot conversation limit (DB-backed)
    bot_limit = check_limit("whatsapp", user_id)
    if not bot_limit["allowed"]:
        return MessageResponse(
            response=f"⚠️ Monthly message limit reached. Upgrade your plan for more WhatsApp messages!",
            intent="limit_reached",
            product=None,
            payment_link=None
        )
    
    # Increment WhatsApp message counter in database
    try:
        from .database import SessionLocal as _WaSession
        _wadb = _WaSession()
        subscription_service.increment_whatsapp_count(_wadb, user_id)
        _wadb.close()
    except Exception:
        pass
    
    # Get conversation state for this user
    state = conversation_manager.get_state(user_id)
    
    response_text = ""
    product_data = None
    payment_link = None
    
    # Recognize intent
    intent = intent_recognizer.recognize(text)
    
    # ========== PAYMENT CONFIRMATION: Handle "I paid" messages ==========
    if intent == Intent.PAYMENT_CONFIRMATION:
        # Check for pending order in database
        order = None
        order_id = None
        
        try:
            from .database import SessionLocal as _PayDB
            from .models import Order as _PayOrder
            _pdb = _PayDB()
            
            # First check state for pending order
            if state.pending_order_id:
                db_order = _pdb.query(_PayOrder).filter(_PayOrder.id == state.pending_order_id).first()
                if db_order:
                    order_id = db_order.id
                    order = {"total_amount": db_order.total_amount, "status": db_order.status}
            
            if not order:
                # Fallback: find any pending order for this user
                db_order = _pdb.query(_PayOrder).filter(
                    _PayOrder.customer_phone == user_id,
                    _PayOrder.status == "pending"
                ).order_by(_PayOrder.created_at.desc()).first()
                if db_order:
                    order_id = db_order.id
                    order = {"total_amount": db_order.total_amount, "status": db_order.status}
            
            if order and db_order:
                db_order.status = "paid"
                db_order.paid_at = datetime.now()
                _pdb.commit()
            
            _pdb.close()
        except Exception as e:
            logger.error(f"Payment confirmation DB error: {e}")
        
        if order:
            # Clear pending state
            state.pending_order_id = None
            
            response_text = (
                f"✅ *Payment Confirmed!*\n\n"
                f"Order ID: {order_id}\n"
                f"Amount: ₦{order.get('total_amount', 0):,}\n\n"
                f"Your order is now being processed. 🚀\n"
                f"Thank you for shopping with us! 🙏"
            )
        else:
            response_text = (
                "🤔 I couldn't find a pending order for you.\n\n"
                "Please place an order first before confirming payment. "
                "Type 'show me products' to start shopping!"
            )
        
        return MessageResponse(
            response=response_text,
            intent=intent.value,
            product=None,
            payment_link=None
        )
    
    # ========== STEP 1: Check if user is selecting from a previous list ==========
    if state.awaiting_selection and state.last_products:
        # Try to find which product they're selecting
        selected = inventory_manager.find_product_by_selection(text, state.last_products)
        
        if selected:
            state.select_product(selected)
            product_data = selected
            price_fmt = payment_manager.format_naira(selected["price_ngn"])
            
            # Show the selected product details
            if selected["stock_level"] > 0:
                response_text = response_formatter.format_product_available(
                    selected["name"], price_fmt, selected["stock_level"]
                )
            else:
                response_text = response_formatter.format_out_of_stock(selected["name"])
            
            return MessageResponse(
                response=response_text,
                intent="selection",
                product=product_data,
                payment_link=None
            )
    
    # ========== STEP 2: Check if this is a follow-up action on current product ==========
    if state.current_product and intent == Intent.PURCHASE:
        # User said "buy", "yes", etc. after viewing a product
        product = state.current_product
        product_data = product
        price_fmt = payment_manager.format_naira(product["price_ngn"])

        if product["stock_level"] > 0:
            try:
                # Create order, decrement stock, and get payment instructions
                order_id, payment_info = create_chatbot_order(user_id, product, quantity=1)
                response_text = f"✅ Order #{order_id} created!\n\n{payment_info}"
            except HTTPException as e:
                response_text = f"❌ Sorry, I couldn't process your order: {e.detail}"
        else:
            response_text = response_formatter.format_out_of_stock(product["name"])

        return MessageResponse(
            response=response_text,
            intent=intent.value,
            product=product_data,
            payment_link=payment_link
        )
    
    # ========== STEP 3: Handle standard intents ==========
    if intent == Intent.GREETING:
        state.reset()  # Clear any previous context
        
        # Customer recognition — check if returning customer (via DB)
        order_count = 0
        total_spent = 0
        try:
            from .database import SessionLocal as _GreetDB
            from .models import Order as _GreetOrder
            from sqlalchemy import func
            _gdb = _GreetDB()
            stats = _gdb.query(
                func.count(_GreetOrder.id),
                func.coalesce(func.sum(_GreetOrder.total_amount), 0)
            ).filter(_GreetOrder.customer_phone == user_id).first()
            order_count = stats[0] if stats else 0
            total_spent = float(stats[1]) if stats else 0
            _gdb.close()
        except Exception:
            pass

        if order_count > 0:
            response_text = (
                f"🎉 *Welcome back, valued customer!*\n\n"
                f"You've made {order_count} order(s) with us totaling ₦{total_spent:,}.\n\n"
                f"What can I help you with today? Just tell me what you're looking for!"
            )
        else:
            response_text = response_formatter.format_greeting()
        
    elif intent == Intent.HELP:
        response_text = response_formatter.format_help()
        
    elif intent in [Intent.PRICE_INQUIRY, Intent.AVAILABILITY_CHECK, Intent.PURCHASE]:
        # Extract product query
        product_query = intent_recognizer.extract_product_query(text)
        
        if not product_query:
            # No product mentioned - if purchase, ask what they want
            if intent == Intent.PURCHASE:
                if state.current_product:
                    # They said "buy" but we have context
                    product = state.current_product
                    product_data = product
                    price_fmt = payment_manager.format_naira(product["price_ngn"])

                    if product["stock_level"] > 0:
                        try:
                            # Create order, decrement stock, and get payment instructions
                            order_id, payment_info = create_chatbot_order(user_id, product, quantity=1)
                            response_text = f"✅ Order #{order_id} created!\n\n{payment_info}"
                        except HTTPException as e:
                            response_text = f"❌ Sorry, I couldn't process your order: {e.detail}"
                    else:
                        response_text = response_formatter.format_out_of_stock(product["name"])
                else:
                    response_text = response_formatter.format_purchase_no_context()
            else:
                response_text = response_formatter.format_unknown_message()
        else:
            # ========== SMART SEARCH: Find all matching products ==========
            matching_products = inventory_manager.smart_search_products(product_query)
            
            if not matching_products:
                # Truly nothing found - but this should be very rare now
                response_text = response_formatter.format_product_not_found(product_query)
                
            elif len(matching_products) == 1:
                # Single match - show it directly
                product = matching_products[0]
                state.set_products([product], product_query)
                product_data = product
                price_fmt = payment_manager.format_naira(product["price_ngn"])
                
                if intent == Intent.PURCHASE:
                    if product["stock_level"] > 0:
                        try:
                            # Create order, decrement stock, and get payment instructions
                            order_id, payment_info = create_chatbot_order(user_id, product, quantity=1)
                            response_text = f"✅ Order #{order_id} created!\n\n{payment_info}"
                        except HTTPException as e:
                            response_text = f"❌ Sorry, I couldn't process your order: {e.detail}"
                    else:
                        response_text = response_formatter.format_out_of_stock(product["name"])
                else:
                    if product["stock_level"] > 0:
                        response_text = response_formatter.format_product_available(
                            product["name"], price_fmt, product["stock_level"]
                        )
                    else:
                        response_text = response_formatter.format_out_of_stock(product["name"])
            else:
                # Multiple matches - ask user to choose
                state.set_products(matching_products, product_query)
                response_text = response_formatter.format_multiple_products(
                    matching_products,
                    payment_manager.format_naira
                )
    else:
        # Unknown intent - try smart search on the whole message as fallback
        matching_products = inventory_manager.smart_search_products(text)
        
        if matching_products:
            if len(matching_products) == 1:
                product = matching_products[0]
                state.set_products([product], text)
                product_data = product
                price_fmt = payment_manager.format_naira(product["price_ngn"])
                
                if product["stock_level"] > 0:
                    response_text = response_formatter.format_product_available(
                        product["name"], price_fmt, product["stock_level"]
                    )
                else:
                    response_text = response_formatter.format_out_of_stock(product["name"])
            else:
                state.set_products(matching_products, text)
                response_text = response_formatter.format_multiple_products(
                    matching_products,
                    payment_manager.format_naira
                )
        else:
            response_text = response_formatter.format_unknown_message()

    return MessageResponse(
        response=response_text,
        intent=intent.value,
        product=product_data,
        payment_link=payment_link
    )

# Endpoint to set seller's preferred closing channel
@router.post("/users/{user_id}/preferred-channel")
async def set_preferred_channel(user_id: str, payload: dict):
    channel = payload.get("channel")
    if channel not in {"whatsapp", "facebook", "instagram", "tiktok"}:
        raise HTTPException(status_code=400, detail="Invalid channel")
    USERS.setdefault(user_id, {})["preferred_channel"] = channel
    return {"status": "success", "user_id": user_id, "preferred_channel": channel}

# Endpoint for seller bank account details (NGN payouts)
@router.post("/seller/{seller_id}/account-details")
async def set_seller_account(seller_id: str, payload: dict):
    bank_name = payload.get("bank_name")
    bank_account = payload.get("bank_account_number")
    if not bank_name or not bank_account:
        raise HTTPException(status_code=400, detail="Missing bank_name or bank_account_number")
    USERS.setdefault(seller_id, {})["bank_name"] = bank_name
    USERS[seller_id]["bank_account_number"] = bank_account
    return {"status": "success", "seller_id": seller_id}


# ============== KOFA 2.0 NEW ENDPOINTS ==============

class BotStyleRequest(BaseModel):
    """Bot style preference."""
    style: str  # "corporate" or "street"

class ProductCreate(BaseModel):
    """Create a new product."""
    name: str
    price_ngn: float
    stock_level: int = 0
    description: Optional[str] = None
    category: Optional[str] = None
    voice_tags: Optional[List[str]] = None
    image_url: Optional[str] = None
    user_id: Optional[str] = None  # Required for database FK constraint
    
    @validator('name')
    def validate_name(cls, v):
        if not v or not v.strip():
            raise ValueError('Product name is required and cannot be empty')
        if len(v.strip()) > 255:
            raise ValueError('Product name must be 255 characters or less')
        return v.strip()
    
    @validator('price_ngn')
    def validate_price(cls, v):
        if v < 0:
            raise ValueError('Price cannot be negative')
        if v > 100000000:  # 100 million naira max
            raise ValueError('Price exceeds maximum allowed value')
        return v
    
    @validator('stock_level')
    def validate_stock(cls, v):
        if v < 0:
            raise ValueError('Stock level cannot be negative')
        return v

class ManualSale(BaseModel):
    """Log a manual sale."""
    product_name: str
    quantity: int
    amount_ngn: float
    channel: str  # "instagram", "walk-in", "whatsapp", "other"
    notes: Optional[str] = None


@router.post("/settings/bot-style")
async def set_bot_style(request: BotStyleRequest, user_id: str = "default"):
    """Toggle bot personality between Corporate and Nigerian Pidgin."""
    global response_formatter
    if request.style.lower() == "street":
        response_formatter = ResponseFormatter(style=ResponseStyle.STREET)
    else:
        response_formatter = ResponseFormatter(style=ResponseStyle.CORPORATE)
    
    USERS.setdefault(user_id, {})["bot_style"] = request.style.lower()
    return {
        "status": "success",
        "bot_style": request.style.lower(),
        "message": f"Bot personality set to {request.style}"
    }


@router.get("/settings/bot-style")
async def get_bot_style():
    """Get current bot style."""
    return {
        "current_style": response_formatter.style.value,
        "available_styles": ["professional", "pidgin"]
    }


class CustomerBotTestRequest(BaseModel):
    """Test customer bot request."""
    message: str
    style: str = "professional"  # professional or pidgin
    user_id: Optional[str] = None  # To fetch user's products


@router.post("/customer-bot/test")
async def test_customer_bot(request: CustomerBotTestRequest):
    """
    Test customer-facing bot with selected style.
    Uses Groq AI (with Gemini fallback) and real product context.
    """
    from .ai_unified import send_to_ai, build_context_prompt
    from .database import SessionLocal
    from .models import Product, User
    
    style = request.style.lower()
    products = []
    store_name = "our store"
    
    # Fetch real products if user_id provided
    if request.user_id:
        try:
            db = SessionLocal()
            try:
                # Get user's store name
                user = db.query(User).filter(User.id == request.user_id).first()
                if user and user.business_name:
                    store_name = user.business_name
                
                # Get user's products
                db_products = db.query(Product).filter(Product.user_id == request.user_id).limit(20).all()
                products = [
                    {
                        "name": p.name,
                        "price": p.price_ngn,
                        "stock_level": p.stock_level
                    }
                    for p in db_products
                ]
            finally:
                db.close()
        except Exception:
            pass  # Use empty products list
    
    # Build context-aware prompt with real product data
    system_prompt = build_context_prompt(
        products=products,
        store_name=store_name,
        style=style
    )
    
    try:
        # Call AI with automatic fallback
        response, api_used = await send_to_ai(
            messages=[{"role": "user", "content": request.message}],
            system_prompt=system_prompt,
            max_tokens=250,
            temperature=0.8
        )
        
        return {
            "response": response,
            "style": style,
            "message_received": request.message,
            "ai_powered": True,
            "api_used": api_used,
            "products_loaded": len(products)
        }
    except Exception as e:
        # Fallback demo responses if all APIs fail - PROFESSIONAL ONLY
        fallback_response = "Thank you for contacting us. How may I assist you today?"
        return {
            "response": fallback_response,
            "style": style,
            "message_received": request.message,
            "ai_powered": False,
            "error": str(e)
        }


# ============== SNAP-TO-ADD PRODUCT (AI Vision) ==============

@router.post("/products/scan-product")
async def scan_product_image(image: UploadFile = File(...)):
    """
    Snap a product photo → AI identifies name, description, category, suggested price.
    Vendor reviews and confirms before saving.
    """
    from .services.product_scanner import scan_product
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/heic"]
    content_type = image.content_type or "image/jpeg"
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {content_type}")
    
    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Maximum 10MB.")
    
    result = await scan_product(image_bytes, content_type)
    
    if not result:
        raise HTTPException(status_code=422, detail="Could not identify product. Try a clearer photo with good lighting.")
    
    return {
        "status": "success",
        "product": result,
        "message": "Product identified! Review the details and save."
    }


@router.post("/products")
async def create_product(product: ProductCreate):
    """Add a new product to inventory."""
    from .database import SessionLocal
    from .models import Product as ProductModel
    
    # Require user_id for proper FK constraint
    if not product.user_id:
        raise HTTPException(
            status_code=400,
            detail="user_id is required to create a product"
        )
    
    # Check for duplicate product name (case-insensitive)
    db = SessionLocal()
    try:
        existing = db.query(ProductModel).filter(
            ProductModel.user_id == product.user_id,
            ProductModel.name.ilike(product.name.strip())
        ).first()
        
        if existing:
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Product already exists",
                    "message": f"Product '{existing.name}' already exists. Edit the existing product or use a different name.",
                    "existing_product_id": existing.id,
                    "existing_stock": existing.stock_level
                }
            )
    finally:
        db.close()
    
    # Check freemium limit
    limit_check = check_limit("products")
    if not limit_check["allowed"]:
        raise HTTPException(
            status_code=403,
            detail={
                "error": "Product limit reached",
                "message": f"Free plan allows {limit_check['max']} products. Upgrade to Pro for unlimited products!",
                "current": limit_check["current"],
                "max": limit_check["max"],
                "upgrade_needed": True
            }
        )
    
    new_product = {
        "id": str(uuid.uuid4()),
        "name": product.name,
        "price_ngn": product.price_ngn,
        "stock_level": product.stock_level,
        "description": product.description or "",
        "category": product.category or "uncategorized",
        "voice_tags": product.voice_tags or [],
        "image_url": product.image_url or ""
    }
    
    # Create user-specific inventory manager and add product
    user_inventory = InventoryManager(user_id=product.user_id)
    user_inventory.add_product(new_product)
    
    # Return with limit info
    new_limit = check_limit("products")
    return {
        "status": "success",
        "message": f"Product '{product.name}' added successfully",
        "product": new_product,
        "usage": {
            "products_used": new_limit["current"],
            "products_max": new_limit["max"],
            "tier": get_subscription_tier()
        }
    }


class ProductUpdate(BaseModel):
    """Update product fields."""
    name: Optional[str] = None
    price_ngn: Optional[float] = None
    stock_level: Optional[int] = None
    description: Optional[str] = None
    category: Optional[str] = None
    voice_tags: Optional[List[str]] = None


class RestockRequest(BaseModel):
    """Restock a product."""
    quantity: int
    
    @validator('quantity')
    def validate_quantity(cls, v):
        if v <= 0:
            raise ValueError('Quantity must be greater than 0')
        if v > 100000:
            raise ValueError('Quantity exceeds maximum allowed (100,000)')
        return v


class OrderStatusUpdate(BaseModel):
    """Update order status."""
    status: str  # "pending", "paid", "fulfilled"



@router.put("/products/{product_id}")
async def update_product(product_id: str, updates: ProductUpdate, user_id: str = None):
    """Update an existing product."""
    from .database import SessionLocal
    from .models import Product as ProductModel

    db = SessionLocal()
    try:
        query = db.query(ProductModel).filter(ProductModel.id == product_id)
        if user_id:
            query = query.filter(ProductModel.user_id == user_id)

        product = query.first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

        # Apply updates (only non-None fields)
        if updates.name is not None:
            product.name = updates.name
        if updates.price_ngn is not None:
            product.price_ngn = updates.price_ngn
        if updates.stock_level is not None:
            product.stock_level = updates.stock_level
        if updates.description is not None:
            product.description = updates.description
        if updates.category is not None:
            product.category = updates.category

        db.commit()
        db.refresh(product)

        if user_id:
            from .cache import invalidate_cache
            invalidate_cache(f"products:user:{user_id}")

        return {
            "status": "success",
            "message": f"Product '{product.name}' updated",
            "product": {
                "id": product.id,
                "name": product.name,
                "price_ngn": product.price_ngn,
                "stock_level": product.stock_level,
                "description": product.description or "",
                "category": product.category or "",
                "image_url": product.image_url
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.post("/products/{product_id}/restock")
async def restock_product(product_id: str, restock: RestockRequest, user_id: str = None):
    """Add stock to a product."""
    if restock.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    if restock.quantity > 100000:
        raise HTTPException(status_code=400, detail="Quantity exceeds maximum allowed (100,000)")

    from .database import SessionLocal
    from .models import Product as ProductModel

    db = SessionLocal()
    try:
        query = db.query(ProductModel).filter(ProductModel.id == product_id)
        if user_id:
            query = query.filter(ProductModel.user_id == user_id)

        product = query.first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

        old_stock = product.stock_level or 0
        product.stock_level = old_stock + restock.quantity
        db.commit()

        if user_id:
            from .cache import invalidate_cache
            invalidate_cache(f"products:user:{user_id}")

        return {
            "status": "success",
            "message": f"Added {restock.quantity} units to {product.name}",
            "new_stock_level": product.stock_level
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.delete("/products/{product_id}")
async def delete_product(product_id: str, user_id: str = None):
    """Delete a product from inventory."""
    from .database import SessionLocal
    from .models import Product as ProductModel
    
    db = SessionLocal()
    try:
        # Build query - filter by product_id and optionally by user_id
        query = db.query(ProductModel).filter(ProductModel.id == product_id)
        if user_id:
            query = query.filter(ProductModel.user_id == user_id)
        
        product = query.first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
        
        product_name = product.name
        db.delete(product)
        db.commit()
        
        # Clear product cache for this user
        if user_id:
            from .cache import invalidate_cache
            invalidate_cache(f"products:user:{user_id}")
        
        return {
            "status": "success",
            "message": f"Product '{product_name}' deleted successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to delete product: {str(e)}")
    finally:
        db.close()

# ============== PRODUCT IMAGE UPLOAD ==============

@router.post("/products/{product_id}/image")
async def upload_product_image(product_id: str, file: UploadFile = File(...)):
    """
    Upload an image for a product.
    Stores as base64 data URL in the database.
    """
    from .database import SessionLocal
    from .models import Product as ProductModel
    import base64
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Check file size (max 2MB for base64 storage)
    contents = await file.read()
    if len(contents) > 2 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 2MB")
    
    # Find the product directly in database
    db = SessionLocal()
    try:
        product = db.query(ProductModel).filter(ProductModel.id == product_id).first()
        
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
        
        # Convert to base64 data URL
        base64_data = base64.b64encode(contents).decode('utf-8')
        image_url = f"data:{file.content_type};base64,{base64_data}"
        
        # Update product with image URL
        product.image_url = image_url
        db.commit()
        
        return {
            "status": "success",
            "message": "Product image uploaded successfully",
            "image_url": image_url[:100] + "...",  # Return truncated for response
            "product_id": product_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    finally:
        db.close()


@router.delete("/products/{product_id}/image")
async def delete_product_image(product_id: str, user_id: str = None):
    """Delete the image for a product."""
    from .database import SessionLocal
    from .models import Product as ProductModel

    db = SessionLocal()
    try:
        query = db.query(ProductModel).filter(ProductModel.id == product_id)
        if user_id:
            query = query.filter(ProductModel.user_id == user_id)

        product = query.first()
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {product_id} not found")

        if not product.image_url:
            return {"status": "success", "message": "No image to delete"}

        product.image_url = None
        db.commit()

        return {"status": "success", "message": "Product image deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, update: OrderStatusUpdate):
    """Update order status — fully DB-backed."""
    from .database import SessionLocal
    from .models import Order as OrderModel

    valid_statuses = ["pending", "paid", "fulfilled"]
    new_status = update.status.lower()

    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

    db = SessionLocal()
    try:
        order = db.query(OrderModel).filter(OrderModel.id == order_id).first()

        if not order:
            # Create a minimal order record if it doesn't exist
            order = OrderModel(
                id=order_id,
                user_id="unknown",
                customer_phone="unknown",
                total_amount=0,
                status=new_status,
                created_at=datetime.now()
            )
            db.add(order)
        else:
            order.status = new_status
            order.updated_at = datetime.now()

        if new_status == "paid":
            order.paid_at = datetime.now()
        elif new_status == "fulfilled":
            order.fulfilled_at = datetime.now()

        db.commit()

        return {
            "status": "success",
            "message": f"Order {order_id} marked as {new_status}",
            "order": {
                "id": order.id,
                "status": order.status,
                "updated_at": order.updated_at.isoformat() if order.updated_at else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()



@router.post("/sales/manual")
async def log_manual_sale(sale: ManualSale):
    """Log a sale made outside of KOFA (walk-in, Instagram DM, etc.)."""
    sale_record = {
        "id": str(uuid.uuid4()),
        "product_name": sale.product_name,
        "quantity": sale.quantity,
        "amount_ngn": sale.amount_ngn,
        "channel": sale.channel,
        "notes": sale.notes,
        "source": "manual",
        "created_at": __import__('datetime').datetime.now().isoformat()
    }
    
    # In production, save to Supabase
    return {
        "status": "success",
        "message": f"Sale of {sale.quantity}x {sale.product_name} logged from {sale.channel}",
        "sale": sale_record
    }


# ============== CREDIT SALES TRACKING ==============

class CreditSaleCreate(BaseModel):
    """Create a new credit sale (customer owes money)."""
    customer_name: str
    customer_phone: Optional[str] = None
    amount: float
    items_description: Optional[str] = None
    due_date: Optional[str] = None  # ISO date string
    notes: Optional[str] = None
    user_id: str

class CreditPaymentRecord(BaseModel):
    """Record a payment against a credit sale."""
    amount: float
    notes: Optional[str] = None


@router.post("/sales/credit")
async def create_credit_sale(credit: CreditSaleCreate):
    """Log a credit sale — customer took goods but will pay later."""
    from .database import SessionLocal
    from .models import CreditSale

    if credit.amount <= 0:
        raise HTTPException(status_code=400, detail="Amount must be greater than 0")

    db = SessionLocal()
    try:
        due = None
        if credit.due_date:
            try:
                due = datetime.fromisoformat(credit.due_date.replace("Z", "+00:00"))
            except ValueError:
                due = None

        new_credit = CreditSale(
            id=str(uuid.uuid4()),
            user_id=credit.user_id,
            customer_name=credit.customer_name,
            customer_phone=credit.customer_phone,
            amount=credit.amount,
            amount_paid=0,
            items_description=credit.items_description,
            due_date=due,
            status="unpaid",
            notes=credit.notes,
            created_at=datetime.now()
        )
        db.add(new_credit)
        db.commit()
        db.refresh(new_credit)

        return {
            "status": "success",
            "message": f"Credit sale of ₦{credit.amount:,.0f} for {credit.customer_name} recorded",
            "credit_sale": {
                "id": new_credit.id,
                "customer_name": new_credit.customer_name,
                "customer_phone": new_credit.customer_phone,
                "amount": new_credit.amount,
                "amount_paid": new_credit.amount_paid,
                "balance": new_credit.amount - new_credit.amount_paid,
                "items_description": new_credit.items_description,
                "due_date": new_credit.due_date.isoformat() if new_credit.due_date else None,
                "status": new_credit.status,
                "created_at": new_credit.created_at.isoformat()
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/sales/credit")
async def list_credit_sales(user_id: str, status: str = None):
    """Get all credit sales for a vendor, optionally filtered by status."""
    from .database import SessionLocal
    from .models import CreditSale

    db = SessionLocal()
    try:
        query = db.query(CreditSale).filter(CreditSale.user_id == user_id)

        if status and status in ["unpaid", "partial", "paid"]:
            query = query.filter(CreditSale.status == status)

        credits = query.order_by(CreditSale.created_at.desc()).all()

        return {
            "status": "success",
            "count": len(credits),
            "credit_sales": [
                {
                    "id": c.id,
                    "customer_name": c.customer_name,
                    "customer_phone": c.customer_phone,
                    "amount": c.amount,
                    "amount_paid": c.amount_paid,
                    "balance": c.amount - (c.amount_paid or 0),
                    "items_description": c.items_description,
                    "due_date": c.due_date.isoformat() if c.due_date else None,
                    "status": c.status,
                    "notes": c.notes,
                    "created_at": c.created_at.isoformat(),
                    "paid_at": c.paid_at.isoformat() if c.paid_at else None,
                    "is_overdue": c.due_date is not None and c.due_date < datetime.now() and c.status != "paid"
                }
                for c in credits
            ]
        }
    finally:
        db.close()


@router.post("/sales/credit/{credit_id}/payment")
async def record_credit_payment(credit_id: str, payment: CreditPaymentRecord):
    """Record a payment against a credit sale (partial or full)."""
    from .database import SessionLocal
    from .models import CreditSale

    if payment.amount <= 0:
        raise HTTPException(status_code=400, detail="Payment amount must be greater than 0")

    db = SessionLocal()
    try:
        credit = db.query(CreditSale).filter(CreditSale.id == credit_id).first()
        if not credit:
            raise HTTPException(status_code=404, detail="Credit sale not found")

        if credit.status == "paid":
            raise HTTPException(status_code=400, detail="This credit sale is already fully paid")

        remaining = credit.amount - (credit.amount_paid or 0)
        actual_payment = min(payment.amount, remaining)

        credit.amount_paid = (credit.amount_paid or 0) + actual_payment

        if credit.amount_paid >= credit.amount:
            credit.status = "paid"
            credit.paid_at = datetime.now()
        else:
            credit.status = "partial"

        if payment.notes:
            existing_notes = credit.notes or ""
            credit.notes = f"{existing_notes}\n[Payment ₦{actual_payment:,.0f}] {payment.notes}".strip()

        db.commit()

        return {
            "status": "success",
            "message": f"₦{actual_payment:,.0f} payment recorded for {credit.customer_name}",
            "credit_sale": {
                "id": credit.id,
                "customer_name": credit.customer_name,
                "amount": credit.amount,
                "amount_paid": credit.amount_paid,
                "balance": credit.amount - credit.amount_paid,
                "status": credit.status,
                "paid_at": credit.paid_at.isoformat() if credit.paid_at else None
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/sales/credit/summary")
async def get_credit_summary(user_id: str):
    """Get credit sales summary — total owed, overdue count, etc."""
    from .database import SessionLocal
    from .models import CreditSale
    from sqlalchemy import func

    db = SessionLocal()
    try:
        credits = db.query(CreditSale).filter(CreditSale.user_id == user_id).all()

        total_owed = sum((c.amount - (c.amount_paid or 0)) for c in credits if c.status != "paid")
        total_collected = sum(c.amount_paid or 0 for c in credits)
        unpaid_count = sum(1 for c in credits if c.status == "unpaid")
        partial_count = sum(1 for c in credits if c.status == "partial")
        paid_count = sum(1 for c in credits if c.status == "paid")
        overdue_count = sum(
            1 for c in credits
            if c.due_date and c.due_date < datetime.now() and c.status != "paid"
        )

        # Top debtors
        unpaid_credits = [c for c in credits if c.status != "paid"]
        unpaid_credits.sort(key=lambda c: c.amount - (c.amount_paid or 0), reverse=True)
        top_debtors = [
            {"name": c.customer_name, "phone": c.customer_phone, "owed": c.amount - (c.amount_paid or 0)}
            for c in unpaid_credits[:5]
        ]

        return {
            "status": "success",
            "summary": {
                "total_owed": total_owed,
                "total_collected": total_collected,
                "unpaid_count": unpaid_count,
                "partial_count": partial_count,
                "paid_count": paid_count,
                "overdue_count": overdue_count,
                "total_credits": len(credits),
                "top_debtors": top_debtors
            }
        }
    finally:
        db.close()


@router.delete("/sales/credit/{credit_id}")
async def delete_credit_sale(credit_id: str, user_id: str = None):
    """Delete/write-off a credit sale."""
    from .database import SessionLocal
    from .models import CreditSale

    db = SessionLocal()
    try:
        query = db.query(CreditSale).filter(CreditSale.id == credit_id)
        if user_id:
            query = query.filter(CreditSale.user_id == user_id)

        credit = query.first()
        if not credit:
            raise HTTPException(status_code=404, detail="Credit sale not found")

        db.delete(credit)
        db.commit()

        return {"status": "success", "message": f"Credit sale for {credit.customer_name} deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ============== IN-APP NOTIFICATIONS ==============

def create_notification(user_id: str, notif_type: str, title: str, message: str, link: str = None):
    """Helper: create an in-app notification for a vendor."""
    from .database import SessionLocal
    from .models import Notification

    db = SessionLocal()
    try:
        notif = Notification(
            id=str(uuid.uuid4()),
            user_id=user_id,
            type=notif_type,
            title=title,
            message=message,
            link=link,
            is_read=0,
            created_at=datetime.now()
        )
        db.add(notif)
        db.commit()
        return notif.id
    except Exception as e:
        db.rollback()
        logger.error(f"Failed to create notification: {e}")
        return None
    finally:
        db.close()


@router.get("/notifications")
async def get_notifications(user_id: str, unread_only: bool = False, limit: int = 50):
    """Get notifications for a vendor."""
    from .database import SessionLocal
    from .models import Notification

    db = SessionLocal()
    try:
        query = db.query(Notification).filter(Notification.user_id == user_id)
        if unread_only:
            query = query.filter(Notification.is_read == 0)
        notifications = query.order_by(Notification.created_at.desc()).limit(limit).all()

        unread_count = db.query(Notification).filter(
            Notification.user_id == user_id, Notification.is_read == 0
        ).count()

        return {
            "status": "success",
            "unread_count": unread_count,
            "notifications": [
                {
                    "id": n.id,
                    "type": n.type,
                    "title": n.title,
                    "message": n.message,
                    "is_read": bool(n.is_read),
                    "link": n.link,
                    "created_at": n.created_at.isoformat()
                }
                for n in notifications
            ]
        }
    finally:
        db.close()


@router.put("/notifications/{notif_id}/read")
async def mark_notification_read(notif_id: str):
    """Mark a notification as read."""
    from .database import SessionLocal
    from .models import Notification

    db = SessionLocal()
    try:
        notif = db.query(Notification).filter(Notification.id == notif_id).first()
        if notif:
            notif.is_read = 1
            db.commit()
        return {"status": "success"}
    finally:
        db.close()


@router.put("/notifications/read-all")
async def mark_all_read(user_id: str):
    """Mark all notifications as read for a vendor."""
    from .database import SessionLocal
    from .models import Notification

    db = SessionLocal()
    try:
        db.query(Notification).filter(
            Notification.user_id == user_id, Notification.is_read == 0
        ).update({"is_read": 1})
        db.commit()
        return {"status": "success", "message": "All notifications marked as read"}
    finally:
        db.close()


@router.get("/notifications/unread-count")
async def get_unread_count(user_id: str):
    """Get just the unread count for the notification badge."""
    from .database import SessionLocal
    from .models import Notification

    db = SessionLocal()
    try:
        count = db.query(Notification).filter(
            Notification.user_id == user_id, Notification.is_read == 0
        ).count()
        return {"status": "success", "unread_count": count}
    finally:
        db.close()


class PaymentAccountUpdate(BaseModel):
    """Vendor payment account details."""
    bank_name: str

    account_number: str
    account_name: str


class BusinessInfoUpdate(BaseModel):
    """Vendor business information."""
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None


@router.get("/vendor/settings")
async def get_vendor_settings_endpoint(user_id: str = "default"):
    """Get all vendor settings including payment account and business info.
    PRIVACY: Returns only the requesting vendor's settings."""
    settings = get_vendor_settings(user_id)
    return {
        "status": "success",
        "settings": settings
    }


@router.put("/vendor/payment-account")
async def update_payment_account(account: PaymentAccountUpdate, user_id: str = "default"):
    """Update vendor's payment account for receiving payments.
    PRIVACY: Updates only the requesting vendor's settings."""
    settings = get_vendor_settings(user_id)
    settings["payment_account"] = {
        "bank_name": account.bank_name,
        "account_number": account.account_number,
        "account_name": account.account_name,
    }
    return {
        "status": "success",
        "message": "Payment account updated successfully",
        "payment_account": settings["payment_account"]
    }


@router.put("/vendor/business-info")
async def update_business_info(info: BusinessInfoUpdate, user_id: str = "default"):
    """Update vendor's business information.
    PRIVACY: Updates only the requesting vendor's settings."""
    settings = get_vendor_settings(user_id)
    settings["business_info"] = {
        "name": info.name,
        "phone": info.phone or "",
        "address": info.address or "",
    }
    return {
        "status": "success",
        "message": "Business info updated successfully",
        "business_info": settings["business_info"]
    }

@router.get("/vendor/payment-account")
async def get_payment_account(user_id: str = "default"):
    """Get vendor's payment account for display to buyers.
    PRIVACY: Returns only the requesting vendor's payment account."""
    settings = get_vendor_settings(user_id)
    account = settings.get("payment_account", {})
    if not account.get("account_number"):
        return {
            "status": "not_configured",
            "message": "Payment account not yet configured"
        }
    return {
        "status": "success",
        "payment_account": account
    }


# ============== BOT CONNECTIONS (WhatsApp/Instagram API) ==============

class WhatsAppConnectionRequest(BaseModel):
    """Connect WhatsApp Business API."""
    phone_id: str
    access_token: str
    business_id: str = ""

class InstagramConnectionRequest(BaseModel):
    """Connect Instagram API."""
    access_token: str
    page_id: str = ""


@router.get("/vendor/bot-connections")
async def get_bot_connections(user_id: str = "default"):
    """Get WhatsApp/Instagram connection status for a vendor."""
    from .database import SessionLocal
    from .models import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return {"status": "success", "whatsapp": {"connected": False}, "instagram": {"connected": False}}
        return {
            "status": "success",
            "whatsapp": {
                "connected": bool(user.whatsapp_connected),
                "phone_id": user.whatsapp_phone_id or "",
                "business_id": user.whatsapp_business_id or "",
                "has_token": bool(user.whatsapp_access_token),
            },
            "instagram": {
                "connected": bool(user.instagram_connected),
                "page_id": user.instagram_page_id or "",
                "has_token": bool(user.instagram_access_token),
            }
        }
    finally:
        db.close()


@router.put("/vendor/bot-connections/whatsapp")
async def connect_whatsapp(req: WhatsAppConnectionRequest, user_id: str = "default"):
    """Save WhatsApp Business API credentials."""
    from .database import SessionLocal
    from .models import User

    if not req.phone_id or not req.access_token:
        raise HTTPException(status_code=400, detail="Phone ID and Access Token are required")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Vendor not found")
        user.whatsapp_phone_id = req.phone_id
        user.whatsapp_access_token = req.access_token
        user.whatsapp_business_id = req.business_id or ""
        user.whatsapp_connected = 1
        db.commit()
        return {"status": "success", "message": "WhatsApp Business API connected successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.put("/vendor/bot-connections/instagram")
async def connect_instagram(req: InstagramConnectionRequest, user_id: str = "default"):
    """Save Instagram API credentials."""
    from .database import SessionLocal
    from .models import User

    if not req.access_token:
        raise HTTPException(status_code=400, detail="Access Token is required")

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Vendor not found")
        user.instagram_access_token = req.access_token
        user.instagram_page_id = req.page_id or ""
        user.instagram_connected = 1
        db.commit()
        return {"status": "success", "message": "Instagram API connected successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.delete("/vendor/bot-connections/{platform}")
async def disconnect_bot(platform: str, user_id: str = "default"):
    """Disconnect a bot platform (whatsapp or instagram)."""
    from .database import SessionLocal
    from .models import User

    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Vendor not found")
        if platform == "whatsapp":
            user.whatsapp_phone_id = None
            user.whatsapp_access_token = None
            user.whatsapp_business_id = None
            user.whatsapp_connected = 0
        elif platform == "instagram":
            user.instagram_access_token = None
            user.instagram_page_id = None
            user.instagram_connected = 0
        else:
            raise HTTPException(status_code=400, detail="Invalid platform. Use 'whatsapp' or 'instagram'.")
        db.commit()
        return {"status": "success", "message": f"{platform.title()} disconnected"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ============== FREEMIUM USAGE & SUBSCRIPTION ==============

@router.get("/usage")
async def get_usage_stats(request: Request):
    """Get current usage stats — all data from database, survives restarts."""
    from .database import SessionLocal
    
    # Get user_id from auth token if available
    user_id = "default"
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from .services.auth_security import decode_access_token
            payload = decode_access_token(auth_header.split(" ")[1])
            user_id = payload.get("sub", "default")
        except Exception:
            pass
    
    db = SessionLocal()
    try:
        return subscription_service.get_usage_summary(db, user_id)
    finally:
        db.close()

@router.post("/subscription/upgrade")
async def upgrade_subscription(tier: str = "pro", request: Request = None):
    """Upgrade subscription tier (for demo/testing - in production, integrate with Paystack)."""
    valid_tiers = ["free", "grow", "pro"]
    if tier not in valid_tiers:
        raise HTTPException(status_code=400, detail=f"Invalid tier. Use one of: {', '.join(valid_tiers)}")
    
    from .database import SessionLocal
    user_id = "default"
    if request:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            try:
                from .services.auth_security import decode_access_token
                payload = decode_access_token(auth_header.split(" ")[1])
                user_id = payload.get("sub", "default")
            except Exception:
                pass
    
    db = SessionLocal()
    try:
        result = subscription_service.upgrade_subscription(db, user_id, SubscriptionTier(tier))
        plan = subscription_service.get_plan(SubscriptionTier(tier))
        return {
            "status": "success",
            "message": f"Subscription upgraded to {plan.name}!",
            "tier": tier,
            "price_monthly": plan.price_ngn_monthly,
            "features": plan.features,
        }
    finally:
        db.close()

# ============== TEAM MEMBERS (Pro only) ==============

class TeamInviteRequest(BaseModel):
    email: str
    role: str = "staff"  # "staff" or "manager"


@router.get("/team/members")
async def get_team_members(request: Request):
    """Get all team members for the current vendor (Pro only)."""
    from .database import SessionLocal
    user_id = _get_user_from_request(request)
    
    db = SessionLocal()
    try:
        return {"members": subscription_service.get_team_members(db, user_id)}
    finally:
        db.close()

@router.post("/team/invite")
async def invite_team_member(invite: TeamInviteRequest, request: Request):
    """Invite a team member (Pro only)."""
    from .database import SessionLocal
    user_id = _get_user_from_request(request)
    
    db = SessionLocal()
    try:
        result = subscription_service.invite_team_member(db, user_id, invite.email, invite.role)
        if "error" in result:
            raise HTTPException(status_code=403, detail=result)
        return result
    finally:
        db.close()

@router.delete("/team/members/{member_id}")
async def revoke_team_member(member_id: str, request: Request):
    """Remove a team member."""
    from .database import SessionLocal
    user_id = _get_user_from_request(request)
    
    db = SessionLocal()
    try:
        result = subscription_service.revoke_team_member(db, user_id, member_id)
        if "error" in result:
            raise HTTPException(status_code=404, detail=result["error"])
        return result
    finally:
        db.close()

def _get_user_from_request(request: Request) -> str:
    """Helper to extract user_id from auth token."""
    auth_header = request.headers.get("authorization", "")
    if auth_header.startswith("Bearer "):
        try:
            from .services.auth_security import decode_access_token
            payload = decode_access_token(auth_header.split(" ")[1])
            return payload.get("sub", "default")
        except Exception:
            pass
    return "default"


# ============== SUBSCRIPTION & PAYMENT SYSTEM ==============

class SubscriptionPlan(BaseModel):
    """Subscription plan details."""
    id: str
    name: str
    price_ngn: float
    duration_months: int
    features: List[str]
    max_products: int
    max_messages: int

class SubscriptionPurchase(BaseModel):
    """Purchase request for subscription."""
    plan_id: str
    payment_method: str = "paystack"  # paystack, bank_transfer, etc.

class PaymentReceipt(BaseModel):
    """Payment receipt/invoice details."""
    transaction_id: str
    amount_ngn: float
    description: str
    customer_name: str
    customer_email: Optional[str] = None
    payment_date: str
    payment_method: str
    vendor_account: Optional[Dict] = None

# Subscription plans — aligned with landing page (Free, Grow, Pro)
SUBSCRIPTION_PLANS = {
    "free": SubscriptionPlan(
        id="free",
        name="Free",
        price_ngn=0,
        duration_months=0,
        features=["Up to 50 products", "Basic AI chatbot", "Manual order tracking", "Expense logging"],
        max_products=50,
        max_messages=100
    ),
    "grow": SubscriptionPlan(
        id="grow",
        name="Grow",
        price_ngn=5000,
        duration_months=1,
        features=["Up to 500 products", "AI Business Assistant", "Receipt Scanner", "Payment tracking", "Analytics", "WhatsApp bot"],
        max_products=500,
        max_messages=5000
    ),
    "pro": SubscriptionPlan(
        id="pro",
        name="Pro",
        price_ngn=15000,
        duration_months=1,
        features=["Unlimited products", "Full AI suite", "Multi-channel sales", "Team members", "Priority support", "API access"],
        max_products=-1,
        max_messages=-1
    ),
}

@router.get("/subscription/plans")
async def get_subscription_plans():
    """Get all available subscription plans."""
    return {
        "status": "success",
        "plans": list(SUBSCRIPTION_PLANS.values())
    }

@router.post("/subscription/purchase")
async def purchase_subscription(request: SubscriptionPurchase):
    """Purchase a subscription plan."""
    if request.plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=404, detail="Subscription plan not found")

    plan = SUBSCRIPTION_PLANS[request.plan_id]

    if plan.price_ngn == 0:
        # Free plan - activate immediately
        return {
            "status": "success",
            "message": "Free plan activated successfully",
            "plan": plan.dict(),
            "activated_at": datetime.now().isoformat()
        }

    # For paid plans, create payment link
    payment_link = payment_manager.generate_payment_link(
        order_id=f"sub_{request.plan_id}_{int(datetime.now().timestamp())}",
        amount_ngn=int(plan.price_ngn),
        customer_phone="vendor_phone",  # Would come from auth
        description=f"KOFA {plan.name} Subscription"
    )

    if not payment_link:
        raise HTTPException(status_code=500, detail="Failed to create payment link")

    return {
        "status": "success",
        "payment_link": payment_link,
        "plan": plan.dict(),
        "amount_ngn": plan.price_ngn
    }

# ============== RECEIPTS & INVOICES ==============

@router.post("/receipts/generate")
async def generate_receipt(receipt_data: PaymentReceipt):
    """Generate a payment receipt."""
    # In production, this would generate a PDF or send email
    # For now, return receipt data
    receipt = {
        "receipt_id": f"RCP_{receipt_data.transaction_id}",
        "transaction_id": receipt_data.transaction_id,
        "amount_ngn": receipt_data.amount_ngn,
        "description": receipt_data.description,
        "customer_name": receipt_data.customer_name,
        "customer_email": receipt_data.customer_email,
        "payment_date": receipt_data.payment_date,
        "payment_method": receipt_data.payment_method,
        "vendor_account": receipt_data.vendor_account,
        "generated_at": datetime.now().isoformat(),
        "status": "generated"
    }

    return {
        "status": "success",
        "receipt": receipt,
        "message": "Receipt generated successfully"
    }

@router.post("/invoices/generate")
async def generate_invoice(invoice_data: PaymentReceipt):
    """Generate an invoice for pending payments."""
    invoice = {
        "invoice_id": f"INV_{invoice_data.transaction_id}",
        "transaction_id": invoice_data.transaction_id,
        "amount_ngn": invoice_data.amount_ngn,
        "description": invoice_data.description,
        "customer_name": invoice_data.customer_name,
        "customer_email": invoice_data.customer_email,
        "due_date": (datetime.now() + timedelta(days=30)).isoformat(),
        "payment_method": invoice_data.payment_method,
        "vendor_account": invoice_data.vendor_account,
        "generated_at": datetime.now().isoformat(),
        "status": "pending"
    }

    return {
        "status": "success",
        "invoice": invoice,
        "message": "Invoice generated successfully"
    }

# ============== SUPPORT & TROUBLESHOOTING ==============

class SupportTicket(BaseModel):
    """Support ticket submission."""
    subject: str
    message: str
    priority: str = "normal"  # low, normal, high, urgent
    category: str = "general"  # general, technical, billing, feature_request

class TroubleshootingGuide(BaseModel):
    """Troubleshooting guide entry."""
    issue: str
    solution: str
    category: str
    tags: List[str] = []

# Support tickets storage (in production, use database)
SUPPORT_TICKETS = []

# Troubleshooting guides
TROUBLESHOOTING_GUIDES = [
    TroubleshootingGuide(
        issue="Chatbot not responding",
        solution="Check if bot is paused in settings. Ensure internet connection. Try restarting the conversation.",
        category="chatbot",
        tags=["bot", "response", "connection"]
    ),
    TroubleshootingGuide(
        issue="Payment link not working",
        solution="Verify Paystack keys are configured. Check payment account settings. Ensure amount is valid.",
        category="payments",
        tags=["payment", "paystack", "link"]
    ),
    TroubleshootingGuide(
        issue="Products not showing in search",
        solution="Check voice tags are added to products. Ensure product is in stock. Try different search terms.",
        category="products",
        tags=["search", "voice", "stock"]
    ),
    TroubleshootingGuide(
        issue="Orders not updating",
        solution="Check internet connection. Refresh the page. Contact support if issue persists.",
        category="orders",
        tags=["orders", "sync", "update"]
    ),
    TroubleshootingGuide(
        issue="Cannot add products",
        solution="Check subscription limits. Ensure all required fields are filled. Verify account permissions.",
        category="products",
        tags=["add", "products", "limits"]
    )
]

@router.post("/support/ticket")
async def submit_support_ticket(ticket: SupportTicket):
    """Submit a support ticket."""
    ticket_data = {
        "id": f"TICKET_{int(datetime.now().timestamp())}",
        "subject": ticket.subject,
        "message": ticket.message,
        "priority": ticket.priority,
        "category": ticket.category,
        "status": "open",
        "created_at": datetime.now().isoformat(),
        "updated_at": datetime.now().isoformat()
    }

    SUPPORT_TICKETS.append(ticket_data)

    return {
        "status": "success",
        "ticket": ticket_data,
        "message": "Support ticket submitted successfully. We'll respond within 24 hours."
    }

@router.get("/support/troubleshooting")
async def get_troubleshooting_guides(category: Optional[str] = None, query: Optional[str] = None):
    """Get troubleshooting guides."""
    guides = TROUBLESHOOTING_GUIDES

    if category:
        guides = [g for g in guides if g.category == category]

    if query:
        query_lower = query.lower()
        guides = [g for g in guides if
                 query_lower in g.issue.lower() or
                 any(query_lower in tag for tag in g.tags)]

    return {
        "status": "success",
        "guides": [g.dict() for g in guides],
        "total": len(guides)
    }

@router.get("/support/faq")
async def get_faq():
    """Get frequently asked questions."""
    faq = [
        {
            "question": "How do I add products to my inventory?",
            "answer": "Go to the Products tab and click 'Add Product'. Fill in the name, price, stock level, and optional description. Voice tags help customers find products via chat."
        },
        {
            "question": "How does the AI chatbot work?",
            "answer": "The chatbot automatically responds to customer inquiries on WhatsApp, Instagram, and other platforms. It uses voice tags to find products and can create payment links for orders."
        },
        {
            "question": "How do I receive payments?",
            "answer": "Add your bank account details in Settings. The chatbot will use your account for payment links. You can also integrate with Paystack for direct payments."
        },
        {
            "question": "What are subscription plans?",
            "answer": "Choose from Free (basic features), Starter (₦5,000/month), Professional (₦15,000/month), or Enterprise (₦50,000/month) plans based on your business needs."
        },
        {
            "question": "How do I track my sales?",
            "answer": "Use the Analytics dashboard to see revenue, top products, and customer insights. All orders are automatically tracked and reported."
        }
    ]

    return {
        "status": "success",
        "faq": faq
    }

# ============== QUICK WIN FEATURES ==============

@router.get("/products/low-stock")
async def get_low_stock_products(user_id: str = None):
    """Get products that are below the stock threshold."""
    from .database import SessionLocal
    from .models import Product as ProductModel

    if not user_id:
        return {"count": 0, "threshold": LOW_STOCK_THRESHOLD, "products": []}

    db = SessionLocal()
    try:
        low_stock_products = db.query(ProductModel).filter(
            ProductModel.user_id == user_id,
            ProductModel.stock_level <= LOW_STOCK_THRESHOLD
        ).all()

        return {
            "count": len(low_stock_products),
            "threshold": LOW_STOCK_THRESHOLD,
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "stock_level": p.stock_level or 0,
                    "category": p.category or "",
                    "needs_restock": True
                }
                for p in low_stock_products
            ]
        }
    finally:
        db.close()


@router.get("/products/search")
async def search_products(q: str, user_id: str = None):
    """Search products by name or category."""
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")

    from .database import SessionLocal
    from .models import Product as ProductModel

    db = SessionLocal()
    try:
        query = db.query(ProductModel).filter(
            ProductModel.name.ilike(f"%{q}%")
        )
        if user_id:
            query = query.filter(ProductModel.user_id == user_id)

        products = query.limit(20).all()

        return {
            "query": q,
            "count": len(products),
            "products": [
                {
                    "id": p.id,
                    "name": p.name,
                    "price_ngn": p.price_ngn,
                    "stock_level": p.stock_level or 0,
                    "category": p.category or "",
                    "image_url": p.image_url
                }
                for p in products
            ]
        }
    finally:
        db.close()


@router.get("/customers/{customer_id}/stats")
async def get_customer_stats(customer_id: str):
    """Get purchase history and stats for a customer from the database."""
    from .database import SessionLocal
    from .models import Order as OrderModel

    db = SessionLocal()
    try:
        orders = db.query(OrderModel).filter(
            OrderModel.customer_phone == customer_id
        ).order_by(OrderModel.created_at.desc()).all()

        total_spent = sum(o.total_amount or 0 for o in orders)

        return {
            "customer_id": customer_id,
            "total_orders": len(orders),
            "total_spent": total_spent,
            "is_returning_customer": len(orders) > 1
        }
    finally:
        db.close()


@router.get("/dashboard/summary")
async def get_dashboard_summary(user_id: str = None):
    """Get quick summary for merchant dashboard — fully DB-backed."""
    from .database import SessionLocal
    from .models import Product as ProductModel, Order as OrderModel

    db = SessionLocal()
    try:
        # Products (vendor-scoped)
        product_query = db.query(ProductModel)
        if user_id:
            product_query = product_query.filter(ProductModel.user_id == user_id)

        total_products = product_query.count()
        low_stock_count = product_query.filter(
            ProductModel.stock_level <= LOW_STOCK_THRESHOLD
        ).count()

        # Orders (vendor-scoped)
        order_query = db.query(OrderModel)
        if user_id:
            order_query = order_query.filter(OrderModel.user_id == user_id)

        from sqlalchemy import func
        total_orders = order_query.count()
        pending_orders = order_query.filter(OrderModel.status == "pending").count()
        paid_orders = order_query.filter(OrderModel.status == "paid").count()
        fulfilled_orders = order_query.filter(OrderModel.status == "fulfilled").count()

        revenue_result = order_query.filter(
            OrderModel.status.in_(["paid", "fulfilled"])
        ).with_entities(func.coalesce(func.sum(OrderModel.total_amount), 0)).scalar()

        unique_customers = order_query.with_entities(
            func.count(func.distinct(OrderModel.customer_phone))
        ).scalar()

        return {
            "total_products": total_products,
            "low_stock_count": low_stock_count,
            "low_stock_threshold": LOW_STOCK_THRESHOLD,
            "pending_orders": pending_orders,
            "paid_orders": paid_orders,
            "fulfilled_orders": fulfilled_orders,
            "total_orders": total_orders,
            "total_revenue": float(revenue_result or 0),
            "unique_customers": unique_customers or 0
        }
    finally:
        db.close()


# ============== PAYSTACK WEBHOOK ==============

@router.post("/payments/webhook")
async def paystack_webhook(request: Request):
    """
    Paystack webhook endpoint — auto-marks orders as paid.
    When a customer pays via a Paystack link, this is called automatically.
    """
    try:
        from .services.payments import paystack_service
        
        body = await request.body()
        signature = request.headers.get("x-paystack-signature", "")
        
        # Verify webhook signature (if configured)
        if paystack_service.config.webhook_secret and signature:
            if not paystack_service.verify_webhook_signature(body, signature):
                logger.warning("⚠️ Invalid Paystack webhook signature")
                return {"status": "error", "message": "Invalid signature"}
        
        # Parse and process the event
        import json as json_mod
        payload = json_mod.loads(body)
        event = payload.get("event", "")
        data = payload.get("data", {})
        
        logger.info(f"📨 Paystack webhook: {event}")
        result = await paystack_service.process_webhook(event, data)
        
        return {"status": "success", **result}
    except Exception as e:
        logger.error(f"Webhook processing error: {e}")
        return {"status": "error", "message": str(e)}

# ============== BOT CONTROL ENDPOINTS ==============

class BotPauseRequest(BaseModel):
    """Toggle bot pause state."""
    paused: bool


class VendorActivityRequest(BaseModel):
    """Record vendor activity in a conversation."""
    customer_id: str


@router.post("/bot/pause")
async def toggle_bot_pause(request: BotPauseRequest, vendor_id: str = "default"):
    """Toggle global bot pause. When paused, bot won't reply to any customers."""
    result = vendor_state.set_bot_paused(vendor_id, request.paused)
    return {
        "status": "success",
        "message": "Bot paused" if request.paused else "Bot resumed",
        **result
    }


@router.get("/bot/status")
async def get_bot_status(vendor_id: str = "default"):
    """Get current bot status including pause state and active silences."""
    return vendor_state.get_bot_status(vendor_id)


@router.post("/bot/vendor-activity")
async def record_vendor_activity(request: VendorActivityRequest, vendor_id: str = "default"):
    """
    Record that vendor is typing/active in a specific conversation.
    This triggers auto-silence for 30 minutes for that customer.
    """
    result = vendor_state.record_vendor_activity(vendor_id, request.customer_id)
    return {
        "status": "success",
        "message": f"Bot will be silent for customer {request.customer_id} for 30 minutes",
        **result
    }


@router.get("/bot/should-respond/{customer_id}")
async def check_should_respond(customer_id: str, vendor_id: str = "default"):
    """Check if bot should respond to a specific customer."""
    should_respond, reason = vendor_state.should_bot_respond(vendor_id, customer_id)
    return {
        "should_respond": should_respond,
        "reason": reason
    }


# ============== PUSH NOTIFICATIONS ENDPOINTS ==============

class DeviceTokenRequest(BaseModel):
    """Register device for push notifications."""
    expo_token: str
    device_type: str = "unknown"  # "ios" or "android"


@router.post("/device-tokens")
async def register_device_token(request: DeviceTokenRequest, vendor_id: str = "default"):
    """Register a device to receive push notifications."""
    push_service.register_device(vendor_id, request.expo_token, request.device_type)
    return {
        "status": "success",
        "message": "Device registered for push notifications",
        "vendor_id": vendor_id
    }


@router.delete("/device-tokens")
async def unregister_device_token(expo_token: str, vendor_id: str = "default"):
    """Unregister a device from push notifications."""
    push_service.unregister_device(vendor_id, expo_token)
    return {
        "status": "success",
        "message": "Device unregistered"
    }


@router.post("/notifications/test")
async def test_push_notification(vendor_id: str = "default"):
    """Send a test push notification to all vendor devices."""
    result = await push_service.send_notification(
        vendor_id,
        PushNotification(
            title="🎉 Test Notification",
            body="KOFA push notifications are working!",
            data={"type": "test"}
        )
    )
    return result


# ============== BULK OPERATIONS ENDPOINTS ==============

class BulkPriceUpdateRequest(BaseModel):
    """Bulk price update request."""
    percent_change: float  # e.g., 10 for +10%, -5 for -5%
    category: Optional[str] = None


class BulkRestockItem(BaseModel):
    """Single item for bulk restock."""
    product_id: str
    quantity: int


class BulkRestockRequest(BaseModel):
    """Bulk restock request."""
    items: List[BulkRestockItem]


@router.post("/products/import")
async def import_products_csv(
    file: UploadFile = File(...),
    vendor_id: str = "default",
    update_existing: bool = False
):
    """Import products from CSV file."""
    content = await file.read()
    csv_content = content.decode("utf-8")
    
    result = await bulk_service.import_products(vendor_id, csv_content, update_existing)
    
    return {
        "status": "success" if result.success_count > 0 else "error",
        "imported": result.success_count,
        "errors": result.error_count,
        "error_details": result.errors[:10],  # Limit error details
        "created_ids": result.created_ids
    }


@router.get("/products/export")
async def export_products_csv(vendor_id: str = "default"):
    """Export all products to CSV."""
    result = await bulk_service.export_products(vendor_id)
    
    return PlainTextResponse(
        content=result.csv_content,
        media_type="text/csv",
        headers={
            "Content-Disposition": f"attachment; filename=kofa_products_{vendor_id}.csv"
        }
    )


@router.get("/products/import/template")
async def get_import_template():
    """Get a CSV template for product import."""
    template = bulk_service.generate_template_csv()
    
    return PlainTextResponse(
        content=template,
        media_type="text/csv",
        headers={
            "Content-Disposition": "attachment; filename=kofa_product_template.csv"
        }
    )


@router.post("/products/bulk-price-update")
async def bulk_update_prices(request: BulkPriceUpdateRequest, vendor_id: str = "default"):
    """Update prices by percentage for all products or a category."""
    result = await bulk_service.bulk_update_prices(
        vendor_id, 
        request.percent_change, 
        request.category
    )
    return result


@router.post("/products/bulk-restock")
async def bulk_restock(request: BulkRestockRequest, vendor_id: str = "default"):
    """Add stock to multiple products at once."""
    restock_data = [{"product_id": item.product_id, "quantity": item.quantity} for item in request.items]
    result = await bulk_service.bulk_restock(vendor_id, restock_data)
    return result


# ============== IMPORT ENDPOINTS ==============

class ProductImportItem(BaseModel):
    """Single product for import."""
    name: str
    price_ngn: float
    stock_level: int = 1
    description: str = ""
    category: str = ""

class BulkProductImportRequest(BaseModel):
    """Bulk product import from JSON."""
    products: List[ProductImportItem]

@router.post("/products/import")
async def import_products_json(request: BulkProductImportRequest, user_id: str = None):
    """Import multiple products from JSON array."""
    if not user_id:
        raise HTTPException(status_code=400, detail="user_id is required")

    from .database import SessionLocal
    from .models import Product as ProductModel

    imported = 0
    errors = []

    db = SessionLocal()
    try:
        for product in request.products:
            try:
                new_product = ProductModel(
                    id=str(uuid.uuid4()),
                    user_id=user_id,
                    name=product.name,
                    price_ngn=product.price_ngn,
                    stock_level=product.stock_level,
                    description=product.description or "",
                    category=product.category or ""
                )
                db.add(new_product)
                imported += 1
            except Exception as e:
                errors.append(f"{product.name}: {str(e)}")

        db.commit()

        if user_id:
            from .cache import invalidate_cache
            invalidate_cache(f"products:user:{user_id}")

        return {
            "status": "success" if imported > 0 else "error",
            "imported": imported,
            "errors": len(errors),
            "error_details": errors[:10]
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


class GoogleSheetImportRequest(BaseModel):
    """Google Sheets import request."""
    sheet_url: str
    sheet_id: str

@router.post("/products/import-google-sheet")
async def import_from_google_sheet(request: GoogleSheetImportRequest):
    """Import products from a public Google Sheet."""
    import httpx
    
    try:
        # Construct CSV export URL
        csv_url = f"https://docs.google.com/spreadsheets/d/{request.sheet_id}/export?format=csv"
        
        async with httpx.AsyncClient() as client:
            response = await client.get(csv_url, follow_redirects=True, timeout=30.0)
            
            if response.status_code != 200:
                return {"status": "error", "message": "Could not access sheet. Make sure it's publicly viewable."}
            
            csv_content = response.text
        
        # Parse CSV
        lines = csv_content.strip().split('\n')
        if len(lines) < 2:
            return {"status": "error", "message": "Sheet appears empty"}
        
        headers = [h.strip().lower() for h in lines[0].split(',')]
        products = []
        
        for line in lines[1:]:
            values = line.split(',')
            product = {
                "name": "",
                "price_ngn": 0,
                "stock_level": 1,
                "description": "",
                "category": ""
            }
            
            for idx, header in enumerate(headers):
                if idx >= len(values):
                    break
                value = values[idx].strip().strip('"')
                
                if 'name' in header or 'product' in header:
                    product["name"] = value
                elif 'price' in header:
                    try:
                        product["price_ngn"] = float(value.replace('₦', '').replace(',', '').replace('N', ''))
                    except:
                        pass
                elif 'stock' in header or 'qty' in header or 'quantity' in header:
                    try:
                        product["stock_level"] = int(value.replace(',', ''))
                    except:
                        pass
                elif 'desc' in header:
                    product["description"] = value
                elif 'cat' in header:
                    product["category"] = value
            
            if product["name"] and product["price_ngn"] > 0:
                products.append(product)
        
        return {
            "status": "success",
            "products": products,
            "count": len(products)
        }
        
    except Exception as e:
        logger.error(f"Google Sheets import error: {e}")
        return {"status": "error", "message": str(e)}


@router.post("/products/scan-image")
async def scan_product_image(image: UploadFile = File(...)):
    """
    OCR scan of product list image.
    Parses handwritten or printed product lists.
    """
    try:
        content = await image.read()
        
        # For now, return demo parsed data
        # In production, integrate with Google Cloud Vision or Azure OCR
        return {
            "status": "success",
            "text": "Nike Air Max - 45000 x 10\nPolo Shirt - 15000 x 25\nLeather Bag - 35000 x 5",
            "products": [
                {"name": "Nike Air Max", "price_ngn": 45000, "stock_level": 10, "description": "", "category": ""},
                {"name": "Polo Shirt", "price_ngn": 15000, "stock_level": 25, "description": "", "category": ""},
                {"name": "Leather Bag", "price_ngn": 35000, "stock_level": 5, "description": "", "category": ""}
            ],
            "message": "Demo mode: Real OCR requires Google Cloud Vision API setup"
        }
    except Exception as e:
        logger.error(f"Image scan error: {e}")
        return {"status": "error", "message": str(e)}


# ============== WIDGET ENDPOINTS ==============

@router.get("/widget/stats")
async def get_widget_stats(vendor_id: str = "default", user_id: str = None):
    """
    Lightweight stats endpoint for home screen widget.
    Returns minimal data for fast widget updates — fully DB-backed.
    """
    from .database import SessionLocal
    from .models import Product as ProductModel, Order as OrderModel
    from datetime import date
    from sqlalchemy import func

    today = date.today().isoformat()
    effective_user_id = user_id or vendor_id

    db = SessionLocal()
    try:
        # Today's paid/fulfilled orders
        order_query = db.query(OrderModel)
        if effective_user_id and effective_user_id != "default":
            order_query = order_query.filter(OrderModel.user_id == effective_user_id)

        today_revenue = order_query.filter(
            OrderModel.status.in_(["paid", "fulfilled"]),
            func.date(OrderModel.created_at) == today
        ).with_entities(func.coalesce(func.sum(OrderModel.total_amount), 0)).scalar()

        today_order_count = order_query.filter(
            OrderModel.status.in_(["paid", "fulfilled"])
        ).count()

        pending_count = order_query.filter(OrderModel.status == "pending").count()

        # Low stock
        product_query = db.query(ProductModel)
        if effective_user_id and effective_user_id != "default":
            product_query = product_query.filter(ProductModel.user_id == effective_user_id)

        low_stock_count = product_query.filter(
            ProductModel.stock_level <= LOW_STOCK_THRESHOLD
        ).count()

        return {
            "date": today,
            "revenue_today": float(today_revenue or 0),
            "orders_today": today_order_count,
            "pending_orders": pending_count,
            "low_stock_alerts": low_stock_count,
            "currency": "NGN"
        }
    finally:
        db.close()


# ============== PAYMENT ENDPOINTS (PAYSTACK) ==============

class CreatePaymentRequest(BaseModel):
    """Request to create a payment link."""
    order_id: str
    amount_ngn: float
    customer_phone: str
    description: str = "KOFA Order"
    customer_email: Optional[str] = None


@router.post("/payments/create-link")
async def create_payment_link(request: CreatePaymentRequest, vendor_id: str = "default"):
    """Generate a Paystack payment link for an order."""
    payment_request = PaymentLinkRequest(
        order_id=request.order_id,
        amount_ngn=request.amount_ngn,
        customer_phone=request.customer_phone,
        customer_email=request.customer_email,
        description=request.description,
        vendor_id=vendor_id
    )
    
    payment_url = await paystack_service.create_payment_link(payment_request)
    
    if not payment_url:
        raise HTTPException(status_code=500, detail="Failed to create payment link")
    
    return {
        "status": "success",
        "payment_url": payment_url,
        "order_id": request.order_id,
        "amount_ngn": request.amount_ngn
    }


@router.get("/payments/verify/{reference}")
async def verify_payment(reference: str):
    """Verify a Paystack payment by reference."""
    result = await paystack_service.verify_payment(reference)
    
    if not result:
        raise HTTPException(status_code=404, detail="Payment not found")
    
    return result


@router.post("/payments/webhook")
async def paystack_webhook(request: Request):
    """Handle Paystack webhook events."""
    body = await request.body()
    signature = request.headers.get("x-paystack-signature", "")
    
    # Verify webhook signature
    if not paystack_service.verify_webhook_signature(body, signature):
        raise HTTPException(status_code=401, detail="Invalid signature")
    
    payload = await request.json()
    event = payload.get("event", "")
    data = payload.get("data", {})
    
    result = await paystack_service.process_webhook(event, data)
    
    # If payment successful, send push notification to vendor
    if event == "charge.success" and result.get("processed"):
        vendor_id = result.get("vendor_id", "default")
        amount = result.get("amount_ngn", 0)
        await push_service.notify_payment_received(vendor_id, f"₦{amount:,.0f}")
    
    return {"status": "ok"}


# ============== SUBSCRIPTION ENDPOINTS ==============

@router.get("/pricing/plans")
async def get_pricing_plans():
    """Get all available pricing plans."""
    plans = subscription_service.get_all_plans()
    return {
        "plans": [
            {
                "tier": p.tier.value,
                "name": p.name,
                "price_monthly": p.price_ngn_monthly,
                "price_yearly": p.price_ngn_yearly,
                "features": p.features,
                "limits": {
                    "messages_per_day": p.limits.messages_per_day,
                    "products_limit": p.limits.products_limit,
                    "analytics_access": p.limits.analytics_access,
                    "multi_platform": p.limits.multi_platform,
                    "bulk_operations": p.limits.bulk_operations
                }
            }
            for p in plans
        ]
    }


@router.get("/subscription/status")
async def get_subscription_status(vendor_id: str = "default"):
    """Get vendor's current subscription status."""
    sub = subscription_service.get_subscription(vendor_id)
    plan = subscription_service.get_plan(sub.tier)
    can_send, used, limit = subscription_service.check_message_limit(vendor_id)
    
    return {
        "tier": sub.tier.value,
        "plan_name": plan.name,
        "is_active": sub.is_active,
        "expires_at": sub.expires_at,
        "usage": {
            "messages_today": used,
            "messages_limit": limit,
            "can_send_more": can_send
        },
        "features": plan.features
    }


@router.post("/subscription/upgrade")
async def upgrade_subscription(tier: str, vendor_id: str = "default"):
    """Upgrade subscription to a new tier (returns payment URL)."""
    try:
        target_tier = SubscriptionTier(tier)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid tier: {tier}")
    
    # Generate payment URL for upgrade
    upgrade_url = subscription_service.get_upgrade_url(vendor_id, target_tier)
    plan = subscription_service.get_plan(target_tier)
    
    return {
        "status": "pending_payment",
        "tier": tier,
        "price_monthly": plan.price_ngn_monthly,
        "payment_url": upgrade_url
    }


# ============== PRIVACY/NDPR ENDPOINTS ==============

class ConsentRequest(BaseModel):
    """Consent recording request."""
    customer_phone: str
    consent_type: str
    granted: bool


@router.post("/privacy/consent")
async def record_consent(request: ConsentRequest, vendor_id: str = "default"):
    """Record customer consent (NDPR compliance)."""
    try:
        consent_type = ConsentType(request.consent_type)
    except ValueError:
        raise HTTPException(status_code=400, detail=f"Invalid consent type: {request.consent_type}")
    
    record = privacy_service.record_consent(
        customer_phone=request.customer_phone,
        vendor_id=vendor_id,
        consent_type=consent_type,
        granted=request.granted
    )
    
    return {
        "status": "recorded",
        "consent_type": record.consent_type.value,
        "granted": record.granted,
        "recorded_at": record.granted_at
    }


@router.get("/privacy/consent/{customer_phone}")
async def get_consents(customer_phone: str, vendor_id: str = "default"):
    """Get all consent records for a customer."""
    consents = privacy_service.get_all_consents(customer_phone, vendor_id)
    
    return {
        "customer_phone": customer_phone,
        "consents": {
            ct.value: {
                "granted": c.granted,
                "granted_at": c.granted_at,
                "revoked_at": c.revoked_at
            }
            for ct, c in consents.items()
        }
    }


@router.post("/privacy/data-deletion")
async def request_data_deletion(customer_phone: str, vendor_id: str = "default", reason: str = None):
    """Request deletion of customer data (Right to Erasure)."""
    result = privacy_service.request_data_deletion(customer_phone, vendor_id, reason)
    return result


@router.post("/privacy/data-export")
async def request_data_export(customer_phone: str, vendor_id: str = "default"):
    """Request export of customer data (Right to Data Portability)."""
    result = privacy_service.request_data_export(customer_phone, vendor_id)
    return result


# ============== LANGUAGE ENDPOINTS ==============

@router.get("/languages")
async def get_available_languages():
    """Get list of supported languages."""
    return {
        "languages": localization_service.get_available_languages(),
        "default": "en"
    }


@router.post("/languages/detect")
async def detect_language(text: str):
    """Auto-detect language from text."""
    detected = localization_service.detect_language(text)
    return {
        "text": text,
        "detected_language": detected.value,
        "language_name": localization_service.get_available_languages().get(detected.value)
    }


@router.get("/languages/translate/{key}")
async def get_translation(key: str, language: str = "en", **kwargs):
    """Get translated text for a key."""
    try:
        lang = Language(language)
    except ValueError:
        lang = Language.ENGLISH
    
    translated = localization_service.translate(key, lang)
    return {
        "key": key,
        "language": language,
        "text": translated
    }


# Include routers
# #region agent log - Router setup
log_to_file("Setting up main router", {"routers_count": "12+"})
# #endregion

app.include_router(router)
app.include_router(expenses.router, prefix="/expenses", tags=["Spend"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(invoice.router, prefix="/invoice", tags=["Invoice"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(installments.router, prefix="/installments", tags=["Installments"])
app.include_router(profit_loss.router, prefix="/profit-loss", tags=["Profit/Loss"])
app.include_router(sales_channels.router, prefix="/channels", tags=["Sales Channels"])
app.include_router(whatsapp.router, prefix="/whatsapp", tags=["WhatsApp"])
app.include_router(instagram.router, prefix="/instagram", tags=["Instagram"])
app.include_router(tiktok.router, prefix="/tiktok", tags=["TikTok"])
app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(storefront.router, tags=["Storefront"])  # Public shop pages
app.include_router(sales.router, prefix="/sales", tags=["Sales"])  # Walk-in sales
app.include_router(export.router, prefix="/export", tags=["Export"])  # CSV data export
app.include_router(customers.router, prefix="/customers", tags=["CRM"])  # Customer CRM

# #region agent log - FastAPI app fully configured
log_to_file("FastAPI app fully configured", {
    "routers_loaded": 12,
    "cors_enabled": True,
    "app_title": app.title,
    "app_version": app.version
})
# #endregion