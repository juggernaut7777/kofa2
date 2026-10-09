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
        mock_product = {
            "id": "123",
            "name": "Red Sneakers",
            "price_ngn": 15000,
            "stock_level": 10
        }
        mock_inventory.smart_search_products.return_value = [mock_product]
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
        mock_inventory.smart_search_products.return_value = []
        
        response = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "Do you have flying carpets?"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert "couldn't find" in data["response"].lower() or "not found" in data["response"].lower()
    
    def test_product_out_of_stock_flow(self, client, mock_inventory):
        """Test checking out-of-stock product."""
        mock_product = {
            "id": "123",
            "name": "Red Sneakers",
            "price_ngn": 15000,
            "stock_level": 0
        }
        mock_inventory.smart_search_products.return_value = [mock_product]
        
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
        mock_product = {
            "id": "123",
            "name": "Red Sneakers",
            "price_ngn": 15000,
            "stock_level": 10
        }
        mock_inventory.smart_search_products.return_value = [mock_product]
        mock_payment.format_naira.return_value = "₦15,000"
        
        response1 = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "Do you have red sneakers?"
        })
        
        assert response1.status_code == 200
        
        # Step 2: Purchase with order creation
        with patch('chatbot.main.create_chatbot_order') as mock_create_order:
            mock_create_order.return_value = ("ORD-1234", "Payment Details:\nBank: GTBank\nAccount: 0123456789")
            response2 = client.post("/message", json={
                "user_id": "+2348012345678",
                "message_text": "Yes, I want to buy it"
            })
            
            assert response2.status_code == 200
            data2 = response2.json()
            assert "ORD-1234" in data2["response"]
            assert data2["intent"] == "purchase"
    
    def test_purchase_without_context(self, client):
        """Test purchase intent without prior product inquiry."""
        from chatbot.main import conversation_manager
        conversation_manager.get_state("+2348099999999").reset()
        response = client.post("/message", json={
            "user_id": "+2348099999999",
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
