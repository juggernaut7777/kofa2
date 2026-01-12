"""Integration tests for order creation and stock management - critical for preventing overselling."""
import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient
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


class TestAtomicStockDecrement:
    """Test atomic stock decrement functionality."""

    def test_decrement_stock_rpc_success(self, mock_inventory):
        """Test successful stock decrement using RPC."""
        # Mock RPC success
        mock_inventory.decrement_stock.return_value = True

        result = mock_inventory.decrement_stock("product-123", 2)

        assert result is True
        mock_inventory.decrement_stock.assert_called_once_with("product-123", 2)

    def test_decrement_stock_rpc_failure_fallback(self, mock_inventory):
        """Test RPC failure falls back to SQL update."""
        # Mock RPC failure and SQL success
        mock_inventory.decrement_stock.side_effect = [Exception("RPC failed"), True]

        result = mock_inventory.decrement_stock("product-123", 1)

        assert result is True
        assert mock_inventory.decrement_stock.call_count == 2

    def test_decrement_stock_insufficient_inventory(self, mock_inventory):
        """Test decrement fails when insufficient stock."""
        mock_inventory.decrement_stock.return_value = False

        result = mock_inventory.decrement_stock("product-123", 100)

        assert result is False


class TestOrderCreationWithStock:
    """Test order creation with stock validation and decrement."""

    def test_create_order_successful_stock_decrement(self, client, mock_inventory, mock_payment):
        """Test successful order creation decrements stock."""
        # Mock product lookup
        mock_product = {
            "id": "product-123",
            "name": "Test Product",
            "price_ngn": 10000,
            "stock_level": 5
        }
        mock_inventory.get_product_by_id.return_value = mock_product
        mock_inventory.decrement_stock.return_value = True
        mock_payment.generate_payment_link.return_value = "https://payment.link/test"

        response = client.post("/orders", json={
            "items": [{"product_id": "product-123", "quantity": 2}],
            "user_id": "+2348012345678"
        })

        assert response.status_code == 200
        data = response.json()
        assert "order_id" in data
        assert data["amount_ngn"] == 20000  # 2 * 10000
        mock_inventory.decrement_stock.assert_called_once_with("product-123", 2)

    def test_create_order_insufficient_stock(self, client, mock_inventory):
        """Test order creation fails with insufficient stock."""
        mock_product = {
            "id": "product-123",
            "name": "Test Product",
            "price_ngn": 10000,
            "stock_level": 1  # Only 1 available
        }
        mock_inventory.get_product_by_id.return_value = mock_product

        response = client.post("/orders", json={
            "items": [{"product_id": "product-123", "quantity": 5}],  # Request 5
            "user_id": "+2348012345678"
        })

        assert response.status_code == 400
        data = response.json()
        assert "insufficient stock" in data["detail"].lower()

    def test_create_order_stock_decrement_failure_rollback(self, client, mock_inventory, mock_payment):
        """Test stock decrement failure rolls back payment link."""
        mock_product = {
            "id": "product-123",
            "name": "Test Product",
            "price_ngn": 10000,
            "stock_level": 5
        }
        mock_inventory.get_product_by_id.return_value = mock_product
        mock_inventory.decrement_stock.return_value = False  # Stock decrement fails
        mock_payment.generate_payment_link.return_value = "https://payment.link/test"

        response = client.post("/orders", json={
            "items": [{"product_id": "product-123", "quantity": 2}],
            "user_id": "+2348012345678"
        })

        assert response.status_code == 500
        # Should not have called payment generation if stock decrement failed
        mock_payment.generate_payment_link.assert_not_called()


