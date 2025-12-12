"""
Nigerian English Conversation Test
Demonstrates the chatbot handling realistic Nigerian customer conversations.
"""
import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from chatbot.intent import IntentRecognizer, Intent
from chatbot.response_formatter import ResponseFormatter, ResponseStyle


def test_nigerian_conversations():
    """Test the chatbot with realistic Nigerian English phrases."""
    
    recognizer = IntentRecognizer()
    
    print("=" * 70)
    print("NIGERIAN ENGLISH CONVERSATION TEST")
    print("=" * 70)
    print()
    
    # Test cases with Nigerian English
    test_cases = [
        ("Abeg I need that red canvas for my brother, hope you get am?", Intent.AVAILABILITY_CHECK),
        ("How far for that white packing shirt?", Intent.PRICE_INQUIRY),
        ("Una get blue jeans?", Intent.AVAILABILITY_CHECK),
        ("Wetin be the price for that black bag?", Intent.PRICE_INQUIRY),
        ("I wan buy the canvas", Intent.PURCHASE),
        ("Make I buy am", Intent.PURCHASE),
        ("You dey sell phone charger?", Intent.AVAILABILITY_CHECK),
        ("How much be the joggers?", Intent.PRICE_INQUIRY),
        ("Oya send me the link make I pay", Intent.PURCHASE),
    ]
    
    print("INTENT RECOGNITION TEST")
    print("-" * 70)
    
    for message, expected_intent in test_cases:
        detected_intent = recognizer.recognize(message)
        status = "✅" if detected_intent == expected_intent else "❌"
        
        print(f"\n{status} Message: \"{message}\"")
        print(f"   Expected: {expected_intent.value}")
        print(f"   Detected: {detected_intent.value}")
    
    print("\n" + "=" * 70)
    print()
    
    # Test product extraction
    print("PRODUCT EXTRACTION TEST")
    print("-" * 70)
    
    extraction_tests = [
        "Abeg I need that red canvas",
        "You get white packing shirt?",
        "How much be the black bag?",
        "I wan buy phone charger",
    ]
    
    for message in extraction_tests:
        product_query = recognizer.extract_product_query(message)
        print(f"\nMessage: \"{message}\"")
        print(f"Extracted: \"{product_query}\"")
    
    print("\n" + "=" * 70)
    print()


def demo_response_styles():
    """Demonstrate both response styles side-by-side."""
    
    print("=" * 70)
    print("RESPONSE STYLE COMPARISON")
    print("=" * 70)
    print()
    
    corporate = ResponseFormatter(ResponseStyle.CORPORATE)
    street = ResponseFormatter(ResponseStyle.STREET)
    
    scenarios = [
        ("Greeting", lambda f: f.format_greeting()),
        ("Product Available", lambda f: f.format_product_available("Nike Air Max Red", "₦45,000", 4)),
        ("Out of Stock", lambda f: f.format_out_of_stock("Nike Air Max Red")),
        ("Payment Link", lambda f: f.format_payment_link(
            "Nike Air Max Red",
            "https://payment.link/xyz",
            "₦45,000",
            15
        )),
    ]
    
    for scenario_name, formatter_func in scenarios:
        print(f"\n📋 SCENARIO: {scenario_name}")
        print("-" * 70)
        
        print("\n🏢 CORPORATE STYLE:")
        print(formatter_func(corporate))
        
        print("\n🌍 STREET STYLE (Nigerian Pidgin):")
        print(formatter_func(street))
        
        print()
    
    print("=" * 70)


def simulate_full_conversation():
    """Simulate a complete conversation from greeting to purchase."""
    
    print("\n" + "=" * 70)
    print("FULL CONVERSATION SIMULATION")
    print("=" * 70)
    print()
    
    # Using Street Style for Nigerian market
    formatter = ResponseFormatter(ResponseStyle.STREET)
    recognizer = IntentRecognizer()
    
    conversation = [
        "Abeg I need that red canvas for my brother, hope you get am?",
        "Yes, I wan buy",
    ]
    
    print("Customer Journey (Street Style):\n")
    
    for i, message in enumerate(conversation, 1):
        intent = recognizer.recognize(message)
        product_query = recognizer.extract_product_query(message)
        
        print(f"Step {i}:")
        print(f"👤 Customer: \"{message}\"")
        print(f"🤖 Bot detected: {intent.value}")
        
        if product_query:
            print(f"🔍 Product query: \"{product_query}\"")
        
        # Simulate response based on intent
        if intent == Intent.AVAILABILITY_CHECK:
            response = formatter.format_product_available("Nike Air Max Red", "₦45,000", 4)
        elif intent == Intent.PURCHASE:
            response = formatter.format_payment_link(
                "Nike Air Max Red",
                "https://payment.nairaramp.com/pay?ref=xyz",
                "₦45,000",
                15
            )
        else:
            response = formatter.format_greeting()
        
        print(f"💬 Bot Response:")
        print(response)
        print("\n" + "-" * 70 + "\n")
    
    print("=" * 70)


if __name__ == "__main__":
    # Run all tests
    test_nigerian_conversations()
    demo_response_styles()
    simulate_full_conversation()
    
    print("\n✅ All tests complete!")
    print("\nTo use CORPORATE style instead of STREET style:")
    print("Edit chatbot/main.py and change:")
    print("  response_formatter = ResponseFormatter(style=ResponseStyle.STREET)")
    print("to:")
    print("  response_formatter = ResponseFormatter(style=ResponseStyle.CORPORATE)")
