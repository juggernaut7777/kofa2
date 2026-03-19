"""
Customer CRM Router for KOFA.
Manages customer profiles, auto-created from all sales channels.
"""
import json
import logging
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy import or_

logger = logging.getLogger(__name__)
router = APIRouter()


# --- Pydantic models ---

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    tags: Optional[list] = None
    notes: Optional[str] = None


# --- Helper: find or create customer ---

def find_or_create_customer(
    db,
    user_id: str,
    phone: str = None,
    name: str = None,
    channel: str = "walkin",
    whatsapp_id: str = None,
    instagram_id: str = None,
    order_amount: float = 0,
):
    """
    Find an existing customer by phone/whatsapp_id/instagram_id, or create a new one.
    Also updates stats (total_orders, total_spent, last_order_date).
    Returns the Customer object.
    """
    from ..models import Customer
    import uuid

    customer = None

    # Try to find by phone first (primary merge key)
    if phone:
        customer = db.query(Customer).filter(
            Customer.user_id == user_id,
            Customer.phone == phone
        ).first()

    # Try WhatsApp ID
    if not customer and whatsapp_id:
        customer = db.query(Customer).filter(
            Customer.user_id == user_id,
            Customer.whatsapp_id == whatsapp_id
        ).first()

    # Try Instagram ID
    if not customer and instagram_id:
        customer = db.query(Customer).filter(
            Customer.user_id == user_id,
            Customer.instagram_id == instagram_id
        ).first()

    if customer:
        # Update existing customer
        if name and not customer.name:
            customer.name = name
        if phone and not customer.phone:
            customer.phone = phone
        if whatsapp_id and not customer.whatsapp_id:
            customer.whatsapp_id = whatsapp_id
        if instagram_id and not customer.instagram_id:
            customer.instagram_id = instagram_id
        # Update stats
        if order_amount > 0:
            customer.total_orders = (customer.total_orders or 0) + 1
            customer.total_spent = (customer.total_spent or 0) + order_amount
            customer.last_order_date = datetime.utcnow()
        customer.updated_at = datetime.utcnow()
    else:
        # Create new customer
        customer = Customer(
            id=str(uuid.uuid4()),
            user_id=user_id,
            name=name or ("WhatsApp Customer" if channel == "whatsapp" else
                          "Instagram Customer" if channel == "instagram" else
                          "Customer"),
            phone=phone or whatsapp_id,
            whatsapp_id=whatsapp_id,
            instagram_id=instagram_id,
            channel=channel,
            tags="[]",
            total_orders=1 if order_amount > 0 else 0,
            total_spent=order_amount,
            last_order_date=datetime.utcnow() if order_amount > 0 else None,
        )
        db.add(customer)
        logger.info(f"New customer created: {customer.name} via {channel}")

    return customer


# --- API Endpoints ---

@router.get("/list")
async def list_customers(
    user_id: str = None,
    search: str = None,
    channel: str = None,
    tag: str = None,
    sort: str = "recent",  # recent, spent, orders, name
    limit: int = 100,
    offset: int = 0,
):
    """List all customers for a vendor with optional filters."""
    from ..database import SessionLocal
    from ..models import Customer

    db = SessionLocal()
    try:
        query = db.query(Customer)

        if user_id:
            query = query.filter(Customer.user_id == user_id)

        # Search by name or phone
        if search:
            search_pattern = f"%{search}%"
            query = query.filter(
                or_(
                    Customer.name.ilike(search_pattern),
                    Customer.phone.ilike(search_pattern),
                    Customer.email.ilike(search_pattern),
                )
            )

        # Filter by channel
        if channel:
            query = query.filter(Customer.channel == channel)

        # Filter by tag
        if tag:
            query = query.filter(Customer.tags.ilike(f'%"{tag}"%'))

        # Sorting
        if sort == "spent":
            query = query.order_by(Customer.total_spent.desc())
        elif sort == "orders":
            query = query.order_by(Customer.total_orders.desc())
        elif sort == "name":
            query = query.order_by(Customer.name.asc())
        else:  # recent
            query = query.order_by(Customer.created_at.desc())

        total = query.count()
        customers = query.offset(offset).limit(limit).all()

        return {
            "customers": [
                {
                    "id": c.id,
                    "name": c.name,
                    "phone": c.phone,
                    "email": c.email,
                    "channel": c.channel,
                    "whatsapp_id": c.whatsapp_id,
                    "instagram_id": c.instagram_id,
                    "tags": json.loads(c.tags) if c.tags else [],
                    "notes": c.notes,
                    "total_orders": c.total_orders or 0,
                    "total_spent": c.total_spent or 0,
                    "last_order_date": c.last_order_date.isoformat() if c.last_order_date else None,
                    "created_at": c.created_at.isoformat() if c.created_at else None,
                }
                for c in customers
            ],
            "total": total,
            "limit": limit,
            "offset": offset,
        }
    finally:
        db.close()