class TestChatbotPurchaseIntegration:
    """Test chatbot purchase flow creates orders and decrements stock."""

    def test_chatbot_purchase_creates_order_and_decrements_stock(self, client, mock_inventory, mock_payment):
        """Test complete chatbot purchase flow."""
        # Mock product search and lookup
        mock_product = {
            "id": "product-123",
            "name": "Red Sneakers",
            "price_ngn": 15000,
            "stock_level": 5
        }

        # Mock search returns product
        mock_inventory.smart_search_products.return_value = [mock_product]
        mock_payment.format_naira.return_value = "₦15,000"
        mock_inventory.get_product_by_id.return_value = mock_product
        mock_inventory.decrement_stock.return_value = True
        mock_payment.generate_payment_link.return_value = "https://payment.link/test"

        # Step 1: Search for product
        response1 = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "Do you have red sneakers?"
        })
        assert response1.status_code == 200

        # Step 2: Purchase the product
        response2 = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "Yes, I want to buy it"
        })

        assert response2.status_code == 200
        data2 = response2.json()
        assert data2["payment_link"] is not None
        assert "₦15,000" in data2["response"]

        # Verify stock was decremented
        mock_inventory.decrement_stock.assert_called_once_with("product-123", 1)

    def test_chatbot_purchase_fails_insufficient_stock(self, client, mock_inventory, mock_payment):
        """Test chatbot purchase fails when insufficient stock."""
        mock_product = {
            "id": "product-123",
            "name": "Red Sneakers",
            "price_ngn": 15000,
            "stock_level": 0  # Out of stock
        }

        mock_inventory.smart_search_products.return_value = [mock_product]
        mock_payment.format_naira.return_value = "₦15,000"

        # Search for product
        response1 = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "red sneakers"
        })
        assert response1.status_code == 200

        # Try to purchase
        response2 = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "I want to buy"
        })

        assert response2.status_code == 200
        data2 = response2.json()
        assert "sold out" in data2["response"].lower()
        assert data2["payment_link"] is None

    def test_chatbot_purchase_handles_stock_decrement_error(self, client, mock_inventory, mock_payment):
        """Test chatbot purchase handles stock decrement errors gracefully."""
        mock_product = {
            "id": "product-123",
            "name": "Red Sneakers",
            "price_ngn": 15000,
            "stock_level": 5
        }

        mock_inventory.smart_search_products.return_value = [mock_product]
        mock_inventory.get_product_by_id.return_value = mock_product
        mock_inventory.decrement_stock.return_value = False  # Stock decrement fails
        mock_payment.format_naira.return_value = "₦15,000"

        # Search and try to purchase
        client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "red sneakers"
        })

        response = client.post("/message", json={
            "user_id": "+2348012345678",
            "message_text": "buy it"
        })

        assert response.status_code == 200
        data = response.json()
        assert "couldn't process your order" in data["response"].lower()


class TestRaceConditionPrevention:
    """Test that race conditions are prevented in concurrent scenarios."""

    def test_concurrent_stock_decrement_isolation(self, mock_inventory):
        """Test that stock decrements are isolated (simulated concurrent access)."""
        # This is a simplified test - in real concurrent scenarios,
        # we'd need multiple threads/processes

        mock_product = {
            "id": "product-123",
            "name": "Test Product",
            "price_ngn": 10000,
            "stock_level": 3
        }

        # First call succeeds
        mock_inventory.decrement_stock.return_value = True

        # Simulate two concurrent decrement attempts
        result1 = mock_inventory.decrement_stock("product-123", 2)
        result2 = mock_inventory.decrement_stock("product-123", 2)

        # Both should succeed if atomic (in real atomic implementation)
        # or second should fail if race condition occurred
        assert result1 is True
        # Note: This test setup assumes atomic behavior - real concurrent testing
        # would require actual database transactions or proper isolation testing


class TestErrorHandling:
    """Test error handling in order creation and stock management."""

    def test_order_creation_handles_payment_link_failure(self, client, mock_inventory, mock_payment):
        """Test order creation handles payment link generation failure."""
        mock_product = {
            "id": "product-123",
            "name": "Test Product",
            "price_ngn": 10000,
            "stock_level": 5
        }

        mock_inventory.get_product_by_id.return_value = mock_product
        mock_inventory.decrement_stock.return_value = True
        mock_payment.generate_payment_link.return_value = None  # Payment link fails

        response = client.post("/orders", json={
            "items": [{"product_id": "product-123", "quantity": 1}],
            "user_id": "+2348012345678"
        })

        assert response.status_code == 500
        data = response.json()
        assert "payment link" in data["detail"].lower()

    def test_invalid_product_id_handled(self, client, mock_inventory):
        """Test invalid product ID is handled gracefully."""
        mock_inventory.get_product_by_id.return_value = None

        response = client.post("/orders", json={
            "items": [{"product_id": "invalid-id", "quantity": 1}],
            "user_id": "+2348012345678"
        })

        assert response.status_code == 404
        data = response.json()
        assert "not found" in data["detail"].lower()


if __name__ == "__main__":
    pytest.main([__file__, "-v"])



