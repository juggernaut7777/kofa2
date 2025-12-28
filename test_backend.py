#!/usr/bin/env python3
"""Quick test to check backend status"""
import requests
import sys

def test_backend():
    try:
        print("Testing KOFA Backend Status...")
        print("=" * 50)

        # Test Heroku backend
        heroku_url = "https://kofa-backend-david-0a6d58175f07.herokuapp.com"
        print(f"Testing Heroku backend: {heroku_url}")

        # Test health endpoint
        health_response = requests.get(f"{heroku_url}/health", timeout=10)
        print(f"Health check: {health_response.status_code}")
        if health_response.status_code == 200:
            print(f"SUCCESS: Backend is RUNNING: {health_response.json()}")
        else:
            print(f"ERROR: Backend returned: {health_response.status_code} {health_response.text}")

        # Test products endpoint
        products_response = requests.get(f"{heroku_url}/products", timeout=10)
        print(f"Products endpoint: {products_response.status_code}")
        if products_response.status_code == 200:
            products = products_response.json()
            print(f"SUCCESS: Products loaded: {len(products)} products")
        else:
            print(f"ERROR: Products failed: {products_response.status_code}")

        # Test orders endpoint
        orders_response = requests.get(f"{heroku_url}/orders", timeout=10)
        print(f"Orders endpoint: {orders_response.status_code}")
        if orders_response.status_code == 200:
            orders = orders_response.json()
            print(f"SUCCESS: Orders loaded: {len(orders)} orders")
        else:
            print(f"ERROR: Orders failed: {orders_response.status_code}")

        print("\nBackend Status Summary:")
        if health_response.status_code == 200:
            print("BACKEND IS WORKING!")
        else:
            print("BACKEND IS DOWN")

    except requests.exceptions.RequestException as e:
        print(f"Network Error: {e}")
        print("Backend might be down or network issue")
    except Exception as e:
        print(f"Unexpected Error: {e}")

if __name__ == "__main__":
    test_backend()
