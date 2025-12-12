from chatbot.intent import IntentRecognizer, Intent

def verify_intent():
    recognizer = IntentRecognizer()
    
    test_cases = [
        ("Do you have red sneakers?", Intent.AVAILABILITY_CHECK, "red sneakers"),
        ("How much is the ankara shirt?", Intent.PRICE_INQUIRY, "ankara shirt"),
        ("I want to buy the black bag", Intent.PURCHASE, "black bag"),
        ("Hello o", Intent.GREETING, None),
        ("Abeg help me", Intent.HELP, None),
    ]
    
    print("🧠 Verifying Intent Recognition...\n")
    
    for text, expected_intent, expected_product in test_cases:
        intent = recognizer.recognize(text)
        product = recognizer.extract_product_query(text)
        
        status = "✅" if intent == expected_intent else "❌"
        prod_status = "✅" if product == expected_product else "❌"
        
        print(f"Message: '{text}'")
        print(f"  Intent: {intent.value} [{status}] (Expected: {expected_intent.value})")
        if expected_product:
            print(f"  Product: {product} [{prod_status}] (Expected: {expected_product})")
        print("-" * 30)

if __name__ == "__main__":
    verify_intent()
