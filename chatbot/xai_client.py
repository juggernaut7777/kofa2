"""
xAI Grok API client for KOFA.
3rd AI fallback: Groq → Gemini → Grok → error

Uses OpenAI-compatible API format (api.x.ai).
"""
import os
import logging
import aiohttp

logger = logging.getLogger(__name__)

XAI_API_KEY = os.getenv("XAI_API_KEY", "")
XAI_BASE_URL = "https://api.x.ai/v1/chat/completions"
XAI_MODEL = "grok-3-mini-fast"  # Fast, cheap, good for customer service


async def send_to_grok(
    messages: list,
    system_prompt: str = "",
    max_tokens: int = 1000,
    temperature: float = 0.7
) -> str:
    """
    Send a prompt to xAI Grok API.
    
    Uses OpenAI-compatible format, so message structure is identical
    to what we already use for Groq.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        system_prompt: Optional system prompt
        max_tokens: Max response length
        temperature: Creativity (0.0-1.0)
    
    Returns:
        Response text string, or empty string on failure
    """
    if not XAI_API_KEY:
        logger.warning("XAI_API_KEY not configured — skipping Grok")
        return ""
    
    # Build messages with system prompt
    api_messages = []
    if system_prompt:
        api_messages.append({"role": "system", "content": system_prompt})
    api_messages.extend(messages)
    
    headers = {
        "Authorization": f"Bearer {XAI_API_KEY}",
        "Content-Type": "application/json"
    }
    
    payload = {
        "model": XAI_MODEL,
        "messages": api_messages,
        "max_tokens": max_tokens,
        "temperature": temperature,
    }
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                XAI_BASE_URL,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=15)
            ) as response:
                if response.status == 200:
                    data = await response.json()
                    content = data.get("choices", [{}])[0].get("message", {}).get("content", "")
                    if content:
                        logger.info(f"✅ Grok response received ({len(content)} chars)")
                        return content
                    return ""
                else:
                    error = await response.text()
                    logger.error(f"❌ Grok API error {response.status}: {error[:200]}")
                    return ""
    except aiohttp.ClientError as e:
        logger.error(f"❌ Grok connection error: {e}")
        return ""
    except Exception as e:
        logger.error(f"❌ Grok unexpected error: {e}")
        return ""
