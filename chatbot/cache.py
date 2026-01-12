"""
Redis-backed caching for KOFA backend.
Uses Heroku Redis for persistent, shared caching with instant invalidation.
Falls back to in-memory cache if Redis is unavailable.
"""
import os
import time
import json
import logging
from typing import Any, Optional, Dict
from functools import wraps

logger = logging.getLogger(__name__)

# Try to connect to Redis
_redis_client = None
_redis_available = False

try:
    import redis
    redis_url = os.getenv('REDIS_URL')
    if redis_url:
        _redis_client = redis.from_url(redis_url, decode_responses=True)
        # Test connection
        _redis_client.ping()
        _redis_available = True
        logger.info("Redis cache connected successfully")
except Exception as e:
    logger.warning(f"Redis not available, using in-memory cache: {e}")
    _redis_available = False

# Fallback in-memory cache
_memory_cache: Dict[str, Dict[str, Any]] = {}


def get_cache(key: str) -> Optional[Any]:
    """Get value from cache if not expired."""
    if _redis_available:
        try:
            value = _redis_client.get(key)
            if value:
                return json.loads(value)
        except Exception as e:
            logger.warning(f"Redis get failed: {e}")
    
    # Fallback to memory cache
    if key in _memory_cache:
        entry = _memory_cache[key]
        if time.time() < entry['expires']:
            return entry['value']
        else:
            del _memory_cache[key]
    return None


def set_cache(key: str, value: Any, ttl_seconds: int = 60):
    """Set value in cache with TTL."""
    if _redis_available:
        try:
            _redis_client.setex(key, ttl_seconds, json.dumps(value, default=str))
            return
        except Exception as e:
            logger.warning(f"Redis set failed: {e}")
    
    # Fallback to memory cache
    _memory_cache[key] = {
        'value': value,
        'expires': time.time() + ttl_seconds
    }


def invalidate_cache(key: str = None, prefix: str = None):
    """Invalidate specific key or all keys with prefix. INSTANT with Redis!"""
    global _memory_cache
    
    if _redis_available:
        try:
            if key:
                _redis_client.delete(key)
            elif prefix:
                # Find all keys with prefix and delete them
                keys = _redis_client.keys(f"{prefix}*")
                if keys:
                    _redis_client.delete(*keys)
            else:
                _redis_client.flushdb()
            return
        except Exception as e:
            logger.warning(f"Redis invalidate failed: {e}")
    
    # Fallback to memory cache
    if key:
        _memory_cache.pop(key, None)
    elif prefix:
        keys_to_delete = [k for k in _memory_cache if k.startswith(prefix)]
        for k in keys_to_delete:
            del _memory_cache[k]
    else:
        _memory_cache = {}


def cached(ttl_seconds: int = 60, key_prefix: str = ""):
    """Decorator to cache function results."""
    def decorator(func):
        @wraps(func)
        async def async_wrapper(*args, **kwargs):
            cache_key = f"{key_prefix}{func.__name__}:{str(args)}:{str(kwargs)}"
            
            cached_value = get_cache(cache_key)
            if cached_value is not None:
                return cached_value
            
            result = await func(*args, **kwargs)
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
        
        import asyncio
        if asyncio.iscoroutinefunction(func):
            return async_wrapper
        return sync_wrapper
    
    return decorator


def get_cache_stats() -> dict:
    """Get cache statistics."""
    if _redis_available:
        try:
            info = _redis_client.info()
            return {
                'backend': 'redis',
                'connected': True,
                'used_memory': info.get('used_memory_human', 'unknown'),
                'total_keys': _redis_client.dbsize()
            }
        except Exception:
            pass
    
    now = time.time()
    valid = sum(1 for entry in _memory_cache.values() if entry['expires'] > now)
    
    return {
        'backend': 'memory',
        'total_keys': len(_memory_cache),
        'valid_keys': valid
    }


def is_redis_available() -> bool:
    """Check if Redis is available."""
    return _redis_available
