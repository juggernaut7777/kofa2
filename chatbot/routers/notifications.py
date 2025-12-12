# owo_flow/chatbot/routers/notifications.py
"""
Notifications API Router
WhatsApp notification management.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Dict, Optional

from ..services.notifications import (
    notification_service, NotificationType
)

router = APIRouter()


class SendNotificationRequest(BaseModel):
    type: str
    recipient_phone: str
    variables: Dict[str, str]
    style: Optional[str] = None


@router.get("/templates")
async def get_notification_templates():
    """
    Get all available notification templates.
    """
    return {"templates": notification_service.get_templates()}


@router.post("/send")
async def send_notification(request: SendNotificationRequest):
    """
    Send a notification using a template.
    
    Example:
    ```json
    {
        "type": "order_confirmation",
        "recipient_phone": "+2348012345678",
        "variables": {
            "order_id": "ORD-001",
            "items_summary": "Nike Air Max x1",
            "total_amount": "45000",
            "payment_link": "https://pay.link/xyz"
        }
    }
    ```
    """
    try:
        notification_type = NotificationType(request.type)
    except ValueError:
        raise HTTPException(400, f"Invalid notification type: {request.type}")
    
    try:
        if request.style:
            notification_service.style = request.style
        
        notification = notification_service.send_immediate(
            notification_type,
            request.recipient_phone,
            request.variables
        )
        
        return {
            "notification_id": notification.id,
            "status": notification.status,
            "recipient": notification.recipient_phone,
            "message": notification.message,
            "sent_at": notification.sent_at.isoformat() if notification.sent_at else None
        }
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/queue")
async def get_notification_queue():
    """
    Get pending notifications in queue.
    """
    return {"queue": notification_service.get_queue()}


@router.get("/history")
async def get_notification_history(limit: int = 20):
    """
    Get recently sent notifications.
    """
    return {"sent": notification_service.get_sent_history(limit)}


@router.post("/preview")
async def preview_notification(request: SendNotificationRequest):
    """
    Preview a notification without sending.
    """
    try:
        notification_type = NotificationType(request.type)
    except ValueError:
        raise HTTPException(400, f"Invalid notification type: {request.type}")
    
    try:
        message = notification_service.render_template(
            notification_type,
            request.variables,
            request.style
        )
        return {
            "type": request.type,
            "recipient": request.recipient_phone,
            "preview": message,
            "style": request.style or notification_service.style
        }
    except ValueError as e:
        raise HTTPException(400, str(e))


# Convenience endpoints for common notifications

@router.post("/order-confirmation")
async def send_order_confirmation(
    recipient_phone: str,
    order_id: str,
    items_summary: str,
    total_amount: float,
    payment_link: str
):
    """
    Quick endpoint to send order confirmation.
    """
    notification = notification_service.notify_order_confirmation(
        recipient_phone, order_id, items_summary, total_amount, payment_link
    )
    
    return {
        "notification_id": notification.id,
        "status": notification.status,
        "message": notification.message
    }


@router.post("/payment-received")
async def send_payment_notification(
    recipient_phone: str,
    order_id: str,
    amount: float,
    payment_ref: str
):
    """
    Quick endpoint to send payment confirmation.
    """
    notification = notification_service.notify_payment_received(
        recipient_phone, order_id, amount, payment_ref
    )
    
    return {
        "notification_id": notification.id,
        "status": notification.status,
        "message": notification.message
    }


@router.post("/shipping-update")
async def send_shipping_notification(
    recipient_phone: str,
    tracking_id: str,
    status: str,
    location: str,
    status_message: str,
    tracking_url: str
):
    """
    Quick endpoint to send shipping update.
    """
    notification = notification_service.notify_shipping_update(
        recipient_phone, tracking_id, status, location, status_message, tracking_url
    )
    
    return {
        "notification_id": notification.id,
        "status": notification.status,
        "message": notification.message
    }
