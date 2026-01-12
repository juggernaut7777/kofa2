from fastapi import FastAPI, HTTPException, APIRouter, UploadFile, File, Request
from fastapi.responses import PlainTextResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, validator
from typing import Optional, List, Dict
import uuid
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
import os
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
from .services.localization import localization_service, Language, t
from .services import storage_service
from .routers import (
    expenses, analytics, invoice, 
    recommendations, notifications, installments, profit_loss, sales_channels, whatsapp,
    instagram, tiktok
)

app = FastAPI(
    title="KOFA Commerce Engine",
    description="AI-powered commerce platform for modern merchants",
    version="2.0.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# In‑memory store for demo purposes (User preferences)
USERS: dict = {}

# Orders store - tracks orders created by chatbot
ORDERS_STORE: dict = {}

# Customer purchase history tracking
CUSTOMER_HISTORY: dict = {}

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

# ============== FREEMIUM LIMITS ==============
FREEMIUM_LIMITS = {
    "free": {
        "max_products": 5,
        "max_orders_per_month": 30,
        "max_bot_conversations_per_month": 50,
        "max_image_uploads": 3,
    },
    "pro": {
        "max_products": 999999,  # Unlimited
        "max_orders_per_month": 999999,
        "max_bot_conversations_per_month": 999999,
        "max_image_uploads": 999999,
    }
}

# Usage tracking (resets monthly)
USAGE_TRACKING: dict = {
    "orders_this_month": 0,
    "bot_conversations_this_month": 0,
    "month_started": datetime.now().strftime("%Y-%m"),
}

def get_subscription_tier() -> str:
    """Get current subscription tier."""
    return VENDOR_SETTINGS.get("subscription_tier", "free")

def check_limit(limit_type: str) -> dict:
    """
    Check if user has hit a freemium limit.
    Returns: {"allowed": bool, "current": int, "max": int, "upgrade_needed": bool}
    """
    tier = get_subscription_tier()
    limits = FREEMIUM_LIMITS.get(tier, FREEMIUM_LIMITS["free"])
    
    # Reset monthly counters if new month
    current_month = datetime.now().strftime("%Y-%m")
    if USAGE_TRACKING.get("month_started") != current_month:
        USAGE_TRACKING["orders_this_month"] = 0
        USAGE_TRACKING["bot_conversations_this_month"] = 0
        USAGE_TRACKING["month_started"] = current_month
    
    if limit_type == "products":
        current = len(inventory_manager.list_products())
        max_allowed = limits["max_products"]
    elif limit_type == "orders":
        current = USAGE_TRACKING.get("orders_this_month", 0)
        max_allowed = limits["max_orders_per_month"]
    elif limit_type == "bot_conversations":
        current = USAGE_TRACKING.get("bot_conversations_this_month", 0)
        max_allowed = limits["max_bot_conversations_per_month"]
    elif limit_type == "image_uploads":
        # Count products with images
        products = inventory_manager.list_products()
        current = sum(1 for p in products if p.get("image_url"))
        max_allowed = limits["max_image_uploads"]
    else:
        return {"allowed": True, "current": 0, "max": 999999, "upgrade_needed": False}
    
    allowed = current < max_allowed
    return {
        "allowed": allowed,
        "current": current,
        "max": max_allowed,
        "upgrade_needed": not allowed and tier == "free"
    }

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
async def get_products():
    """Get all products from inventory. CACHED for 60 seconds to reduce I/O costs."""
    cache_key = "products:all"
    
    # Check cache first (fast, in-memory)
    cached = get_cache(cache_key)
    if cached is not None:
        return cached
    
    # Cache miss - fetch from database
    products = inventory_manager.list_products()
    
    # Store in cache for 60 seconds
    set_cache(cache_key, products, ttl_seconds=60)
    
    return products

@router.post("/orders", response_model=OrderResponse)
async def create_order(request: OrderRequest):
    """Create a new order and generate payment link."""
    # Validate request
    if not request.items:
        raise HTTPException(status_code=400, detail="Order must contain at least one item")
    
    if not request.user_id or not request.user_id.strip():
        raise HTTPException(status_code=400, detail="User ID is required")
    
    total_amount = 0.0
    order_items = []
    products_to_decrement = []  # Track products for stock decrement
    
    # Validate all products exist and have sufficient stock
    for item in request.items:
        # Validate quantity
        if item.quantity <= 0:
            raise HTTPException(
                status_code=400, 
                detail=f"Invalid quantity for product {item.product_id}: {item.quantity}. Quantity must be greater than 0"
            )
        
        # Get product by ID
        product = inventory_manager.get_product_by_id(item.product_id)
        if not product:
            raise HTTPException(
                status_code=404, 
                detail=f"Product {item.product_id} not found"
            )
        
        # Check stock availability
        current_stock = product.get("stock_level", 0)
        if current_stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {product.get('name', 'product')}. Available: {current_stock}, Requested: {item.quantity}"
            )
        
        # Calculate item total
        price = float(product.get("price_ngn", 0))
        if price <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid price for product {product.get('name', 'product')}: {price}"
            )
        
        item_total = price * item.quantity
        total_amount += item_total
        
        # Store order item details
        order_items.append({
            "product_id": item.product_id,
            "product_name": product.get("name", "Unknown"),
            "quantity": item.quantity,
            "price": price,
            "total": item_total
        })
        
        # Track for stock decrement
        products_to_decrement.append((item.product_id, item.quantity))
    
    if total_amount <= 0:
        raise HTTPException(status_code=400, detail="Order total must be greater than 0")

    # Generate order ID
    order_id = str(uuid.uuid4())
    
    # Decrement stock for all items (do this before creating payment link)
    for product_id, quantity in products_to_decrement:
        success = inventory_manager.decrement_stock(product_id, quantity)
        if not success:
            # This should rarely happen since we checked above, but handle it anyway
            raise HTTPException(
                status_code=500,
                detail=f"Failed to reserve stock for product {product_id}. Please try again."
            )
    
    # Generate payment link
    payment_link = payment_manager.generate_payment_link(
        order_id=order_id,
        amount_ngn=int(round(total_amount)),
        customer_phone=request.user_id,
        description=f"Order {order_id[:8]}"
    )
    
    if not payment_link:
        # Rollback stock decrements if payment link generation fails
        # Note: In production, use database transactions for this
        for product_id, quantity in products_to_decrement:
            inventory_manager.update_stock(product_id, quantity)  # Restore stock
        raise HTTPException(status_code=500, detail="Failed to generate payment link")
    
    # Store order in ORDERS_STORE
    ORDERS_STORE[order_id] = {
        "id": order_id,
        "customer_phone": request.user_id,
        "items": order_items,
        "total_amount": total_amount,
        "status": "pending",
        "payment_ref": None,
        "created_at": datetime.now().isoformat()
    }
    
    # Invalidate orders cache so new order appears immediately
    invalidate_cache(prefix="orders:")
        
    return OrderResponse(
        order_id=order_id,
        payment_link=payment_link,
        amount_ngn=total_amount,
        message="Order created successfully"
    )


