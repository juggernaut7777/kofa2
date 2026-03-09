"""
KOFA AI Brain - Smart Business Assistant
Handles complex business operations via natural language.
PRIVACY: All prompts are vendor-scoped. The AI never sees cross-vendor data.
"""
import json
import re
from typing import Dict, Any, List
from .groq_client import send_to_groq
from .inventory import InventoryManager


def get_business_ai_prompt(vendor_name: str = "your store") -> str:
    """Generate a vendor-scoped business AI system prompt with privacy guards."""
    return f"""You are KOFA Business AI - a PRIVATE business assistant exclusively for {vendor_name}.

You help with:
- Inventory management (add/remove/update products)
- Sales tracking and reports
- Invoice generation
- Stock alerts
- Business analytics

PRIVACY RULES (CRITICAL - NEVER VIOLATE):
- You ONLY have access to {vendor_name}'s inventory, sales, and customer records.
- You must NEVER reference, compare to, or mention any other vendor or seller.
- You must NEVER use phrases like "more than other sellers", "compared to the market", or "other vendors on Kofa".
- If asked about market trends, use GENERAL industry knowledge only, NEVER internal Kofa platform data.
- All analytics you provide must be based ONLY on {vendor_name}'s own historical data.
- When comparing performance, ONLY compare to {vendor_name}'s own past periods.
  GOOD: "Your bag sales are up 20% compared to your last week."
  BAD: "You sold more bags than average on the platform."

IMPORTANT RULES:
1. Respond in a professional, helpful manner using clear English only
2. Do NOT use Pidgin, slang, or informal language
3. Use ₦ for currency (Naira)
4. When user wants to perform an action, include a JSON command in your response
5. ALWAYS include the JSON when an action is needed — the system executes it automatically

AVAILABLE ACTIONS (respond with JSON):

📦 INVENTORY MANAGEMENT:
- ADD_PRODUCT: {{"action": "ADD_PRODUCT", "name": "product name", "quantity": 10, "price": 5000, "category": "optional category"}}
- UPDATE_PRICE: {{"action": "UPDATE_PRICE", "product": "product name", "new_price": 6000}}
- UPDATE_PRODUCT: {{"action": "UPDATE_PRODUCT", "product": "product name", "updates": {{"name": "new name", "price_ngn": 5000, "description": "new desc", "category": "new cat"}}}}
- DELETE_PRODUCT: {{"action": "DELETE_PRODUCT", "product": "product name"}}
- RESTOCK: {{"action": "RESTOCK", "product": "product name", "quantity": 20}}
- CHECK_STOCK: {{"action": "CHECK_STOCK", "product": "product name"}}
- LIST_PRODUCTS: {{"action": "LIST_PRODUCTS"}}
- SEARCH_PRODUCT: {{"action": "SEARCH_PRODUCT", "query": "search term"}}
- LOW_STOCK_ALERT: {{"action": "LOW_STOCK_ALERT", "threshold": 5}}

💰 SALES:
- RECORD_SALE: {{"action": "RECORD_SALE", "product": "product name", "quantity": 1, "customer": "optional phone/name"}}
- REMOVE_STOCK: {{"action": "REMOVE_STOCK", "product": "product name", "quantity": 1}}

📊 REPORTS:
- SALES_REPORT: {{"action": "SALES_REPORT", "period": "today|week|month"}}
- BEST_SELLERS: {{"action": "BEST_SELLERS", "limit": 5}}
- DAILY_SUMMARY: {{"action": "DAILY_SUMMARY"}}

💸 EXPENSES:
- LOG_EXPENSE: {{"action": "LOG_EXPENSE", "amount": 5000, "description": "Delivery fee for 3 packages", "category": "delivery"}}
  Categories: rent, marketing, restock, delivery, misc

💰 PAYMENTS:
- CONFIRM_PAYMENT: {{"action": "CONFIRM_PAYMENT", "order_id": "abc123", "amount": 15000, "method": "transfer"}}

EXAMPLES:
User: "Add 50 red bags at 3000 naira"
You: I'll add that to your inventory right away.
{{"action": "ADD_PRODUCT", "name": "Red Bags", "quantity": 50, "price": 3000}}

User: "I just sold 2 Nike shoes"
You: Let me record that sale.
{{"action": "RECORD_SALE", "product": "Nike shoes", "quantity": 2}}

User: "Change price of blue jeans to 8000"
You: Updating the price now.
{{"action": "UPDATE_PRICE", "product": "blue jeans", "new_price": 8000}}

User: "Delete the broken charger from my store"
You: I'll remove that product from your inventory.
{{"action": "DELETE_PRODUCT", "product": "broken charger"}}

User: "I got 100 more t-shirts delivered"
You: Great! Let me update your stock.
{{"action": "RESTOCK", "product": "t-shirts", "quantity": 100}}

User: "I spent 5000 on transport for deliveries"
You: Let me log that expense.
{{"action": "LOG_EXPENSE", "amount": 5000, "description": "Transport for deliveries", "category": "delivery"}}

User: "Customer paid 15000 for order abc123"
You: I'll confirm that payment now.
{{"action": "CONFIRM_PAYMENT", "order_id": "abc123", "amount": 15000, "method": "transfer"}}

If the user's intent is unclear, ask clarifying questions.
If it's just conversation, respond naturally without JSON.
"""


