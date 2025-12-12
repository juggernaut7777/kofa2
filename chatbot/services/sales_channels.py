# owo_flow/chatbot/services/sales_channels.py
"""
Sales Channels Service for Multi-Platform Order Aggregation
Tracks orders from WhatsApp, Instagram, TikTok, Walk-in, etc.
"One dashboard to rule them all"
"""
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import random
import uuid


class SalesChannel(Enum):
    """Available sales channels."""
    WHATSAPP = "whatsapp"
    INSTAGRAM = "instagram"
    TIKTOK = "tiktok"
    WALKIN = "walkin"
    FACEBOOK = "facebook"
    TWITTER = "twitter"
    OTHER = "other"


class OrderStatus(Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    PAID = "paid"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"


@dataclass
class ChannelOrder:
    """Order from any sales channel."""
    id: str
    channel: SalesChannel
    customer_phone: str
    customer_name: Optional[str]
    
    # Product info
    items: List[Dict]  # [{product_id, name, quantity, unit_price, total}]
    total_amount_ngn: float
    
    # Status
    status: OrderStatus
    
    # External references
    channel_order_ref: Optional[str]  # IG DM ref, TikTok order ID, etc.
    notes: Optional[str]
    
    # Timestamps
    created_at: datetime
    updated_at: datetime


@dataclass
class ChannelSummary:
    """Summary for a single channel."""
    channel: str
    order_count: int
    revenue_ngn: float
    avg_order_value: float
    top_product: Optional[str]
    conversion_rate: Optional[float]  # If we track inquiries


@dataclass
class MultiChannelDashboard:
    """Complete multi-channel overview."""
    total_orders: int
    total_revenue_ngn: float
    channels: List[ChannelSummary]
    best_channel: str
    recent_orders: List[Dict]


class SalesChannelsService:
    """
    Multi-platform order aggregation service.
    Unifies orders from WhatsApp, Instagram, TikTok, Walk-in.
    """
    
    def __init__(self):
        # Mock orders for demonstration
        self._orders: List[ChannelOrder] = self._generate_mock_orders()
        
        # Mock products (same as other services)
        self._products = {
            "1": {"name": "Nike Air Max Red", "price": 45000},
            "2": {"name": "Adidas White Sneakers", "price": 38000},
            "3": {"name": "Men Formal Shirt White", "price": 15000},
            "4": {"name": "Designer Blue Jeans", "price": 25000},
            "5": {"name": "Black Leather Bag", "price": 35000},
            "6": {"name": "Plain Round Neck T-Shirt", "price": 8000},
            "7": {"name": "iPhone Charger Fast Charging", "price": 12000},
        }
    
    def _generate_mock_orders(self) -> List[ChannelOrder]:
        """Generate realistic multi-channel orders."""
        orders = []
        now = datetime.now()
        
        # Channel distribution: WhatsApp dominant, then IG, then walkin, then TikTok
        channel_weights = [
            (SalesChannel.WHATSAPP, 40),
            (SalesChannel.INSTAGRAM, 30),
            (SalesChannel.WALKIN, 20),
            (SalesChannel.TIKTOK, 10),
        ]
        
        customers = [
            ("+2348012345678", "Chinedu Okafor"),
            ("+2349087654321", "Amara Eze"),
            ("+2348055551234", "Fatima Bello"),
            ("+2347033332222", "Obinna Nwosu"),
            ("+2348099998888", "Yetunde Adeyemi"),
        ]
        
        products = [
            {"id": "1", "name": "Nike Air Max Red", "price": 45000},
            {"id": "2", "name": "Adidas White Sneakers", "price": 38000},
            {"id": "3", "name": "Men Formal Shirt White", "price": 15000},
            {"id": "4", "name": "Designer Blue Jeans", "price": 25000},
            {"id": "5", "name": "Black Leather Bag", "price": 35000},
        ]
        
        for i in range(40):
            days_ago = random.randint(0, 14)
            hours_ago = random.randint(0, 23)
            
            # Weighted channel selection
            channel = random.choices(
                [c[0] for c in channel_weights],
                weights=[c[1] for c in channel_weights]
            )[0]
            
            customer = random.choice(customers)
            product = random.choice(products)
            quantity = random.randint(1, 2)
            
            # Generate channel-specific reference
            if channel == SalesChannel.INSTAGRAM:
                channel_ref = f"IG-DM-{random.randint(1000,9999)}"
            elif channel == SalesChannel.TIKTOK:
                channel_ref = f"TT-{random.randint(10000,99999)}"
            elif channel == SalesChannel.WHATSAPP:
                channel_ref = None  # WhatsApp handled by bot
            else:
                channel_ref = f"WALK-{i+1:04d}"
            
            orders.append(ChannelOrder(
                id=str(uuid.uuid4())[:8],
                channel=channel,
                customer_phone=customer[0],
                customer_name=customer[1],
                items=[{
                    "product_id": product["id"],
                    "name": product["name"],
                    "quantity": quantity,
                    "unit_price": product["price"],
                    "total": product["price"] * quantity
                }],
                total_amount_ngn=product["price"] * quantity,
                status=random.choice(list(OrderStatus)),
                channel_order_ref=channel_ref,
                notes=None,
                created_at=now - timedelta(days=days_ago, hours=hours_ago),
                updated_at=now - timedelta(days=days_ago, hours=hours_ago)
            ))
        
        return sorted(orders, key=lambda x: x.created_at, reverse=True)
    
    def create_order(
        self,
        channel: str,
        customer_phone: str,
        items: List[Dict],
        customer_name: Optional[str] = None,
        channel_order_ref: Optional[str] = None,
        notes: Optional[str] = None
    ) -> ChannelOrder:
        """
        Create a new order from any channel.
        Used for manual order entry from IG/TikTok.
        """
        try:
            sales_channel = SalesChannel(channel.lower())
        except ValueError:
            sales_channel = SalesChannel.OTHER
        
        # Calculate total
        total_amount = sum(item.get("total", 0) for item in items)
        
        now = datetime.now()
        order = ChannelOrder(
            id=str(uuid.uuid4())[:8],
            channel=sales_channel,
            customer_phone=customer_phone,
            customer_name=customer_name,
            items=items,
            total_amount_ngn=total_amount,
            status=OrderStatus.PENDING,
            channel_order_ref=channel_order_ref,
            notes=notes,
            created_at=now,
            updated_at=now
        )
        
        self._orders.insert(0, order)
        return order
    
    def get_orders(
        self,
        channel: Optional[str] = None,
        status: Optional[str] = None,
        limit: int = 20
    ) -> List[Dict]:
        """Get orders with optional filters."""
        filtered = self._orders
        
        if channel:
            try:
                channel_enum = SalesChannel(channel.lower())
                filtered = [o for o in filtered if o.channel == channel_enum]
            except ValueError:
                pass
        
        if status:
            try:
                status_enum = OrderStatus(status.lower())
                filtered = [o for o in filtered if o.status == status_enum]
            except ValueError:
                pass
        
        return [self._order_to_dict(o) for o in filtered[:limit]]
    
    def get_channel_summary(self, days: int = 7) -> MultiChannelDashboard:
        """Get multi-channel performance summary."""
        cutoff = datetime.now() - timedelta(days=days)
        recent_orders = [o for o in self._orders if o.created_at >= cutoff]
        
        # Aggregate by channel
        channel_data: Dict[str, Dict] = {}
        
        for order in recent_orders:
            ch = order.channel.value
            if ch not in channel_data:
                channel_data[ch] = {
                    "order_count": 0,
                    "revenue": 0,
                    "products": {}
                }
            
            channel_data[ch]["order_count"] += 1
            channel_data[ch]["revenue"] += order.total_amount_ngn
            
            # Track top product per channel
            for item in order.items:
                pname = item.get("name", "Unknown")
                channel_data[ch]["products"][pname] = \
                    channel_data[ch]["products"].get(pname, 0) + 1
        
        # Build channel summaries
        summaries = []
        for ch, data in channel_data.items():
            top_product = None
            if data["products"]:
                top_product = max(data["products"], key=data["products"].get)
            
            summaries.append(ChannelSummary(
                channel=ch,
                order_count=data["order_count"],
                revenue_ngn=data["revenue"],
                avg_order_value=data["revenue"] / data["order_count"] if data["order_count"] > 0 else 0,
                top_product=top_product,
                conversion_rate=None
            ))
        
        # Sort by revenue
        summaries.sort(key=lambda x: x.revenue_ngn, reverse=True)
        
        return MultiChannelDashboard(
            total_orders=len(recent_orders),
            total_revenue_ngn=sum(o.total_amount_ngn for o in recent_orders),
            channels=summaries,
            best_channel=summaries[0].channel if summaries else "none",
            recent_orders=[self._order_to_dict(o) for o in recent_orders[:10]]
        )
    
    def get_daily_breakdown(self, days: int = 7) -> List[Dict]:
        """Get order count by channel for each day."""
        now = datetime.now()
        breakdown = []
        
        for day_offset in range(days):
            day_start = (now - timedelta(days=day_offset)).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            day_end = day_start + timedelta(days=1)
            
            day_orders = [
                o for o in self._orders
                if day_start <= o.created_at < day_end
            ]
            
            channel_counts = {}
            for ch in SalesChannel:
                channel_counts[ch.value] = len([
                    o for o in day_orders if o.channel == ch
                ])
            
            breakdown.append({
                "date": day_start.strftime("%Y-%m-%d"),
                "total_orders": len(day_orders),
                "total_revenue": sum(o.total_amount_ngn for o in day_orders),
                "by_channel": channel_counts
            })
        
        return breakdown
    
    def _order_to_dict(self, order: ChannelOrder) -> Dict:
        """Convert order to dictionary."""
        return {
            "id": order.id,
            "channel": order.channel.value,
            "customer_phone": order.customer_phone,
            "customer_name": order.customer_name,
            "items": order.items,
            "total_amount_ngn": order.total_amount_ngn,
            "status": order.status.value,
            "channel_order_ref": order.channel_order_ref,
            "notes": order.notes,
            "created_at": order.created_at.isoformat(),
            "updated_at": order.updated_at.isoformat()
        }


# Singleton instance
sales_channels_service = SalesChannelsService()
