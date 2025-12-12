# owo_flow/chatbot/services/invoice.py
"""
Invoice/Receipt Generator for Nigerian Market
Generates PDF receipts with VAT (7.5%) for WhatsApp sharing.
"""
from typing import List, Dict, Optional
from dataclasses import dataclass, field
from datetime import datetime
import uuid
import os


@dataclass
class InvoiceItem:
    """Single line item on invoice."""
    product_name: str
    quantity: int
    unit_price_ngn: float
    total_ngn: float = field(init=False)
    
    def __post_init__(self):
        self.total_ngn = self.quantity * self.unit_price_ngn


@dataclass
class Invoice:
    """Complete invoice data."""
    invoice_id: str
    order_id: str
    customer_name: str
    customer_phone: str
    customer_address: Optional[str]
    items: List[InvoiceItem]
    subtotal_ngn: float
    vat_ngn: float
    delivery_fee_ngn: float
    total_ngn: float
    created_at: datetime
    paid: bool
    payment_ref: Optional[str]
    merchant_name: str = "OwoFlow Commerce"
    merchant_address: str = "Lagos, Nigeria"
    merchant_phone: str = "+234 800 OWO FLOW"


# Nigerian VAT rate
VAT_RATE = 0.075  # 7.5%

# Mock invoice storage
_invoices_db: Dict[str, Invoice] = {}


