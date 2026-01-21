"""Response formatter for professional business chatbot."""
from enum import Enum


class ResponseStyle(str, Enum):
    """Response style options - PROFESSIONAL ONLY."""
    PROFESSIONAL = "professional"  # Clean, professional tone
    CORPORATE = "corporate"       # Same as professional (kept for backwards compatibility)


class ResponseFormatter:
    """Formats chatbot responses in professional tone only."""
    
    def __init__(self, style: ResponseStyle = ResponseStyle.PROFESSIONAL):
        """
        Initialize response formatter.
        
        Args:
            style: Response style (professional is the only option)
        """
        self.style = style
    
    def format_greeting(self) -> str:
        """Format greeting message."""
        return "Hello! 👋 Welcome to our store. I can help you check prices, availability, and make purchases. What are you looking for?"
    
    def format_help(self) -> str:
        """Format help message."""
        return (
            "Here's what I can help you with:\n\n"
            "✅ Check product availability\n"
            "✅ Get prices\n"
            "✅ Make purchases\n\n"
            "Just tell me what you're looking for!"
        )
    
    def format_product_not_found(self, query: str) -> str:
        """Format product not found message."""
        return f"Sorry, I couldn't find '{query}' in our inventory. Can you describe it differently?"
    
    def format_out_of_stock(self, product_name: str) -> str:
        """Format out of stock message."""
        return f"Sorry, {product_name} is currently sold out. 😔"
    
    def format_product_available(
        self,
        product_name: str,
        price_formatted: str,
        stock_level: int
    ) -> str:
        """Format product availability message."""
        return (
            f"Yes! We have {product_name} in stock. ✅\n\n"
            f"💰 Price: {price_formatted}\n"
            f"📦 {stock_level} {'piece' if stock_level == 1 else 'pieces'} left in stock\n\n"
            f"Want to buy? Just say 'Yes' or 'Buy'!"
        )
    
    def format_payment_link(
        self,
        product_name: str,
        payment_link: str,
        price_formatted: str,
        reservation_minutes: int
    ) -> str:
        """Format payment link message."""
        return (
            f"Great! Here's your payment link for {product_name}:\n\n"
            f"💳 {payment_link}\n\n"
            f"Amount: {price_formatted}\n"
            f"⏰ Order reserved for {reservation_minutes} minutes.\n\n"
            f"Pay now to confirm your order!"
        )
    
    def format_purchase_no_context(self) -> str:
        """Format purchase without context message."""
        return "What would you like to buy? Please tell me the product name."
    
    def format_order_creation_failed(self) -> str:
        """Format order creation failure message."""
        return "Sorry, we couldn't create your order. Please try again."
    
    def format_payment_link_failed(self) -> str:
        """Format payment link generation failure message."""
        return "Sorry, we couldn't generate a payment link. Please contact support."
    
    def format_unknown_message(self) -> str:
        """Format unknown intent message."""
        return (
            "I'm not sure what you're looking for. 🤔\n\n"
            "You can ask me about:\n"
            "• Product availability\n"
            "• Prices\n"
            "• Making a purchase\n\n"
            "What would you like to know?"
        )
    
    def format_multiple_products(
        self,
        products: list,
        format_price_fn
    ) -> str:
        """Format response when multiple products match a query."""
        lines = ["I found several matching products:\n"]
        for i, product in enumerate(products[:5], 1):  # Max 5 products
            price = format_price_fn(product.get("price_ngn", 0))
            stock = product.get("stock_level", 0)
            status = "✅" if stock > 0 else "❌ Sold out"
            lines.append(f"{i}. **{product['name']}** - {price} {status}")
        
        lines.append("\n\nWhich one would you like? Reply with the number or name.")
        return "\n".join(lines)
    
    def format_clarification_by_attribute(
        self,
        products: list,
        attribute: str  # "color", "size", etc.
    ) -> str:
        """Ask for clarification based on specific attribute."""
        if attribute == "color":
            colors = set()
            for p in products:
                name = p.get("name", "").lower()
                for color in ["red", "blue", "white", "black", "gold", "green", "pink"]:
                    if color in name:
                        colors.add(color.capitalize())
            if colors:
                return f"We have that in: {', '.join(colors)}. Which color would you prefer?"
        return "Could you be more specific about which one you'd like?"
    
    def format_single_product_found(
        self,
        product: dict,
        price_formatted: str
    ) -> str:
        """Format response for single product match with details."""
        stock = product.get("stock_level", 0)
        name = product.get("name", "Product")
        
        if stock <= 0:
            return self.format_out_of_stock(name)
        
        return self.format_product_available(name, price_formatted, stock)
