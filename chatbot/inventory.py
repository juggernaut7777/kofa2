"""Inventory management with Supabase backend and mock data fallback."""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from .config import settings

# Try to import Supabase, but allow fallback to mock data
try:
    from supabase import create_client, Client
    SUPABASE_AVAILABLE = True
except ImportError:
    SUPABASE_AVAILABLE = False
    Client = None


# Mock product data for testing without Supabase
MOCK_PRODUCTS = [
    {
        "id": "prod-001",
        "name": "Premium Red Sneakers",
        "price_ngn": 45000,
        "stock_level": 12,
        "description": "Fresh kicks for the street",
        "voice_tags": ["sneakers", "red shoe", "kicks", "trainers"],
        "category": "footwear"
    },
    {
        "id": "prod-002",
        "name": "Lagos Beach Shorts",
        "price_ngn": 8500,
        "stock_level": 25,
        "description": "Perfect for that Elegushi flex",
        "voice_tags": ["shorts", "beach wear", "summer", "knickers"],
        "category": "clothing"
    },
    {
        "id": "prod-003",
        "name": "Ankara Print Shirt",
        "price_ngn": 15000,
        "stock_level": 8,
        "description": "Traditional meets modern",
        "voice_tags": ["ankara", "shirt", "native", "African print"],
        "category": "clothing"
    },
    {
        "id": "prod-004",
        "name": "Designer Sunglasses",
        "price_ngn": 22000,
        "stock_level": 15,
        "description": "Block out Lagos sun in style",
        "voice_tags": ["shades", "glasses", "sunglasses", "sun glasses"],
        "category": "accessories"
    },
    {
        "id": "prod-005",
        "name": "Gold Chain Necklace",
        "price_ngn": 85000,
        "stock_level": 5,
        "description": "Shine like Burna Boy",
        "voice_tags": ["chain", "jewelry", "gold", "necklace", "neck piece"],
        "category": "jewelry"
    },
    {
        "id": "prod-006",
        "name": "Leather Wallet",
        "price_ngn": 12000,
        "stock_level": 20,
        "description": "Keep your Naira secure",
        "voice_tags": ["wallet", "leather", "purse", "money holder"],
        "category": "accessories"
    },
]


@dataclass
class Product:
    """Represents a product in inventory."""
    id: str
    name: str
    price_ngn: float
    stock_level: int
    voice_tags: List[str] = field(default_factory=list)
    description: str = ""
    category: str = ""


@dataclass
class Order:
    """Represents a customer order."""
    order_id: str
    customer_phone: str
    items: List[Dict[str, Any]]
    status: str
    total_amount_ngn: float
    payment_ref: Optional[str] = None


