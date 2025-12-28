"""Test script to verify the chatbot purchase flow fix."""
import requests
import json
import time

def test_purchase_flow(base_url="http://localhost:8000"):
    """Test that chatbot purchases now create orders and decrement stock."""

    user_id = "+2348012345678"
    print("Testing KOFA Chatbot Purchase Flow Fix")
    print("=" * 50)

    # Test 1: Check initial products and stock
    print("\n1. Checking initial products...")
    response = requests.get(f"{base_url}/products")
    if response.status_code != 200:
        print(f"ERROR: Could not get products (status {response.status_code})")
        return

    products = response.json()
    print(f"Found {len(products)} products")

    if not products:
        print("ERROR: No products found")
        return

    # Get first product
    product = products[0]
    initial_stock = product.get('stock_level', 0)
    product_name = product.get('name', 'Unknown')
    product_id = product.get('id')

    print(f"Testing with product: {product_name} (ID: {product_id})")
    print(f"Initial stock: {initial_stock}")

    # Test 2: Chatbot purchase flow
    print("\n2. Testing chatbot purchase...")

    # Step 2a: Search for the product
    search_response = requests.post(
        f"{base_url}/message",
        json={"user_id": user_id, "message_text": product_name.lower()}
    )

    if search_response.status_code != 200:
        print(f"ERROR: Search failed (status {search_response.status_code})")
        return

    search_data = search_response.json()
    print(f"Search intent: {search_data['intent']}")

    # Step 2b: Try to purchase it
    purchase_response = requests.post(
        f"{base_url}/message",
        json={"user_id": user_id, "message_text": "I want to buy this"}
    )

    if purchase_response.status_code != 200:
        print(f"ERROR: Purchase failed (status {purchase_response.status_code})")
        print(f"Response: {purchase_response.text}")
        return

    purchase_data = purchase_response.json()
    print(f"Purchase intent: {purchase_data['intent']}")
    print(f"Response: {purchase_data['response'][:100]}...")

    has_payment_link = 'payment_link' in purchase_data and purchase_data['payment_link']
    print(f"Payment link generated: {has_payment_link}")

    # Test 3: Check if stock was decremented
    print("\n3. Checking if stock was decremented...")
    response2 = requests.get(f"{base_url}/products")
    if response2.status_code != 200:
        print(f"ERROR: Could not get products after purchase (status {response2.status_code})")
        return

    products_after = response2.json()
    product_after = None
    for p in products_after:
        if p.get('id') == product_id:
            product_after = p
            break

    if not product_after:
        print("ERROR: Product not found after purchase")
        return

    final_stock = product_after.get('stock_level', 0)
    stock_decremented = final_stock == initial_stock - 1
    print(f"Final stock: {final_stock}")
    print(f"Stock decremented: {stock_decremented}")

    # Test 4: Check if order was created
    print("\n4. Checking if order was created...")
    orders_response = requests.get(f"{base_url}/orders")
    if orders_response.status_code != 200:
        print(f"ERROR: Could not get orders (status {orders_response.status_code})")
        return

    orders = orders_response.json()
    chatbot_orders = [o for o in orders if o.get('source') == 'chatbot']
    print(f"Total orders: {len(orders)}")
    print(f"Chatbot orders: {len(chatbot_orders)}")

    if chatbot_orders:
        latest_order = chatbot_orders[-1]  # Get most recent
        order_total = latest_order.get('total_amount', 0)
        print(f"Latest chatbot order total: {order_total}")
        print(f"Order customer: {latest_order.get('customer_phone')}")

    # Test Results
    print("\n" + "=" * 50)
    print("TEST RESULTS:")
    print(f"- Payment link generated: {'PASS' if has_payment_link else 'FAIL'}")
    print(f"- Stock decremented: {'PASS' if stock_decremented else 'FAIL'}")
    print(f"- Order created: {'PASS' if chatbot_orders else 'FAIL'}")

    all_passed = has_payment_link and stock_decremented and len(chatbot_orders) > 0
    print(f"\nOVERALL: {'PASS - Bug Fixed!' if all_passed else 'FAIL - Bug Still Exists'}")

if __name__ == "__main__":
    try:
        test_purchase_flow()
    except requests.exceptions.ConnectionError:
        print("ERROR: Could not connect to server at http://localhost:8000")
        print("Make sure the server is running with: uvicorn chatbot.main:app --reload")
    except Exception as e:
        print(f"ERROR: {e}")


