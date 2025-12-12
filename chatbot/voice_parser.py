import re
from typing import Optional, Dict, Any

class VoiceParser:
    """
    Parses natural language voice commands for inventory management.
    Handles Nigerian market context (e.g., 'bags of rice', 'k', 'credit').
    """

    def parse_command(self, text: str) -> Dict[str, Any]:
        """
        Parses a transcribed voice command string into a structured action dictionary.

        Supported patterns:
        - Restock: "Just bought [quantity] [item] at [price] [payment_type]"
          Example: "Just bought 50 bags of rice at 40k each on credit"
        
        - Sale: "Sold [quantity] [item] [payment_type]"
          Example: "Sold 5 bags of rice cash"

        Returns:
            Dict containing:
            - action: 'restock' | 'sale' | 'unknown'
            - item: str (product name)
            - quantity: int
            - unit_price: float (optional)
            - payment_type: 'credit' | 'cash' | 'transfer' (optional)
            - original_text: str
        """
        text_lower = text.lower()
        
        # 1. Try Restock Pattern
        # "bought 50 [bags of] rice at 40k [each] [on credit]"
        restock_match = re.search(
            r"bought\s+(\d+)\s+(?:bags\s+of\s+)?(.+?)\s+at\s+(\d+(?:k|000)?)\s*(?:each)?\s*(?:on\s+)?(credit|cash|transfer)?",
            text_lower
        )
        if restock_match:
            qty_str = restock_match.group(1)
            item_str = restock_match.group(2).strip()
            price_str = restock_match.group(3)
            payment_type = restock_match.group(4) or "cash"

            # Clean price (handle 'k' suffix)
            price = self._parse_price(price_str)

            return {
                "action": "restock",
                "item": item_str,
                "quantity": int(qty_str),
                "unit_price": price,
                "payment_type": payment_type,
                "original_text": text
            }

        # 2. Try Sale Pattern
        # "sold 5 [bags of] rice [cash/transfer]"
        sale_match = re.search(
            r"sold\s+(\d+)\s+(?:bags\s+of\s+)?(.+?)\s*(cash|transfer|credit)?$",
            text_lower
        )
        if sale_match:
            qty_str = sale_match.group(1)
            item_str = sale_match.group(2).strip()
            payment_type = sale_match.group(3) or "cash"

            return {
                "action": "sale",
                "item": item_str,
                "quantity": int(qty_str),
                "payment_type": payment_type,
                "original_text": text
            }

        return {"action": "unknown", "original_text": text}

    def _parse_price(self, price_str: str) -> float:
        """Converts price string like '40k' or '40000' to float."""
        if not price_str:
            return 0.0
        price_str = price_str.replace(",", "")
        if "k" in price_str:
            return float(price_str.replace("k", "")) * 1000
        return float(price_str)
