"""
Groq AI Client for KOFA
FREE AI API - 14,400 requests/day
"""
import os
import httpx
import json
from typing import Optional, Dict, Any

# Groq API configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions"
GROQ_MODEL = "llama-3.1-8b-instant"  # 14,400 requests/day FREE!


async def send_to_groq(
    messages: list,
    system_prompt: str = "",
    max_tokens: int = 1000,
    temperature: float = 0.7
) -> Optional[str]:
    """
    Send a prompt to Groq AI and get response.
    
    Args:
        messages: List of conversation messages
        system_prompt: System instructions for the AI
        max_tokens: Maximum response length
        temperature: Creativity (0-1)
    
    Returns:
        AI response text or None on error
    """
    if not GROQ_API_KEY:
        return "Error: GROQ_API_KEY not configured. Please set your API key."
    
    # Build message list
    full_messages = []
    
    if system_prompt:
        full_messages.append({
            "role": "system",
            "content": system_prompt
        })
    
    full_messages.extend(messages)
    
    payload = {
        "model": GROQ_MODEL,
        "messages": full_messages,
        "max_tokens": max_tokens,
        "temperature": temperature
    }
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                GROQ_API_URL,
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                return f"AI Error: {response.status_code} - {response.text[:100]}"
                
    except Exception as e:
        return f"Connection error: {str(e)}"


def send_to_groq_sync(
    messages: list,
    system_prompt: str = "",
    max_tokens: int = 1000,
    temperature: float = 0.7
) -> Optional[str]:
    """
    Synchronous version for non-async contexts.
    """
    import httpx
    
    if not GROQ_API_KEY:
        return "Error: GROQ_API_KEY not configured. Please set your API key."
    
    full_messages = []
    
    if system_prompt:
        full_messages.append({
            "role": "system",
            "content": system_prompt
        })
    
    full_messages.extend(messages)
    
    payload = {
        "model": GROQ_MODEL,
        "messages": full_messages,
        "max_tokens": max_tokens,
        "temperature": temperature
    }
    
    headers = {
        "Authorization": f"Bearer {GROQ_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                GROQ_API_URL,
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                return data["choices"][0]["message"]["content"]
            else:
                return f"AI Error: {response.status_code}"
                
    except Exception as e:
        return f"Connection error: {str(e)}"
