"""
Simple in-memory caching for KOFA backend.
Caches frequently accessed data like products and orders to reduce database load.
"""
import time
from typing import Any, Optional, Dict
from functools import wraps

# Simple in-memory cache with TTL
_cache: Dict[str, Dict[str, Any]] = {}


def get_cache(key: str) -> Optional[Any]:
    """Get value from cache if not expired."""
    if key in _cache:
        entry = _cache[key]
        if time.time() < entry['expires']:
            return entry['value']
        else:
            # Expired, remove it
            del _cache[key]
    return None


def set_cache(key: str, value: Any, ttl_seconds: int = 60):
    """Set value in cache with TTL."""
    _cache[key] = {
        'value': value,
        'expires': time.time() + ttl_seconds
    }


def invalidate_cache(key: str = None, prefix: str = None):
    """Invalidate specific key or all keys with prefix."""
    global _cache
    if key:
        _cache.pop(key, None)
    elif prefix:
        keys_to_delete = [k for k in _cache if k.startswith(prefix)]
        for k in keys_to_delete:
            del _cache[k]
    else:
        _cache = {}


def cached(ttl_seconds: int = 60, key_prefix: str = ""):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            # Create cache key from function name and args
            cache_key = f"{key_prefix}{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Check cache
            cached_value = get_cache(cache_key)
            if cached_value is not None:
                return cached_value
            
            # Execute function
            result = await func(*args, **kwargs)
            
            # Cache result
            set_cache(cache_key, result, ttl_seconds)
            return result
        
        @wraps(func)
        def sync_wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}{func.__name__}:{str(args)}:{str(kwargs)}"
            
            cached_value = get_cache(cache_key)
            if cached_value is not None:
                return cached_value
            
            result = func(*args, **kwargs)
            set_cache(cache_key, result, ttl_seconds)
            return result
        
        # Return appropriate wrapper based on function type
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


# Cache statistics
def get_cache_stats() -> dict:
    """Get cache statistics."""
    now = time.time()
    valid = sum(1 for entry in _cache.values() if entry['expires'] > now)
    expired = len(_cache) - valid
    
    return {
        'total_keys': len(_cache),
        'valid_keys': valid,
        'expired_keys': expired
    }