class InventoryManager:
    """
    Manages product inventory, dual-currency pricing, and stock levels.
    Uses Supabase when configured, falls back to mock data otherwise.
    """

    def __init__(self):
        self._supabase: Optional[Client] = None
        self._use_mock = False
        self._mock_products = [p.copy() for p in MOCK_PRODUCTS]  # Local copy for mutations
        
    def _check_supabase_connection(self) -> bool:
        """Check if Supabase is properly configured and available."""
        if not SUPABASE_AVAILABLE:
            return False
        # Check if we have valid-looking credentials
        if not settings.supabase_url or settings.supabase_url == "http://localhost:54321":
            if not settings.supabase_key or settings.supabase_key == "test-key-for-development":
                return False
        return True

    @property
    def supabase(self) -> Optional[Client]:
        """Lazy initialization of Supabase client."""
        if self._use_mock:
            return None
        if self._supabase is None:
            if not self._check_supabase_connection():
                self._use_mock = True
                print("⚠️  Supabase not configured - using mock data")
                return None
            try:
                from supabase import create_client
                self._supabase = create_client(settings.supabase_url, settings.supabase_key)
            except Exception as e:
                print(f"⚠️  Supabase connection failed: {e} - using mock data")
                self._use_mock = True
                return None
        return self._supabase

    def _dict_to_product(self, data: dict) -> Product:
        """Convert a dictionary to a Product object."""
        return Product(
            id=data.get("id", ""),
            name=data.get("name", ""),
            price_ngn=data.get("price_ngn", 0.0),
            stock_level=data.get("stock_level", 0),
            voice_tags=data.get("voice_tags") or [],
            description=data.get("description") or "",
            category=data.get("category") or ""
        )

    def _dict_to_order(self, data: dict) -> Order:
        """Convert a dictionary to an Order object."""
        return Order(
            order_id=data.get("order_id", ""),
            customer_phone=data.get("customer_phone", ""),
            items=data.get("items", []),
            status=data.get("status", "Pending"),
            total_amount_ngn=data.get("total_amount_ngn", 0.0),
            payment_ref=data.get("payment_ref")
        )

    def add_product(self, name: str, stock: int, price_ngn: float, price_usd: float = 0.0) -> dict:
        """Adds a new product to inventory."""
        import uuid
        product = {
            "id": f"prod-{str(uuid.uuid4())[:8]}",
            "name": name,
            "stock_level": stock,
            "price_ngn": price_ngn,
            "voice_tags": [name.lower()],
            "description": "",
            "category": ""
        }
        
        # Use mock data if Supabase unavailable
        if self._use_mock or self.supabase is None:
            self._mock_products.append(product)
            return product
        
        data = self.supabase.table("products").insert(product).execute()
        return data.data[0] if data.data else {}

    def search_product(self, query: str) -> Optional[Product]:
        """
        Search for a product by name or voice tag.
        Returns the first matching product as a Product object.
        """
        query_lower = query.lower()
        
        # Use mock data if Supabase unavailable
        if self._use_mock or self.supabase is None:
            for prod in self._mock_products:
                # Check name match
                if query_lower in prod["name"].lower():
                    return self._dict_to_product(prod)
                # Check voice tags
                for tag in prod.get("voice_tags", []):
                    if query_lower in tag.lower() or tag.lower() in query_lower:
                        return self._dict_to_product(prod)
            return None
        
        # 1. Try name match using ILIKE
        response = self.supabase.table("products").select("*").ilike("name", f"%{query}%").execute()
        if response.data:
            return self._dict_to_product(response.data[0])
        
        # 2. Fallback: fetch all and check voice tags
        all_products = self.supabase.table("products").select("*").execute()
        for prod in all_products.data:
            tags = prod.get("voice_tags") or []
            # Check if query matches any voice tag
            for tag in tags:
                if query_lower in tag.lower() or tag.lower() in query_lower:
                    return self._dict_to_product(prod)
        
        return None

    def get_product_by_name(self, name: str) -> Optional[dict]:
        """Finds a product by name (case-insensitive partial match or voice tag)."""
        name_lower = name.lower()
        
        # Use mock data if Supabase unavailable
        if self._use_mock or self.supabase is None:
            for prod in self._mock_products:
                # Check name match
                if name_lower in prod["name"].lower():
                    return prod
                # Check voice tags
                for tag in prod.get("voice_tags", []):
                    if name_lower in tag.lower() or tag.lower() in name_lower:
                        return prod
            return None
        
        response = self.supabase.table("products").select("*").ilike("name", f"%{name}%").execute()
        if response.data:
            return response.data[0]
            
        # Fallback: check voice tags
        all_products = self.supabase.table("products").select("*").execute()
        for prod in all_products.data:
            tags = prod.get("voice_tags") or []
            if name_lower in [t.lower() for t in tags]:
                return prod
                
        return None

    def check_stock(self, product_id: str) -> int:
        """Check the stock level for a product by ID."""
        # Use mock data if Supabase unavailable
        if self._use_mock or self.supabase is None:
            for prod in self._mock_products:
                if prod["id"] == product_id:
                    return prod.get("stock_level", 0)
            return 0
        
        response = self.supabase.table("products").select("stock_level").eq("id", product_id).execute()
        if response.data:
            return response.data[0].get("stock_level", 0)
        return 0

    def decrement_stock(self, product_id: str, quantity: int) -> bool:
        """
        Decrement stock for a product. Returns True if successful, False if insufficient stock.
        """
        # Get current stock
        response = self.supabase.table("products").select("stock_level").eq("id", product_id).execute()
        if not response.data:
            return False
            
        current_stock = response.data[0].get("stock_level", 0)
        
        # Check if we have enough stock
        if current_stock < quantity:
            return False
        
        # Update stock
        new_stock = current_stock - quantity
        self.supabase.table("products").update({"stock_level": new_stock}).eq("id", product_id).execute()
        return True

    def update_stock(self, product_id: str, quantity_delta: int) -> Optional[dict]:
        """Updates stock level (positive for restock, negative for sale)."""
        response = self.supabase.table("products").select("stock_level").eq("id", product_id).execute()
        if not response.data:
            return None
            
        current_stock = response.data[0]["stock_level"]
        new_stock = current_stock + quantity_delta
        
        update_response = self.supabase.table("products").update({"stock_level": new_stock}).eq("id", product_id).execute()
        return update_response.data[0] if update_response.data else None
    
    def list_products(self) -> List[dict]:
        """List all products."""
        # Use mock data if Supabase unavailable
        if self._use_mock or self.supabase is None:
            return self._mock_products
        
        response = self.supabase.table("products").select("*").execute()
        return response.data

    def create_order(self, customer_phone: str, items: List[Dict], total_amount_ngn: float) -> Optional[Order]:
        """Create a new order."""
        order_data = {
            "customer_phone": customer_phone,
            "items": items,
            "status": "Pending",
            "total_amount_ngn": total_amount_ngn,
            "payment_ref": None
        }
        response = self.supabase.table("orders").insert(order_data).execute()
        if response.data:
            return self._dict_to_order(response.data[0])
        return None
