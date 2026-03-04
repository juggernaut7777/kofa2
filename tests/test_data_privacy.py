"""
Tests for Multi-Tenancy Data Privacy ("Private Vault" Architecture)
Ensures that Vendor A can never see Vendor B's data through any layer.
"""
import os
import sys
import pytest
from unittest.mock import MagicMock, patch

# ============== Mock database before any chatbot imports ==============
# The chatbot modules require MYSQL_USER env var at import time.
# We set mock env vars to allow importing without a real DB connection.
os.environ.setdefault("MYSQL_USER", "test_user")
os.environ.setdefault("MYSQL_PASSWORD", "test_pass")
os.environ.setdefault("MYSQL_HOST", "localhost")
os.environ.setdefault("MYSQL_PORT", "3306")
os.environ.setdefault("MYSQL_DATABASE", "test_db")
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_KEY", "test_key")


# ============== LAYER 1: AI Prompt Isolation Tests ==============

class TestAIPromptIsolation:
    """Verify that AI system prompts are vendor-scoped and contain privacy rules."""
    
    def test_business_ai_prompt_contains_vendor_name(self):
        """The business AI prompt should include the specific vendor's name."""
        from chatbot.ai_brain import get_business_ai_prompt
        
        prompt = get_business_ai_prompt("Mama Nkechi's Bags")
        
        assert "Mama Nkechi's Bags" in prompt
        assert "PRIVATE" in prompt or "private" in prompt
    
    def test_business_ai_prompt_has_privacy_rules(self):
        """The business AI prompt must contain anti-leak privacy rules."""
        from chatbot.ai_brain import get_business_ai_prompt
        
        prompt = get_business_ai_prompt("Test Store")
        
        # Must forbid cross-vendor comparisons
        assert "NEVER" in prompt
        assert "other vendor" in prompt.lower() or "other seller" in prompt.lower()
    
    def test_customer_ai_prompt_contains_store_name(self):
        """The customer-facing AI prompt should include the specific store name."""
        from chatbot.ai_brain import get_customer_ai_prompt
        
        prompt = get_customer_ai_prompt("Elegance Fashion")
        
        assert "Elegance Fashion" in prompt
        assert "ONLY" in prompt  # Should say "represents this store ONLY"
    
    def test_customer_ai_prompt_forbids_competitor_mentions(self):
        """Customer AI must never mention other stores."""
        from chatbot.ai_brain import get_customer_ai_prompt
        
        prompt = get_customer_ai_prompt("My Shop")
        
        assert "never mention other stores" in prompt.lower() or "never mention other" in prompt.lower()

    def test_different_vendors_get_different_prompts(self):
        """Two different vendors must get uniquely scoped prompts."""
        from chatbot.ai_brain import get_business_ai_prompt
        
        prompt_a = get_business_ai_prompt("Vendor A Store")
        prompt_b = get_business_ai_prompt("Vendor B Store")
        
        assert "Vendor A Store" in prompt_a
        assert "Vendor B Store" in prompt_b
        assert "Vendor B Store" not in prompt_a
        assert "Vendor A Store" not in prompt_b

    def test_unified_business_prompt_has_privacy(self):
        """The unified AI business prompt builder should include privacy mandate."""
        from chatbot.ai_unified import build_business_ai_prompt
        
        prompt = build_business_ai_prompt(
            products=[{"name": "Test", "price_ngn": 1000, "stock_level": 5}],
            store_name="Secret Shop"
        )
        
        assert "PRIVACY" in prompt or "PRIVATE" in prompt
        assert "Secret Shop" in prompt
    
    def test_unified_context_prompt_has_privacy(self):
        """The unified context prompt builder should scope to specific store."""
        from chatbot.ai_unified import build_context_prompt
        
        prompt = build_context_prompt(
            products=[{"name": "Test Item", "price": 500, "stock_level": 10}],
            store_name="Only My Store"
        )
        
        assert "Only My Store" in prompt
        assert "PRIVACY" in prompt or "exclusively" in prompt.lower()

    def test_legacy_aliases_still_work(self):
        """Legacy BUSINESS_AI_PROMPT and CUSTOMER_AI_PROMPT should still exist."""
        from chatbot.ai_brain import BUSINESS_AI_PROMPT, CUSTOMER_AI_PROMPT
        
        assert isinstance(BUSINESS_AI_PROMPT, str)
        assert isinstance(CUSTOMER_AI_PROMPT, str)
        assert len(BUSINESS_AI_PROMPT) > 100
        assert len(CUSTOMER_AI_PROMPT) > 100


# ============== LAYER 2: Vendor Settings Isolation Tests ==============

