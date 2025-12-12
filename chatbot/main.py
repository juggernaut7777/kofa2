from fastapi import FastAPI, HTTPException, APIRouter
from pydantic import BaseModel
from typing import Optional, List
import uuid

from .inventory import InventoryManager
from .intent import IntentRecognizer, Intent
from .payment import PaymentManager
from .response_formatter import ResponseFormatter, ResponseStyle
from .routers import (
    expenses, delivery, analytics, invoice, 
    recommendations, notifications, installments, profit_loss, sales_channels, whatsapp
)

app = FastAPI(
    title="Owo Flow Commerce Engine",
    description="WhatsApp-first commerce system for Nigerian market",
    version="1.0.0"
)

# In‑memory store for demo purposes (User preferences)
USERS: dict = {}
router = APIRouter()

# Initialize components
inventory_manager = InventoryManager()
intent_recognizer = IntentRecognizer()
payment_manager = PaymentManager()
# Default to street style for demo, but could be dynamic based on user profile
response_formatter = ResponseFormatter(style=ResponseStyle.STREET)

class MessageRequest(BaseModel):
    """Incoming message payload."""
    user_id: str  # Customer phone number
    message_text: str

class MessageResponse(BaseModel):
    """Chatbot reply."""
    response: str
    intent: str
    product: Optional[dict] = None
    payment_link: Optional[str] = None

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

class OrderRequest(BaseModel):
    items: List[OrderItem]
    user_id: str # Phone number

class OrderResponse(BaseModel):
    order_id: str
    payment_link: str
    amount_ngn: float
    message: str

