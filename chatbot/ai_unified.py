"""
Unified AI Client for KOFA
Handles Groq (primary) → Gemini (backup) fallback
Plus context injection for product/inventory awareness
"""
from typing import Optional, List, Dict
from .groq_client import send_to_groq
from .gemini_client import send_to_gemini


async def send_to_ai(
    messages: list,
    system_prompt: str = "",
    max_tokens: int = 1000,
    temperature: float = 0.7
) -> tuple[str, str]:
    """
    Send prompt to AI with automatic fallback.
    Tries Groq first, then Gemini if Groq fails.
    
    Returns:
        Tuple of (response_text, api_used)
    """
    # Try Groq first (primary)
    try:
        response = await send_to_groq(
            messages=messages,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature
        )
        if response and not response.startswith("Error:") and not response.startswith("AI Error:"):
            return response, "groq"
    except Exception:
        pass
    
    # Try Gemini as backup
    try:
        # Gemini uses a different message format - combine into one prompt
        user_message = ""
        for msg in messages:
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break
        
        response = await send_to_gemini(
            prompt=user_message,
            system_prompt=system_prompt,
            max_tokens=max_tokens,
            temperature=temperature
        )
        if response:
            return response, "gemini"
    except Exception:
        pass
    
    # Both failed - return error
    return "I'm sorry, I'm having trouble connecting right now. Please try again.", "fallback"


def build_context_prompt(
    products: List[Dict],
    store_name: str = "our store",
    style: str = "professional"
) -> str:
    """
    Build a context-aware system prompt with real product data.
    
    Args:
        products: List of product dictionaries with name, price, stock_level
        store_name: Name of the store
        style: 'professional' or 'pidgin'
    
    Returns:
        System prompt string with product context
    """
    # Build product list
    if products:
        in_stock = []
        out_of_stock = []
        
        for p in products:
            name = p.get("name", "Unknown")
            price = p.get("price") or p.get("price_ngn", 0)
            stock = p.get("stock_level", 0)
            
            item = f"- {name}: ₦{price:,.0f} ({stock} in stock)"
            
            if stock > 0:
                in_stock.append(item)
            else:
                out_of_stock.append(f"- {name}: OUT OF STOCK")
        
        product_list = "\n".join(in_stock) if in_stock else "No products currently in stock."
        out_of_stock_list = "\n".join(out_of_stock) if out_of_stock else ""
    else:
        product_list = "No products listed yet."
        out_of_stock_list = ""
    
    # PROFESSIONAL STYLE ONLY - No pidgin/casual styles
    # The style parameter is ignored - always use professional tone
    prompt = f"""You are a helpful, professional customer service bot exclusively for {store_name}.

PRIVACY: You represent {store_name} ONLY. Never mention other stores or vendors.

AVAILABLE PRODUCTS (IN STOCK):
{product_list}

{f"OUT OF STOCK ITEMS:{chr(10)}{out_of_stock_list}" if out_of_stock_list else ""}

RULES:
- Be polite, formal, and professional
- Use proper English only - NO slang, NO pidgin, NO casual language
- ONLY suggest products that are IN STOCK
- Use accurate prices from the list above
- If a customer asks about an out-of-stock item, apologize and suggest alternatives from THIS store only
- Never compare prices with competitors or other sellers
- If customer wants to buy, confirm the order and ask for delivery details
- Keep responses concise (2-3 sentences max)

Example responses:
- "Thank you for your inquiry. We have [product] available for ₦X,XXX."
- "I apologize, [product] is currently out of stock. May I suggest [alternative]?"
- "Great choice! That will be ₦X,XXX. May I have your delivery address?"
"""
    
    return prompt


def build_business_ai_prompt(
    products: List[Dict],
    orders: List[Dict] = None,
    expenses: List[Dict] = None,
    store_name: str = "your store"
) -> str:
    """
    Build context-aware prompt for Business AI (vendor-facing).
    Always uses professional tone.
    
    Args:
        products: List of products
        orders: List of recent orders
        expenses: List of recent expenses
        store_name: Store name
    
    Returns:
        System prompt with business context
    """
    # Product summary
    if products:
        total_products = len(products)
        in_stock = sum(1 for p in products if (p.get("stock_level", 0) or 0) > 0)
        low_stock = [p.get("name") for p in products if 0 < (p.get("stock_level", 0) or 0) < 5]
        total_value = sum((p.get("price") or p.get("price_ngn", 0)) * (p.get("stock_level", 0) or 0) for p in products)
        
        product_summary = f"""
INVENTORY OVERVIEW:
- Total Products: {total_products}
- In Stock: {in_stock}
- Low Stock Items: {', '.join(low_stock[:5]) if low_stock else 'None'}
- Total Inventory Value: ₦{total_value:,.0f}
"""
    else:
        product_summary = "\nINVENTORY: No products added yet.\n"
    
    # Orders summary
    if orders:
        pending = sum(1 for o in orders if o.get("status") in ["pending", "processing"])
        completed = sum(1 for o in orders if o.get("status") == "completed")
        total_revenue = sum(o.get("total_amount", 0) for o in orders)
        
        order_summary = f"""
ORDERS OVERVIEW:
- Pending Orders: {pending}
- Completed Orders: {completed}
- Total Revenue: ₦{total_revenue:,.0f}
"""
    else:
        order_summary = "\nORDERS: No orders yet.\n"
    
    prompt = f"""You are a PRIVATE business advisor AI exclusively for {store_name}, a Nigerian commerce business.

PRIVACY MANDATE: You ONLY have access to {store_name}'s data. NEVER compare to other vendors or use platform-wide statistics.

{product_summary}
{order_summary}

YOUR ROLE:
- Provide actionable business advice based ONLY on {store_name}'s own data
- Help with inventory management decisions
- Suggest pricing strategies using general market knowledge, not other Kofa vendor data
- Analyze {store_name}'s sales trends against their own past performance
- Help draft customer messages
- Never reveal internal business data to customers

RULES:
- Always be professional and helpful
- Use data from the inventory and orders when relevant
- Give specific, actionable recommendations
- Keep responses focused and concise
- ONLY compare performance to {store_name}'s own historical data
- If asked about something not in your data, acknowledge the limitation
"""
    
    return prompt