# Legacy aliases for backward compatibility
BUSINESS_AI_PROMPT = get_business_ai_prompt()


def get_customer_ai_prompt(store_name: str = "our store") -> str:
    """Generate a vendor-scoped customer-facing AI system prompt with privacy guards."""
    return f"""You are KOFA - a friendly AI shopping assistant for {store_name}.

You help customers:
- Find products
- Check prices and availability
- Place orders
- Answer questions about products

PRIVACY RULES (CRITICAL - NEVER VIOLATE):
- You represent {store_name} ONLY. You must never mention other stores or vendors.
- You must never suggest customers go to a different seller or compare prices with competitors.
- You only know about {store_name}'s products, prices, and stock levels.

IMPORTANT RULES:
1. Be professional and helpful using clear English only
2. Do NOT use Pidgin, slang, or informal language
3. Use ₦ for currency (Naira)
4. Keep responses short and clear

AVAILABLE ACTIONS (respond with JSON when needed):
- SEARCH_PRODUCT: {{"action": "SEARCH_PRODUCT", "query": "product name"}}
- CHECK_PRICE: {{"action": "CHECK_PRICE", "product": "product name"}}
- CREATE_ORDER: {{"action": "CREATE_ORDER", "product": "name", "quantity": 1}}
- LIST_CATEGORIES: {{"action": "LIST_CATEGORIES"}}

Current store products will be provided in context.
"""


# Legacy alias for backward compatibility
CUSTOMER_AI_PROMPT = get_customer_ai_prompt()


