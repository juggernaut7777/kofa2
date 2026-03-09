"""
Product Scanner Service for KOFA
Uses Gemini Vision API to identify products from photos.
Vendor snaps a product photo → AI identifies name, description, category, suggested price.
"""
import os
import base64
import httpx
import json
import logging
from typing import Optional, Dict, Any

logger = logging.getLogger(__name__)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_VISION_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"

PRODUCT_IDENTIFICATION_PROMPT = """You are a product identification AI for Nigerian small business vendors.

Analyze this product photo and extract:
1. **name** - Product name (clear, sell-ready, e.g. "Red Ankara Gown" not "dress")
2. **description** - Short, professional selling description (2-3 sentences max, highlight key features)
3. **category** - One of: clothing, electronics, food, beauty, accessories, home, other
4. **suggested_price_ngn** - Estimated Nigerian Naira price based on the product type (rough estimate)

Rules:
- Keep the name concise but descriptive (max 5 words)
- Description should help SELL the product — mention material, size range, color, key features
- If you can't identify the product, still give your best guess
- Price should be realistic for Nigerian market
- Return ONLY valid JSON, no markdown, no explanation

Return as JSON:
{"name": "Red Ankara Gown", "description": "Beautiful red Ankara print gown with modern styling. Premium African wax fabric, suitable for weddings and special occasions. Available in all sizes.", "category": "clothing", "suggested_price_ngn": 25000}"""


async def scan_product(image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[Dict[str, Any]]:
    """
    Scan a product photo and identify it using Gemini Vision.
    
    Args:
        image_bytes: Raw image bytes
        mime_type: Image MIME type
    
    Returns:
        Product data dict or None on failure
    """
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not configured — cannot scan product")
        return None
    
    # Encode image to base64
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    
    payload = {
        "contents": [{
            "parts": [
                {"text": PRODUCT_IDENTIFICATION_PROMPT},
                {
                    "inline_data": {
                        "mime_type": mime_type,
                        "data": image_b64
                    }
                }
            ]
        }],
        "generationConfig": {
            "maxOutputTokens": 500,
            "temperature": 0.2
        }
    }
    
    url = f"{GEMINI_VISION_URL}?key={GEMINI_API_KEY}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code != 200:
                logger.error(f"Gemini Vision API error: {response.status_code} - {response.text}")
                return None
            
            data = response.json()
            candidates = data.get("candidates", [])
            
            if not candidates:
                logger.error("Gemini returned no candidates")
                return None
            
            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            
            # Clean up response
            text = text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            result = json.loads(text)
            
            # Validate required fields
            if "name" not in result:
                logger.error(f"Missing 'name' in product scan: {result}")
                return None
            
            # Ensure price is a number
            if "suggested_price_ngn" in result:
                result["suggested_price_ngn"] = float(result["suggested_price_ngn"])
            
            # Default category
            valid_categories = ["clothing", "electronics", "food", "beauty", "accessories", "home", "other"]
            if result.get("category") not in valid_categories:
                result["category"] = "other"
            
            logger.info(f"✅ Product scanned: {result['name']} — ₦{result.get('suggested_price_ngn', 0):,.0f}")
            return result
            
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e}")
        return None
    except Exception as e:
        logger.error(f"Product scan error: {e}")
        return None
