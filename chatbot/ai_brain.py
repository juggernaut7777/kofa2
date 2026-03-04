"""
KOFA AI Brain - Smart Business Assistant
Handles complex business operations via natural language.
PRIVACY: All prompts are vendor-scoped. The AI never sees cross-vendor data.
"""
import json
import re
from typing import Dict, Any, Optional, List
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
4. When user wants to perform an action, respond with a JSON command

AVAILABLE ACTIONS (respond with JSON):
- ADD_PRODUCT: {{"action": "ADD_PRODUCT", "name": "product name", "quantity": 10, "price": 5000}}
- REMOVE_STOCK: {{"action": "REMOVE_STOCK", "product": "product name", "quantity": 1}}
- CHECK_STOCK: {{"action": "CHECK_STOCK", "product": "product name"}}
- LIST_PRODUCTS: {{"action": "LIST_PRODUCTS"}}
- LOW_STOCK_ALERT: {{"action": "LOW_STOCK_ALERT", "threshold": 5}}
- SALES_REPORT: {{"action": "SALES_REPORT", "period": "today|week|month"}}
- GENERATE_INVOICE: {{"action": "GENERATE_INVOICE", "customer": "phone or name", "items": [...]}}

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
        # Look for JSON in response
        json_match = re.search(r'\{[^{}]+\}', ai_response)
        if json_match:
            action_data = json.loads(json_match.group())
            action_type = action_data.get("action")
            
            if action_type == "ADD_PRODUCT":
                result = inventory_manager.add_product({
                    "name": action_data.get("name"),
                    "stock_level": action_data.get("quantity", 0),
                    "price_ngn": action_data.get("price", 0),
                    "voice_tags": [action_data.get("name", "").lower()]
                })
                action_taken = "ADD_PRODUCT"
                action_result = f"✅ Added {action_data.get('name')} - {action_data.get('quantity')} units at ₦{action_data.get('price')}"
                
            elif action_type == "REMOVE_STOCK":
                product = inventory_manager.get_product_by_name(action_data.get("product"))
                if product:
                    success = inventory_manager.decrement_stock(
                        product["id"],
                        action_data.get("quantity", 1)
                    )
                    if success:
                        action_taken = "REMOVE_STOCK"
                        action_result = f"✅ Removed {action_data.get('quantity')} {action_data.get('product')} from stock"
                    else:
                        action_result = f"❌ Not enough stock to remove"
                else:
                    action_result = f"❌ Product '{action_data.get('product')}' not found"
                    
            elif action_type == "CHECK_STOCK":
                product = inventory_manager.get_product_by_name(action_data.get("product"))
                if product:
                    action_taken = "CHECK_STOCK"
                    action_result = f"📦 {product['name']}: {product['stock_level']} in stock, ₦{product['price_ngn']} each"
                else:
                    action_result = f"❌ Product not found"
                    
            elif action_type == "LIST_PRODUCTS":
                action_taken = "LIST_PRODUCTS"
                action_result = f"📋 You have {len(products)} products in inventory"
                
            elif action_type == "LOW_STOCK_ALERT":
                threshold = action_data.get("threshold", 5)
                low_stock = [p for p in products if p["stock_level"] < threshold]
                action_taken = "LOW_STOCK_ALERT"
                if low_stock:
                    items = "\n".join([f"  ⚠️ {p['name']}: only {p['stock_level']} left" for p in low_stock[:10]])
                    action_result = f"🚨 Low Stock Alert ({len(low_stock)} items):\n{items}"
                else:
                    action_result = f"✅ No items below {threshold} units"
                    
    except (json.JSONDecodeError, KeyError) as e:
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
