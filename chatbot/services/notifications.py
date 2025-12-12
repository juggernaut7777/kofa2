# owo_flow/chatbot/services/notifications.py
"""
WhatsApp Notification Service for Nigerian Market
Provides templated notifications for orders, payments, and alerts.
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime
from enum import Enum
import uuid


class NotificationType(Enum):
    ORDER_CONFIRMATION = "order_confirmation"
    PAYMENT_RECEIVED = "payment_received"
    SHIPPING_UPDATE = "shipping_update"
    DELIVERY_COMPLETE = "delivery_complete"
    LOW_STOCK_ALERT = "low_stock_alert"
    DAILY_SUMMARY = "daily_summary"
    PROMOTIONAL = "promotional"
    ABANDONED_CART = "abandoned_cart"


@dataclass
class NotificationTemplate:
    """WhatsApp message template."""
    type: NotificationType
    name: str
    template_street: str  # Nigerian Pidgin version
    template_corporate: str  # Professional version
    variables: List[str]  # Required variables


@dataclass
class Notification:
    """Queued or sent notification."""
    id: str
    type: NotificationType
    recipient_phone: str
    message: str
    status: str  # pending, sent, failed
    created_at: datetime
    sent_at: Optional[datetime]
    metadata: Dict


# Notification templates
TEMPLATES: Dict[NotificationType, NotificationTemplate] = {
    NotificationType.ORDER_CONFIRMATION: NotificationTemplate(
        type=NotificationType.ORDER_CONFIRMATION,
        name="Order Confirmation",
        template_street="""🎉 *Order Don Confirm!*

Order ID: {order_id}
Items: {items_summary}
Total: ₦{total_amount}

💳 Pay here: {payment_link}

E go expire in 15 minutes o! Pay sharp! ⏰""",
        template_corporate="""✅ *Order Confirmed*

Order ID: {order_id}
Items: {items_summary}
Total Amount: ₦{total_amount}

Payment Link: {payment_link}

Please complete payment within 15 minutes to secure your order.""",
        variables=["order_id", "items_summary", "total_amount", "payment_link"]
    ),
    
    NotificationType.PAYMENT_RECEIVED: NotificationTemplate(
        type=NotificationType.PAYMENT_RECEIVED,
        name="Payment Received",
        template_street="""💰 *Payment Don Enter!*

Order: {order_id}
Amount: ₦{amount}
Ref: {payment_ref}

Your order don confirm. We go process am now now! 🚀""",
        template_corporate="""✅ *Payment Confirmed*

Order: {order_id}
Amount: ₦{amount}
Reference: {payment_ref}

Your order is now being processed. Thank you!""",
        variables=["order_id", "amount", "payment_ref"]
    ),
    
    NotificationType.SHIPPING_UPDATE: NotificationTemplate(
        type=NotificationType.SHIPPING_UPDATE,
        name="Shipping Update",
        template_street="""🚚 *Your Package Dey Move!*

Tracking: {tracking_id}
Status: {status}
Location: {location}

{status_message}

Track am: {tracking_url}""",
        template_corporate="""📦 *Shipping Update*

Tracking Number: {tracking_id}
Status: {status}
Current Location: {location}

{status_message}

Track your package: {tracking_url}""",
        variables=["tracking_id", "status", "location", "status_message", "tracking_url"]
    ),
    
    NotificationType.DELIVERY_COMPLETE: NotificationTemplate(
        type=NotificationType.DELIVERY_COMPLETE,
        name="Delivery Complete",
        template_street="""✅ *Package Don Land!*

Your order {order_id} don deliver successfully!

We hope say you like am! 🙏

Any wahala? Just reply this message.

⭐ _Rate us if you like!_""",
        template_corporate="""✅ *Delivery Complete*

Your order {order_id} has been delivered successfully.

We hope you enjoy your purchase!

For any concerns, please reply to this message.