# ===== BUSINESS AI ENDPOINT =====
# Conversation history storage for Business AI
BUSINESS_AI_CONVERSATIONS: Dict[str, List[Dict]] = {}

@router.post("/business-ai")
async def business_ai_chat(request: BusinessAIRequest):
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
        conversation_id = request.conversation_id or str(uuid.uuid4())
        
        # Get conversation history
        history = BUSINESS_AI_CONVERSATIONS.get(conversation_id, [])
        
        # Process with AI
        result = await process_business_command(
            message=request.message,
            user_id=request.user_id,
            inventory_manager=inventory_manager,
            conversation_history=history
        )
        
        # Update conversation history
        history.append({"role": "user", "content": request.message})
        history.append({"role": "assistant", "content": result["response"]})
        
        # Keep only last 10 messages for context
        BUSINESS_AI_CONVERSATIONS[conversation_id] = history[-10:]
        
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
            conversation_id=request.conversation_id or str(uuid.uuid4())
        )
    except Exception as e:
        logger.error(f"Business AI error: {e}")
        return BusinessAIResponse(
            response=f"Sorry, I encountered an error: {str(e)}. Please try again.",
            conversation_id=request.conversation_id or str(uuid.uuid4())
        )


@router.get("/orders")
async def get_orders(status: Optional[str] = None):
    """
    Get all orders for merchant dashboard.
    Fetches from database, falling back to ORDERS_STORE + mock demo orders.
    PERFORMANCE OPTIMIZED: Uses eager loading + 60-second caching.
    """
    # Build cache key based on status filter
    cache_key = f"orders:{status or 'all'}"
    
    # Check cache first (fast, in-memory)
    cached = get_cache(cache_key)
    if cached is not None:
        return cached
    
    from datetime import timedelta
    from sqlalchemy.orm import joinedload
    
    all_orders = []
    
    # Try to fetch from database first
    try:
        from .database import SessionLocal
        from .models import Order as OrderModel, OrderItem as OrderItemModel
        
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
        logger.warning(f"Database query failed, using memory store: {db_error}")
        # Fallback to ORDERS_STORE
        for order_id, order in ORDERS_STORE.items():
            all_orders.append({
                "id": order.get("id", order_id),
                "customer_phone": order.get("customer_phone", "Unknown"),
                "items": order.get("items", []),
                "total_amount": order.get("total_amount", 0),
                "status": order.get("status", "pending"),
                "payment_ref": order.get("payment_ref"),
                "created_at": order.get("created_at", datetime.now().isoformat()),
                "source": "memory"
            })
    
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

    # Decrement stock first
    success = inventory_manager.decrement_stock(product_id, quantity)
    if not success:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to reserve stock for {product_name}. Please try again."
        )

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

    # Store order in ORDERS_STORE (in-memory for quick access)
    ORDERS_STORE[order_id] = {
        "id": order_id,
        "customer_phone": user_id,
        "items": order_items,
        "total_amount": total_amount,
        "status": "pending",
        "payment_ref": None,
        "created_at": datetime.now().isoformat(),
        "source": "chatbot"
    }
    
    # Increment order usage counter for freemium tracking
    USAGE_TRACKING["orders_this_month"] = USAGE_TRACKING.get("orders_this_month", 0) + 1
    
    # Persist order to database
    try:
        from .database import SessionLocal
        from .models import Order as OrderModel, OrderItem as OrderItemModel
        
        db = SessionLocal()
        try:
            # Create order record
            db_order = OrderModel(
                id=order_id,
                user_id=inventory_manager.user_id,  # Vendor/owner ID
                customer_phone=user_id,
                total_amount=total_amount,
                status="pending",
                notes=f"Chatbot order for {product_name}"
            )
            db.add(db_order)
            
            # Create order item record
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
        except Exception as db_error:
            db.rollback()
            logger.error(f"Failed to persist order to database: {db_error}")
            # Continue anyway - order is in memory
        finally:
            db.close()
    except Exception as import_error:
        logger.error(f"Database import error: {import_error}")

    # Update customer history
    if user_id not in CUSTOMER_HISTORY:
        CUSTOMER_HISTORY[user_id] = {"orders": [], "total_spent": 0}

    CUSTOMER_HISTORY[user_id]["orders"].append({
        "order_id": order_id,
        "product_name": product_name,
        "amount": total_amount,
        "timestamp": datetime.now().isoformat()
    })
    CUSTOMER_HISTORY[user_id]["total_spent"] += total_amount

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
    from .conversation import conversation_manager
    
    user_id = request.user_id
    text = request.message_text
    
    # Check freemium bot conversation limit
    bot_limit = check_limit("bot_conversations")
    if not bot_limit["allowed"]:
        return MessageResponse(
            response=f"⚠️ Monthly conversation limit reached ({bot_limit['max']} messages). The vendor needs to upgrade to Pro for unlimited bot conversations!",
            intent="limit_reached",
            product=None,
            payment_link=None
        )
    
    # Increment bot conversation counter
    USAGE_TRACKING["bot_conversations_this_month"] = USAGE_TRACKING.get("bot_conversations_this_month", 0) + 1
    
    # Get conversation state for this user
    state = conversation_manager.get_state(user_id)
    
    response_text = ""
    product_data = None
    payment_link = None
    
    # Recognize intent
    intent = intent_recognizer.recognize(text)
    
    # ========== PAYMENT CONFIRMATION: Handle "I paid" messages ==========
    if intent == Intent.PAYMENT_CONFIRMATION:
        # Check for pending order in state or ORDERS_STORE
        order = None
        order_id = None
        
        # First check state for pending order
        if state.pending_order_id and state.pending_order_id in ORDERS_STORE:
            order_id = state.pending_order_id
            order = ORDERS_STORE[order_id]
        else:
            # Fallback: find any pending order for this user
            for oid, o in ORDERS_STORE.items():
                if o.get("customer_phone") == user_id and o.get("status") == "pending":
                    order_id = oid
                    order = o
                    break
        
        if order:
            # Update order status
            order["status"] = "paid"
            order["paid_at"] = datetime.now().isoformat()
            
            # Track customer purchase history
            if user_id not in CUSTOMER_HISTORY:
                CUSTOMER_HISTORY[user_id] = {"orders": [], "total_spent": 0}
            CUSTOMER_HISTORY[user_id]["orders"].append(order_id)
            CUSTOMER_HISTORY[user_id]["total_spent"] += order.get("total_amount", 0)
            
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
        
        # Customer recognition - check if returning customer
        if user_id in CUSTOMER_HISTORY:
            history = CUSTOMER_HISTORY[user_id]
            order_count = len(history.get("orders", []))
            total_spent = history.get("total_spent", 0)
            
            if order_count > 0:
                response_text = (
                    f"🎉 *Welcome back, valued customer!*\n\n"
                    f"You've made {order_count} order(s) with us totaling ₦{total_spent:,}.\n\n"
                    f"What can I help you with today? Just tell me what you're looking for!"
                )
            else:
                response_text = response_formatter.format_greeting()
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
        "available_styles": ["corporate", "street"]
    }


