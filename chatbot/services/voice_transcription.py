"""
Voice Transcription Service for WhatsApp voice notes.
Uses Google Gemini API for FREE voice transcription with Nigerian English support.
"""
import os
import aiohttp
import base64
from typing import Optional, Tuple


class VoiceTranscriptionService:
    """Transcribe WhatsApp voice notes to text using Gemini (FREE)."""
    
    def __init__(self):
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "")
        self.whatsapp_access_token = os.getenv("WHATSAPP_ACCESS_TOKEN", "")
        self.gemini_model = "gemini-1.5-flash"  # Fast and free
    
    async def download_whatsapp_media(self, media_id: str) -> Optional[bytes]:
        """
        Download media from WhatsApp Cloud API.
        
        Args:
            media_id: The WhatsApp media ID
            
        Returns:
            Audio file bytes or None if download fails
        """
        if not self.whatsapp_access_token:
            print("⚠️ WHATSAPP_ACCESS_TOKEN not configured")
            return None
        
        try:
            # First, get the media URL
            url = f"https://graph.facebook.com/v18.0/{media_id}"
            headers = {"Authorization": f"Bearer {self.whatsapp_access_token}"}
            
            async with aiohttp.ClientSession() as session:
                # Get media URL
                async with session.get(url, headers=headers) as response:
                    if response.status != 200:
                        print(f"❌ Failed to get media URL: {await response.text()}")
                        return None
                    
                    data = await response.json()
                    media_url = data.get("url")
                
                if not media_url:
                    print("❌ No media URL in response")
                    return None
                
                # Download the actual media
                async with session.get(media_url, headers=headers) as response:
                    if response.status != 200:
                        print(f"❌ Failed to download media: {await response.text()}")
                        return None
                    
                    return await response.read()
                    
        except Exception as e:
            print(f"❌ Error downloading media: {e}")
            return None
    
    async def transcribe_audio_with_gemini(self, audio_data: bytes, mime_type: str = "audio/ogg") -> Tuple[str, float]:
        """
        Transcribe audio using Google Gemini API (FREE!).
        
        Args:
            audio_data: Raw audio bytes
            mime_type: MIME type of the audio (audio/ogg, audio/mp3, etc.)
            
        Returns:
            Tuple of (transcribed_text, confidence_score)
        """
        if not self.gemini_api_key:
            print("⚠️ GEMINI_API_KEY not configured - cannot transcribe")
            return ("", 0.0)
        
        try:
            # Encode audio as base64
            audio_base64 = base64.b64encode(audio_data).decode("utf-8")
            
            # Gemini API endpoint
            url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.gemini_model}:generateContent?key={self.gemini_api_key}"
            
            # Request body with audio inline
            payload = {
                "contents": [
                    {
                        "parts": [
                            {
                                "text": "Transcribe this audio message. The speaker may be using Nigerian English or Pidgin. Return ONLY the transcribed text, nothing else."
                            },
                            {
                                "inline_data": {
                                    "mime_type": mime_type,
                                    "data": audio_base64
                                }
                            }
                        ]
                    }
                ],
                "generationConfig": {
                    "temperature": 0.1,
                    "maxOutputTokens": 500
                }
            }
            
            async with aiohttp.ClientSession() as session:
                async with session.post(url, json=payload) as response:
                    if response.status != 200:
                        error = await response.text()
                        print(f"❌ Gemini API error: {error}")
                        return ("", 0.0)
                    
                    result = await response.json()
                    
                    # Extract text from response
                    candidates = result.get("candidates", [])
                    if candidates:
                        content = candidates[0].get("content", {})
                        parts = content.get("parts", [])
                        if parts:
                            text = parts[0].get("text", "").strip()
                            print(f"📢 Transcribed: \"{text}\"")
                            return (text, 0.9)
                    
                    return ("", 0.0)
                    
        except Exception as e:
            print(f"❌ Transcription error: {e}")
            return ("", 0.0)
    
    async def transcribe_whatsapp_voice(self, media_id: str) -> Optional[str]:
        """
        Full pipeline: Download WhatsApp voice note and transcribe it with Gemini.
        
        Args:
            media_id: WhatsApp media ID
            
        Returns:
            Transcribed text or None if failed
        """
        print(f"🎤 Processing voice note: {media_id}")
        
        # Download the voice note
        audio_data = await self.download_whatsapp_media(media_id)
        if not audio_data:
            return None
        
        # WhatsApp voice notes are typically OGG format
        text, confidence = await self.transcribe_audio_with_gemini(audio_data, "audio/ogg")
        
        if confidence < 0.5:
            print(f"⚠️ Low confidence transcription: {confidence}")
            return None
        
        return text


# Singleton instance
voice_service = VoiceTranscriptionService()
