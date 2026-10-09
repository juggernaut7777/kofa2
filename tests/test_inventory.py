"""Unit tests for inventory management with SQLAlchemy backend."""
import json
import pytest
from unittest.mock import patch
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from chatbot.models import Base, Product as ProductModel
from chatbot.inventory import InventoryManager, DEFAULT_USER_ID


@pytest.fixture
def in_memory_db():
    """Create a fresh in-memory SQLite database for testing."""
    engine = create_engine("sqlite:///:memory:")
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    
    # Pre-populate sample test data
    with Session() as session:
        session.add(ProductModel(
            id="prod-123",
            user_id=DEFAULT_USER_ID,
            name="Red Sneakers",
            price_ngn=15000,
            stock_level=10,
            voice_tags=json.dumps(["red shoes", "kicks", "sneakers"]),
            description="Premium red running shoes",
            category="Footwear"
        ))
        session.commit()
        
    with patch("chatbot.inventory.SessionLocal", Session):
        yield Session


@pytest.fixture
def inventory_manager(in_memory_db):
    """Create an InventoryManager instance configured with in-memory DB."""
    return InventoryManager(user_id=DEFAULT_USER_ID)


class TestProductSearch:
    """Test product search functionality."""

    def test_search_product_by_name(self, inventory_manager):
        """Test searching product by name."""
        product = inventory_manager.search_product("red sneakers")
        assert product is not None
        assert product.name == "Red Sneakers"
        assert product.price_ngn == 15000

    def test_search_product_by_voice_tag(self, inventory_manager):
        """Test searching product via voice tags."""
        product = inventory_manager.search_product("kicks")
        assert product is not None
        assert product.name == "Red Sneakers"
        assert "kicks" in product.voice_tags

    def test_search_product_not_found(self, inventory_manager):
        """Test searching for non-existent product."""
        product = inventory_manager.search_product("hoverboard-flying-shoes-xyz")
        assert product is None


class TestStockManagement:
    """Test stock management operations."""

    def test_check_stock(self, inventory_manager):
        """Test checking stock level."""
        stock = inventory_manager.check_stock("prod-123")
        assert stock == 10

    def test_decrement_stock_success(self, inventory_manager):
        """Test successful stock decrement."""
        result = inventory_manager.decrement_stock("prod-123", 2)
        assert result is True
        assert inventory_manager.check_stock("prod-123") == 8

    def test_decrement_stock_insufficient(self, inventory_manager):
        """Test decrement fails with insufficient stock."""
        result = inventory_manager.decrement_stock("prod-123", 50)
        assert result is False
        assert inventory_manager.check_stock("prod-123") == 10


class TestOrderManagement:
    """Test order creation and management."""

    def test_create_order_success(self, inventory_manager):
        """Test successful order creation."""
        order = inventory_manager.create_order(
            customer_phone="+2348012345678",
            items=[{"product_id": "prod-123", "quantity": 1}],
            total_amount_ngn=15000
        )
        assert order is not None
        assert order.customer_phone == "+2348012345678"
        assert order.status == "pending"
        # Stock should also be decremented
        assert inventory_manager.check_stock("prod-123") == 9