@router.post("/products")
async def create_product(product: ProductCreate):
    """Add a new product to inventory."""
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
    
    # Add to inventory (in production, this would insert to Supabase)
    inventory_manager.add_product(new_product)
    
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
async def update_product(product_id: str, updates: ProductUpdate):
    """Update an existing product."""
    # Build updates dict
    update_data = {
        "name": updates.name,
        "price_ngn": updates.price_ngn,
        "stock_level": updates.stock_level,
        "description": updates.description,
        "category": updates.category,
        "voice_tags": updates.voice_tags,
    }
    
    # Use inventory manager to update
    updated_product = inventory_manager.update_product_fields(product_id, update_data)
    
    if not updated_product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    
    return {
        "status": "success",
        "message": f"Product '{updated_product.get('name', 'Unknown')}' updated",
        "product": updated_product
    }


@router.post("/products/{product_id}/restock")
async def restock_product(product_id: str, restock: RestockRequest):
    """Add stock to a product."""
    if restock.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be positive")
    if restock.quantity > 100000:  # Reasonable upper limit
        raise HTTPException(status_code=400, detail="Quantity exceeds maximum allowed (100,000)")
    
    # Find product
    products = inventory_manager.list_products()
    product_found = None
    
    for p in products:
        if str(p.get('id')) == product_id:
            product_found = p
            break
    
    if not product_found:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    
    # Update stock using the inventory manager method
    old_stock = product_found.get('stock_level', 0)
    inventory_manager.update_stock(product_id, restock.quantity)
    new_stock = old_stock + restock.quantity
    
    return {
        "status": "success",
        "message": f"Added {restock.quantity} units to {product_found['name']}",
        "new_stock_level": new_stock
    }


