"""
Gemini AI Client for KOFA - Backup API
Google's Gemini API as fallback when Groq fails
"""
import os
import httpx
from typing import Optional

# Gemini API configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"


async def send_to_gemini(
    prompt: str,
    system_prompt: str = "",
    max_tokens: int = 1000,
    temperature: float = 0.7
) -> Optional[str]:
    """
    Send a prompt to Gemini AI and get response.
    
    Args:
        prompt: User message
        system_prompt: System instructions for the AI
        max_tokens: Maximum response length
        temperature: Creativity (0-1)
    
    Returns:
        AI response text or None on error
    """
    if not GEMINI_API_KEY:
        return None
    
    # Combine system prompt with user message
    full_prompt = f"{system_prompt}\n\nUser: {prompt}" if system_prompt else prompt
    
    payload = {
        "contents": [{
            "parts": [{"text": full_prompt}]
        }],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature
        }
    }
    
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                # Extract text from Gemini response
                candidates = data.get("candidates", [])
                if candidates:
                    content = candidates[0].get("content", {})
                    parts = content.get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
                return None
            else:
                return None
                
    except Exception as e:
        return None


def send_to_gemini_sync(
    prompt: str,
    system_prompt: str = "",
    max_tokens: int = 1000,
    temperature: float = 0.7
) -> Optional[str]:
    """
    Synchronous version for non-async contexts.
    """
    if not GEMINI_API_KEY:
        return None
    
    full_prompt = f"{system_prompt}\n\nUser: {prompt}" if system_prompt else prompt
    
    payload = {
        "contents": [{
            "parts": [{"text": full_prompt}]
        }],
        "generationConfig": {
            "maxOutputTokens": max_tokens,
            "temperature": temperature
        }
    }
    
    url = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
    
    try:
        with httpx.Client(timeout=30.0) as client:
            response = client.post(
                url,
                json=payload,
                headers={"Content-Type": "application/json"}
            )
            
            if response.status_code == 200:
                data = response.json()
                candidates = data.get("candidates", [])
                if candidates:
                    content = candidates[0].get("content", {})
                    parts = content.get("parts", [])
                    if parts:
                        return parts[0].get("text", "")
                return None
            else:
                return None
                
    except Exception as e:
        return None