⭐ _We'd love to hear your feedback._""",
        variables=["order_id"]
    ),
    
    NotificationType.LOW_STOCK_ALERT: NotificationTemplate(
        type=NotificationType.LOW_STOCK_ALERT,
        name="Low Stock Alert",
        template_street="""⚠️ *Stock Alert!*

These products don almost finish:

{product_list}

Restock am quick before e sell out!""",
        template_corporate="""⚠️ *Inventory Alert*

The following products are running low:

{product_list}

Please consider restocking soon.""",
        variables=["product_list"]
    ),
    
    NotificationType.DAILY_SUMMARY: NotificationTemplate(
        type=NotificationType.DAILY_SUMMARY,
        name="Daily Summary",
        template_street="""📊 *Today's Business Summary*

💰 Revenue: ₦{revenue}
📦 Orders: {order_count}
📈 Growth: {growth}%

Top product: {top_product}

{low_stock_warning}

_Tomorrow go better! 🚀_""",
        template_corporate="""📊 *Daily Business Report*

Revenue: ₦{revenue}
Orders Processed: {order_count}
Growth vs Yesterday: {growth}%

Best Seller: {top_product}

{low_stock_warning}""",
        variables=["revenue", "order_count", "growth", "top_product", "low_stock_warning"]
    ),
    
    NotificationType.ABANDONED_CART: NotificationTemplate(
        type=NotificationType.ABANDONED_CART,
        name="Abandoned Cart",
        template_street="""👋 *Oya Come Back!*

You leave {product_name} for cart o!

Still dey available for ₦{price} 

Ready to buy? Just reply "Yes"!

_We fit hold am small for you_ 😊""",
        template_corporate="""👋 *Complete Your Purchase*

You left {product_name} in your cart.

It's still available at ₦{price}

Ready to complete your order? Reply "Yes" to proceed.

_We can hold it for you._""",
        variables=["product_name", "price"]
    ),
    
    NotificationType.PROMOTIONAL: NotificationTemplate(
        type=NotificationType.PROMOTIONAL,
        name="Promotional",
        template_street="""🔥 *Hot Promo Alert!*

{promo_title}

{promo_details}

Use code: {promo_code}
Valid till: {expiry_date}

Shop now: {shop_link}""",
        template_corporate="""🎁 *Special Offer*

{promo_title}

{promo_details}

Promo Code: {promo_code}
Valid Until: {expiry_date}

Shop Now: {shop_link}""",
        variables=["promo_title", "promo_details", "promo_code", "expiry_date", "shop_link"]
    ),
}

# Mock notification queue
_notification_queue: List[Notification] = []
_sent_notifications: List[Notification] = []