async def process_business_command(
    message: str,
    user_id: str,
    inventory_manager: InventoryManager,
    conversation_history: List[Dict] = None,
    vendor_name: str = "your store"
) -> Dict[str, Any]:
    """
    Process a business owner's command using AI.
    
    Args:
        message: User's natural language message
        user_id: Business owner's ID
        inventory_manager: Inventory manager instance (must be vendor-scoped)
        conversation_history: Previous messages for context
        vendor_name: Vendor's business name for AI prompt scoping
    
    Returns:
        Response with AI message and any actions taken
    """
    # Get current inventory context (already vendor-scoped via inventory_manager)
    products = inventory_manager.list_products()
    product_summary = "\n".join([
        f"- {p['name']}: {p['stock_level']} in stock, ₦{p['price_ngn']}"
        for p in products[:20]  # Limit to 20 for context
    ])
    
    context = f"""
Current Inventory ({len(products)} products):
{product_summary}
"""
    
    # Build messages
    messages = conversation_history or []
    messages.append({
        "role": "user",
        "content": f"{message}\n\n[Context: {context}]"
    })
    
    # Get AI response with vendor-scoped prompt
    ai_response = await send_to_groq(
        messages=messages,
        system_prompt=get_business_ai_prompt(vendor_name),
        max_tokens=500,
        temperature=0.3  # Lower for more consistent actions
    )
    
    # Parse for JSON action
    action_result = None
    action_taken = None
    
    try:
        # Look for JSON in response (support nested objects too)
        json_match = re.search(r'\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}', ai_response)
        if json_match:
            action_data = json.loads(json_match.group())
            action_type = action_data.get("action")
            
            # ===== INVENTORY MANAGEMENT =====
            
            if action_type == "ADD_PRODUCT":
                product_data = {
                    "name": action_data.get("name"),
                    "stock_level": action_data.get("quantity", 0),
                    "price_ngn": action_data.get("price", 0),
                    "voice_tags": [action_data.get("name", "").lower()],
                }
                if action_data.get("category"):
                    product_data["category"] = action_data["category"]
                result = inventory_manager.add_product(product_data)
                action_taken = "ADD_PRODUCT"
                qty = action_data.get('quantity', 0)
                price = action_data.get('price', 0)
                action_result = f"✅ Added {action_data.get('name')} — {qty} units at ₦{price:,}"
                
            elif action_type == "UPDATE_PRICE":
                product = inventory_manager.get_product_by_name(action_data.get("product"))
                if product:
                    new_price = action_data.get("new_price", 0)
                    inventory_manager.update_product_fields(
                        product["id"],
                        {"price_ngn": new_price}
                    )
                    action_taken = "UPDATE_PRICE"
                    action_result = f"✅ Updated {product['name']} price: ₦{product['price_ngn']:,} → ₦{new_price:,}"
                else:
                    action_result = f"❌ Product '{action_data.get('product')}' not found"
            
            elif action_type == "UPDATE_PRODUCT":
                product = inventory_manager.get_product_by_name(action_data.get("product"))
                if product:
                    updates = action_data.get("updates", {})
                    inventory_manager.update_product_fields(product["id"], updates)
                    action_taken = "UPDATE_PRODUCT"
                    changed = ", ".join(f"{k}={v}" for k, v in updates.items())
                    action_result = f"✅ Updated {product['name']}: {changed}"
                else:
                    action_result = f"❌ Product '{action_data.get('product')}' not found"
                    
            elif action_type == "DELETE_PRODUCT":
                product = inventory_manager.get_product_by_name(action_data.get("product"))
                if product:
                    inventory_manager.delete_product(product["id"])
                    action_taken = "DELETE_PRODUCT"
                    action_result = f"✅ Deleted {product['name']} from inventory"
                else:
                    action_result = f"❌ Product '{action_data.get('product')}' not found"
                    
            elif action_type == "RESTOCK":
                product = inventory_manager.get_product_by_name(action_data.get("product"))
                if product:
                    qty = action_data.get("quantity", 0)
                    inventory_manager.update_stock(product["id"], qty)
                    new_stock = product["stock_level"] + qty
                    action_taken = "RESTOCK"
                    action_result = f"✅ Restocked {product['name']}: +{qty} units (now {new_stock} total)"
                else:
                    action_result = f"❌ Product '{action_data.get('product')}' not found"
            
            elif action_type == "SEARCH_PRODUCT":
                query = action_data.get("query", "")
                found = inventory_manager.smart_search_products(query)
                action_taken = "SEARCH_PRODUCT"
                if found:
                    items = "\n".join([f"  📦 {p['name']}: {p['stock_level']} in stock, ₦{p['price_ngn']:,}" for p in found[:10]])
                    action_result = f"🔍 Found {len(found)} product(s):\n{items}"
                else:
                    action_result = f"❌ No products found matching '{query}'"
            
            # ===== SALES =====
            
            elif action_type == "RECORD_SALE" or action_type == "REMOVE_STOCK":
                product = inventory_manager.get_product_by_name(action_data.get("product"))
                if product:
                    qty = action_data.get("quantity", 1)
                    success = inventory_manager.decrement_stock(product["id"], qty)
                    if success:
                        action_taken = action_type
                        revenue = product['price_ngn'] * qty
                        remaining = product['stock_level'] - qty
                        action_result = f"✅ Sold {qty}x {product['name']} — ₦{revenue:,} revenue ({remaining} left in stock)"
                    else:
                        action_result = f"❌ Not enough stock. You only have {product['stock_level']} {product['name']} left."
                else:
                    action_result = f"❌ Product '{action_data.get('product')}' not found"
                    
            # ===== INVENTORY QUERIES =====
            
            elif action_type == "CHECK_STOCK":
                product = inventory_manager.get_product_by_name(action_data.get("product"))
                if product:
                    action_taken = "CHECK_STOCK"
                    action_result = f"📦 {product['name']}: {product['stock_level']} in stock, ₦{product['price_ngn']:,} each"
                else:
                    action_result = "❌ Product not found"
                    
            elif action_type == "LIST_PRODUCTS":
                action_taken = "LIST_PRODUCTS"
                if products:
                    items = "\n".join([f"  • {p['name']}: {p['stock_level']} units, ₦{p['price_ngn']:,}" for p in products[:15]])
                    total_value = sum(p['price_ngn'] * p['stock_level'] for p in products)
                    action_result = f"📋 Inventory ({len(products)} products, total value: ₦{total_value:,}):\n{items}"
                    if len(products) > 15:
                        action_result += f"\n  ... and {len(products) - 15} more"
                else:
                    action_result = "📋 Your inventory is empty. Say 'Add [product] at [price]' to get started!"
                
            elif action_type == "LOW_STOCK_ALERT":
                threshold = action_data.get("threshold", 5)
                low_stock = [p for p in products if p["stock_level"] < threshold]
                action_taken = "LOW_STOCK_ALERT"
                if low_stock:
                    items = "\n".join([f"  ⚠️ {p['name']}: only {p['stock_level']} left" for p in low_stock[:10]])
                    action_result = f"🚨 Low Stock Alert ({len(low_stock)} items):\n{items}"
                else:
                    action_result = f"✅ All good! No items below {threshold} units"
            
            # ===== REPORTS =====
            
            elif action_type == "SALES_REPORT":
                action_taken = "SALES_REPORT"
                # Use analytics service for reports
                try:
                    from .services.analytics import get_analytics_service, TimePeriod
                    period_str = action_data.get("period", "month")
                    period_map = {"today": TimePeriod.TODAY, "week": TimePeriod.WEEK, "month": TimePeriod.MONTH}
                    period = period_map.get(period_str, TimePeriod.MONTH)
                    analytics = get_analytics_service(user_id)
                    revenue = analytics.get_revenue_metrics(period)
                    action_result = (
                        f"📊 Sales Report ({period_str.title()}):\n"
                        f"  💰 Revenue: ₦{revenue.total_revenue_ngn:,.0f}\n"
                        f"  📦 Orders: {revenue.order_count}\n"
                        f"  📈 Avg Order: ₦{revenue.average_order_value:,.0f}\n"
                        f"  {'🔥' if revenue.growth_percent > 0 else '📉'} Growth: {revenue.growth_percent:+.1f}%"
                    )
                except Exception:
                    action_result = "📊 Sales report is being set up. Add more sales to see detailed analytics!"
            
            elif action_type == "BEST_SELLERS":
                action_taken = "BEST_SELLERS"
                try:
                    from .services.analytics import get_analytics_service
                    analytics = get_analytics_service(user_id)
                    limit = action_data.get("limit", 5)
                    top = analytics.get_top_products(limit)
                    if top:
                        items = "\n".join([f"  {i+1}. {p.product_name}: {p.units_sold} sold, ₦{p.revenue_ngn:,.0f}" for i, p in enumerate(top)])
                        action_result = f"🏆 Best Sellers:\n{items}"
                    else:
                        action_result = "No sales data yet. Start selling to see your best sellers!"
                except Exception:
                    action_result = "📊 Best sellers report is being set up."
                    
            elif action_type == "DAILY_SUMMARY":
                action_taken = "DAILY_SUMMARY"
                try:
                    from .services.analytics import get_analytics_service
                    analytics = get_analytics_service(user_id)
                    summary = analytics.format_daily_summary(style="corporate")
                    action_result = summary
                except Exception as e:
                    action_result = "📊 Daily summary is being set up. Add more sales data to see results!"

            # ===== EXPENSES =====

            elif action_type == "LOG_EXPENSE":
                action_taken = "LOG_EXPENSE"
                try:
                    from .database import SessionLocal
                    from .models import Expense as ExpenseModel
                    import uuid as uuid_mod
                    from datetime import datetime as dt

                    db = SessionLocal()
                    try:
                        expense_id = str(uuid_mod.uuid4())
                        new_expense = ExpenseModel(
                            id=expense_id,
                            user_id=user_id,
                            amount=float(action_data.get("amount", 0)),
                            description=action_data.get("description", "Business expense"),
                            category=action_data.get("category", "misc"),
                            expense_type="BUSINESS",
                            date=dt.utcnow()
                        )
                        db.add(new_expense)
                        db.commit()
                        amt = float(action_data.get('amount', 0))
                        action_result = f"✅ Expense logged: ₦{amt:,.0f} — {action_data.get('description', 'expense')}"
                    finally:
                        db.close()
                except Exception as e:
                    action_result = f"❌ Failed to log expense: {str(e)}"

            elif action_type == "CONFIRM_PAYMENT":
                action_taken = "CONFIRM_PAYMENT"
                try:
                    from .database import SessionLocal
                    from sqlalchemy import text as sql_text

                    db = SessionLocal()
                    try:
                        order_id = action_data.get("order_id", "")
                        method = action_data.get("method", "transfer")
                        db.execute(
                            sql_text("UPDATE orders SET status = 'paid', payment_method = :method WHERE id = :oid"),
                            {"method": method, "oid": order_id}
                        )
                        db.commit()
                        amt = float(action_data.get('amount', 0))
                        action_result = f"✅ Payment confirmed: ₦{amt:,.0f} for order {order_id} via {method}"
                    finally:
                        db.close()
                except Exception as e:
                    action_result = f"❌ Failed to confirm payment: {str(e)}"
                    
    except (json.JSONDecodeError, KeyError):
        pass  # No valid JSON action, just use AI response
    
    # Clean response (remove JSON if we executed it)
    clean_response = ai_response
    if action_result:
        clean_response = re.sub(r'\{[^{}]+\}', '', ai_response).strip()
        if not clean_response:
            clean_response = action_result
        else:
            clean_response = f"{clean_response}\n\n{action_result}"
    
    return {
        "response": clean_response,
        "action_taken": action_taken,
        "action_result": action_result,
        "products_count": len(products)
    }


