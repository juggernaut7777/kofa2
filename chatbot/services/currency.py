"""
Multi-Currency Service for KOFA
Handles USD/GBP/EUR → NGN conversion with live exchange rates.
"""
import os
import logging
import aiohttp
from typing import Dict, Optional
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

# Cached exchange rates (refreshed every hour)
_exchange_cache: Dict[str, float] = {}
_cache_timestamp: Optional[datetime] = None
CACHE_TTL = timedelta(hours=1)

# Fallback exchange rates if API is unavailable
DEFAULT_RATES = {
    "USD": 1600.0,
    "GBP": 2000.0,
    "EUR": 1750.0,
    "NGN": 1.0,
}

SUPPORTED_CURRENCIES = ["NGN", "USD", "GBP", "EUR"]


async def get_exchange_rates() -> Dict[str, float]:
    """
    Get current exchange rates to NGN.
    Uses ExchangeRate-API (free tier: 1500 requests/month).
    Falls back to cached/default rates if API fails.
    """
    global _exchange_cache, _cache_timestamp
    
    # Return cached rates if still fresh
    if _cache_timestamp and datetime.utcnow() - _cache_timestamp < CACHE_TTL and _exchange_cache:
        return _exchange_cache
    
    api_key = os.getenv("EXCHANGE_RATE_API_KEY", "")
    
    if api_key:
        try:
            url = f"https://v6.exchangerate-api.com/v6/{api_key}/latest/NGN"
            async with aiohttp.ClientSession() as session:
                async with session.get(url, timeout=aiohttp.ClientTimeout(total=5)) as response:
                    if response.status == 200:
                        data = await response.json()
                        rates = data.get("conversion_rates", {})
                        # Invert rates (we want X_TO_NGN, API gives NGN_TO_X)
                        _exchange_cache = {
                            curr: 1.0 / rates[curr] if rates.get(curr, 0) > 0 else DEFAULT_RATES.get(curr, 1)
                            for curr in SUPPORTED_CURRENCIES
                        }
                        _exchange_cache["NGN"] = 1.0
                        _cache_timestamp = datetime.utcnow()
                        logger.info("Exchange rates refreshed from API")
                        return _exchange_cache
        except Exception as e:
            logger.warning(f"Exchange rate API failed: {e}, using fallback rates")
    
    return DEFAULT_RATES


def convert_to_ngn(amount: float, from_currency: str) -> float:
    """Convert an amount from a foreign currency to NGN (synchronous, uses cache)."""
    from_currency = from_currency.upper()
    if from_currency == "NGN":
        return amount
    
    rate = _exchange_cache.get(from_currency) or DEFAULT_RATES.get(from_currency, 1.0)
    return round(amount * rate, 2)


def convert_from_ngn(amount_ngn: float, to_currency: str) -> float:
    """Convert an amount from NGN to a foreign currency."""
    to_currency = to_currency.upper()
    if to_currency == "NGN":
        return amount_ngn
    
    rate = _exchange_cache.get(to_currency) or DEFAULT_RATES.get(to_currency, 1.0)
    if rate > 0:
        return round(amount_ngn / rate, 2)
    return amount_ngn


def format_currency(amount: float, currency: str = "NGN") -> str:
    """Format amount with currency symbol."""
    symbols = {"NGN": "₦", "USD": "$", "GBP": "£", "EUR": "€"}
    symbol = symbols.get(currency.upper(), currency)
    return f"{symbol}{amount:,.2f}"
