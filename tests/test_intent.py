"""Unit tests for intent recognition."""
import pytest
from chatbot.intent import IntentRecognizer, Intent


@pytest.fixture
def recognizer():
    """Create an IntentRecognizer instance."""
    return IntentRecognizer()


class TestIntentRecognition:
    """Test intent recognition functionality."""
    
    def test_greeting_intent(self, recognizer):
        """Test greeting recognition."""
        messages = [
            "Hello",
            "Hi there",
            "Good morning",
            "Hey"
        ]
        for msg in messages:
            assert recognizer.recognize(msg) == Intent.GREETING
    
    def test_help_intent(self, recognizer):
        """Test help request recognition."""
        messages = [
            "help me",
            "what can you do",
            "how do I order",
            "I need assistance"
        ]
        for msg in messages:
            assert recognizer.recognize(msg) == Intent.HELP
    
    def test_price_inquiry_intent(self, recognizer):
        """Test price inquiry recognition."""
        messages = [
            "How much is the red sneakers?",
            "What's the price of blue jeans",
            "Price for black bag",
            "Cost of white shirt"
        ]
        for msg in messages:
            assert recognizer.recognize(msg) == Intent.PRICE_INQUIRY
    
    def test_availability_intent(self, recognizer):
        """Test availability check recognition."""
        messages = [
            "Do you have red sneakers?",
            "Is blue jeans available?",
            "red sneakers in stock?",
            "Can I get black bag"
        ]
        for msg in messages:
            assert recognizer.recognize(msg) == Intent.AVAILABILITY_CHECK
    
    def test_purchase_intent(self, recognizer):
        """Test purchase intent recognition."""
        messages = [
            "I want to buy",
            "Yes, purchase it",
            "Okay, I'll take it",
            "Buy now"
        ]
        for msg in messages:
            assert recognizer.recognize(msg) == Intent.PURCHASE
    
    def test_unknown_intent(self, recognizer):
        """Test unknown intent handling."""
        messages = [
            "asdfghjkl",
            "random gibberish",
            "123456"
        ]
        for msg in messages:
            assert recognizer.recognize(msg) == Intent.UNKNOWN


class TestProductExtraction:
    """Test product query extraction."""
    
    def test_extract_from_availability_query(self, recognizer):
        """Test extracting product from availability question."""
        query = recognizer.extract_product_query("Do you have red sneakers?")
        assert query is not None
        assert "red" in query or "sneakers" in query
    
    def test_extract_from_price_query(self, recognizer):
        """Test extracting product from price question."""
        query = recognizer.extract_product_query("How much is the blue jeans?")
        assert query is not None
        assert "blue" in query or "jeans" in query
    
    def test_extract_simple_product_name(self, recognizer):
        """Test extracting simple product names."""
        query = recognizer.extract_product_query("red shoes")
        assert query is not None
        assert "red" in query and "shoes" in query
    
    def test_no_extraction_from_short_message(self, recognizer):
        """Test that very short messages return None or minimal extraction."""
        query = recognizer.extract_product_query("hi")
        # Should either be None or very short
        assert query is None or len(query) <= 2
