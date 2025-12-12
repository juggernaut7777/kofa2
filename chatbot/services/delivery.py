# owo_flow/chatbot/services/delivery.py
"""
Delivery Integration Service for Nigerian Market
Supports: GIG Logistics, Kwik, Sendbox (mock implementation)
"""
from typing import Optional, List, Dict
from dataclasses import dataclass
from enum import Enum
from datetime import datetime, timedelta
import uuid


class DeliveryProvider(Enum):
    GIG = "gig_logistics"
    KWIK = "kwik"
    SENDBOX = "sendbox"


class DeliveryStatus(Enum):
    PENDING = "pending"
    PICKED_UP = "picked_up"
    IN_TRANSIT = "in_transit"
    OUT_FOR_DELIVERY = "out_for_delivery"
    DELIVERED = "delivered"
    FAILED = "failed"


@dataclass
class DeliveryZone:
    """Nigerian delivery zones with pricing."""
    name: str
    state: str
    base_price_ngn: float
    price_per_kg: float
    estimated_days: int


@dataclass
class DeliveryEstimate:
    """Delivery price estimate."""
    provider: DeliveryProvider
    origin: str
    destination: str
    weight_kg: float
    price_ngn: float
    estimated_days: int
    pickup_date: datetime


@dataclass
class Shipment:
    """Active shipment tracking."""
    tracking_id: str
    order_id: str
    provider: DeliveryProvider
    origin: str
    destination: str
    status: DeliveryStatus
    customer_phone: str
    customer_name: str
    pickup_address: str
    delivery_address: str
    weight_kg: float
    price_ngn: float
    created_at: datetime
    estimated_delivery: datetime
    tracking_history: List[Dict]


# Nigerian Delivery Zones - Major cities and regions
NIGERIAN_ZONES: Dict[str, DeliveryZone] = {
    # Lagos Zones
    "lagos_island": DeliveryZone("Lagos Island", "Lagos", 1500, 200, 1),
    "lagos_mainland": DeliveryZone("Lagos Mainland", "Lagos", 1500, 200, 1),
    "lekki": DeliveryZone("Lekki", "Lagos", 2000, 250, 1),
    "ikeja": DeliveryZone("Ikeja", "Lagos", 1500, 200, 1),
    "ajah": DeliveryZone("Ajah", "Lagos", 2500, 300, 1),
    "ikorodu": DeliveryZone("Ikorodu", "Lagos", 2500, 300, 2),
    
    # Other Major Cities
    "abuja": DeliveryZone("Abuja", "FCT", 3500, 400, 2),
    "port_harcourt": DeliveryZone("Port Harcourt", "Rivers", 4000, 450, 3),
    "ibadan": DeliveryZone("Ibadan", "Oyo", 2500, 300, 2),
    "kano": DeliveryZone("Kano", "Kano", 5000, 500, 4),
    "enugu": DeliveryZone("Enugu", "Enugu", 4500, 450, 3),
    "benin": DeliveryZone("Benin City", "Edo", 3500, 400, 3),
    "kaduna": DeliveryZone("Kaduna", "Kaduna", 5000, 500, 4),
    "owerri": DeliveryZone("Owerri", "Imo", 4500, 450, 3),
    "warri": DeliveryZone("Warri", "Delta", 4000, 400, 3),
    "calabar": DeliveryZone("Calabar", "Cross River", 5500, 550, 4),
    "asaba": DeliveryZone("Asaba", "Delta", 4000, 400, 3),
    "uyo": DeliveryZone("Uyo", "Akwa Ibom", 5000, 500, 4),
    "abeokuta": DeliveryZone("Abeokuta", "Ogun", 2000, 250, 2),
    "aba": DeliveryZone("Aba", "Abia", 4500, 450, 3),
}

# Mock shipment storage
_shipments_db: Dict[str, Shipment] = {}


