"""Unit tests for inventory management."""
import pytest
from unittest.mock import Mock, patch
from chatbot.inventory import InventoryManager, Product, Order


@pytest.fixture
def mock_supabase_client():
    """Create a mock Supabase client."""
    with patch('chatbot.inventory.create_client') as mock_create:
        mock_client = Mock()
        mock_create.return_value = mock_client
        yield mock_client


@pytest.fixture
def inventory_manager(mock_supabase_client):
    """Create an InventoryManager instance with mocked client."""
    return InventoryManager()


class TestProductSearch:
    """Test product search functionality."""
    
    def test_search_product_by_name(self, inventory_manager, mock_supabase_client):
        """Test searching product by exact name."""
        # Mock response
        mock_response = Mock()
        mock_response.data = [
            {
                "id": "123",
                "name": "Red Sneakers",
                "price_ngn": 15000,
                "stock_level": 10,
                "voice_tags": ["red shoes", "sneakers"],
                "description": "Nice shoes",
                "category": "Footwear"
            }
        ]
        # Chain: table().select().ilike().execute()
        mock_supabase_client.table.return_value.select.return_value.ilike.return_value.execute.return_value = mock_response
        
        # Search
        product = inventory_manager.search_product("red sneakers")
        
        assert product is not None
        assert product.name == "Red Sneakers"
        assert product.price_ngn == 15000
    
    def test_search_product_by_voice_tag(self, inventory_manager, mock_supabase_client):
        """Test searching product via voice tags."""
        mock_response = Mock()
        mock_response.data = [
            {
                "id": "123",
                "name": "Red Sneakers",
                "price_ngn": 15000,
                "stock_level": 10,
                "voice_tags": ["red shoes", "kicks", "running shoes"],
                "description": "Nice shoes",
                "category": "Footwear"
            }
        ]
        # Chain: table().select().ilike().execute() for name search (returns empty)
        mock_empty_response = Mock()
        mock_empty_response.data = []
        mock_supabase_client.table.return_value.select.return_value.ilike.return_value.execute.return_value = mock_empty_response
        # For voice tag fallback: table().select().execute() for all products
        mock_supabase_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        # Search using voice tag
        product = inventory_manager.search_product("kicks")
        
        assert product is not None
        assert "kicks" in product.voice_tags
    
    def test_search_product_not_found(self, inventory_manager, mock_supabase_client):
        """Test searching for non-existent product."""
        mock_response = Mock()
        mock_response.data = []
        # Chain: table().select().ilike().execute() returns empty
        mock_supabase_client.table.return_value.select.return_value.ilike.return_value.execute.return_value = mock_response
        # Fallback also returns empty
        mock_supabase_client.table.return_value.select.return_value.execute.return_value = mock_response
        
        product = inventory_manager.search_product("non-existent-product")
        
        assert product is None


class TestStockManagement:
    """Test stock management operations."""
    
    def test_check_stock(self, inventory_manager, mock_supabase_client):
        """Test checking stock level."""
        mock_response = Mock()
        mock_response.data = [
            {
                "id": "123",
                "name": "Red Sneakers",
                "price_ngn": 15000,
                "stock_level": 5,
                "voice_tags": [],
                "description": "",
                "category": ""
            }
        ]
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        stock = inventory_manager.check_stock("123")
        
        assert stock == 5
    
    def test_decrement_stock_success(self, inventory_manager, mock_supabase_client):
        """Test successful stock decrement."""
        # Mock get product
        mock_get_response = Mock()
        mock_get_response.data = [
            {
                "id": "123",
                "name": "Red Sneakers",
                "price_ngn": 15000,
                "stock_level": 10,
                "voice_tags": [],
                "description": "",
                "category": ""
            }
        ]
        
        # Mock update
        mock_update_response = Mock()
        mock_update_response.data = [{"stock_level": 9}]
        
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_get_response
        mock_supabase_client.table.return_value.update.return_value.eq.return_value.execute.return_value = mock_update_response
        
        result = inventory_manager.decrement_stock("123", 1)
        
        assert result is True
    
    def test_decrement_stock_insufficient(self, inventory_manager, mock_supabase_client):
        """Test decrement fails with insufficient stock."""
        mock_response = Mock()
        mock_response.data = [
            {
                "id": "123",
                "name": "Red Sneakers",
                "price_ngn": 15000,
                "stock_level": 2,
                "voice_tags": [],
                "description": "",
                "category": ""
            }
        ]
        mock_supabase_client.table.return_value.select.return_value.eq.return_value.execute.return_value = mock_response
        
        result = inventory_manager.decrement_stock("123", 5)
        
        assert result is False


class TestOrderManagement:
    """Test order creation and management."""
    
    def test_create_order_success(self, inventory_manager, mock_supabase_client):
        """Test successful order creation."""
        mock_response = Mock()
        mock_response.data = [
            {
                "order_id": "order-123",
                "customer_phone": "+2348012345678",
                "items": [{"product_id": "123", "quantity": 1}],
                "status": "Pending",
                "payment_ref": None,
                "total_amount_ngn": 15000
            }
        ]
        mock_supabase_client.table.return_value.insert.return_value.execute.return_value = mock_response
        
        order = inventory_manager.create_order(
            customer_phone="+2348012345678",
            items=[{"product_id": "123", "quantity": 1, "price": 15000}],
            total_amount_ngn=15000
        )
        
        assert order is not None
        assert order.order_id == "order-123"
        assert order.status == "Pending"