@router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    """Delete a product from inventory."""
    # Find product first to verify it exists
    product = inventory_manager.get_product_by_id(product_id)
    
    if not product:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    
    # Delete from database
    success = inventory_manager.delete_product(product_id)
    
    if not success:
        raise HTTPException(status_code=500, detail="Failed to delete product")
    
    return {
        "status": "success",
        "message": f"Product '{product.get('name', 'Unknown')}' deleted successfully"
    }

# ============== PRODUCT IMAGE UPLOAD ==============

@router.post("/products/{product_id}/image")
async def upload_product_image(product_id: str, file: UploadFile = File(...)):
    """
    Upload an image for a product.
    Stores in Supabase Storage and updates product's image_url.
    """
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid file type. Allowed: {', '.join(allowed_types)}"
        )
    
    # Check file size (max 5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB")
    
    # Find the product first
    products = inventory_manager.list_products()
    product_found = None
    for p in products:
        if str(p.get('id')) == product_id:
            product_found = p
            break
    
    if not product_found:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    
    # Upload to Supabase Storage
    success, message, image_url = await storage_service.upload_product_image(
        product_id=product_id,
        file_bytes=contents,
        filename=file.filename or "image.jpg",
        content_type=file.content_type or "image/jpeg"
    )
    
    if not success:
        raise HTTPException(status_code=500, detail=message)
    
    # Update product with image URL
    inventory_manager.update_product_fields(product_id, {"image_url": image_url})
    
    return {
        "status": "success",
        "message": "Product image uploaded successfully",
        "image_url": image_url,
        "product_id": product_id
    }