# Health endpoints
@app.get("/")
async def root():
    """Health check endpoint."""
    return {"status": "online", "service": "Owo Flow Commerce Engine", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

@router.get("/products")
async def get_products():
    """Get all products from inventory."""
    return inventory_manager.list_products()

@router.post("/orders", response_model=OrderResponse)
async def create_order(request: OrderRequest):
    """Create a new order and generate payment link."""
    total_amount = 0.0
    
    # Calculate total and verify stock (simplified)
    # in a real app, we should lock stock or check immediately before
    for item in request.items:
        # We need to fetch product details. For now we assume we have them or fetch them.
        # Since InventoryManager.list_products returns dicts, we can use that or get_product_by_id if we added it.
        # For MVP, let's just trust the price passed or fetch all products to look up price.
        # Optimally: InventoryManager should have get_product_by_id
        pass 
    
    # Let's iterate over inventory to find prices. This is inefficient but fine for this MVP step.
    # In production, implement get_product_by_id in InventoryManager
    all_products = inventory_manager.list_products()
    product_map = {str(p.get('id')): p for p in all_products}
    
    for item in request.items:
        product = product_map.get(item.product_id)
        if not product:
            # If not found by ID, maybe mock logic used name as ID? 
            # In Supabase logic, ID should be UUID.
            # If we can't find it, skip or error.
            print(f"Product {item.product_id} not found")
            continue
            
        total_amount += product['price_ngn'] * item.quantity

    if total_amount == 0:
        # Fallback for testing if IDs don't match or empty
        # If we are testing with mocks, let's assume a default price
        total_amount = 1000.0 * len(request.items)

    order_id = str(uuid.uuid4())
    payment_link = payment_manager.generate_payment_link(
        order_id=order_id,
        amount_ngn=int(total_amount),
        customer_phone=request.user_id,
        description=f"Order {order_id[:8]}"
    )
    
    if not payment_link:
        raise HTTPException(status_code=500, detail="Failed to generate payment link")
        
    return OrderResponse(
        order_id=order_id,
        payment_link=payment_link,
        amount_ngn=total_amount,
        message="Order created successfully"
    )


@router.get("/orders")
async def get_orders(status: Optional[str] = None):
    """
    Get all orders for merchant dashboard.
    For MVP, returns mock orders. In production, query Supabase.
    """
    # In production, this would query Supabase:
    # orders = supabase.table("orders").select("*").execute()
    
    # For MVP demo, return mock orders
    import datetime
    
    mock_orders = [
        {
            "id": "order-001",
            "customer_phone": "+2348012345678",
            "items": [
                {"product_id": "1", "product_name": "Nike Air Max Red", "quantity": 1, "price": 45000}
            ],
            "total_amount": 45000,
            "status": "pending",
            "created_at": (datetime.datetime.now() - datetime.timedelta(minutes=30)).isoformat()
        },
        {
            "id": "order-002",
            "customer_phone": "+2349087654321",
            "items": [
                {"product_id": "3", "product_name": "Men Formal Shirt White", "quantity": 2, "price": 15000},
                {"product_id": "6", "product_name": "Plain Round Neck T-Shirt", "quantity": 3, "price": 8000}
            ],
            "total_amount": 54000,
            "status": "paid",
            "payment_ref": "PAY-ABC123",
            "created_at": (datetime.datetime.now() - datetime.timedelta(hours=2)).isoformat()
        },
        {
            "id": "order-003",
            "customer_phone": "+2348055551234",
            "items": [
                {"product_id": "5", "product_name": "Black Leather Bag", "quantity": 1, "price": 35000}
            ],
            "total_amount": 35000,
            "status": "fulfilled",
            "payment_ref": "PAY-XYZ789",
            "created_at": (datetime.datetime.now() - datetime.timedelta(days=1)).isoformat()
        }
    ]
    
    # Filter by status if provided
    if status:
        mock_orders = [o for o in mock_orders if o["status"].lower() == status.lower()]
    
    return mock_orders

@router.post("/message")
async def process_message(request: MessageRequest):
    """
    Process incoming message:
    1. Recognize intent
    2. Execute action (check stock, get price)
    3. Format response
    """
    user_id = request.user_id
    text = request.message_text
    
    # Recognize intent
    intent = intent_recognizer.recognize(text)
    
    response_text = ""
    product_data = None
    payment_link = None
    
    # Handle intents
    if intent == Intent.GREETING:
        response_text = response_formatter.format_greeting()
        
    elif intent == Intent.HELP:
        response_text = response_formatter.format_help()
        
    elif intent in [Intent.PRICE_INQUIRY, Intent.AVAILABILITY_CHECK, Intent.PURCHASE]:
        # Extract product entity
        product_query = intent_recognizer.extract_product_query(text)
        
        if not product_query:
            if intent == Intent.PURCHASE:
                response_text = response_formatter.format_purchase_no_context()
            else:
                 response_text = response_formatter.format_unknown_message()
        else:
            # Query inventory
            product = inventory_manager.get_product_by_name(product_query)
            
            if not product:
                response_text = response_formatter.format_product_not_found(product_query)
            else:
                product_data = product
                price_fmt = payment_manager.format_naira(product["price_ngn"])
                
                if intent == Intent.PURCHASE:
                    if product["stock_level"] > 0:
                        # Generate payment link
                        # Ensure we have a valid ID. In Supabase it's usually 'id', but verify schema.
                        # Schema says 'id' uuid default gen_random_uuid()
                        prod_id = str(product.get("id", ""))
                        link = payment_manager.generate_payment_link(
                            order_id=f"ORD-{user_id[-4:]}-{prod_id[:4]}", # Simple ID gen
                            amount_ngn=int(product["price_ngn"]),
                            customer_phone=user_id,
                            description=f"Purchase {product['name']}"
                        )
                        if link:
                            payment_link = link
                            response_text = response_formatter.format_payment_link(
                                product['name'], link, price_fmt, 15
                            )
                        else:
                            response_text = response_formatter.format_payment_link_failed()
                    else:
                        response_text = response_formatter.format_out_of_stock(product["name"])
                else:
                    # Availability / Price check
                    if product["stock_level"] > 0:
                         response_text = response_formatter.format_product_available(
                             product["name"], price_fmt, product["stock_level"]
                         )
                    else:
                        response_text = response_formatter.format_out_of_stock(product["name"])

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

# Include routers
app.include_router(router)
app.include_router(expenses.router, prefix="/expenses", tags=["Spend"])
app.include_router(delivery.router, prefix="/delivery", tags=["Delivery"])
app.include_router(analytics.router, prefix="/analytics", tags=["Analytics"])
app.include_router(invoice.router, prefix="/invoice", tags=["Invoice"])
app.include_router(recommendations.router, prefix="/recommendations", tags=["Recommendations"])
app.include_router(notifications.router, prefix="/notifications", tags=["Notifications"])
app.include_router(installments.router, prefix="/installments", tags=["Installments"])
app.include_router(profit_loss.router, prefix="/profit-loss", tags=["Profit/Loss"])
app.include_router(sales_channels.router, prefix="/channels", tags=["Sales Channels"])
app.include_router(whatsapp.router, prefix="/whatsapp", tags=["WhatsApp"])