class NotificationService:
    """
    WhatsApp notification service.
    In production, integrates with Twilio/WhatsApp Business API.
    """
    
    def __init__(self, style: str = "street"):
        self.style = style  # "street" or "corporate"
    
    def get_templates(self) -> List[Dict]:
        """Get all available templates."""
        return [
            {
                "type": t.type.value,
                "name": t.name,
                "variables": t.variables,
                "preview_street": t.template_street[:100] + "...",
                "preview_corporate": t.template_corporate[:100] + "..."
            }
            for t in TEMPLATES.values()
        ]
    
    def render_template(
        self,
        notification_type: NotificationType,
        variables: Dict[str, str],
        style: Optional[str] = None
    ) -> str:
        """Render a notification template with variables."""
        template = TEMPLATES.get(notification_type)
        if not template:
            raise ValueError(f"Unknown notification type: {notification_type}")
        
        style = style or self.style
        template_str = template.template_street if style == "street" else template.template_corporate
        
        try:
            return template_str.format(**variables)
        except KeyError as e:
            raise ValueError(f"Missing variable: {e}")
    
    def queue_notification(
        self,
        notification_type: NotificationType,
        recipient_phone: str,
        variables: Dict[str, str],
        metadata: Optional[Dict] = None
    ) -> Notification:
        """
        Queue a notification for sending.
        In production, this would add to a message queue.
        """
        message = self.render_template(notification_type, variables)
        
        notification = Notification(
            id=f"NOTIF-{uuid.uuid4().hex[:8].upper()}",
            type=notification_type,
            recipient_phone=recipient_phone,
            message=message,
            status="pending",
            created_at=datetime.now(),
            sent_at=None,
            metadata=metadata or {}
        )
        
        _notification_queue.append(notification)
        return notification
    
    def send_notification(self, notification: Notification) -> bool:
        """
        Send a notification immediately.
        In production, calls WhatsApp Business API.
        """
        # Mock sending - in production, call Twilio/WhatsApp API
        # Example: twilio_client.messages.create(...)
        
        notification.status = "sent"
        notification.sent_at = datetime.now()
        
        if notification in _notification_queue:
            _notification_queue.remove(notification)
        _sent_notifications.append(notification)
        
        return True
    
    def send_immediate(
        self,
        notification_type: NotificationType,
        recipient_phone: str,
        variables: Dict[str, str]
    ) -> Notification:
        """Queue and immediately send a notification."""
        notification = self.queue_notification(
            notification_type,
            recipient_phone,
            variables
        )
        self.send_notification(notification)
        return notification
    
    def get_queue(self) -> List[Dict]:
        """Get pending notifications."""
        return [
            {
                "id": n.id,
                "type": n.type.value,
                "recipient": n.recipient_phone,
                "status": n.status,
                "created_at": n.created_at.isoformat(),
                "preview": n.message[:100] + "..." if len(n.message) > 100 else n.message
            }
            for n in _notification_queue
        ]
    
    def get_sent_history(self, limit: int = 20) -> List[Dict]:
        """Get recently sent notifications."""
        return [
            {
                "id": n.id,
                "type": n.type.value,
                "recipient": n.recipient_phone,
                "sent_at": n.sent_at.isoformat() if n.sent_at else None,
                "message": n.message
            }
            for n in sorted(_sent_notifications, key=lambda x: x.sent_at or datetime.min, reverse=True)[:limit]
        ]
    
    # Convenience methods for common notifications
    
    def notify_order_confirmation(
        self,
        recipient_phone: str,
        order_id: str,
        items_summary: str,
        total_amount: float,
        payment_link: str
    ) -> Notification:
        """Send order confirmation."""
        return self.send_immediate(
            NotificationType.ORDER_CONFIRMATION,
            recipient_phone,
            {
                "order_id": order_id,
                "items_summary": items_summary,
                "total_amount": f"{total_amount:,.0f}",
                "payment_link": payment_link
            }
        )
    
    def notify_payment_received(
        self,
        recipient_phone: str,
        order_id: str,
        amount: float,
        payment_ref: str
    ) -> Notification:
        """Send payment confirmation."""
        return self.send_immediate(
            NotificationType.PAYMENT_RECEIVED,
            recipient_phone,
            {
                "order_id": order_id,
                "amount": f"{amount:,.0f}",
                "payment_ref": payment_ref
            }
        )
    
    def notify_shipping_update(
        self,
        recipient_phone: str,
        tracking_id: str,
        status: str,
        location: str,
        status_message: str,
        tracking_url: str
    ) -> Notification:
        """Send shipping update."""
        return self.send_immediate(
            NotificationType.SHIPPING_UPDATE,
            recipient_phone,
            {
                "tracking_id": tracking_id,
                "status": status,
                "location": location,
                "status_message": status_message,
                "tracking_url": tracking_url
            }
        )
    
    def notify_delivery_complete(
        self,
        recipient_phone: str,
        order_id: str
    ) -> Notification:
        """Send delivery complete notification."""
        return self.send_immediate(
            NotificationType.DELIVERY_COMPLETE,
            recipient_phone,
            {"order_id": order_id}
        )
    
    def notify_merchant_low_stock(
        self,
        merchant_phone: str,
        low_stock_products: List[Dict]
    ) -> Notification:
        """Alert merchant about low stock."""
        product_list = "\n".join([
            f"• {p['name']}: {p['stock']} left"
            for p in low_stock_products
        ])
        
        return self.send_immediate(
            NotificationType.LOW_STOCK_ALERT,
            merchant_phone,
            {"product_list": product_list}
        )


# Singleton instance
notification_service = NotificationService()
