"""Integration tests for the complete chatbot flow."""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch
from chatbot.main import app


@pytest.fixture
def client():
    """Create a test client."""
    return TestClient(app)


@pytest.fixture
def mock_inventory():
    """Mock inventory manager."""
    with patch('chatbot.main.inventory_manager') as mock:
        yield mock


@pytest.fixture
def mock_payment():
    """Mock payment manager."""
    with patch('chatbot.main.payment_manager') as mock:
        yield mock


class TestChatbotFlow:
    """Test complete chatbot conversation flows."""
    
    def test_greeting_flow(self, client):
        """Test greeting conversation."""
        response = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "Hello"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["intent"] == "greeting"
        assert "Welcome" in data["response"] or "Hello" in data["response"]
    
    def test_help_flow(self, client):
        """Test help request."""
        response = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "What can you help me with?"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["intent"] == "help"
    
    def test_product_availability_flow(self, client, mock_inventory, mock_payment):
        """Test checking product availability."""
        # Mock product found
        mock_product = Mock()
        mock_product.id = "123"
        mock_product.name = "Red Sneakers"
        mock_product.price_ngn = 15000
        mock_product.stock_level = 10
        
        mock_inventory.search_product.return_value = mock_product
        mock_payment.format_naira.return_value = "₦15,000"
        
        response = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "Do you have red sneakers?"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["intent"] in ["availability_check", "price_inquiry"]
        assert data["product"] is not None
        assert data["product"]["name"] == "Red Sneakers"
    
    def test_product_not_found_flow(self, client, mock_inventory):
        """Test searching for unavailable product."""
        mock_inventory.search_product.return_value = None
        
        response = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "Do you have flying carpets?"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "couldn't find" in data["response"] or "not found" in data["response"].lower()
    
    def test_product_out_of_stock_flow(self, client, mock_inventory):
        """Test checking out-of-stock product."""
        mock_product = Mock()
        mock_product.id = "123"
        mock_product.name = "Red Sneakers"
        mock_product.price_ngn = 15000
        mock_product.stock_level = 0
        
        mock_inventory.search_product.return_value = mock_product
        
        response = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "Do you have red sneakers?"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "sold out" in data["response"].lower()
    
    def test_complete_purchase_flow(self, client, mock_inventory, mock_payment):
        """Test complete purchase flow from inquiry to payment."""
        # Step 1: Check availability
        mock_product = Mock()
        mock_product.id = "123"
        mock_product.name = "Red Sneakers"
        mock_product.price_ngn = 15000
        mock_product.stock_level = 10
        
        mock_inventory.search_product.return_value = mock_product
        mock_inventory.get_product_by_id.return_value = mock_product
        mock_payment.format_naira.return_value = "₦15,000"
        
        response1 = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "Do you have red sneakers?"
        })
        
        assert response1.status_code == 200
        
        # Step 2: Purchase
        mock_order = Mock()
        mock_order.order_id = "order-123"
        mock_order.total_amount_ngn = 15000
        
        mock_inventory.create_order.return_value = mock_order
        mock_inventory.decrement_stock.return_value = True
        mock_payment.generate_payment_link.return_value = "https://payment.link/order-123"
        
        response2 = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "Yes, I want to buy it"
        })
        
        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["payment_link"] is not None
        assert "payment.link" in data2["payment_link"]
    
    def test_purchase_without_context(self, client):
        """Test purchase intent without prior product inquiry."""
        response = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "I want to buy"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "what would you like to buy" in data["response"].lower()
    
    def test_unknown_intent_flow(self, client):
        """Test handling of unknown messages."""
        response = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "asdfghjkl random text"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["intent"] == "unknown"


class TestAPIEndpoints:
    """Test API endpoints."""
    
    def test_root_endpoint(self, client):
        """Test root endpoint."""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
    
    def test_health_endpoint(self, client):
        """Test health check endpoint."""
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
