"""
Paystack Payment Integration for KOFA
Handles payment link generation, verification, and webhook processing.
Reduces fraud and enables in-chat payment collection.
"""
import os
import aiohttp
import hmac
import hashlib
from typing import Optional, Dict, Any
from datetime import datetime
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class PaystackConfig:
    """Paystack configuration from environment."""
    def __init__(self):
        self.secret_key = os.getenv("PAYSTACK_SECRET_KEY", "")
        self.public_key = os.getenv("PAYSTACK_PUBLIC_KEY", "")
        self.base_url = "https://api.paystack.co"
        self.webhook_secret = os.getenv("PAYSTACK_WEBHOOK_SECRET", "")
    
    @property
    def is_configured(self) -> bool:
        return bool(self.secret_key)


class PaymentLinkRequest(BaseModel):
    """Request to create a payment link."""
    order_id: str
    amount_ngn: float
    customer_email: Optional[str] = None
    customer_phone: str
    description: str
    vendor_id: str = "default"
    callback_url: Optional[str] = None


class PaymentVerification(BaseModel):
    """Payment verification result."""
    success: bool
    reference: str
    amount_ngn: float
    status: str
    customer_email: Optional[str] = None
    paid_at: Optional[str] = None
    channel: Optional[str] = None  # card, bank, ussd, etc.
    metadata: Dict[str, Any] = {}


class PaystackService:
    """
    Paystack integration for KOFA payments.
    
    Features:
    - Generate payment links for WhatsApp sharing
    - Verify payment status
    - Process webhooks for real-time updates
    - Support for bank transfer, card, USSD
    """
    
    def __init__(self):
        self.config = PaystackConfig()
    
    def _get_headers(self) -> Dict[str, str]:
        """Get authorization headers."""
        return {
            "Authorization": f"Bearer {self.config.secret_key}",
            "Content-Type": "application/json"
        }
    
    async def create_payment_link(self, request: PaymentLinkRequest) -> Optional[str]:
        """
        Create a Paystack payment link for WhatsApp sharing.
        
        Args:
            request: Payment link request details
            
        Returns:
            Payment URL or None if creation fails
        """
        if not self.config.is_configured:
            logger.warning("Paystack not configured - returning mock payment link")
            return f"https://paystack.com/pay/kofa-{request.order_id}"
        
        try:
            # Convert to kobo (Paystack uses smallest currency unit)
            amount_kobo = int(request.amount_ngn * 100)
            
            # Generate unique reference
            reference = f"KOFA-{request.order_id}-{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            # Build payload
            payload = {
                "amount": amount_kobo,
                "reference": reference,
                "callback_url": request.callback_url or "https://kofa-dhko.onrender.com/payments/callback",
                "metadata": {
                    "order_id": request.order_id,
                    "vendor_id": request.vendor_id,
                    "customer_phone": request.customer_phone,
                    "description": request.description,
                    "custom_fields": [
                        {
                            "display_name": "Order ID",
                            "variable_name": "order_id",
                            "value": request.order_id
                        },
                        {
                            "display_name": "Customer Phone",
                            "variable_name": "customer_phone", 
                            "value": request.customer_phone
                        }
                    ]
                }
            }
            
            # Add email if provided (required by Paystack)
            if request.customer_email:
                payload["email"] = request.customer_email
            else:
                # Generate placeholder email from phone
                phone_clean = request.customer_phone.replace("+", "").replace(" ", "")
                payload["email"] = f"{phone_clean}@kofa.ng"
            
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    f"{self.config.base_url}/transaction/initialize",
                    json=payload,
                    headers=self._get_headers()
                ) as response:
                    if response.status != 200:
                        error = await response.text()
                        logger.error(f"Paystack API error: {error}")
                        return None
                    
                    data = await response.json()
                    
                    if data.get("status"):
                        authorization_url = data["data"]["authorization_url"]
                        logger.info(f"Payment link created successfully: {authorization_url}")
                        return authorization_url
                    else:
                        logger.error(f"Paystack API returned error: {data.get('message')}")
                        return None
                        
        except Exception as e:
            logger.error(f"Error creating payment link: {e}")
            return None
    
    async def verify_payment(self, reference: str) -> Optional[PaymentVerification]:
        """
        Verify a payment by reference.
        
        Args:
            reference: Paystack payment reference
            
        Returns:
            PaymentVerification object or None
        """
        if not self.config.is_configured:
            logger.warning("Paystack not configured for payment verification")
            return None
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.get(
                    f"{self.config.base_url}/transaction/verify/{reference}",
                    headers=self._get_headers()
                ) as response:
                    if response.status != 200:
                        return None
                    
                    data = await response.json()
                    
                    if data.get("status") and data["data"]["status"] == "success":
                        tx = data["data"]
                        return PaymentVerification(
                            success=True,
                            reference=tx["reference"],
                            amount_ngn=tx["amount"] / 100,  # Convert from kobo
                            status=tx["status"],
                            customer_email=tx.get("customer", {}).get("email"),
                            paid_at=tx.get("paid_at"),
                            channel=tx.get("channel"),
                            metadata=tx.get("metadata", {})
                        )
                    
                    return PaymentVerification(
                        success=False,
                        reference=reference,
                        amount_ngn=0,
                        status=data.get("data", {}).get("status", "failed")
                    )
                    
        except Exception as e:
            logger.error(f"Error verifying payment: {e}")
            return None
    
    def verify_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Verify Paystack webhook signature.
        
        Args:
            payload: Raw request body bytes
            signature: x-paystack-signature header value
            
        Returns:
            True if signature is valid
        """
        if not self.config.webhook_secret:
            logger.warning("Paystack webhook secret not configured")
            return False
        
        expected = hmac.new(
            self.config.webhook_secret.encode(),
            payload,
            hashlib.sha512
        ).hexdigest()
        
        return hmac.compare_digest(expected, signature)
    
    async def process_webhook(self, event: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Process Paystack webhook events.
        
        Args:
            event: Event type (e.g., "charge.success")
            data: Event data
            
        Returns:
            Processing result
        """
        if event == "charge.success":
            # Payment successful
            reference = data.get("reference", "")
            amount = data.get("amount", 0) / 100
            metadata = data.get("metadata", {})
            order_id = metadata.get("order_id")
            vendor_id = metadata.get("vendor_id", "default")
            customer_phone = metadata.get("customer_phone")
            
            print(f"💰 Payment received: ₦{amount:,.0f} for order {order_id}")
            
            # Here you would:
            # 1. Update order status to "paid"
            # 2. Send push notification to vendor
            # 3. Send WhatsApp confirmation to customer
            
            return {
                "processed": True,
                "order_id": order_id,
                "vendor_id": vendor_id,
                "amount_ngn": amount,
                "customer_phone": customer_phone
            }
        
        elif event == "transfer.success":
            # Payout to vendor successful
            return {"processed": True, "type": "payout"}
        
        elif event == "transfer.failed":
            # Payout failed
            return {"processed": True, "type": "payout_failed"}
        
        return {"processed": False, "reason": f"Unknown event: {event}"}


# Singleton instance
paystack_service = PaystackService()
