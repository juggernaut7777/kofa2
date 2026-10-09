"""Integration tests for order creation and stock management - critical for preventing overselling."""
import json
import pytest
from unittest.mock import Mock, patch
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from sqlalchemy.pool import StaticPool

from chatbot.main import app
from chatbot.models import Base, Product as ProductModel
from chatbot.inventory import DEFAULT_USER_ID


@pytest.fixture
def in_memory_db():
    """Create a fresh in-memory SQLite database with test products."""
    engine = create_engine(
        "sqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    Session = sessionmaker(bind=engine)
    
    # Pre-populate sample test products
    with Session() as session:
        session.add_all([
            ProductModel(
                id="product-123",
                user_id=DEFAULT_USER_ID,
                name="Test Product",
                price_ngn=10000,
                stock_level=5,
                voice_tags=json.dumps(["test item"])
            ),
            ProductModel(
                id="product-low",
                user_id=DEFAULT_USER_ID,
                name="Low Stock Item",
                price_ngn=5000,
                stock_level=1,
                voice_tags=json.dumps(["low stock"])
            )
        ])
        session.commit()
        
    with patch("chatbot.database.SessionLocal", Session), \
         patch("chatbot.inventory.SessionLocal", Session):
        yield Session


@pytest.fixture
def client(in_memory_db):
    """Create a test client with in-memory DB wired in."""
    return TestClient(app)


@pytest.fixture
def mock_payment():
    """Mock payment manager."""
    with patch('chatbot.main.payment_manager') as mock:
        yield mock


class TestAtomicStockDecrement:
    """Test stock decrement functionality."""

    def test_decrement_stock_rpc_success(self, in_memory_db):
        """Test successful stock decrement."""
        from chatbot.inventory import InventoryManager
        im = InventoryManager()
        result = im.decrement_stock("product-123", 2)
        assert result is True
        assert im.check_stock("product-123") == 3

    def test_decrement_stock_insufficient_inventory(self, in_memory_db):
        """Test decrement fails when insufficient stock."""
        from chatbot.inventory import InventoryManager
        im = InventoryManager()
        result = im.decrement_stock("product-123", 100)
        assert result is False
        assert im.check_stock("product-123") == 5


class TestOrderCreationWithStock:
    """Test order creation with stock validation and decrement."""

    def test_create_order_successful_stock_decrement(self, client, in_memory_db, mock_payment):
        """Test successful order creation decrements stock."""
        mock_payment.generate_payment_link.return_value = "https://payment.link/test"

        response = client.post("/orders", json={
            "items": [{"product_id": "product-123", "quantity": 2}],
            "user_id": "+2348012345678"
        })

        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["amount_ngn"] == 20000  # 2 * 10000

        # Verify stock was decremented in the DB
        with in_memory_db() as session:
            p = session.query(ProductModel).filter(ProductModel.id == "product-123").first()
            assert p.stock_level == 3

    def test_create_order_insufficient_stock(self, client, in_memory_db):
        """Test order creation fails with insufficient stock."""
        response = client.post("/orders", json={
            "items": [{"product_id": "product-low", "quantity": 5}],  # Request 5, only 1 available
            "user_id": "+2348012345678"
        })

        assert response.status_code == 400
        data = response.json()
        assert "insufficient stock" in data["detail"].lower()


class TestChatbotPurchaseIntegration:
    """Test chatbot purchase flow creates orders and decrements stock."""

    def test_chatbot_purchase_creates_order_and_decrements_stock(self, client, in_memory_db, mock_payment):
        """Test complete chatbot purchase flow."""
        mock_payment.format_naira.return_value = "₦10,000"

        # Step 1: Search for product
        response1 = client.post("/message", json={
            "user_id": "+2348088888888",
            "message_text": "Do you have Test Product?"
        })
        assert response1.status_code == 200

        # Step 2: Purchase the product
        response2 = client.post("/message", json={
            "user_id": "+2348088888888",
            "message_text": "Yes, I want to buy it"
        })

        assert response2.status_code == 200
        data2 = response2.json()
        assert "Order #" in data2["response"]

        # Verify stock was decremented in DB
        with in_memory_db() as session:
            p = session.query(ProductModel).filter(ProductModel.id == "product-123").first()
            assert p.stock_level == 4


class TestErrorHandling:
    """Test error handling in order creation."""

    def test_order_creation_handles_payment_link_failure(self, client, in_memory_db, mock_payment):
        """Test order creation handles payment link generation failure."""
        mock_payment.generate_payment_link.return_value = None  # Payment link fails

        response = client.post("/orders", json={
            "items": [{"product_id": "product-123", "quantity": 1}],
            "user_id": "+2348012345678"
        })

        assert response.status_code == 500
        data = response.json()
        assert "payment link" in data["detail"].lower()

    def test_invalid_product_id_handled(self, client, in_memory_db):
        """Test invalid product ID is handled gracefully."""
        response = client.post("/orders", json={
            "items": [{"product_id": "non-existent-product-id", "quantity": 1}],
            "user_id": "+2348012345678"
        })

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()
