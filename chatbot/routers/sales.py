# KOFA Sales Router - Walk-in Sale Recording
"""
Handles recording of walk-in/physical sales that don't go through the chatbot.
Reduces inventory, records revenue, and tracks payment method.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)

router = APIRouter()


class RecordSaleRequest(BaseModel):
    """Request to record a walk-in sale."""
    user_id: str
    product_id: str
    product_name: Optional[str] = None
    quantity: int = 1
    unit_price: float
    total_amount: float
    payment_method: str = "cash"  # cash, transfer, pos, credit
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


@router.post("/record")
async def record_sale(request: RecordSaleRequest):
    """
    Record a walk-in sale.
    - Reduces product stock
    - Creates an order record
    - Tracks payment method
    """
    from ..database import SessionLocal
    from ..models import Product as ProductModel, Order
    
    db = SessionLocal()
    try:
        # Find the product
        product = db.query(ProductModel).filter(ProductModel.id == request.product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Check stock
        if product.stock < request.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock. Only {product.stock} available.")
        
        # Reduce stock
        product.stock -= request.quantity
        
        # Create order record
        order_id = str(uuid.uuid4())
        new_order = Order(
            id=order_id,
            user_id=request.user_id,
            customer_name=request.customer_name or "Walk-in Customer",
            customer_phone=request.customer_phone or "",
            total_amount=request.total_amount,
            status="paid" if request.payment_method != "credit" else "pending",
            payment_method=request.payment_method,
            sales_channel="walkin",
            created_at=datetime.now()
        )
        
        db.add(new_order)
        
        # === CRM: Auto-create or update customer ===
        try:
            from .customers import find_or_create_customer
            customer = find_or_create_customer(
                db,
                user_id=request.user_id,
                phone=request.customer_phone,
                name=request.customer_name,
                channel="walkin",
                order_amount=request.total_amount,
            )
            new_order.customer_id = customer.id
        except Exception as crm_err:
            logger.warning(f"CRM auto-create failed: {crm_err}")
        
        db.commit()
        
        return {
            "success": True,
            "message": "Sale recorded successfully",
            "order_id": order_id,
            "product_name": product.name,
            "quantity": request.quantity,
            "total_amount": request.total_amount,
            "payment_method": request.payment_method,
            "new_stock": product.stock,
            "is_credit": request.payment_method == "credit"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to record sale: {str(e)}")
    finally:
        db.close()


@router.get("/credit")
async def get_credit_sales(user_id: str = None):
    """
    Get all credit sales (customers who owe money).
    """
    from ..database import SessionLocal
    from ..models import Order
    
    db = SessionLocal()
    try:
        query = db.query(Order).filter(
            Order.payment_method == "credit",
            Order.status == "pending"
        )
        
        if user_id:
            query = query.filter(Order.user_id == user_id)
        
        orders = query.order_by(Order.created_at.desc()).all()
        
        total_owing = sum(o.total_amount for o in orders)
        
        return {
            "credit_sales": [
                {
                    "id": o.id,
                    "customer_name": o.customer_name,
                    "customer_phone": o.customer_phone,
                    "amount": o.total_amount,
                    "date": o.created_at.isoformat() if o.created_at else None
                }
                for o in orders
            ],
            "total_owing": total_owing,
            "count": len(orders)
        }
    finally:
        db.close()


@router.post("/mark-paid/{order_id}")
async def mark_credit_paid(order_id: str):
    """
    Mark a credit sale as paid.
    """
    from ..database import SessionLocal
    from ..models import Order
    
    db = SessionLocal()
    try:
        order = db.query(Order).filter(Order.id == order_id).first()
        if not order:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order.status = "paid"
        order.payment_method = "credit_paid"
        db.commit()
        
        return {
            "success": True,
            "message": "Payment recorded",
            "order_id": order_id
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()