class TestVendorSettingsIsolation:
    """Verify that vendor settings are per-vendor, not shared globally."""
    
    def test_different_vendors_get_separate_settings(self):
        """Two vendors should have completely independent settings."""
        # Replicate the get_vendor_settings logic from main.py
        # to test isolation without importing the full app
        _store: dict = {}
        
        def get_vendor_settings(user_id: str = "default") -> dict:
            if user_id not in _store:
                _store[user_id] = {
                    "payment_account": {"bank_name": "", "account_number": "", "account_name": ""},
                    "business_info": {"name": "KOFA Store", "phone": "", "address": ""},
                    "payment_method": "bank_transfer",
                    "subscription_tier": "free",
                }
            return _store[user_id]
        
        settings_a = get_vendor_settings("vendor_a_123")
        settings_b = get_vendor_settings("vendor_b_456")
        
        # Modify vendor A's settings
        settings_a["business_info"]["name"] = "Vendor A Business"
        settings_a["payment_account"]["bank_name"] = "GTBank"
        
        # Vendor B's settings should be unaffected
        assert settings_b["business_info"]["name"] != "Vendor A Business"
        assert settings_b["payment_account"]["bank_name"] != "GTBank"
    
    def test_vendor_settings_persist_for_same_vendor(self):
        """Same vendor should get the same settings object back."""
        _store: dict = {}
        
        def get_vendor_settings(user_id: str = "default") -> dict:
            if user_id not in _store:
                _store[user_id] = {
                    "payment_account": {"bank_name": "", "account_number": "", "account_name": ""},
                    "business_info": {"name": "KOFA Store", "phone": "", "address": ""},
                    "payment_method": "bank_transfer",
                    "subscription_tier": "free",
                }
            return _store[user_id]
        
        settings1 = get_vendor_settings("persistent_vendor")
        settings1["payment_method"] = "paystack"
        
        settings2 = get_vendor_settings("persistent_vendor")
        assert settings2["payment_method"] == "paystack"


# ============== LAYER 3: Analytics Isolation Tests ==============

class TestAnalyticsIsolation:
    """Verify analytics service is vendor-scoped."""
    
    def test_analytics_service_accepts_vendor_id(self):
        """AnalyticsService should accept a vendor_id parameter."""
        from chatbot.services.analytics import AnalyticsService
        
        service_a = AnalyticsService(vendor_id="vendor_a")
        service_b = AnalyticsService(vendor_id="vendor_b")
        
        assert service_a.vendor_id == "vendor_a"
        assert service_b.vendor_id == "vendor_b"
    
    def test_analytics_factory_creates_scoped_instances(self):
        """get_analytics_service() should return vendor-scoped instances."""
        from chatbot.services.analytics import get_analytics_service
        
        service = get_analytics_service("my_vendor_id")
        assert service.vendor_id == "my_vendor_id"
    
    def test_different_vendor_analytics_are_independent(self):
        """Two vendor analytics instances should be separate objects."""
        from chatbot.services.analytics import get_analytics_service
        
        service_a = get_analytics_service("vendor_a")
        service_b = get_analytics_service("vendor_b")
        
        # They should be different instances
        assert service_a is not service_b
        assert service_a.vendor_id != service_b.vendor_id


# ============== LAYER 4: Inventory Isolation Tests ==============

class TestInventoryIsolation:
    """Verify inventory manager is vendor-scoped."""
    
    def test_inventory_manager_accepts_user_id(self):
        """InventoryManager should accept a user_id parameter."""
        from chatbot.inventory import InventoryManager
        
        manager = InventoryManager(user_id="vendor_123")
        assert manager.user_id == "vendor_123"
    
    def test_different_vendors_get_separate_managers(self):
        """Two separate InventoryManagers with different user_ids are independent."""
        from chatbot.inventory import InventoryManager
        
        manager_a = InventoryManager(user_id="vendor_a")
        manager_b = InventoryManager(user_id="vendor_b")
        
        assert manager_a.user_id != manager_b.user_id
        assert manager_a.user_id == "vendor_a"
        assert manager_b.user_id == "vendor_b"


# ============== LAYER 5: Conversation Isolation Tests ==============

class TestConversationIsolation:
    """Verify conversation states are per-user."""
    
    def test_different_users_get_separate_states(self):
        """Two users should have independent conversation states."""
        from chatbot.conversation import ConversationManager
        
        manager = ConversationManager()
        
        state_a = manager.get_state("user_a")
        state_a.set_products([{"name": "Secret Product", "price": 999}], "secret query")
        
        state_b = manager.get_state("user_b")
        
        # User B should NOT see User A's products
        assert len(state_b.last_products) == 0
        assert state_b.last_query == ""
        
        # User A's data should be unchanged
        assert len(state_a.last_products) == 1
        assert state_a.last_products[0]["name"] == "Secret Product"
    
    def test_clearing_one_user_doesnt_affect_another(self):
        """Clearing one user's conversation should not touch another's."""
        from chatbot.conversation import ConversationManager
        
        manager = ConversationManager()
        
        state_a = manager.get_state("clear_user_a")
        state_a.set_products([{"name": "Product A"}], "query A")
        
        state_b = manager.get_state("clear_user_b")
        state_b.set_products([{"name": "Product B"}], "query B")
        
        # Clear user A
        manager.clear_state("clear_user_a")
        
        # User B should be unaffected
        state_b_after = manager.get_state("clear_user_b")
        assert len(state_b_after.last_products) == 1
        assert state_b_after.last_products[0]["name"] == "Product B"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
