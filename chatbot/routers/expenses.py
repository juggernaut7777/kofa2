# kofa/chatbot/routers/expenses.py
"""
Expenses router - tracks vendor business expenses in database.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

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