async def process_customer_query(
    message: str,
    customer_phone: str,
    inventory_manager: InventoryManager,
    conversation_history: List[Dict] = None,
    store_name: str = "our store"
) -> Dict[str, Any]:
    """
    Process a customer's query using AI.
    
    Args:
        message: Customer's message
        customer_phone: Customer's phone number
        inventory_manager: Inventory manager instance (must be vendor-scoped)
        conversation_history: Previous messages
        store_name: Store/vendor name for AI prompt scoping
    
    Returns:
        Response with AI message and any products found
    """
    # Get available products (already vendor-scoped via inventory_manager)
    products = inventory_manager.list_products()
    available = [p for p in products if p["stock_level"] > 0]
    
    product_list = "\n".join([
        f"- {p['name']}: ₦{p['price_ngn']} ({p['stock_level']} available)"
        for p in available[:30]
    ])
    
    context = f"""
Available Products:
{product_list}
"""
    
    messages = conversation_history or []
    messages.append({
        "role": "user", 
        "content": f"{message}\n\n[Store inventory: {context}]"
    })
    
    # Use vendor-scoped prompt
    ai_response = await send_to_groq(
        messages=messages,
        system_prompt=get_customer_ai_prompt(store_name),
        max_tokens=400,
        temperature=0.5
    )
    
    # Parse for product search
    products_found = []
    try:
        json_match = re.search(r'\{[^{}]+\}', ai_response)
        if json_match:
            action_data = json.loads(json_match.group())
            action_type = action_data.get("action")
            
            if action_type == "SEARCH_PRODUCT":
                query = action_data.get("query", "")
                products_found = inventory_manager.smart_search_products(query)
            elif action_type == "CHECK_PRICE":
                product = inventory_manager.get_product_by_name(action_data.get("product"))
                if product:
                    products_found = [product]
                    
    except (json.JSONDecodeError, KeyError):
        pass
    
    # Clean response
    clean_response = re.sub(r'\{[^{}]+\}', '', ai_response).strip()
    
    return {
        "response": clean_response or ai_response,
        "products": products_found[:5],
        "has_products": len(products_found) > 0
    }