class DeliveryService:
    """
    Delivery service for Nigerian market.
    Integrates with GIG Logistics, Kwik, and Sendbox.
    """
    
    def __init__(self, default_provider: DeliveryProvider = DeliveryProvider.GIG):
        self.default_provider = default_provider
        self.merchant_location = "lagos_mainland"  # Default merchant location
    
    def get_zones(self) -> List[Dict]:
        """Get all available delivery zones."""
        return [
            {
                "zone_id": zone_id,
                "name": zone.name,
                "state": zone.state,
                "base_price_ngn": zone.base_price_ngn,
                "price_per_kg": zone.price_per_kg,
                "estimated_days": zone.estimated_days
            }
            for zone_id, zone in NIGERIAN_ZONES.items()
        ]
    
    def find_zone(self, location: str) -> Optional[DeliveryZone]:
        """Find zone by name or partial match."""
        location_lower = location.lower().replace(" ", "_")
        
        # Direct match
        if location_lower in NIGERIAN_ZONES:
            return NIGERIAN_ZONES[location_lower]
        
        # Partial match
        for zone_id, zone in NIGERIAN_ZONES.items():
            if location_lower in zone_id or location_lower in zone.name.lower():
                return zone
            if location_lower in zone.state.lower():
                return zone
        
        return None
    
    def estimate_delivery(
        self,
        origin: str,
        destination: str,
        weight_kg: float,
        provider: Optional[DeliveryProvider] = None
    ) -> Optional[DeliveryEstimate]:
        """
        Calculate delivery estimate.
        
        Args:
            origin: Origin zone (e.g., "lagos_mainland", "Ikeja")
            destination: Destination zone
            weight_kg: Package weight in kg
            provider: Delivery provider (defaults to GIG)
        
        Returns:
            DeliveryEstimate or None if zone not found
        """
        origin_zone = self.find_zone(origin)
        dest_zone = self.find_zone(destination)
        
        if not origin_zone or not dest_zone:
            return None
        
        provider = provider or self.default_provider
        
        # Calculate price
        # Base price + weight price + inter-state surcharge
        base_price = dest_zone.base_price_ngn
        weight_price = weight_kg * dest_zone.price_per_kg
        
        # Add inter-state surcharge (20%)
        if origin_zone.state != dest_zone.state:
            surcharge = (base_price + weight_price) * 0.2
        else:
            surcharge = 0
        
        total_price = base_price + weight_price + surcharge
        
        # Provider adjustments
        if provider == DeliveryProvider.KWIK:
            total_price *= 0.9  # Kwik is 10% cheaper but slower
            estimated_days = dest_zone.estimated_days + 1
        elif provider == DeliveryProvider.SENDBOX:
            total_price *= 1.1  # Sendbox is premium
            estimated_days = max(1, dest_zone.estimated_days - 1)
        else:
            estimated_days = dest_zone.estimated_days
        
        pickup_date = datetime.now() + timedelta(hours=2)
        
        return DeliveryEstimate(
            provider=provider,
            origin=origin_zone.name,
            destination=dest_zone.name,
            weight_kg=weight_kg,
            price_ngn=round(total_price, -2),  # Round to nearest 100
            estimated_days=estimated_days,
            pickup_date=pickup_date
        )
    
    def create_shipment(
        self,
        order_id: str,
        destination: str,
        customer_phone: str,
        customer_name: str,
        delivery_address: str,
        weight_kg: float,
        provider: Optional[DeliveryProvider] = None
    ) -> Optional[Shipment]:
        """
        Create a new shipment.
        
        In production, this would call the actual provider API.
        """
        estimate = self.estimate_delivery(
            self.merchant_location,
            destination,
            weight_kg,
            provider
        )
        
        if not estimate:
            return None
        
        tracking_id = f"OWO-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now()
        
        shipment = Shipment(
            tracking_id=tracking_id,
            order_id=order_id,
            provider=estimate.provider,
            origin=estimate.origin,
            destination=estimate.destination,
            status=DeliveryStatus.PENDING,
            customer_phone=customer_phone,
            customer_name=customer_name,
            pickup_address="Merchant Address (Lagos Mainland)",
            delivery_address=delivery_address,
            weight_kg=weight_kg,
            price_ngn=estimate.price_ngn,
            created_at=now,
            estimated_delivery=now + timedelta(days=estimate.estimated_days),
            tracking_history=[
                {
                    "status": "pending",
                    "message": "Shipment created, awaiting pickup",
                    "timestamp": now.isoformat(),
                    "location": estimate.origin
                }
            ]
        )
        
        _shipments_db[tracking_id] = shipment
        return shipment
    
    def track_shipment(self, tracking_id: str) -> Optional[Shipment]:
        """Get shipment by tracking ID."""
        return _shipments_db.get(tracking_id)
    
    def update_shipment_status(
        self,
        tracking_id: str,
        status: DeliveryStatus,
        location: str,
        message: str
    ) -> Optional[Shipment]:
        """Update shipment status (for webhook callbacks)."""
        shipment = _shipments_db.get(tracking_id)
        if not shipment:
            return None
        
        shipment.status = status
        shipment.tracking_history.append({
            "status": status.value,
            "message": message,
            "timestamp": datetime.now().isoformat(),
            "location": location
        })
        
        return shipment
    
    def get_provider_url(self, provider: DeliveryProvider) -> str:
        """Get provider website for manual tracking."""
        urls = {
            DeliveryProvider.GIG: "https://giglogistics.com/track",
            DeliveryProvider.KWIK: "https://kwik.delivery/track",
            DeliveryProvider.SENDBOX: "https://sendbox.co/track"
        }
        return urls.get(provider, "")
    
    def format_delivery_message(self, shipment: Shipment, style: str = "street") -> str:
        """Format delivery confirmation for WhatsApp."""
        if style == "street":
            return f"""🚚 Your package dey on the way!

📦 Tracking: {shipment.tracking_id}
📍 Going to: {shipment.destination}
💰 Delivery fee: ₦{shipment.price_ngn:,.0f}
⏰ E go reach you within {(shipment.estimated_delivery - datetime.now()).days} days

Track am here: {self.get_provider_url(shipment.provider)}"""
        else:
            return f"""🚚 Your package is on the way!

📦 Tracking Number: {shipment.tracking_id}
📍 Destination: {shipment.destination}
💰 Delivery Fee: ₦{shipment.price_ngn:,.0f}
⏰ Estimated Delivery: {shipment.estimated_delivery.strftime('%B %d, %Y')}

Track your shipment: {self.get_provider_url(shipment.provider)}"""


# Singleton instance
delivery_service = DeliveryService()
