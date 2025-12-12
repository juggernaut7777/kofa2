# owo_flow/chatbot/routers/delivery.py
"""
Delivery API Router
Endpoints for shipping quotes and tracking.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from ..services.delivery import (
    delivery_service, DeliveryProvider, DeliveryStatus
)

router = APIRouter()


# --- Request/Response Models ---

class DeliveryEstimateRequest(BaseModel):
    origin: str
    destination: str
    weight_kg: float
    provider: Optional[str] = None


class DeliveryEstimateResponse(BaseModel):
    provider: str
    origin: str
    destination: str
    weight_kg: float
    price_ngn: float
    estimated_days: int
    pickup_date: str


class CreateShipmentRequest(BaseModel):
    order_id: str
    destination: str
    customer_phone: str
    customer_name: str
    delivery_address: str
    weight_kg: float
    provider: Optional[str] = None


class ShipmentResponse(BaseModel):
    tracking_id: str
    order_id: str
    provider: str
    origin: str
    destination: str
    status: str
    price_ngn: float
    estimated_delivery: str
    tracking_history: List[dict]


# --- Endpoints ---

@router.get("/zones")
async def get_delivery_zones():
    """
    Get all available delivery zones with pricing.
    Used to populate location dropdowns and show delivery options.
    """
    return {
        "zones": delivery_service.get_zones(),
        "providers": [p.value for p in DeliveryProvider]
    }


@router.post("/estimate", response_model=DeliveryEstimateResponse)
async def get_delivery_estimate(request: DeliveryEstimateRequest):
    """
    Calculate delivery price estimate.
    
    Example:
    ```json
    {
        "origin": "Lagos",
        "destination": "Abuja",
        "weight_kg": 2.5
    }
    ```
    """
    provider = None
    if request.provider:
        try:
            provider = DeliveryProvider(request.provider)
        except ValueError:
            raise HTTPException(400, f"Invalid provider: {request.provider}")
    
    estimate = delivery_service.estimate_delivery(
        request.origin,
        request.destination,
        request.weight_kg,
        provider
    )
    
    if not estimate:
        raise HTTPException(404, "Could not find delivery zone. Check origin/destination.")
    
    return DeliveryEstimateResponse(
        provider=estimate.provider.value,
        origin=estimate.origin,
        destination=estimate.destination,
        weight_kg=estimate.weight_kg,
        price_ngn=estimate.price_ngn,
        estimated_days=estimate.estimated_days,
        pickup_date=estimate.pickup_date.isoformat()
    )


@router.post("/create", response_model=ShipmentResponse)
async def create_shipment(request: CreateShipmentRequest):
    """
    Create a new delivery shipment.
    Returns tracking ID and shipment details.
    """
    provider = None
    if request.provider:
        try:
            provider = DeliveryProvider(request.provider)
        except ValueError:
            raise HTTPException(400, f"Invalid provider: {request.provider}")
    
    shipment = delivery_service.create_shipment(
        order_id=request.order_id,
        destination=request.destination,
        customer_phone=request.customer_phone,
        customer_name=request.customer_name,
        delivery_address=request.delivery_address,
        weight_kg=request.weight_kg,
        provider=provider
    )
    
    if not shipment:
        raise HTTPException(400, "Could not create shipment. Check destination zone.")
    
    return ShipmentResponse(
        tracking_id=shipment.tracking_id,
        order_id=shipment.order_id,
        provider=shipment.provider.value,
        origin=shipment.origin,
        destination=shipment.destination,
        status=shipment.status.value,
        price_ngn=shipment.price_ngn,
        estimated_delivery=shipment.estimated_delivery.isoformat(),
        tracking_history=shipment.tracking_history
    )


@router.get("/track/{tracking_id}", response_model=ShipmentResponse)
async def track_shipment(tracking_id: str):
    """
    Get shipment status and tracking history.
    """
    shipment = delivery_service.track_shipment(tracking_id)
    
    if not shipment:
        raise HTTPException(404, f"Shipment {tracking_id} not found")
    
    return ShipmentResponse(
        tracking_id=shipment.tracking_id,
        order_id=shipment.order_id,
        provider=shipment.provider.value,
        origin=shipment.origin,
        destination=shipment.destination,
        status=shipment.status.value,
        price_ngn=shipment.price_ngn,
        estimated_delivery=shipment.estimated_delivery.isoformat(),
        tracking_history=shipment.tracking_history
    )


@router.post("/track/{tracking_id}/update")
async def update_shipment_status(
    tracking_id: str,
    status: str,
    location: str,
    message: str
):
    """
    Update shipment status (webhook callback from delivery provider).
    """
    try:
        delivery_status = DeliveryStatus(status)
    except ValueError:
        raise HTTPException(400, f"Invalid status: {status}")
    
    shipment = delivery_service.update_shipment_status(
        tracking_id, delivery_status, location, message
    )
    
    if not shipment:
        raise HTTPException(404, f"Shipment {tracking_id} not found")
    
    return {"status": "updated", "tracking_id": tracking_id}
