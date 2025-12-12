"""Example test script to verify the chatbot manually."""
import requests
import json


def test_chatbot(base_url="http://localhost:8000"):
    """
    Manually test the chatbot via API calls.
    
    Args:
        base_url: Base URL of the running FastAPI server
    """
    print("🤖 Owo Flow Commerce Engine - Manual Test\n")
    
    # Test 1: Health check
    print("1️⃣ Testing health endpoint...")
    response = requests.get(f"{base_url}/health")
    print(f"   Status: {response.status_code}")
    print(f"   Response: {response.json()}\n")
    
    # Test 2: Greeting
    print("2️⃣ Testing greeting...")
    response = requests.post(
        f"{base_url}/message",
        json={"user_id": "+2348012345678", "message_text": "Hello"}
    )
    data = response.json()
    print(f"   Intent: {data['intent']}")
    print(f"   Response: {data['response']}\n")
    
    # Test 3: Product availability
    print("3️⃣ Testing product availability check...")
    response = requests.post(
        f"{base_url}/message",
        json={"user_id": "+2348012345678", "message_text": "Do you have red sneakers?"}
    )
    data = response.json()
    print(f"   Intent: {data['intent']}")
    print(f"   Response: {data['response']}")
    if data.get('product'):
        print(f"   Product: {data['product']['name']} - ₦{data['product']['price_ngn']:,}\n")
    else:
        print()
    
    # Test 4: Purchase
    print("4️⃣ Testing purchase flow...")
    response = requests.post(
        f"{base_url}/message",
        json={"user_id": "+2348012345678", "message_text": "Yes, I want to buy"}
    )
    data = response.json()
    print(f"   Intent: {data['intent']}")
    print(f"   Response: {data['response']}")
    if data.get('payment_link'):
        print(f"   Payment Link: {data['payment_link']}\n")
    else:
        print()
    
    # Test 5: Help
    print("5️⃣ Testing help request...")
    response = requests.post(
        f"{base_url}/message",
        json={"user_id": "+2348012345678", "message_text": "what can you do?"}
    )
    data = response.json()
    print(f"   Intent: {data['intent']}")
    print(f"   Response: {data['response']}\n")
    
    # Test 6: Get Products
    print("6️⃣ Testing get products list...")
    response = requests.get(f"{base_url}/products")
    print(f"   Status: {response.status_code}")
    products = response.json()
    print(f"   Count: {len(products)}\n")

    # Test 7: Create Order
    print("7️⃣ Testing create order...")
    if products:
        # Use first product to create order
        prod_id = products[0].get('id') or "mock-id"
        response = requests.post(
            f"{base_url}/orders",
            json={
                "items": [{"product_id": str(prod_id), "quantity": 1}],
                "user_id": "+2348012345678"
            }
        )
        print(f"   Status: {response.status_code}")
        order_data = response.json()
        print(f"   Order ID: {order_data.get('order_id')}")
        print(f"   Payment Link: {order_data.get('payment_link')}\n")
    else:
        print("   Skipping order test (no products found)\n")

    print("✅ Manual test complete!")


if __name__ == "__main__":
    print("Make sure the server is running: uvicorn chatbot.main:app --reload\n")
    input("Press Enter to start testing...")
    
    try:
        test_chatbot()
    except requests.exceptions.ConnectionError:
        print("❌ Error: Could not connect to the server.")
        print("   Make sure the server is running on http://localhost:8000")
    except Exception as e:
        print(f"❌ Error: {e}")
