"""
Receipt Generator Service for KOFA
Auto-generates PDF receipts after payment confirmation.
Uses HTML-to-PDF approach for maximum compatibility.
"""
import io
import logging
from typing import Dict, Optional
from datetime import datetime

logger = logging.getLogger(__name__)


def generate_receipt_html(order_data: Dict, vendor_data: Dict = None) -> str:
    """
    Generate a professional HTML receipt for an order.
    
    Args:
        order_data: Order dict with items, totals, etc.
        vendor_data: Vendor info (business name, phone, address)
    
    Returns:
        HTML string of the receipt
    """
    vendor_name = (vendor_data or {}).get("business_name", "KOFA Store")
    vendor_phone = (vendor_data or {}).get("phone", "")
    vendor_address = (vendor_data or {}).get("business_address", "")
    
    order_id = str(order_data.get("id", ""))[:8]
    customer_phone = order_data.get("customer_phone", "N/A")
    total = float(order_data.get("total_amount", 0))
    status = order_data.get("status", "pending")
    created_at = order_data.get("created_at", datetime.utcnow().isoformat())
    items = order_data.get("items", [])
    currency = order_data.get("currency", "NGN")
    
    # Build items rows
    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding: 8px; border-bottom: 1px solid #eee;">{item.get('product_name', 'Product')}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">{item.get('quantity', 1)}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦{float(item.get('price', 0)):,.0f}</td>
            <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₦{float(item.get('total', 0)):,.0f}</td>
        </tr>
        """
    
    # VAT calculation (7.5% Nigeria)
    vat = total * 0.075
    subtotal = total - vat
    
    html = f"""<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body {{ font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }}
        .receipt {{ max-width: 400px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }}
        .header {{ text-align: center; border-bottom: 2px solid #1DB954; padding-bottom: 15px; margin-bottom: 20px; }}
        .header h1 {{ color: #1DB954; margin: 0; font-size: 24px; }}
        .header p {{ color: #666; margin: 5px 0 0 0; font-size: 12px; }}
        .meta {{ display: flex; justify-content: space-between; font-size: 13px; color: #666; margin-bottom: 20px; }}
        table {{ width: 100%; border-collapse: collapse; font-size: 14px; }}
        th {{ text-align: left; padding: 8px; background: #f8f8f8; border-bottom: 2px solid #ddd; }}
        .totals {{ margin-top: 15px; border-top: 2px solid #1DB954; padding-top: 10px; }}
        .totals .row {{ display: flex; justify-content: space-between; padding: 4px 0; font-size: 14px; }}
        .totals .total {{ font-size: 18px; font-weight: bold; color: #1DB954; }}
        .footer {{ text-align: center; margin-top: 20px; font-size: 11px; color: #999; }}
        .status {{ display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 12px; font-weight: bold;
            background: {{'#e8f5e9' if status == 'paid' else '#fff3e0' if status == 'pending' else '#e3f2fd'}};
            color: {{'#2e7d32' if status == 'paid' else '#ef6c00' if status == 'pending' else '#1565c0'}}; }}
    </style>
</head>
<body>
    <div class="receipt">
        <div class="header">
            <h1>{vendor_name}</h1>
            <p>{vendor_address}</p>
            <p>{vendor_phone}</p>
        </div>
        
        <div class="meta">
            <div>
                <strong>Receipt #</strong> {order_id}<br>
                <strong>Date:</strong> {created_at[:10]}
            </div>
            <div style="text-align: right;">
                <strong>Customer:</strong> {customer_phone}<br>
                <span class="status">{status.upper()}</span>
            </div>
        </div>
        
        <table>
            <tr>
                <th>Item</th>
                <th style="text-align: center;">Qty</th>
                <th style="text-align: right;">Price</th>
                <th style="text-align: right;">Total</th>
            </tr>
            {items_html}
        </table>
        
        <div class="totals">
            <div class="row"><span>Subtotal:</span> <span>₦{subtotal:,.0f}</span></div>
            <div class="row"><span>VAT (7.5%):</span> <span>₦{vat:,.0f}</span></div>
            <div class="row total"><span>Total:</span> <span>₦{total:,.0f}</span></div>
        </div>
        
        <div class="footer">
            <p>Thank you for your purchase!</p>
            <p>Powered by KOFA Commerce Engine</p>
        </div>
    </div>
</body>
</html>"""
    
    return html


def format_receipt_text(order_data: Dict, vendor_data: Dict = None) -> str:
    """
    Generate a plain-text receipt for WhatsApp sending.
    
    Returns:
        Formatted text receipt
    """
    vendor_name = (vendor_data or {}).get("business_name", "KOFA Store")
    order_id = str(order_data.get("id", ""))[:8]
    total = float(order_data.get("total_amount", 0))
    items = order_data.get("items", [])
    created_at = order_data.get("created_at", datetime.utcnow().strftime("%Y-%m-%d"))
    
    receipt = f"""🧾 *RECEIPT — {vendor_name}*

📅 Date: {str(created_at)[:10]}
🔗 Receipt #: {order_id}

━━━━━━━━━━━━━━━━━━━━
"""
    
    for item in items:
        name = item.get("product_name", "Product")
        qty = item.get("quantity", 1)
        price = float(item.get("total", 0))
        receipt += f"  {name} x{qty}  →  ₦{price:,.0f}\n"
    
    vat = total * 0.075
    subtotal = total - vat
    
    receipt += f"""━━━━━━━━━━━━━━━━━━━━
  Subtotal: ₦{subtotal:,.0f}
  VAT (7.5%): ₦{vat:,.0f}
  *TOTAL: ₦{total:,.0f}*

✅ Thank you for your purchase!
— Powered by KOFA"""
    
    return receipt