@router.delete("/products/{product_id}/image")
async def delete_product_image(product_id: str):
    """Delete the image for a product."""
    # Find product
    products = inventory_manager.list_products()
    product_found = None
    for p in products:
        if str(p.get('id')) == product_id:
            product_found = p
            break
    
    if not product_found:
        raise HTTPException(status_code=404, detail=f"Product {product_id} not found")
    
    image_url = product_found.get("image_url")
    if not image_url:
        return {"status": "success", "message": "No image to delete"}
    
    # Delete from storage
    success, message = await storage_service.delete_product_image(image_url)
    
    if success:
        # Clear image URL from product
        inventory_manager.update_product_fields(product_id, {"image_url": None})
    
    return {
        "status": "success" if success else "error",
        "message": message
    }


@router.put("/orders/{order_id}/status")
async def update_order_status(order_id: str, update: OrderStatusUpdate):
    """Update order status."""
    valid_statuses = ["pending", "paid", "fulfilled"]
    new_status = update.status.lower()
    
    if new_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    # Check if order exists in ORDERS_STORE
    if order_id in ORDERS_STORE:
        # Update the status field within the existing order
        ORDERS_STORE[order_id]["status"] = new_status
        ORDERS_STORE[order_id]["updated_at"] = datetime.now().isoformat()
        
        if new_status == "paid":
            ORDERS_STORE[order_id]["paid_at"] = datetime.now().isoformat()
        elif new_status == "fulfilled":
            ORDERS_STORE[order_id]["fulfilled_at"] = datetime.now().isoformat()
        
        return {
            "status": "success",
            "message": f"Order {order_id} marked as {new_status}",
            "order": ORDERS_STORE[order_id]
        }
    else:
        # Order not in store - create a minimal record (for demo orders)
        ORDERS_STORE[order_id] = {
            "id": order_id,
            "status": new_status,
            "updated_at": datetime.now().isoformat()
        }
        
        return {
            "status": "success",
            "message": f"Order {order_id} marked as {new_status}",
            "order": ORDERS_STORE[order_id]
        }



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


# ============== VENDOR SETTINGS ENDPOINTS ==============

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
async def get_vendor_settings():
    """Get all vendor settings including payment account and business info."""
    return {
        "status": "success",
        "settings": VENDOR_SETTINGS
    }


@router.put("/vendor/payment-account")
async def update_payment_account(account: PaymentAccountUpdate):
    """Update vendor's payment account for receiving payments."""
    VENDOR_SETTINGS["payment_account"] = {
        "bank_name": account.bank_name,
        "account_number": account.account_number,
        "account_name": account.account_name,
    }
    return {
        "status": "success",
        "message": "Payment account updated successfully",
        "payment_account": VENDOR_SETTINGS["payment_account"]
    }


@router.put("/vendor/business-info")
async def update_business_info(info: BusinessInfoUpdate):
    """Update vendor's business information."""
    VENDOR_SETTINGS["business_info"] = {
        "name": info.name,
        "phone": info.phone or "",
        "address": info.address or "",
    }
    return {
        "status": "success",
        "message": "Business info updated successfully",
        "business_info": VENDOR_SETTINGS["business_info"]
    }

@router.get("/vendor/payment-account")
async def get_payment_account():
    """Get vendor's payment account for display to buyers."""
    account = VENDOR_SETTINGS.get("payment_account", {})
    if not account.get("account_number"):
        return {
            "status": "not_configured",
            "message": "Payment account not yet configured"
        }
    return {
        "status": "success",
        "payment_account": account
    }


