# kofa/chatbot/routers/expenses.py
"""
Expenses router - tracks vendor business expenses in database.
Also handles receipt scanning (OCR) and payment confirmation.
"""
from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid
import logging

logger = logging.getLogger(__name__)
router = APIRouter()


# --- Pydantic request/response models ---
class ExpenseCreate(BaseModel):
    amount: float
    description: str
    category: str = "misc"
    expense_type: str = "BUSINESS"
    date: Optional[str] = None
    user_id: Optional[str] = None  # Required for DB storage


class ExpenseResponse(BaseModel):
    id: str
    amount: float
    description: str
    category: str
    expense_type: str
    date: str
    user_id: Optional[str] = None


# --- API Endpoints ---
@router.post("/log")
async def log_expense(expense: ExpenseCreate):
    """
    Logs a new business expense to the database.
    """
    from ..database import SessionLocal
    from ..models import Expense as ExpenseModel
    
    db = SessionLocal()
    try:
        expense_id = str(uuid.uuid4())
        
        new_expense = ExpenseModel(
            id=expense_id,
            user_id=expense.user_id or "demo-user",  # Default for backward compatibility
            amount=expense.amount,
            description=expense.description,
            category=expense.category,
            expense_type=expense.expense_type or "BUSINESS",
            date=datetime.fromisoformat(expense.date.replace('Z', '+00:00')) if expense.date else datetime.utcnow()
        )
        
        db.add(new_expense)
        db.commit()
        
        return {
            "id": expense_id,
            "amount": expense.amount,
            "description": expense.description,
            "category": expense.category,
            "expense_type": expense.expense_type,
            "date": new_expense.date.isoformat(),
            "message": "Expense logged successfully"
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.get("/summary")
async def get_expense_summary(user_id: str = None):
    """
    Returns total expense summary for a user.
    """
    from ..database import SessionLocal
    from ..models import Expense as ExpenseModel
    from sqlalchemy import func
    
    db = SessionLocal()
    try:
        query = db.query(
            func.sum(ExpenseModel.amount).label('total'),
            func.count(ExpenseModel.id).label('count')
        )
        
        if user_id:
            query = query.filter(ExpenseModel.user_id == user_id)
        
        result = query.first()
        
        return {
            "total": result.total or 0,
            "business_burn": result.total or 0,
            "expense_count": result.count or 0,
            "total_outflow": result.total or 0
        }
    finally:
        db.close()


@router.get("/list")
async def list_expenses(user_id: str = None, expense_type: Optional[str] = None):
    """
    List all expenses for a user, optionally filtered by type.
    """
    from ..database import SessionLocal
    from ..models import Expense as ExpenseModel
    
    db = SessionLocal()
    try:
        query = db.query(ExpenseModel)
        
        if user_id:
            query = query.filter(ExpenseModel.user_id == user_id)
        
        if expense_type:
            query = query.filter(ExpenseModel.expense_type == expense_type.upper())
        
        expenses = query.order_by(ExpenseModel.date.desc()).all()
        
        return [
            {
                "id": e.id,
                "amount": e.amount,
                "description": e.description,
                "category": e.category,
                "expense_type": e.expense_type,
                "date": e.date.isoformat() if e.date else None,
                "user_id": e.user_id
            }
            for e in expenses
        ]
    finally:
        db.close()


@router.delete("/{expense_id}")
async def delete_expense(expense_id: str):
    """
    Delete an expense by ID.
    """
    from ..database import SessionLocal
    from ..models import Expense as ExpenseModel
    
    db = SessionLocal()
    try:
        expense = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
        if not expense:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        db.delete(expense)
        db.commit()
        
        return {"success": True, "message": "Expense deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


@router.put("/{expense_id}")
async def update_expense(expense_id: str, expense: ExpenseCreate):
    """
    Update an existing expense.
    """
    from ..database import SessionLocal
    from ..models import Expense as ExpenseModel
    
    db = SessionLocal()
    try:
        existing = db.query(ExpenseModel).filter(ExpenseModel.id == expense_id).first()
        if not existing:
            raise HTTPException(status_code=404, detail="Expense not found")
        
        existing.amount = expense.amount
        existing.description = expense.description
        existing.category = expense.category
        existing.expense_type = expense.expense_type or "BUSINESS"
        if expense.date:
            existing.date = datetime.fromisoformat(expense.date.replace('Z', '+00:00'))
        
        db.commit()
        
        return {
            "id": expense_id,
            "amount": existing.amount,
            "description": existing.description,
            "category": existing.category,
            "expense_type": existing.expense_type,
            "date": existing.date.isoformat() if existing.date else None,
            "message": "Expense updated successfully"
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()


# ============== RECEIPT SCANNER (OCR) ==============

@router.post("/scan-receipt")
async def scan_receipt_endpoint(image: UploadFile = File(...), user_id: str = Form(None)):
    """
    Scan a receipt photo and extract expense data using Gemini Vision AI.
    Returns extracted fields for vendor to confirm before saving.
    """
    from ..services.receipt_scanner import scan_receipt
    
    # Validate file type
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/heic"]
    content_type = image.content_type or "image/jpeg"
    if content_type not in allowed_types:
        raise HTTPException(status_code=400, detail=f"Unsupported image type: {content_type}. Use JPEG, PNG, or WebP.")
    
    # Read image (limit to 10MB)
    image_bytes = await image.read()
    if len(image_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image too large. Maximum 10MB.")
    
    # Scan with Gemini Vision
    result = await scan_receipt(image_bytes, content_type)
    
    if not result:
        raise HTTPException(status_code=422, detail="Could not extract data from this image. Try a clearer photo.")
    
    return {
        "status": "success",
        "extracted": result,
        "message": "Receipt scanned successfully. Please confirm the details."
    }


# ============== PAYMENT CONFIRMATION ==============

class PaymentConfirmation(BaseModel):
    """Confirm a payment received for an order."""
    order_id: str
    amount: float
    method: str = "transfer"  # cash, transfer, paystack
    reference: Optional[str] = None  # bank reference or Paystack ref
    user_id: Optional[str] = None


@router.post("/confirm-payment")
async def confirm_payment(payment: PaymentConfirmation):
    """
    Confirm a payment received for an order.
    Marks the order as paid and logs the payment.
    """
    from ..database import SessionLocal
    
    db = SessionLocal()
    try:
        # Find the order
        from sqlalchemy import text
        result = db.execute(
            text("SELECT id, total_amount, status FROM orders WHERE id = :oid"),
            {"oid": payment.order_id}
        ).fetchone()
        
        if not result:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order_id, order_total, order_status = result
        
        if order_status == "paid":
            return {"status": "already_paid", "message": "This order is already marked as paid."}
        
        # Check if amount matches (allow ±5% tolerance)
        if order_total and payment.amount < (order_total * 0.95):
            return {
                "status": "partial",
                "message": f"Payment of ₦{payment.amount:,.0f} is less than order total ₦{order_total:,.0f}. Partial payment recorded.",
                "order_total": order_total,
                "amount_received": payment.amount,
                "difference": order_total - payment.amount
            }
        
        # Mark order as paid
        db.execute(
            text("UPDATE orders SET status = 'paid', payment_method = :method WHERE id = :oid"),
            {"method": payment.method, "oid": payment.order_id}
        )
        db.commit()
        
        logger.info(f"💰 Payment confirmed: ₦{payment.amount:,.0f} for order {payment.order_id} via {payment.method}")
        
        return {
            "status": "success",
            "message": f"Payment of ₦{payment.amount:,.0f} confirmed for order {payment.order_id}",
            "order_id": payment.order_id,
            "amount": payment.amount,
            "method": payment.method
        }
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        logger.error(f"Payment confirmation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        db.close()

