# owo_flow/chatbot/routers/expenses.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid

router = APIRouter()

# --- 1. THE DATA MODEL ---
class Expense(BaseModel):
    id: Optional[str] = None
    amount: float
    description: str          # e.g., "Fuel for Generator"
    category: str             # e.g., "Operations", "Salary", "Personal"
    expense_type: str         # "BUSINESS" or "PERSONAL" (The Hybrid Switch)
    date: datetime = datetime.now()
    receipt_image_url: Optional[str] = None

class ExpenseResponse(BaseModel):
    id: str
    amount: float
    description: str
    category: str
    expense_type: str
    date: datetime
    receipt_image_url: Optional[str] = None

# --- 2. MOCK DATABASE (Replace with Supabase later) ---
fake_expense_db: List[ExpenseResponse] = []

# --- 3. THE API ENDPOINTS ---
@router.post("/log", response_model=ExpenseResponse)
async def log_expense(expense: Expense):
    """
    Logs a new expense. 
    Use the 'expense_type' field to tag as BUSINESS or PERSONAL.
    """
    # Generate ID if not provided
    expense_id = expense.id or str(uuid.uuid4())
    
    saved_expense = ExpenseResponse(
        id=expense_id,
        amount=expense.amount,
        description=expense.description,
        category=expense.category,
        expense_type=expense.expense_type,
        date=expense.date,
        receipt_image_url=expense.receipt_image_url
    )
    
    fake_expense_db.append(saved_expense)
    return saved_expense

@router.get("/summary")
async def get_expense_summary():
    """
    Returns the split between Business and Personal spending.
    """
    biz_total = sum(e.amount for e in fake_expense_db if e.expense_type == "BUSINESS")
    personal_total = sum(e.amount for e in fake_expense_db if e.expense_type == "PERSONAL")
    
    return {
        "business_burn": biz_total,
        "personal_spend": personal_total,
        "total_outflow": biz_total + personal_total,
        "expense_count": len(fake_expense_db)
    }

@router.get("/list", response_model=List[ExpenseResponse])
async def list_expenses(expense_type: Optional[str] = None):
    """
    List all expenses, optionally filtered by type (BUSINESS or PERSONAL).
    """
    if expense_type:
        return [e for e in fake_expense_db if e.expense_type.upper() == expense_type.upper()]
    return fake_expense_db