# ============== FREEMIUM USAGE & SUBSCRIPTION ==============

@router.get("/usage")
async def get_usage_stats():
    """Get current usage stats for freemium tracking."""
    tier = get_subscription_tier()
    limits = FREEMIUM_LIMITS.get(tier, FREEMIUM_LIMITS["free"])
    
    # Get current usage
    products_count = len(inventory_manager.list_products())
    products_with_images = sum(1 for p in inventory_manager.list_products() if p.get("image_url"))
    
    return {
        "tier": tier,
        "usage": {
            "products": {
                "used": products_count,
                "max": limits["max_products"],
                "remaining": max(0, limits["max_products"] - products_count)
            },
            "orders_this_month": {
                "used": USAGE_TRACKING.get("orders_this_month", 0),
                "max": limits["max_orders_per_month"],
                "remaining": max(0, limits["max_orders_per_month"] - USAGE_TRACKING.get("orders_this_month", 0))
            },
            "bot_conversations_this_month": {
                "used": USAGE_TRACKING.get("bot_conversations_this_month", 0),
                "max": limits["max_bot_conversations_per_month"],
                "remaining": max(0, limits["max_bot_conversations_per_month"] - USAGE_TRACKING.get("bot_conversations_this_month", 0))
            },
            "image_uploads": {
                "used": products_with_images,
                "max": limits["max_image_uploads"],
                "remaining": max(0, limits["max_image_uploads"] - products_with_images)
            }
        },
        "month_started": USAGE_TRACKING.get("month_started", datetime.now().strftime("%Y-%m"))
    }

@router.post("/subscription/upgrade")
async def upgrade_subscription(tier: str = "pro"):
    """Upgrade subscription tier (for demo/testing - in production, integrate with payment)."""
    if tier not in ["free", "pro"]:
        raise HTTPException(status_code=400, detail="Invalid tier. Use 'free' or 'pro'")
    
    VENDOR_SETTINGS["subscription_tier"] = tier
    return {
        "status": "success",
        "message": f"Subscription upgraded to {tier.upper()}!",
        "tier": tier,
        "limits": FREEMIUM_LIMITS[tier]
    }


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

