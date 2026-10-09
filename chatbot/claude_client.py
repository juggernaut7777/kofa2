"""
Anthropic Claude AI Client for KOFA
Powers advanced African commerce reasoning, invoice parsing, and multilingual debtor negotiation.
"""
import os
import httpx
import logging
from typing import Optional, List, Dict

logger = logging.getLogger(__name__)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", os.getenv("CLAUDE_API_KEY", ""))
ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages"
DEFAULT_MODEL = os.getenv("CLAUDE_MODEL", "claude-3-5-haiku-20241022")


async def send_to_claude(
    messages: List[Dict[str, str]],
    system_prompt: str = "",
    max_tokens: int = 1000,
    temperature: float = 0.7,
    model: str = DEFAULT_MODEL
) -> Optional[str]:
    """
    Send prompt to Anthropic Claude Messages API.
    
    Args:
        messages: List of message dicts with 'role' and 'content'
        system_prompt: System instructions for Claude
        max_tokens: Maximum tokens in response
        temperature: Creativity score
        model: Claude model name
        
    Returns:
        Generated text response or None on failure
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", os.getenv("CLAUDE_API_KEY", ANTHROPIC_API_KEY))
    if not api_key:
        return None

    # Format messages for Anthropic API (requires user/assistant roles)
    formatted_messages = []
    for msg in messages:
        role = msg.get("role", "user")
        if role not in ("user", "assistant"):
            role = "user"
        content = msg.get("content", "").strip()
        if content:
            formatted_messages.append({"role": role, "content": content})

    if not formatted_messages:
        return None

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }

    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": formatted_messages
    }
    
    if system_prompt:
        payload["system"] = system_prompt

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                ANTHROPIC_API_URL,
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                content_blocks = data.get("content", [])
                if content_blocks and "text" in content_blocks[0]:
                    return content_blocks[0]["text"]
            else:
                logger.warning(f"Claude API returned status {response.status_code}: {response.text}")
                return None
    except Exception as e:
        logger.error(f"Claude API request error: {e}")
        return None


async def send_image_to_claude(
    image_bytes: bytes,
    prompt: str,
    mime_type: str = "image/jpeg",
    max_tokens: int = 500,
    temperature: float = 0.2,
    model: str = DEFAULT_MODEL
) -> Optional[str]:
    """
    Send an image and prompt to Anthropic Claude Vision Messages API.
    """
    api_key = os.getenv("ANTHROPIC_API_KEY", os.getenv("CLAUDE_API_KEY", ANTHROPIC_API_KEY))
    if not api_key:
        return None

    import base64
    image_b64 = base64.b64encode(image_bytes).decode("utf-8")

    headers = {
        "x-api-key": api_key,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json"
    }

    # Normalize mime type for Claude
    valid_mime = mime_type if mime_type in ["image/jpeg", "image/png", "image/gif", "image/webp"] else "image/jpeg"

    payload = {
        "model": model,
        "max_tokens": max_tokens,
        "temperature": temperature,
        "messages": [
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": valid_mime,
                            "data": image_b64
                        }
                    },
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ]
    }

    try:
        async with httpx.AsyncClient(timeout=35.0) as client:
            response = await client.post(
                ANTHROPIC_API_URL,
                json=payload,
                headers=headers
            )
            if response.status_code == 200:
                data = response.json()
                content_blocks = data.get("content", [])
                if content_blocks and "text" in content_blocks[0]:
                    return content_blocks[0]["text"]
            else:
                logger.warning(f"Claude Vision API returned status {response.status_code}: {response.text}")
                return None
    except Exception as e:
        logger.error(f"Claude Vision API error: {e}")
        return None
