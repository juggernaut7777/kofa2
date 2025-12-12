# owo_flow/chatbot/routers/invoice.py
"""
Invoice API Router
Generate and manage receipts.
"""
from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import Optional, List

from ..services.invoice import invoice_service

router = APIRouter()


class InvoiceItemRequest(BaseModel):
    product_name: str
    quantity: int
    unit_price_ngn: float


class CreateInvoiceRequest(BaseModel):
    order_id: str
    customer_name: str
    customer_phone: str
    items: List[InvoiceItemRequest]
    delivery_fee: float = 0
    customer_address: Optional[str] = None
    payment_ref: Optional[str] = None


class InvoiceResponse(BaseModel):
    invoice_id: str
    order_id: str
    customer_name: str
    subtotal_ngn: float
    vat_ngn: float
    delivery_fee_ngn: float
    total_ngn: float
    paid: bool
    created_at: str


@router.post("/generate", response_model=InvoiceResponse)
async def generate_invoice(request: CreateInvoiceRequest):
    """
    Generate a new invoice/receipt.
    """
    items = [
        {
            "product_name": item.product_name,
            "quantity": item.quantity,
            "unit_price_ngn": item.unit_price_ngn
        }
        for item in request.items
    ]
    
    invoice = invoice_service.create_invoice(
        order_id=request.order_id,
        customer_name=request.customer_name,
        customer_phone=request.customer_phone,
        items=items,
        delivery_fee=request.delivery_fee,
        customer_address=request.customer_address,
        payment_ref=request.payment_ref
    )
    
    return InvoiceResponse(
        invoice_id=invoice.invoice_id,
        order_id=invoice.order_id,
        customer_name=invoice.customer_name,
        subtotal_ngn=invoice.subtotal_ngn,
        vat_ngn=invoice.vat_ngn,
        delivery_fee_ngn=invoice.delivery_fee_ngn,
        total_ngn=invoice.total_ngn,
        paid=invoice.paid,
        created_at=invoice.created_at.isoformat()
    )


@router.get("/{invoice_id}")
async def get_invoice(invoice_id: str, format: str = "json"):
    """
    Get invoice by ID.
    
    Query params:
    - format: json, text, html (default: json)
    """
    invoice = invoice_service.get_invoice(invoice_id)
    
    if not invoice:
        raise HTTPException(404, f"Invoice {invoice_id} not found")
    
    if format == "text":
        return {"invoice": invoice_service.generate_text_receipt(invoice)}
    elif format == "html":
        html = invoice_service.generate_html_receipt(invoice)
        return HTMLResponse(content=html)
    else:
        return {
            "invoice_id": invoice.invoice_id,
            "order_id": invoice.order_id,
            "customer": {
                "name": invoice.customer_name,
                "phone": invoice.customer_phone,
                "address": invoice.customer_address
            },
            "merchant": {
                "name": invoice.merchant_name,
                "address": invoice.merchant_address,
                "phone": invoice.merchant_phone
            },
            "items": [
                {
                    "product_name": item.product_name,
                    "quantity": item.quantity,
                    "unit_price_ngn": item.unit_price_ngn,
                    "total_ngn": item.total_ngn
                }
                for item in invoice.items
            ],
            "subtotal_ngn": invoice.subtotal_ngn,
            "vat_ngn": invoice.vat_ngn,
            "vat_rate_percent": 7.5,
            "delivery_fee_ngn": invoice.delivery_fee_ngn,
            "total_ngn": invoice.total_ngn,
            "paid": invoice.paid,
            "payment_ref": invoice.payment_ref,
            "created_at": invoice.created_at.isoformat()
        }


@router.get("/{invoice_id}/whatsapp")
async def get_invoice_whatsapp(invoice_id: str, style: str = "street"):
    """
    Get invoice formatted for WhatsApp.
    """
    invoice = invoice_service.get_invoice(invoice_id)
    
    if not invoice:
        raise HTTPException(404, f"Invoice {invoice_id} not found")
    
    message = invoice_service.format_invoice_message(invoice, style)
    
    return {
        "invoice_id": invoice_id,
        "whatsapp_message": message,
        "style": style
    }


@router.post("/{invoice_id}/mark-paid")
async def mark_invoice_paid(invoice_id: str, payment_ref: str):
    """
    Mark invoice as paid.
    """
    invoice = invoice_service.mark_as_paid(invoice_id, payment_ref)
    
    if not invoice:
        raise HTTPException(404, f"Invoice {invoice_id} not found")
    
    return {
        "invoice_id": invoice_id,
        "paid": True,
        "payment_ref": payment_ref
    }


@router.get("/")
async def list_invoices(limit: int = 20, paid_only: bool = False):
    """
    List recent invoices.
    """
    invoices = invoice_service.list_invoices(limit, paid_only)
    
    return [
        {
            "invoice_id": inv.invoice_id,
            "order_id": inv.order_id,
            "customer_name": inv.customer_name,
            "total_ngn": inv.total_ngn,
            "paid": inv.paid,
            "created_at": inv.created_at.isoformat()
        }
        for inv in invoices
    ]
