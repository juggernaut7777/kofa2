"""
CSV/Excel Export Router for KOFA.
Provides download endpoints for products, orders, and expenses data.
"""
import csv
import io
from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends, Query, Request, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

router = APIRouter()


def _get_db():
    """Get database session."""
    from ..database import SessionLocal
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def _get_current_user(request: Request):
    """Extract user_id from auth token."""
    from ..services.auth_security import auth_security
    auth_header = request.headers.get("authorization", "")
    if not auth_header.startswith("Bearer "):
        return None
    payload = auth_security.verify_access_token(auth_header[7:])
    return payload.get("sub") if payload else None


def _make_csv_response(rows: list, headers: list, filename: str) -> StreamingResponse:
    """Create a streaming CSV download response."""
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(headers)
    writer.writerows(rows)
    output.seek(0)
    
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/products")
async def export_products(
    request: Request,
    db: Session = Depends(_get_db)
):
    """Export all products as CSV."""
    from ..models import Product
    
    user_id = _get_current_user(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    products = db.query(Product).filter(Product.user_id == user_id).all()
    
    headers = ["Name", "Category", "Price (NGN)", "Cost Price", "Stock Level", "SKU", "Status", "Created"]
    rows = []
    for p in products:
        rows.append([
            p.name,
            p.category or "",
            p.price,
            getattr(p, 'cost_price', "") or "",
            p.stock_level,
            getattr(p, 'sku', "") or "",
            "Active" if getattr(p, 'is_active', True) else "Inactive",
            p.created_at.strftime("%Y-%m-%d") if p.created_at else "",
        ])
    
    timestamp = datetime.now().strftime("%Y%m%d")
    return _make_csv_response(rows, headers, f"kofa_products_{timestamp}.csv")


@router.get("/orders")
async def export_orders(
    request: Request,
    db: Session = Depends(_get_db),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """Export orders as CSV, optionally filtered by date range."""
    from ..models import Order
    
    user_id = _get_current_user(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    query = db.query(Order).filter(Order.user_id == user_id)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Order.created_at >= start)
        except ValueError:
            pass
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d")
            query = query.filter(Order.created_at <= end)
        except ValueError:
            pass
    
    orders = query.order_by(Order.created_at.desc()).all()
    
    headers = ["Order ID", "Customer", "Total (NGN)", "Status", "Payment Method", "Items", "Date"]
    rows = []
    for o in orders:
        rows.append([
            o.id,
            getattr(o, 'customer_name', "") or "",
            o.total_amount,
            o.status,
            getattr(o, 'payment_method', "") or "",
            getattr(o, 'items_count', "") or "",
            o.created_at.strftime("%Y-%m-%d %H:%M") if o.created_at else "",
        ])
    
    timestamp = datetime.now().strftime("%Y%m%d")
    return _make_csv_response(rows, headers, f"kofa_orders_{timestamp}.csv")


@router.get("/expenses")
async def export_expenses(
    request: Request,
    db: Session = Depends(_get_db),
    start_date: Optional[str] = Query(None, description="Start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="End date YYYY-MM-DD"),
):
    """Export expenses as CSV, optionally filtered by date range."""
    from ..models import Expense
    
    user_id = _get_current_user(request)
    if not user_id:
        raise HTTPException(status_code=401, detail="Authentication required")
    
    query = db.query(Expense).filter(Expense.user_id == user_id)
    
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d")
            query = query.filter(Expense.created_at >= start)
        except ValueError:
            pass
    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d")
            query = query.filter(Expense.created_at <= end)
        except ValueError:
            pass
    
    expenses = query.order_by(Expense.created_at.desc()).all()
    
    headers = ["Description", "Category", "Amount (NGN)", "Date", "Note"]
    rows = []
    for e in expenses:
        rows.append([
            e.description or "",
            getattr(e, 'category', "") or "",
            e.amount,
            e.created_at.strftime("%Y-%m-%d") if e.created_at else "",
            getattr(e, 'note', "") or "",
        ])
    
    timestamp = datetime.now().strftime("%Y%m%d")
    return _make_csv_response(rows, headers, f"kofa_expenses_{timestamp}.csv")