class InvoiceService:
    """
    Invoice generator for Nigerian businesses.
    Creates receipts with proper VAT calculation.
    """
    
    def __init__(
        self,
        merchant_name: str = "OwoFlow Commerce",
        merchant_address: str = "Lagos, Nigeria",
        merchant_phone: str = "+234 800 OWO FLOW"
    ):
        self.merchant_name = merchant_name
        self.merchant_address = merchant_address
        self.merchant_phone = merchant_phone
    
    def calculate_totals(
        self,
        items: List[InvoiceItem],
        delivery_fee: float = 0
    ) -> Dict[str, float]:
        """Calculate invoice totals with VAT."""
        subtotal = sum(item.total_ngn for item in items)
        vat = subtotal * VAT_RATE
        total = subtotal + vat + delivery_fee
        
        return {
            "subtotal_ngn": subtotal,
            "vat_ngn": round(vat, 2),
            "vat_rate": VAT_RATE * 100,
            "delivery_fee_ngn": delivery_fee,
            "total_ngn": round(total, 2)
        }
    
    def create_invoice(
        self,
        order_id: str,
        customer_name: str,
        customer_phone: str,
        items: List[Dict],
        delivery_fee: float = 0,
        customer_address: Optional[str] = None,
        payment_ref: Optional[str] = None
    ) -> Invoice:
        """
        Create a new invoice.
        
        Args:
            order_id: Associated order ID
            customer_name: Customer full name
            customer_phone: Nigerian phone number
            items: List of {product_name, quantity, unit_price_ngn}
            delivery_fee: Delivery fee in NGN
            customer_address: Delivery address (optional)
            payment_ref: Payment reference if already paid
        
        Returns:
            Invoice object
        """
        invoice_id = f"INV-{datetime.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Convert items to InvoiceItem objects
        invoice_items = [
            InvoiceItem(
                product_name=item["product_name"],
                quantity=item["quantity"],
                unit_price_ngn=item["unit_price_ngn"]
            )
            for item in items
        ]
        
        totals = self.calculate_totals(invoice_items, delivery_fee)
        
        invoice = Invoice(
            invoice_id=invoice_id,
            order_id=order_id,
            customer_name=customer_name,
            customer_phone=customer_phone,
            customer_address=customer_address,
            items=invoice_items,
            subtotal_ngn=totals["subtotal_ngn"],
            vat_ngn=totals["vat_ngn"],
            delivery_fee_ngn=totals["delivery_fee_ngn"],
            total_ngn=totals["total_ngn"],
            created_at=datetime.now(),
            paid=payment_ref is not None,
            payment_ref=payment_ref,
            merchant_name=self.merchant_name,
            merchant_address=self.merchant_address,
            merchant_phone=self.merchant_phone
        )
        
        _invoices_db[invoice_id] = invoice
        return invoice
    
    def get_invoice(self, invoice_id: str) -> Optional[Invoice]:
        """Get invoice by ID."""
        return _invoices_db.get(invoice_id)
    
    def get_invoices_by_order(self, order_id: str) -> List[Invoice]:
        """Get all invoices for an order."""
        return [inv for inv in _invoices_db.values() if inv.order_id == order_id]
    
    def list_invoices(
        self,
        limit: int = 20,
        paid_only: bool = False
    ) -> List[Invoice]:
        """List recent invoices."""
        invoices = list(_invoices_db.values())
        
        if paid_only:
            invoices = [inv for inv in invoices if inv.paid]
        
        return sorted(
            invoices,
            key=lambda x: x.created_at,
            reverse=True
        )[:limit]
    
    def mark_as_paid(self, invoice_id: str, payment_ref: str) -> Optional[Invoice]:
        """Mark invoice as paid."""
        invoice = _invoices_db.get(invoice_id)
        if invoice:
            invoice.paid = True
            invoice.payment_ref = payment_ref
        return invoice
    
    def generate_text_receipt(self, invoice: Invoice) -> str:
        """Generate text-based receipt for WhatsApp."""
        lines = [
            "=" * 35,
            f"        {invoice.merchant_name}",
            f"        {invoice.merchant_address}",
            "=" * 35,
            "",
            f"Invoice: {invoice.invoice_id}",
            f"Date: {invoice.created_at.strftime('%d %b %Y, %H:%M')}",
            f"Order: {invoice.order_id}",
            "",
            "-" * 35,
            "ITEMS",
            "-" * 35,
        ]
        
        for item in invoice.items:
            lines.append(f"{item.product_name}")
            lines.append(f"  {item.quantity} x ₦{item.unit_price_ngn:,.0f} = ₦{item.total_ngn:,.0f}")
        
        lines.extend([
            "-" * 35,
            f"Subtotal:        ₦{invoice.subtotal_ngn:>12,.0f}",
            f"VAT (7.5%):      ₦{invoice.vat_ngn:>12,.0f}",
        ])
        
        if invoice.delivery_fee_ngn > 0:
            lines.append(f"Delivery:        ₦{invoice.delivery_fee_ngn:>12,.0f}")
        
        lines.extend([
            "-" * 35,
            f"TOTAL:           ₦{invoice.total_ngn:>12,.0f}",
            "=" * 35,
            "",
            f"Customer: {invoice.customer_name}",
            f"Phone: {invoice.customer_phone}",
        ])
        
        if invoice.customer_address:
            lines.append(f"Address: {invoice.customer_address}")
        
        lines.append("")
        
        if invoice.paid:
            lines.extend([
                "✅ PAID",
                f"Ref: {invoice.payment_ref}"
            ])
        else:
            lines.append("⏳ AWAITING PAYMENT")
        
        lines.extend([
            "",
            "Thank you for your patronage!",
            f"Questions? Call {invoice.merchant_phone}",
            "=" * 35,
        ])
        
        return "\n".join(lines)
    
    def generate_html_receipt(self, invoice: Invoice) -> str:
        """Generate HTML receipt (for PDF conversion)."""
        items_html = ""
        for item in invoice.items:
            items_html += f"""
            <tr>
                <td>{item.product_name}</td>
                <td style="text-align: center;">{item.quantity}</td>
                <td style="text-align: right;">₦{item.unit_price_ngn:,.0f}</td>
                <td style="text-align: right;">₦{item.total_ngn:,.0f}</td>
            </tr>
            """
        
        delivery_row = ""
        if invoice.delivery_fee_ngn > 0:
            delivery_row = f"""
            <tr>
                <td colspan="3" style="text-align: right;"><strong>Delivery:</strong></td>
                <td style="text-align: right;">₦{invoice.delivery_fee_ngn:,.0f}</td>
            </tr>
            """
        
        payment_status = "✅ PAID" if invoice.paid else "⏳ AWAITING PAYMENT"
        payment_color = "#28a745" if invoice.paid else "#ffc107"
        
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <style>
                body {{ font-family: Arial, sans-serif; margin: 20px; }}
                .header {{ text-align: center; margin-bottom: 20px; }}
                .header h1 {{ margin: 0; color: #333; }}
                .header p {{ margin: 5px 0; color: #666; }}
                .invoice-info {{ margin-bottom: 20px; }}
                .invoice-info p {{ margin: 5px 0; }}
                table {{ width: 100%; border-collapse: collapse; margin: 20px 0; }}
                th, td {{ padding: 10px; border-bottom: 1px solid #ddd; }}
                th {{ background-color: #f8f9fa; text-align: left; }}
                .totals td {{ font-weight: bold; }}
                .payment-status {{ 
                    text-align: center; 
                    padding: 15px; 
                    background-color: {payment_color}; 
                    color: white;
                    border-radius: 5px;
                    margin: 20px 0;
                }}
                .footer {{ text-align: center; margin-top: 30px; color: #666; }}
            </style>
        </head>
        <body>
            <div class="header">
                <h1>{invoice.merchant_name}</h1>
                <p>{invoice.merchant_address}</p>
                <p>{invoice.merchant_phone}</p>
            </div>
            
            <div class="invoice-info">
                <p><strong>Invoice:</strong> {invoice.invoice_id}</p>
                <p><strong>Date:</strong> {invoice.created_at.strftime('%d %B %Y, %H:%M')}</p>
                <p><strong>Order:</strong> {invoice.order_id}</p>
                <hr>
                <p><strong>Bill To:</strong></p>
                <p>{invoice.customer_name}</p>
                <p>{invoice.customer_phone}</p>
                {f'<p>{invoice.customer_address}</p>' if invoice.customer_address else ''}
            </div>
            
            <table>
                <thead>
                    <tr>
                        <th>Item</th>
                        <th style="text-align: center;">Qty</th>
                        <th style="text-align: right;">Unit Price</th>
                        <th style="text-align: right;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    {items_html}
                    <tr class="totals">
                        <td colspan="3" style="text-align: right;">Subtotal:</td>
                        <td style="text-align: right;">₦{invoice.subtotal_ngn:,.0f}</td>
                    </tr>
                    <tr class="totals">
                        <td colspan="3" style="text-align: right;">VAT (7.5%):</td>
                        <td style="text-align: right;">₦{invoice.vat_ngn:,.0f}</td>
                    </tr>
                    {delivery_row}
                    <tr class="totals" style="font-size: 1.2em;">
                        <td colspan="3" style="text-align: right;">TOTAL:</td>
                        <td style="text-align: right;">₦{invoice.total_ngn:,.0f}</td>
                    </tr>
                </tbody>
            </table>
            
            <div class="payment-status">
                {payment_status}
                {f'<br>Reference: {invoice.payment_ref}' if invoice.paid else ''}
            </div>
            
            <div class="footer">
                <p>Thank you for your patronage!</p>
                <p>For questions, contact us at {invoice.merchant_phone}</p>
            </div>
        </body>
        </html>
        """
    
    def format_invoice_message(self, invoice: Invoice, style: str = "street") -> str:
        """Format invoice notification for WhatsApp."""
        if style == "street":
            return f"""📄 *Your Receipt Don Ready!*

🆔 Invoice: {invoice.invoice_id}
📦 Order: {invoice.order_id}

💰 *Breakdown:*
• Items: ₦{invoice.subtotal_ngn:,.0f}
• VAT (7.5%): ₦{invoice.vat_ngn:,.0f}
{f'• Delivery: ₦{invoice.delivery_fee_ngn:,.0f}' if invoice.delivery_fee_ngn > 0 else ''}
━━━━━━━━━━━━━
*Total: ₦{invoice.total_ngn:,.0f}*

{'✅ Payment don confirm!' if invoice.paid else '⏳ Waiting for your payment o!'}

Thank you for patronizing us! 🙏"""
        else:
            return f"""📄 *Your Invoice*

Invoice Number: {invoice.invoice_id}
Order Reference: {invoice.order_id}

*Summary:*
• Subtotal: ₦{invoice.subtotal_ngn:,.0f}
• VAT (7.5%): ₦{invoice.vat_ngn:,.0f}
{f'• Delivery Fee: ₦{invoice.delivery_fee_ngn:,.0f}' if invoice.delivery_fee_ngn > 0 else ''}
━━━━━━━━━━━━━
*Total Amount: ₦{invoice.total_ngn:,.0f}*

Status: {'✅ Payment Confirmed' if invoice.paid else '⏳ Awaiting Payment'}

Thank you for your business!"""


# Singleton instance
invoice_service = InvoiceService()
