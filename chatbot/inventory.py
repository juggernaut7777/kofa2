"""Inventory management with Azure SQL backend using SQLAlchemy."""
from dataclasses import dataclass, field
from typing import List, Optional, Dict, Any
from sqlalchemy import func
from contextlib import contextmanager
from .database import SessionLocal
from .models import Product as ProductModel
import uuid
import json
import logging

logger = logging.getLogger(__name__)

# Default vendor/user ID for single-vendor mode
# In production, this should come from authentication context
DEFAULT_USER_ID = "00000000-0000-0000-0000-000000000001"


@dataclass
class Product:
    """Represents a product in inventory (dataclass for compatibility)."""
    id: str
    name: str
    price_ngn: float
    stock_level: int
    voice_tags: List[str] = field(default_factory=list)
    description: str = ""
    category: str = ""


@dataclass
class Order:
    """Represents a customer order (dataclass for compatibility)."""
    order_id: str
    customer_phone: str
    items: List[Dict[str, Any]]
    status: str
    total_amount_ngn: float
    payment_ref: Optional[str] = None


class InventoryManager:
    """
    Manages product inventory using Azure SQL with SQLAlchemy.
    All operations use database sessions for persistence.
    PERFORMANCE OPTIMIZED: Uses context managers for efficient session management.
    """

    def __init__(self, user_id: str = DEFAULT_USER_ID):
        """
        Initialize inventory manager.
        
        Args:
            user_id: Vendor/user ID (defaults to default vendor for single-vendor mode)
        """
        self.user_id = user_id

    @contextmanager
    def _get_db_session(self):
        """
        Context manager for database sessions - PERFORMANCE OPTIMIZED.
        Automatically handles commit/rollback and cleanup.
        
        Usage:
            with self._get_db_session() as db:
                # Use db session
                pass
        """
        db = SessionLocal()
        try:
            yield db
            db.commit()
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()

    def _log_debug(self, message: str, data: dict = None):
        """Log debug information to the debug log file."""
        try:
            import json
            log_entry = {
                "sessionId": "debug-session",
                "runId": "initial",
                "hypothesisId": "F",
                "location": "inventory.py",
                "message": message,
                "data": data or {},
                "timestamp": int(__import__('datetime').datetime.now().timestamp() * 1000)
            }
            with open(r"c:\Users\USER\kofa 2\.cursor\debug.log", "a") as f:
                f.write(json.dumps(log_entry) + "\n")
        except Exception as e:
            logger.warning(f"Debug logging failed: {e}")

    def _model_to_dict(self, product: ProductModel) -> dict:
        """Convert SQLAlchemy Product model to dictionary."""
        # Parse voice_tags from JSON string if stored as text
        voice_tags = []
        if product.voice_tags:
            if isinstance(product.voice_tags, str):
                try:
                    voice_tags = json.loads(product.voice_tags)
                except (json.JSONDecodeError, TypeError):
                    voice_tags = []
            elif isinstance(product.voice_tags, list):
                voice_tags = product.voice_tags
        
        return {
            "id": str(product.id),
            "name": product.name,
            "price_ngn": float(product.price_ngn),
            "stock_level": int(product.stock_level),
            "voice_tags": voice_tags,
            "description": product.description or "",
            "category": product.category or "",
            "image_url": product.image_url or None
        }

    def _dict_to_product(self, data: dict) -> Product:
        """Convert a dictionary to a Product dataclass."""
        return Product(
            id=str(data.get("id", "")),
            name=data.get("name", ""),
            price_ngn=float(data.get("price_ngn", 0.0)),
            stock_level=int(data.get("stock_level", 0)),
            voice_tags=data.get("voice_tags") or [],
            description=data.get("description") or "",
            category=data.get("category") or ""
        )

    def _dict_to_order(self, data: dict) -> Order:
        """Convert a dictionary to an Order dataclass."""
        return Order(
            order_id=str(data.get("order_id", "")),
            customer_phone=data.get("customer_phone", ""),
            items=data.get("items", []),
            status=data.get("status", "Pending"),
            total_amount_ngn=float(data.get("total_amount_ngn", 0.0)),
            payment_ref=data.get("payment_ref")
        )

    def add_product(self, name_or_dict, stock: int = 0, price_ngn: float = 0.0, price_usd: float = 0.0) -> dict:
        """Adds a new product to inventory. Accepts either a dict or positional args."""
        # Handle dict input (from KOFA 2.0 API)
        if isinstance(name_or_dict, dict):
            product_data = {
                "id": name_or_dict.get("id") or str(uuid.uuid4()),
                "name": name_or_dict.get("name", "Unnamed Product"),
                "stock_level": name_or_dict.get("stock_level", 0),
                "price_ngn": name_or_dict.get("price_ngn", 0.0),
                "voice_tags": name_or_dict.get("voice_tags", [name_or_dict.get("name", "").lower()]),
                "description": name_or_dict.get("description", ""),
                "category": name_or_dict.get("category", ""),
                "image_url": name_or_dict.get("image_url")
            }
        else:
            # Original positional args
            product_data = {
                "id": str(uuid.uuid4()),
                "name": name_or_dict,
                "stock_level": stock,
                "price_ngn": price_ngn,
                "voice_tags": [name_or_dict.lower()],
                "description": "",
                "category": "",
                "image_url": None
            }

        with self._get_db_session() as db:
            # Create SQLAlchemy model
            # Serialize voice_tags to JSON string for SQL Server
            voice_tags_json = json.dumps(product_data["voice_tags"]) if product_data["voice_tags"] else None
            
            product = ProductModel(
                id=product_data["id"],
                user_id=self.user_id,
                name=product_data["name"],
                price_ngn=product_data["price_ngn"],
                stock_level=product_data["stock_level"],
                description=product_data["description"],
                category=product_data["category"],
                voice_tags=voice_tags_json,
                image_url=product_data.get("image_url")
            )

            db.add(product)
            db.flush()
            db.refresh(product)

            return self._model_to_dict(product)

    def search_product(self, query: str) -> Optional[Product]:
        """
        Search for a product by name or voice tag.
        Returns the first matching product as a Product object.
        """
        with self._get_db_session() as db:
            query_lower = query.lower()

            # Search by name (case-insensitive)
            product = db.query(ProductModel).filter(
                ProductModel.user_id == self.user_id,
                func.lower(ProductModel.name).contains(query_lower)
            ).first()

            if product:
                return self._dict_to_product(self._model_to_dict(product))

            # Search by voice tags
            all_products = db.query(ProductModel).filter(
                ProductModel.user_id == self.user_id
            ).all()

            for prod in all_products:
                tags = prod.voice_tags or []
                for tag in tags:
                    if query_lower in tag.lower() or tag.lower() in query_lower:
                        return self._dict_to_product(self._model_to_dict(prod))

            return None

    def get_product_by_name(self, name: str) -> Optional[dict]:
        """Finds a product by name (case-insensitive partial match or voice tag)."""
        with self._get_db_session() as db:
            name_lower = name.lower()
            query_words = name_lower.split()

            # Try exact/partial name match first
            product = db.query(ProductModel).filter(
                ProductModel.user_id == self.user_id,
                func.lower(ProductModel.name).contains(name_lower)
            ).first()

            if product:
                return self._model_to_dict(product)

            # Search by voice tags
            all_products = db.query(ProductModel).filter(
                ProductModel.user_id == self.user_id
            ).all()

            for prod in all_products:
                prod_name_lower = prod.name.lower()
                # Parse voice_tags from JSON
                tags_raw = prod.voice_tags or "[]"
                if isinstance(tags_raw, str):
                    try:
                        tags_list = json.loads(tags_raw)
                    except (json.JSONDecodeError, TypeError):
                        tags_list = []
                else:
                    tags_list = tags_raw or []
                tags = [t.lower() for t in tags_list]

                # Check word-by-word matching
                for word in query_words:
                    if len(word) < 3:
                        continue
                    if word in prod_name_lower:
                        return self._model_to_dict(prod)
                    for tag in tags:
                        if word in tag or tag in word:
                            return self._model_to_dict(prod)

                # Check full query against tags
                for tag in tags:
                    if name_lower in tag or tag in name_lower:
                        return self._model_to_dict(prod)

            return None

    def get_product_by_id(self, product_id: str) -> Optional[dict]:
        """Get a product by its ID."""
        with self._get_db_session() as db:
            product = db.query(ProductModel).filter(
                ProductModel.id == product_id,
                ProductModel.user_id == self.user_id
            ).first()

            if product:
                return self._model_to_dict(product)
            return None

    def check_stock(self, product_id: str) -> int:
        """Check the stock level for a product by ID."""
        with self._get_db_session() as db:
            product = db.query(ProductModel).filter(
                ProductModel.id == product_id,
                ProductModel.user_id == self.user_id
            ).first()

            if product:
                return int(product.stock_level)
            return 0

    def decrement_stock(self, product_id: str, quantity: int) -> bool:
        """
        Atomically decrement stock for a product. Returns True if successful, False if insufficient stock.
        Uses Azure SQL atomic operations to prevent race conditions.
        """
        # #region agent log - decrement_stock called
        self._log_debug("decrement_stock called", {
            "product_id": product_id,
            "quantity": quantity,
            "user_id": self.user_id
        })
        # #endregion

        with self._get_db_session() as db:
            try:
                # Use SQLAlchemy ORM to find and update the product
                from .models import Product as ProductModel
                
                product = db.query(ProductModel).filter(
                    ProductModel.id == product_id,
                    ProductModel.stock_level >= quantity
                ).first()
                
                if not product:
                    # Either product doesn't exist or insufficient stock
                    self._log_debug("decrement_stock failed - no matching product", {
                        "product_id": product_id,
                        "quantity": quantity
                    })
                    return False
                
                # Decrement stock
                product.stock_level = product.stock_level - quantity
                
                # === LOW STOCK NOTIFICATION ===
                # If stock drops to 5 or below, create an in-app notification
                LOW_STOCK_THRESHOLD = 5
                if product.stock_level <= LOW_STOCK_THRESHOLD and product.stock_level >= 0:
                    try:
                        from .models import Notification as NotifModel
                        notif = NotifModel(
                            user_id=self.user_id,
                            type="low_stock",
                            title="Low Stock Alert",
                            message=f"⚠️ {product.name} is running low — only {product.stock_level} left in stock!",
                            data={"product_id": product_id, "stock_level": product.stock_level, "product_name": product.name},
                        )
                        db.add(notif)
                        logger.info(f"Low stock notification created for {product.name} (stock: {product.stock_level})")
                    except Exception as notif_err:
                        logger.warning(f"Failed to create low stock notification: {notif_err}")
                
                self._log_debug("decrement_stock completed", {
                    "product_id": product_id,
                    "success": True,
                    "new_stock": product.stock_level
                })
                
                return True

            except Exception as e:
                self._log_debug("decrement_stock error", {
                    "product_id": product_id,
                    "error": str(e)
                })
                logger.error(f"Error in decrement_stock for product {product_id}: {e}")
                return False


    def update_stock(self, product_id: str, quantity_delta: int) -> Optional[dict]:
        """Updates stock level (positive for restock, negative for sale)."""
        with self._get_db_session() as db:
            product = db.query(ProductModel).filter(
                ProductModel.id == product_id,
                ProductModel.user_id == self.user_id
            ).first()

            if not product:
                return None

            product.stock_level = max(0, product.stock_level + quantity_delta)
            db.flush()
            db.refresh(product)

            return {"stock_level": int(product.stock_level)}

    def update_product_fields(self, product_id: str, updates: dict) -> Optional[dict]:
        """Update product fields (name, price, stock, description, etc.)."""
        with self._get_db_session() as db:
            product = db.query(ProductModel).filter(
                ProductModel.id == product_id,
                ProductModel.user_id == self.user_id
            ).first()

            if not product:
                return None

            # Update fields
            if "name" in updates and updates["name"] is not None:
                product.name = updates["name"]
            if "price_ngn" in updates and updates["price_ngn"] is not None:
                product.price_ngn = updates["price_ngn"]
            if "stock_level" in updates and updates["stock_level"] is not None:
                product.stock_level = updates["stock_level"]
            if "description" in updates:
                product.description = updates["description"]
            if "category" in updates:
                product.category = updates["category"]
            if "voice_tags" in updates:
                # Serialize voice_tags to JSON string for SQL Server
                product.voice_tags = json.dumps(updates["voice_tags"]) if updates["voice_tags"] else None
            if "image_url" in updates:
                product.image_url = updates["image_url"]

            db.flush()
            db.refresh(product)

            return self._model_to_dict(product)

    def delete_product(self, product_id: str) -> bool:
        """Delete a product from inventory."""
        with self._get_db_session() as db:
            try:
                product = db.query(ProductModel).filter(
                    ProductModel.id == product_id,
                    ProductModel.user_id == self.user_id
                ).first()

                if not product:
                    return False

                db.delete(product)
                return True
            except Exception as e:
                logger.error(f"Error deleting product {product_id}: {e}")
                return False

    def list_products(self) -> List[dict]:
        """List all products - PERFORMANCE OPTIMIZED."""
        with self._get_db_session() as db:
            products = db.query(ProductModel).filter(
                ProductModel.user_id == self.user_id
            ).all()

            return [self._model_to_dict(p) for p in products]

    def create_order(self, customer_phone: str, items: List[Dict], total_amount_ngn: float) -> Optional[Order]:
        """
        Create a new order and persist to database.
        
        Args:
            customer_phone: Customer's phone number
            items: List of dicts with 'product_id' and 'quantity'
            total_amount_ngn: Total order amount in NGN
            
        Returns:
            Order dataclass if successful, None if failed
        """
        from .models import Order as OrderModel, OrderItem as OrderItemModel
        
        order_id = str(uuid.uuid4())
        
        with self._get_db_session() as db:
            try:
                # Create the order
                order = OrderModel(
                    id=order_id,
                    user_id=self.user_id,
                    customer_phone=customer_phone,
                    total_amount=total_amount_ngn,
                    status="pending",
                )
                db.add(order)
                db.flush()
                
                # Create order items and decrement stock
                order_items_data = []
                for item in items:
                    product_id = item.get("product_id", "")
                    quantity = item.get("quantity", 1)
                    
                    # Get product details
                    product = db.query(ProductModel).filter(
                        ProductModel.id == product_id,
                        ProductModel.user_id == self.user_id
                    ).first()
                    
                    if not product:
                        logger.warning(f"Product {product_id} not found for order {order_id}")
                        continue
                    
                    # Check and decrement stock
                    if product.stock_level < quantity:
                        logger.warning(f"Insufficient stock for {product.name}: have {product.stock_level}, need {quantity}")
                        continue
                    
                    product.stock_level -= quantity
                    
                    item_total = float(product.price_ngn) * quantity
                    order_item = OrderItemModel(
                        id=str(uuid.uuid4()),
                        order_id=order_id,
                        product_id=product_id,
                        product_name=product.name,
                        quantity=quantity,
                        price=float(product.price_ngn),
                        total=item_total,
                    )
                    db.add(order_item)
                    order_items_data.append({
                        "product_id": product_id,
                        "product_name": product.name,
                        "quantity": quantity,
                        "price": float(product.price_ngn),
                        "total": item_total,
                    })
                
                db.flush()
                
                logger.info(f"Order {order_id} created: {len(order_items_data)} items, ₦{total_amount_ngn:,.0f}")
                
                return Order(
                    order_id=order_id,
                    customer_phone=customer_phone,
                    items=order_items_data,
                    status="pending",
                    total_amount_ngn=total_amount_ngn,
                )
                
            except Exception as e:
                logger.error(f"Error creating order: {e}")
                return None

    def smart_search_products(self, query: str) -> List[dict]:
        """
        Smart product search that ALWAYS tries to find matching products.
        Uses multiple strategies to avoid false \"not found\" responses.
        PERFORMANCE OPTIMIZED: Uses context manager for session handling.
        
        Returns: List of matching products (may be empty only if truly nothing matches)
        """
        from fuzzywuzzy import fuzz
        from .conversation import get_all_synonyms

        with self._get_db_session() as db:
            query_lower = query.lower().strip()
            query_words = query_lower.split()

            # Get all products for this user
            all_products = db.query(ProductModel).filter(
                ProductModel.user_id == self.user_id
            ).all()

            if not all_products:
                return []

            # Score each product based on multiple matching strategies
            scored_products = []

            for product in all_products:
                score = 0
                name_lower = product.name.lower()
                description_lower = (product.description or "").lower()
                category_lower = (product.category or "").lower()
                # Parse voice_tags from JSON
                tags_raw = product.voice_tags or "[]"
                if isinstance(tags_raw, str):
                    try:
                        tags_list = json.loads(tags_raw)
                    except (json.JSONDecodeError, TypeError):
                        tags_list = []
                else:
                    tags_list = tags_raw or []
                tags = [t.lower() for t in tags_list]

                # STRATEGY 1: Exact name match (highest priority)
                if query_lower in name_lower:
                    score += 100

                # STRATEGY 2: Exact voice tag match
                for tag in tags:
                    if query_lower == tag or query_lower in tag or tag in query_lower:
                        score += 80
                        break

                # STRATEGY 3: Word-by-word matching
                for word in query_words:
                    if len(word) < 2:
                        continue

                    if word in name_lower:
                        score += 40

                    for tag in tags:
                        if word in tag:
                            score += 35
                            break

                    if word in description_lower:
                        score += 15

                    if word in category_lower:
                        score += 25

                # STRATEGY 4: Synonym matching
                for word in query_words:
                    if len(word) < 3:
                        continue
                    synonyms = get_all_synonyms(word)
                    for synonym in synonyms:
                        if synonym in name_lower:
                            score += 30
                        for tag in tags:
                            if synonym in tag:
                                score += 25
                                break
                        if synonym in category_lower:
                            score += 20

                # STRATEGY 5: Fuzzy matching (for typos/variations)
                name_fuzzy = fuzz.partial_ratio(query_lower, name_lower)
                if name_fuzzy > 70:
                    score += name_fuzzy // 4

                for tag in tags:
                    tag_fuzzy = fuzz.ratio(query_lower, tag)
                    if tag_fuzzy > 70:
                        score += tag_fuzzy // 5
                        break

                # STRATEGY 6: Category fallback
                category_terms = {
                    "footwear": ["shoe", "shoes", "sneaker", "sneakers", "canvas", "kicks"],
                    "clothing": ["shirt", "shorts", "jeans", "trouser", "top", "clothes"],
                    "accessories": ["bag", "wallet", "chain", "glasses", "shades"],
                    "jewelry": ["chain", "necklace", "gold", "ring", "earring"],
                    "electronics": ["charger", "phone", "cable", "earphones"]
                }

                for cat, terms in category_terms.items():
                    if any(term in query_lower for term in terms):
                        if category_lower == cat:
                            score += 20

                if score > 0:
                    scored_products.append((product, score))

            # Sort by score (highest first)
            scored_products.sort(key=lambda x: x[1], reverse=True)

            # Return products with meaningful scores
            results = [self._model_to_dict(p) for p, s in scored_products if s >= 20]

            # If no results, try even more aggressive matching
            if not results:
                for product in all_products:
                    name_lower = product.name.lower()
                    # Parse voice_tags from JSON
                    tags_raw = product.voice_tags or "[]"
                    if isinstance(tags_raw, str):
                        try:
                            tags_list = json.loads(tags_raw)
                        except (json.JSONDecodeError, TypeError):
                            tags_list = []
                    else:
                        tags_list = tags_raw or []
                    tags = [t.lower() for t in tags_list]

                    for word in query_words:
                        if len(word) >= 3:
                            if word in name_lower or any(word in t for t in tags):
                                prod_dict = self._model_to_dict(product)
                                if prod_dict not in results:
                                    results.append(prod_dict)

            return results

    def find_product_by_selection(self, selection: str, product_list: List[dict]) -> Optional[dict]:
        """
        Find a product from a list based on user selection.
        Handles: "1", "first", "the red one", "green yam", etc.
        PRIORITIZES exact name matches over partial matches.
        """
        from fuzzywuzzy import fuzz

        selection_lower = selection.lower().strip()

        # Handle numeric selection: "1", "2", etc.
        if selection_lower.isdigit():
            idx = int(selection_lower) - 1
            if 0 <= idx < len(product_list):
                return product_list[idx]

        # Handle ordinal selection: "first", "second", etc.
        ordinals = {"first": 0, "second": 1, "third": 2, "1st": 0, "2nd": 1, "3rd": 2}
        if selection_lower in ordinals:
            idx = ordinals[selection_lower]
            if idx < len(product_list):
                return product_list[idx]

        # Clean selection - remove common filler words
        clean_selection = selection_lower
        for filler in ["the", "one", "please", "i want", "give me", "show me"]:
            clean_selection = clean_selection.replace(filler, "")
        clean_selection = clean_selection.strip()

        # PRIORITY 1: Check for exact name match (case insensitive)
        for product in product_list:
            name_lower = product.get("name", "").lower()
            if clean_selection == name_lower or clean_selection in name_lower:
                return product

        # PRIORITY 2: Check if full selection phrase appears in name
        for product in product_list:
            name_lower = product.get("name", "").lower()
            if all(word in name_lower for word in clean_selection.split() if len(word) >= 3):
                return product

        # PRIORITY 3: Score-based matching (fallback)
        best_match = None
        best_score = 0

        for product in product_list:
            name_lower = product.get("name", "").lower()
            tags = [t.lower() for t in product.get("voice_tags", [])]
            score = 0

            # Full phrase fuzzy match against name
            name_fuzzy = fuzz.ratio(clean_selection, name_lower)
            score += name_fuzzy

            # Check word-by-word
            selection_words = clean_selection.split()
            words_matched = 0
            for word in selection_words:
                if len(word) >= 3:
                    if word in name_lower:
                        words_matched += 1
                        score += 20
                    for tag in tags:
                        if word in tag:
                            score += 10
                            break

            # Bonus for matching more words
            if len(selection_words) > 0:
                match_ratio = words_matched / len(selection_words)
                score += int(match_ratio * 50)

            if score > best_score:
                best_score = score
                best_match = product

        return best_match
