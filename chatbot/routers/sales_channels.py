# owo_flow/chatbot/routers/sales_channels.py
"""
Sales Channels API Router
Multi-platform order aggregation endpoints.
"One dashboard to rule them all"
"""
from fastapi import APIRouter, Query, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

from ..services.sales_channels import sales_channels_service, SalesChannel

router = APIRouter()


class OrderItem(BaseModel):
    """Item in an order."""
    product_id: str
    name: str
    quantity: int
    unit_price: float
    total: float


class CreateOrderRequest(BaseModel):
    """Request to create order from any channel."""
    channel: str  # whatsapp, instagram, tiktok, walkin, other
    customer_phone: str
    customer_name: Optional[str] = None
    items: List[OrderItem]
    channel_order_ref: Optional[str] = None  # IG DM ref, TikTok order ID, etc.
    notes: Optional[str] = None


@router.post("/orders")
async def create_channel_order(request: CreateOrderRequest):
    """
    Create order from any sales channel.
    Use this to log orders from Instagram DMs, TikTok, walk-in customers, etc.
    """
    items = [item.model_dump() for item in request.items]
    
    order = sales_channels_service.create_order(
        channel=request.channel,
        customer_phone=request.customer_phone,
        customer_name=request.customer_name,
        items=items,
        channel_order_ref=request.channel_order_ref,
        notes=request.notes
    )
    
    return {
        "success": True,
        "order_id": order.id,
        "channel": order.channel.value,
        "total_amount_ngn": order.total_amount_ngn,
        "formatted_total": f"₦{order.total_amount_ngn:,.0f}",
        "message": f"Order created from {order.channel.value.upper()}"
    }


@router.get("/orders")
async def get_channel_orders(
    channel: Optional[str] = Query(None, description="Filter by channel: whatsapp, instagram, tiktok, walkin"),
    status: Optional[str] = Query(None, description="Filter by status: pending, paid, shipped, delivered"),
    limit: int = Query(20, ge=1, le=100)
):
    """
    Get orders from all channels or filter by specific channel.
    """
    orders = sales_channels_service.get_orders(
        channel=channel,
        status=status,
        limit=limit
    )
    
    return {
        "count": len(orders),
        "filter": {
            "channel": channel,
            "status": status
        },
        "orders": orders
    }


@router.get("/summary")
async def get_channel_summary(
    days: int = Query(7, ge=1, le=90, description="Number of days to analyze")
):
    """
    Get multi-channel performance summary.
    See which platform brings the most orders and revenue.
    """
    dashboard = sales_channels_service.get_channel_summary(days)
    
    return {
        "period": f"last_{days}_days",
        "total_orders": dashboard.total_orders,
        "total_revenue_ngn": dashboard.total_revenue_ngn,
        "formatted_revenue": f"₦{dashboard.total_revenue_ngn:,.0f}",
        "best_channel": dashboard.best_channel,
        "channels": [
            {
                "name": ch.channel,
                "order_count": ch.order_count,
                "revenue_ngn": ch.revenue_ngn,
                "formatted_revenue": f"₦{ch.revenue_ngn:,.0f}",
                "avg_order_value": round(ch.avg_order_value, 0),
                "top_product": ch.top_product
            }
            for ch in dashboard.channels
        ],
        "recent_orders": dashboard.recent_orders[:5]
    }


@router.get("/breakdown")
async def get_daily_breakdown(
    days: int = Query(7, ge=1, le=30, description="Number of days")
):
    """
    Get daily order breakdown by channel.
    Useful for trend analysis.
    """
    breakdown = sales_channels_service.get_daily_breakdown(days)
    
    return {
        "period": f"last_{days}_days",
        "daily_data": breakdown
    }


@router.get("/available")
async def get_available_channels():
    """
    Get list of available sales channels.
    """
    return {
        "channels": [
            {"id": ch.value, "name": ch.value.title(), "active": True}
            for ch in SalesChannel
        ]
    }


# Bulk import endpoint
class BulkOrderItem(BaseModel):
    channel: str
    customer_phone: str
    customer_name: Optional[str] = None
    product_name: str
    quantity: int
    unit_price: float
    channel_order_ref: Optional[str] = None


@router.post("/import")
async def bulk_import_orders(orders: List[BulkOrderItem]):
    """
    Bulk import orders from CSV or external source.
    Useful for migrating from spreadsheets.
    """
    created = []
    errors = []
    
    for i, order_data in enumerate(orders):
        try:
            items = [{
                "product_id": "import",
                "name": order_data.product_name,
                "quantity": order_data.quantity,
                "unit_price": order_data.unit_price,
                "total": order_data.quantity * order_data.unit_price
            }]
            
            order = sales_channels_service.create_order(
                channel=order_data.channel,
                customer_phone=order_data.customer_phone,
                customer_name=order_data.customer_name,
                items=items,
                channel_order_ref=order_data.channel_order_ref
            )
            created.append(order.id)
        except Exception as e:
            errors.append({"index": i, "error": str(e)})
    
    return {
        "success": len(errors) == 0,
        "created_count": len(created),
        "error_count": len(errors),
        "created_order_ids": created,
        "errors": errors
    }
