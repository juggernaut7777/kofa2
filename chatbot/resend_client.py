"""
Resend Email Client for KOFA
Sends verification emails using Resend API
"""
import os
import httpx
import random
from datetime import datetime, timedelta

RESEND_API_KEY = os.getenv("RESEND_API_KEY", "")
RESEND_API_URL = "https://api.resend.com/emails"

# Use Resend's test domain (no setup needed)
# Later can switch to: noreply@kofaapp.me (requires domain verification)
SENDER_EMAIL = "KOFA <onboarding@resend.dev>"


def generate_verification_code() -> str:
    """Generate a 6-digit verification code."""
    return str(random.randint(100000, 999999))


async def send_verification_email(to_email: str, verification_code: str, first_name: str = "there") -> dict:
    """
    Send verification email with 6-digit code.
    
    Args:
        to_email: Recipient email address
        verification_code: 6-digit verification code
        first_name: User's first name for personalization
    
    Returns:
        Dict with success status and email_id or error
    """
    if not RESEND_API_KEY:
        return {
            "success": False,
            "error": "RESEND_API_KEY not configured"
        }
    
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                        <!-- Header -->
                        <tr>
                            <td style="background: linear-gradient(135deg, #0095FF 0%, #00D4FF 100%); padding: 40px 30px; text-align: center;">
                                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                                    KOFA
                                </h1>
                                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">
                                    AI-Powered Business Management
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 40px 30px;">
                                <h2 style="margin: 0 0 16px; color: #1a1a1a; font-size: 24px; font-weight: 600;">
                                    Welcome, {first_name}! 👋
                                </h2>
                                
                                <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 16px; line-height: 1.5;">
                                    Thanks for signing up for KOFA! To complete your registration and start managing your business with AI, please verify your email address.
                                </p>
                                
                                <p style="margin: 0 0 12px; color: #1a1a1a; font-size: 14px; font-weight: 600;">
                                    Your verification code is:
                                </p>
                                
                                <!-- Verification Code -->
                                <div style="background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border: 2px solid #0095FF; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
                                    <div style="font-size: 40px; font-weight: 700; color: #0095FF; letter-spacing: 8px; font-family: 'Courier New', monospace;">
                                        {verification_code}
                                    </div>
                                </div>
                                
                                <p style="margin: 0 0 24px; color: #4a4a4a; font-size: 14px; line-height: 1.5;">
                                    Enter this code on the verification page to activate your account. This code will expire in <strong>15 minutes</strong>.
                                </p>
                                
                                <div style="background-color: #fff9e6; border-left: 4px solid #ffc107; padding: 16px; border-radius: 4px; margin: 0 0 24px;">
                                    <p style="margin: 0; color: #856404; font-size: 13px; line-height: 1.4;">
                                        <strong>Security tip:</strong> Never share this code with anyone. KOFA will never ask for your verification code.
                                    </p>
                                </div>
                                
                                <p style="margin: 0; color: #6b6b6b; font-size: 14px; line-height: 1.5;">
                                    Didn't request this email? You can safely ignore it.
                                </p>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
                                <p style="margin: 0 0 8px; color: #6b6b6b; font-size: 13px;">
                                    Questions? Email us at <a href="mailto:support@kofaapp.me" style="color: #0095FF; text-decoration: none;">support@kofaapp.me</a>
                                </p>
                                <p style="margin: 0; color: #9b9b9b; font-size: 12px;">
                                    © 2026 KOFA. All rights reserved.
                                </p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </body>
    </html>
    """
    
    text_content = f"""
    Welcome to KOFA, {first_name}!
    
    Your verification code is: {verification_code}
    
    Enter this code on the verification page to activate your account.
    This code will expire in 15 minutes.
    
    If you didn't request this email, you can safely ignore it.
    
    Questions? Email us at support@kofaapp.me
    
    © 2026 KOFA. All rights reserved.
    """
    
    payload = {
        "from": SENDER_EMAIL,
        "to": [to_email],
        "subject": f"Your KOFA Verification Code: {verification_code}",
        "html": html_content,
        "text": text_content
    }
    
    headers = {
        "Authorization": f"Bearer {RESEND_API_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(
                RESEND_API_URL,
                json=payload,
                headers=headers
            )
            
            if response.status_code == 200:
                data = response.json()
                return {
                    "success": True,
                    "email_id": data.get("id"),
                    "message": "Verification email sent successfully"
                }
            else:
                return {
                    "success": False,
                    "error": f"Resend API error: {response.status_code}",
                    "details": response.text
                }
    except Exception as e:
        return {
            "success": False,
            "error": f"Failed to send email: {str(e)}"
        }


def get_verification_expiry() -> datetime:
    """Get expiry time for verification code (15 minutes from now)."""
    return datetime.utcnow() + timedelta(minutes=15)