# Subscription plans
SUBSCRIPTION_PLANS = {
    "free": SubscriptionPlan(
        id="free",
        name="Free",
        price_ngn=0,
        duration_months=0,
        features=["Up to 50 products", "Basic chatbot", "Manual order tracking"],
        max_products=50,
        max_messages=100
    ),
    "starter": SubscriptionPlan(
        id="starter",
        name="Starter",
        price_ngn=5000,
        duration_months=1,
        features=["Up to 200 products", "AI chatbot", "Order management", "Basic analytics"],
        max_products=200,
        max_messages=1000
    ),
    "professional": SubscriptionPlan(
        id="professional",
        name="Professional",
        price_ngn=15000,
        duration_months=1,
        features=["Unlimited products", "Advanced AI chatbot", "Full analytics", "Multi-channel sales", "Priority support"],
        max_products=-1,  # unlimited
        max_messages=-1   # unlimited
    ),
    "enterprise": SubscriptionPlan(
        id="enterprise",
        name="Enterprise",
        price_ngn=50000,
        duration_months=1,
        features=["Everything in Professional", "Custom integrations", "Dedicated support", "White-label options"],
        max_products=-1,
        max_messages=-1
    )
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
async def get_low_stock_products():
    """Get products that are below the stock threshold."""
    products = inventory_manager.list_products()
    low_stock = [
        {
            "id": p.get("id"),
            "name": p.get("name"),
            "stock_level": p.get("stock_level", 0),
            "category": p.get("category"),
            "needs_restock": True
        }
        for p in products
        if p.get("stock_level", 0) <= LOW_STOCK_THRESHOLD
    ]
    
    return {
        "count": len(low_stock),
        "threshold": LOW_STOCK_THRESHOLD,
        "products": low_stock
    }


@router.get("/products/search")
async def search_products(q: str):
    """Search products by name, category, or voice tags."""
    if not q or len(q) < 2:
        raise HTTPException(status_code=400, detail="Search query must be at least 2 characters")
    
    matching = inventory_manager.smart_search_products(q)
    
    return {
        "query": q,
        "count": len(matching),
        "products": matching
    }


@router.get("/customers/{customer_id}/stats")
async def get_customer_stats(customer_id: str):
    """Get purchase history and stats for a customer."""
    if customer_id in CUSTOMER_HISTORY:
        history = CUSTOMER_HISTORY[customer_id]
        return {
            "customer_id": customer_id,
            "total_orders": len(history.get("orders", [])),
            "total_spent": history.get("total_spent", 0),
            "orders": history.get("orders", []),
            "is_returning_customer": len(history.get("orders", [])) > 1
        }
    else:
        return {
            "customer_id": customer_id,
            "total_orders": 0,
            "total_spent": 0,
            "orders": [],
            "is_returning_customer": False
        }


@router.get("/dashboard/summary")
async def get_dashboard_summary():
    """Get quick summary for merchant dashboard."""
    products = inventory_manager.list_products()
    low_stock_count = sum(1 for p in products if p.get("stock_level", 0) <= LOW_STOCK_THRESHOLD)
    
    # Count orders by status
    pending_orders = sum(1 for o in ORDERS_STORE.values() if o.get("status") == "pending")
    paid_orders = sum(1 for o in ORDERS_STORE.values() if o.get("status") == "paid")
    fulfilled_orders = sum(1 for o in ORDERS_STORE.values() if o.get("status") == "fulfilled")
    
    # Total revenue from paid/fulfilled orders
    total_revenue = sum(
        o.get("total_amount", 0) 
        for o in ORDERS_STORE.values() 
        if o.get("status") in ["paid", "fulfilled"]
    )
    
    return {
        "total_products": len(products),
        "low_stock_count": low_stock_count,
        "low_stock_threshold": LOW_STOCK_THRESHOLD,
        "pending_orders": pending_orders,
        "paid_orders": paid_orders,
        "fulfilled_orders": fulfilled_orders,
        "total_orders": len(ORDERS_STORE),
        "total_revenue": total_revenue,
        "unique_customers": len(CUSTOMER_HISTORY)
    }


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
async def import_products_json(request: BulkProductImportRequest):
    """Import multiple products from JSON array."""
    imported = 0
    errors = []
    
    for product in request.products:
        try:
            new_product = {
                "id": str(uuid.uuid4()),
                "name": product.name,
                "price_ngn": product.price_ngn,
                "stock_level": product.stock_level,
                "description": product.description,
                "category": product.category,
                "voice_tags": [],
                "image_url": ""
            }
            inventory_manager.add_product(new_product)
            imported += 1
        except Exception as e:
            errors.append(f"{product.name}: {str(e)}")
    
    return {
        "status": "success" if imported > 0 else "error",
        "imported": imported,
        "errors": len(errors),
        "error_details": errors[:10]
    }


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
async def get_widget_stats(vendor_id: str = "default"):
    """
    Lightweight stats endpoint for home screen widget.
    Returns minimal data for fast widget updates.
    """
    from datetime import date
    
    today = date.today().isoformat()
    
    # Calculate today's revenue and order count
    today_orders = [
        o for o in ORDERS_STORE.values()
        if o.get("created_at", "").startswith(today) and o.get("status") in ["paid", "fulfilled"]
    ]
    
    today_revenue = sum(o.get("total_amount", 0) for o in today_orders)
    today_order_count = len(today_orders)
    
    # Pending orders needing attention
    pending_count = sum(1 for o in ORDERS_STORE.values() if o.get("status") == "pending")
    
    # Low stock count
    products = inventory_manager.list_products()
    low_stock_count = sum(1 for p in products if p.get("stock_level", 0) <= LOW_STOCK_THRESHOLD)
    
    return {
        "date": today,
        "revenue_today": today_revenue,
        "orders_today": today_order_count,
        "pending_orders": pending_count,
        "low_stock_alerts": low_stock_count,
        "currency": "NGN"
    }


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

# #region agent log - FastAPI app fully configured
log_to_file("FastAPI app fully configured", {
    "routers_loaded": 12,
    "cors_enabled": True,
    "app_title": app.title,
    "app_version": app.version
})
# #endregion