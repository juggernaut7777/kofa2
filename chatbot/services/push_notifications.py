"""
Push Notification Service using Expo Push Notifications.
Sends alerts to vendor mobile apps for new orders, low stock, etc.
"""
import os
import aiohttp
from typing import List, Dict, Optional
from dataclasses import dataclass


@dataclass
class PushNotification:
    """Push notification payload."""
    title: str
    body: str
    data: Optional[Dict] = None
    sound: str = "default"
    badge: int = 1


class PushNotificationService:
    """Send push notifications via Expo Push API."""
    
    EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send"
    
    def __init__(self):
        # In production, store tokens in database
        self._device_tokens: Dict[str, List[str]] = {}  # vendor_id -> [tokens]
    
    def register_device(self, vendor_id: str, expo_token: str, device_type: str = "unknown"):
        """
        Register a device for push notifications.
        
        Args:
            vendor_id: The vendor's ID
            expo_token: Expo push token (e.g., ExponentPushToken[xxx])
            device_type: 'ios' or 'android'
        """
        if vendor_id not in self._device_tokens:
            self._device_tokens[vendor_id] = []
        
        if expo_token not in self._device_tokens[vendor_id]:
            self._device_tokens[vendor_id].append(expo_token)
            print(f"📱 Registered device for vendor {vendor_id}: {expo_token[:20]}...")
        
        # In production, also save to database
        # self._save_token_to_db(vendor_id, expo_token, device_type)
    
    def unregister_device(self, vendor_id: str, expo_token: str):
        """Remove a device from push notifications."""
        if vendor_id in self._device_tokens:
            self._device_tokens[vendor_id] = [
                t for t in self._device_tokens[vendor_id] if t != expo_token
            ]
    
    def get_vendor_tokens(self, vendor_id: str) -> List[str]:
        """Get all registered tokens for a vendor."""
        return self._device_tokens.get(vendor_id, [])
    
    async def send_notification(
        self, 
        vendor_id: str, 
        notification: PushNotification
    ) -> Dict:
        """
        Send push notification to all vendor devices.
        
        Args:
            vendor_id: Target vendor
            notification: Notification content
            
        Returns:
            API response with success/failure info
        """
        tokens = self.get_vendor_tokens(vendor_id)
        
        if not tokens:
            print(f"⚠️ No devices registered for vendor {vendor_id}")
            return {"success": False, "error": "No devices registered"}
        
        # Build Expo push messages
        messages = []
        for token in tokens:
            messages.append({
                "to": token,
                "title": notification.title,
                "body": notification.body,
                "sound": notification.sound,
                "badge": notification.badge,
                "data": notification.data or {}
            })
        
        try:
            async with aiohttp.ClientSession() as session:
                async with session.post(
                    self.EXPO_PUSH_URL,
                    json=messages,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    result = await response.json()
                    
                    if response.status == 200:
                        print(f"✅ Push sent to {len(tokens)} devices for vendor {vendor_id}")
                    else:
                        print(f"❌ Push failed: {result}")
                    
                    return result
                    
        except Exception as e:
            print(f"❌ Push notification error: {e}")
            return {"success": False, "error": str(e)}
    
    async def send_new_order_alert(
        self, 
        vendor_id: str, 
        order_id: str, 
        amount: float,
        customer_phone: str = ""
    ):
        """Send notification for new order."""
        notification = PushNotification(
            title="🛒 New Order!",
            body=f"₦{amount:,.0f} order received" + (f" from {customer_phone}" if customer_phone else ""),
            data={
                "type": "new_order",
                "order_id": order_id,
                "amount": amount
            }
        )
        return await self.send_notification(vendor_id, notification)
    
    async def send_low_stock_alert(
        self, 
        vendor_id: str, 
        product_name: str, 
        stock_level: int
    ):
        """Send notification for low stock."""
        notification = PushNotification(
            title="📦 Low Stock Alert",
            body=f"{product_name} only has {stock_level} left!",
            data={
                "type": "low_stock",
                "product_name": product_name,
                "stock_level": stock_level
            }
        )
        return await self.send_notification(vendor_id, notification)
    
    async def send_payment_received(
        self, 
        vendor_id: str, 
        order_id: str, 
        amount: float
    ):
        """Send notification for payment received."""
        notification = PushNotification(
            title="💰 Payment Received!",
            body=f"₦{amount:,.0f} payment confirmed for order",
            data={
                "type": "payment_received",
                "order_id": order_id,
                "amount": amount
            }
        )
        return await self.send_notification(vendor_id, notification)


# Singleton instance
push_service = PushNotificationService()