@router.get("/stats")
async def customer_stats(user_id: str = None):
    """Get CRM stats — total customers, top spenders, channel breakdown."""
    from ..database import SessionLocal
    from ..models import Customer

    db = SessionLocal()
    try:
        query = db.query(Customer)
        if user_id:
            query = query.filter(Customer.user_id == user_id)

        customers = query.all()
        total = len(customers)

        # Channel breakdown
        channels = {}
        for c in customers:
            ch = c.channel or "unknown"
            channels[ch] = channels.get(ch, 0) + 1

        # Top 5 spenders
        sorted_by_spent = sorted(customers, key=lambda c: c.total_spent or 0, reverse=True)[:5]

        return {
            "total_customers": total,
            "channels": channels,
            "total_revenue_from_crm": sum(c.total_spent or 0 for c in customers),
            "top_spenders": [
                {
                    "id": c.id,
                    "name": c.name,
                    "total_spent": c.total_spent or 0,
                    "total_orders": c.total_orders or 0,
                    "channel": c.channel,
                }
                for c in sorted_by_spent
            ],
        }
    finally:
        db.close()


@router.get("/{customer_id}")
async def get_customer(customer_id: str):
    """Get a single customer with their order history."""
    from ..database import SessionLocal
    from ..models import Customer, Order

    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        # Get order history for this customer
        orders = []
        if customer.phone:
            order_records = db.query(Order).filter(
                Order.user_id == customer.user_id,
                Order.customer_phone == customer.phone,
            ).order_by(Order.created_at.desc()).limit(50).all()

            orders = [
                {
                    "id": o.id,
                    "total_amount": o.total_amount,
                    "status": o.status,
                    "channel": o.channel,
                    "payment_method": getattr(o, 'payment_method', None),
                    "created_at": o.created_at.isoformat() if o.created_at else None,
                }
                for o in order_records
            ]

        return {
            "id": customer.id,
            "name": customer.name,
            "phone": customer.phone,
            "email": customer.email,
            "channel": customer.channel,
            "whatsapp_id": customer.whatsapp_id,
            "instagram_id": customer.instagram_id,
            "tags": json.loads(customer.tags) if customer.tags else [],
            "notes": customer.notes,
            "total_orders": customer.total_orders or 0,
            "total_spent": customer.total_spent or 0,
            "last_order_date": customer.last_order_date.isoformat() if customer.last_order_date else None,
            "created_at": customer.created_at.isoformat() if customer.created_at else None,
            "orders": orders,
        }
    finally:
        db.close()


@router.put("/{customer_id}")
async def update_customer(customer_id: str, update: CustomerUpdate):
    """Update customer info — name, tags, notes."""
    from ..database import SessionLocal
    from ..models import Customer

    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        if update.name is not None:
            customer.name = update.name
        if update.phone is not None:
            customer.phone = update.phone
        if update.email is not None:
            customer.email = update.email
        if update.tags is not None:
            customer.tags = json.dumps(update.tags)
        if update.notes is not None:
            customer.notes = update.notes

        customer.updated_at = datetime.utcnow()
        db.commit()

        return {"status": "success", "message": "Customer updated"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.delete("/{customer_id}")
async def delete_customer(customer_id: str):
    """Delete a customer record."""
    from ..database import SessionLocal
    from ..models import Customer

    db = SessionLocal()
    try:
        customer = db.query(Customer).filter(Customer.id == customer_id).first()
        if not customer:
            raise HTTPException(status_code=404, detail="Customer not found")

        db.delete(customer)
        db.commit()

        return {"status": "success", "message": "Customer deleted"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
