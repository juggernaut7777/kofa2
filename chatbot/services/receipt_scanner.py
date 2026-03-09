"""
Receipt Scanner Service for KOFA
Uses Gemini Vision API to extract expense data from receipt photos.
Vendor snaps a receipt → AI extracts amount, description, category → auto-logs expense.
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

RECEIPT_EXTRACTION_PROMPT = """You are a receipt/invoice data extractor for Nigerian businesses.

Analyze this image of a receipt, invoice, or expense document and extract:
1. **amount** - Total amount in Naira (number only, no currency symbol)
2. **description** - What was purchased (brief, e.g. "Stock purchase from ABC Textiles")
3. **category** - One of: rent, marketing, restock, delivery, misc
4. **date** - Date on receipt in ISO format (YYYY-MM-DD), or null if not visible
5. **vendor_name** - Name of the store/vendor on the receipt, or null

Rules:
- If multiple items, sum them for the total amount
- Category guide: restock = buying goods for resale, delivery = shipping/transport, marketing = ads/promo, rent = rent/utilities, misc = everything else
- If amount is in USD or other currency, convert to NGN (use approximate rate)
- Return ONLY valid JSON, no markdown, no explanation

Return as JSON:
{"amount": 15000, "description": "Stock purchase - 10 polo shirts", "category": "restock", "date": "2026-03-09", "vendor_name": "ABC Store"}"""


async def scan_receipt(image_bytes: bytes, mime_type: str = "image/jpeg") -> Optional[Dict[str, Any]]:
    """
    Scan a receipt image and extract expense data using Gemini Vision.
    
    Args:
        image_bytes: Raw image bytes
        mime_type: Image MIME type (image/jpeg, image/png, etc.)
    
    Returns:
        Extracted expense data dict or None on failure
    """
    if not GEMINI_API_KEY:
        logger.error("GEMINI_API_KEY not configured — cannot scan receipt")
        return None
    
    # Encode image to base64
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")
    
    payload = {
        "contents": [{
            "parts": [
                {"text": RECEIPT_EXTRACTION_PROMPT},
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
            "temperature": 0.1  # Low temp for accuracy
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
            
            # Clean up response - remove markdown code blocks if present
            text = text.strip()
            if text.startswith("```"):
                text = text.split("\n", 1)[1] if "\n" in text else text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            # Parse JSON
            result = json.loads(text)
            
            # Validate required fields
            if "amount" not in result or "description" not in result:
                logger.error(f"Missing required fields in extraction: {result}")
                return None
            
            # Ensure amount is a number
            result["amount"] = float(result["amount"])
            
            # Default category if missing
            if "category" not in result or result["category"] not in ["rent", "marketing", "restock", "delivery", "misc"]:
                result["category"] = "misc"
            
            logger.info(f"✅ Receipt scanned: ₦{result['amount']:,.0f} - {result['description']}")
            return result
            
    except json.JSONDecodeError as e:
        logger.error(f"Failed to parse Gemini response as JSON: {e} — raw: {text}")
        return None
    except Exception as e:
        logger.error(f"Receipt scan error: {e}")
        return None
