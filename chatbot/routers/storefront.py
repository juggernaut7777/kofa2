# KOFA Public Storefront Router
# Serves public shop pages for vendors - both JSON API and HTML storefront

from fastapi import APIRouter, HTTPException
from fastapi.responses import HTMLResponse
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import func
import urllib.parse
import html as html_module

router = APIRouter()


class ProductItem(BaseModel):
    """Product for public storefront."""
    id: str
    name: str
    price: float
    stock: int
    image_url: Optional[str] = None
    category: Optional[str] = None


class ShopResponse(BaseModel):
    """Public shop data."""
    vendor_id: str
    business_name: str
    display_name: str  # first_name or business_name
    phone: str
    avatar_url: Optional[str] = None
    products: List[ProductItem]


def _get_shop_data(shop_name: str) -> dict:
    """
    Fetch vendor + products from database.
    Shared between JSON API and HTML storefront.
    Returns dict with vendor info and product list.
    """
    from ..database import SessionLocal
    from ..models import User, Product

    decoded_name = urllib.parse.unquote(shop_name).strip()

    db = SessionLocal()
    try:
        # Find vendor by business_name (case-insensitive)
        vendor = db.query(User).filter(
            func.lower(User.business_name) == decoded_name.lower()
        ).first()

        if not vendor:
            # Try partial match
            vendor = db.query(User).filter(
                User.business_name.ilike(f"%{decoded_name}%")
            ).first()

        if not vendor:
            return None

        # Get vendor's products (only in-stock items)
        products = db.query(Product).filter(
            Product.user_id == vendor.id,
            Product.stock_level > 0
        ).order_by(Product.name).all()

        product_list = []
        categories = set()
        for p in products:
            product_list.append({
                "id": p.id,
                "name": p.name,
                "price": p.price_ngn,
                "stock": p.stock_level,
                "image_url": p.image_url,
                "category": p.category or "Other",
            })
            if p.category:
                categories.add(p.category)

        return {
            "vendor_id": vendor.id,
            "business_name": vendor.business_name or "Shop",
            "display_name": vendor.first_name or vendor.business_name or "Shop",
            "phone": vendor.phone,
            "products": product_list,
            "categories": sorted(categories),
        }
    finally:
        db.close()


# ============== JSON API (existing) ==============

@router.get("/shop/{shop_name}", response_model=ShopResponse)
async def get_public_shop(shop_name: str):
    """
    Get public storefront data as JSON.
    Lookup by business_name (case-insensitive, URL-decoded).
    """
    try:
        data = _get_shop_data(shop_name)
        if not data:
            raise HTTPException(status_code=404, detail=f"Shop '{shop_name}' not found")

        return ShopResponse(
            vendor_id=data["vendor_id"],
            business_name=data["business_name"],
            display_name=data["display_name"],
            phone=data["phone"],
            avatar_url=None,
            products=[ProductItem(**p) for p in data["products"]]
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ============== HTML STOREFRONT PAGE ==============

def _build_product_card(product: dict, vendor_phone: str) -> str:
    """Build HTML for a single product card."""
    name = html_module.escape(product["name"])
    price = product["price"]
    stock = product["stock"]
    category = html_module.escape(product.get("category", ""))
    image_url = product.get("image_url")

    # WhatsApp order message
    wa_message = urllib.parse.quote(
        f"Hi! I'd like to order: {product['name']} (₦{price:,.0f})"
    )
    wa_link = f"https://wa.me/{vendor_phone.replace('+', '')}?text={wa_message}"

    # Stock badge
    if stock <= 3:
        stock_badge = f'<span class="stock-badge stock-low">Only {stock} left</span>'
    elif stock <= 10:
        stock_badge = f'<span class="stock-badge stock-med">{stock} in stock</span>'
    else:
        stock_badge = '<span class="stock-badge stock-ok">In Stock</span>'

    # Product image or placeholder
    if image_url:
        image_html = f'<img src="{html_module.escape(image_url)}" alt="{name}" class="product-img" loading="lazy">'
    else:
        # Generate a color based on product name hash
        colors = ["#1DB954", "#E91E63", "#FF9800", "#2196F3", "#9C27B0", "#00BCD4", "#FF5722", "#4CAF50"]
        color = colors[hash(product["name"]) % len(colors)]
        initials = product["name"][:2].upper()
        image_html = f'<div class="product-img product-placeholder" style="background: {color}20; color: {color}"><span>{initials}</span></div>'

    return f'''
    <div class="product-card" data-category="{category}">
        {image_html}
        <div class="product-info">
            <span class="product-category">{category}</span>
            <h3 class="product-name">{name}</h3>
            <div class="product-price">₦{price:,.0f}</div>
            {stock_badge}
            <div style="display:flex;gap:6px">
                <button onclick="addToCart('{name.replace(chr(39), chr(92)+chr(39))}', {price})" style="flex:1;padding:9px;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:transparent;color:#fff;font-weight:600;font-size:0.75rem;cursor:pointer;font-family:inherit;transition:all 0.2s" onmouseover="this.style.background='rgba(255,255,255,0.06)'" onmouseout="this.style.background='transparent'">+ Cart</button>
                <a href="{wa_link}" target="_blank" rel="noopener" class="btn-order" id="order-{html_module.escape(product['id'])}" style="flex:2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.769-1.42A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.137 0-4.146-.554-5.894-1.558l-.42-.258-3.077.916.858-2.906-.266-.423C2.082 16.092 2 14.077 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    Order
                </a>
            </div>
        </div>
    </div>
    '''


def _build_storefront_html(data: dict) -> str:
    """Build the complete storefront HTML page — premium KOFA design."""
    store_name = html_module.escape(data["business_name"])
    display_name = html_module.escape(data["display_name"])
    phone = data["phone"]
    products = data["products"]
    categories = data["categories"]
    product_count = len(products)

    # Build product cards
    product_cards = "\n".join(
        _build_product_card(p, phone) for p in products
    )

    # Build category filter buttons
    cat_buttons = '<button class="cat-btn active" data-cat="all">All</button>\n'
    for cat in categories:
        cat_buttons += f'<button class="cat-btn" data-cat="{html_module.escape(cat)}">{html_module.escape(cat)}</button>\n'

    # WhatsApp general link
    wa_general = f"https://wa.me/{phone.replace('+', '')}"

    # Store initials
    initials = store_name[:1].upper()

    # Empty state
    if product_count == 0:
        product_cards = '''
        <div class="empty-state">
            <div class="empty-icon">🏪</div>
            <h3>Coming Soon</h3>
            <p>This store is setting up. Check back soon!</p>
        </div>
        '''

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
    <title>{store_name} | Shop on KOFA</title>
    <meta name="description" content="Shop {store_name} — {product_count} products available. Order instantly via WhatsApp.">

    <!-- Open Graph / WhatsApp & Instagram Preview -->
    <meta property="og:title" content="{store_name} — Shop Now">
    <meta property="og:description" content="{product_count} products available. Order instantly via WhatsApp.">
    <meta property="og:type" content="website">
    <meta property="og:site_name" content="KOFA">

    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary">
    <meta name="twitter:title" content="{store_name} — Shop Now">

    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">

    <style>
        :root {{
            --bg: #07070A;
            --bg-elevated: #0F0F14;
            --bg-card: #16161D;
            --bg-card-hover: #1E1E28;
            --accent: #0095FF;
            --accent-hover: #0080E0;
            --accent-soft: rgba(0, 149, 255, 0.08);
            --green: #25D366;
            --green-hover: #20c157;
            --text-primary: #FFFFFF;
            --text-secondary: #A0A0B0;
            --text-muted: #5A5A6E;
            --border: rgba(255, 255, 255, 0.06);
            --border-hover: rgba(255, 255, 255, 0.12);
            --radius: 16px;
        }}

        * {{ margin: 0; padding: 0; box-sizing: border-box; }}

        body {{
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: var(--bg);
            color: var(--text-primary);
            line-height: 1.6;
            -webkit-font-smoothing: antialiased;
            min-height: 100vh;
        }}

        .container {{
            max-width: 920px;
            margin: 0 auto;
            padding: 0 16px;
        }}

        /* ===== ANIMATIONS ===== */
        @keyframes fadeUp {{
            from {{ opacity: 0; transform: translateY(16px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}
        @keyframes pulse {{
            0%, 100% {{ opacity: 0.4; }}
            50% {{ opacity: 0.8; }}
        }}

        /* ===== STORE HEADER ===== */
        .store-header {{
            padding: 40px 0 28px;
            text-align: center;
            animation: fadeUp 0.5s ease;
        }}

        .store-avatar {{
            width: 72px;
            height: 72px;
            background: linear-gradient(135deg, var(--accent), #0070DD);
            border-radius: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 1.75rem;
            font-weight: 900;
            color: #fff;
            margin: 0 auto 14px;
            box-shadow: 0 8px 32px rgba(0, 149, 255, 0.25);
        }}

        .store-name {{
            font-size: 1.65rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            margin-bottom: 2px;
        }}

        .store-verified {{
            display: inline-flex;
            align-items: center;
            gap: 4px;
            font-size: 0.75rem;
            color: var(--accent);
            font-weight: 600;
            margin-bottom: 8px;
        }}

        .store-meta {{
            color: var(--text-muted);
            font-size: 0.8rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 14px;
            margin-bottom: 16px;
        }}

        .store-meta span {{
            display: flex;
            align-items: center;
            gap: 4px;
        }}

        .store-actions {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }}

        .store-wa-btn {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 22px;
            background: var(--green);
            color: #fff;
            border-radius: 99px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.82rem;
            transition: all 0.2s;
            border: none;
        }}

        .store-wa-btn:hover {{
            transform: scale(1.04);
            background: var(--green-hover);
            box-shadow: 0 4px 16px rgba(37, 211, 102, 0.3);
        }}

        .store-share-btn {{
            padding: 10px 18px;
            border-radius: 99px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-secondary);
            font-size: 0.82rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
        }}

        .store-share-btn:hover {{
            border-color: var(--border-hover);
            color: var(--text-primary);
        }}

        /* ===== SEARCH BAR ===== */
        .search-wrap {{
            padding: 0 0 16px;
            animation: fadeUp 0.5s ease 0.1s both;
        }}

        .search-bar {{
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 16px;
            border-radius: 14px;
            background: var(--bg-elevated);
            border: 1px solid var(--border);
            transition: border-color 0.2s;
        }}

        .search-bar:focus-within {{
            border-color: var(--accent);
        }}

        .search-bar svg {{
            color: var(--text-muted);
            flex-shrink: 0;
        }}

        .search-bar input {{
            flex: 1;
            background: none;
            border: none;
            outline: none;
            font-size: 0.85rem;
            font-family: inherit;
            color: var(--text-primary);
        }}

        .search-bar input::placeholder {{
            color: var(--text-muted);
        }}

        /* ===== CATEGORY FILTER ===== */
        .categories {{
            padding: 0 0 16px;
            display: flex;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
            animation: fadeUp 0.5s ease 0.15s both;
        }}

        .categories::-webkit-scrollbar {{ display: none; }}

        .cat-btn {{
            padding: 8px 16px;
            border-radius: 99px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-secondary);
            font-size: 0.78rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
            font-family: inherit;
        }}

        .cat-btn:hover {{ border-color: var(--text-muted); color: var(--text-primary); }}

        .cat-btn.active {{
            background: var(--accent);
            color: #fff;
            border-color: var(--accent);
            font-weight: 600;
        }}

        /* ===== PRODUCT GRID ===== */
        .product-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
            gap: 14px;
            padding: 0 0 40px;
        }}

        .product-card {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: var(--radius);
            overflow: hidden;
            transition: all 0.25s ease;
            animation: fadeUp 0.4s ease both;
        }}

        .product-card:hover {{
            border-color: var(--border-hover);
            transform: translateY(-3px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        }}

        .product-img {{
            width: 100%;
            aspect-ratio: 1;
            object-fit: cover;
            display: flex;
            align-items: center;
            justify-content: center;
        }}

        .product-placeholder span {{
            font-size: 1.75rem;
            font-weight: 800;
            letter-spacing: -0.02em;
        }}

        .product-info {{
            padding: 14px;
        }}

        .product-category {{
            font-size: 0.65rem;
            color: var(--accent);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }}

        .product-name {{
            font-size: 0.9rem;
            font-weight: 600;
            margin: 3px 0 6px;
            letter-spacing: -0.01em;
            line-height: 1.3;
        }}

        .product-price {{
            font-size: 1.15rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 6px;
        }}

        .stock-badge {{
            display: inline-block;
            padding: 2px 8px;
            border-radius: 99px;
            font-size: 0.65rem;
            font-weight: 600;
            margin-bottom: 10px;
        }}

        .stock-ok {{ background: rgba(34, 197, 94, 0.12); color: #22c55e; }}
        .stock-med {{ background: rgba(251, 191, 36, 0.12); color: #fbbf24; }}
        .stock-low {{ background: rgba(239, 68, 68, 0.12); color: #ef4444; }}

        .btn-order {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            width: 100%;
            padding: 9px;
            background: var(--green);
            color: #fff;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.78rem;
            transition: all 0.2s;
        }}

        .btn-order:hover {{
            background: var(--green-hover);
            transform: scale(1.02);
        }}

        /* ===== CART SHEET ===== */
        .cart-fab {{
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 50;
            display: none;
            align-items: center;
            gap: 8px;
            padding: 14px 22px;
            border-radius: 99px;
            border: none;
            cursor: pointer;
            background: var(--green);
            color: #fff;
            font-weight: 700;
            font-size: 0.85rem;
            font-family: inherit;
            box-shadow: 0 6px 24px rgba(37, 211, 102, 0.35);
            transition: all 0.2s;
        }}

        .cart-fab.visible {{ display: flex; }}
        .cart-fab:hover {{ transform: scale(1.06); }}

        .cart-fab .count {{
            background: #fff;
            color: var(--green);
            width: 22px;
            height: 22px;
            border-radius: 99px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            font-weight: 800;
        }}

        /* Cart Overlay */
        .cart-overlay {{
            position: fixed;
            inset: 0;
            z-index: 100;
            background: rgba(0, 0, 0, 0.6);
            backdrop-filter: blur(4px);
            display: none;
            align-items: flex-end;
            justify-content: center;
        }}

        .cart-overlay.open {{ display: flex; }}

        .cart-sheet {{
            width: 100%;
            max-width: 500px;
            max-height: 70vh;
            background: var(--bg-elevated);
            border-radius: 24px 24px 0 0;
            padding: 24px;
            overflow-y: auto;
        }}

        .cart-sheet h2 {{
            font-size: 1.1rem;
            font-weight: 700;
            margin-bottom: 16px;
        }}

        .cart-item {{
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid var(--border);
        }}

        .cart-item-name {{
            font-size: 0.85rem;
            font-weight: 500;
        }}

        .cart-item-price {{
            font-size: 0.85rem;
            font-weight: 700;
            color: var(--text-secondary);
        }}

        .cart-item-remove {{
            background: none;
            border: none;
            color: var(--text-muted);
            cursor: pointer;
            padding: 4px;
            font-size: 1rem;
        }}

        .cart-total {{
            display: flex;
            justify-content: space-between;
            padding: 14px 0;
            font-weight: 700;
            font-size: 1rem;
        }}

        .cart-send-btn {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 14px;
            background: var(--green);
            color: #fff;
            border-radius: 14px;
            text-decoration: none;
            font-weight: 700;
            font-size: 0.9rem;
            border: none;
            cursor: pointer;
            transition: all 0.2s;
            font-family: inherit;
            margin-top: 8px;
        }}

        .cart-send-btn:hover {{ background: var(--green-hover); }}

        /* ===== EMPTY STATE ===== */
        .empty-state {{
            grid-column: 1 / -1;
            text-align: center;
            padding: 80px 20px;
        }}

        .empty-icon {{ font-size: 3rem; margin-bottom: 16px; }}
        .empty-state h3 {{ font-size: 1.25rem; margin-bottom: 8px; }}
        .empty-state p {{ color: var(--text-muted); }}

        .no-results {{
            grid-column: 1 / -1;
            text-align: center;
            padding: 48px 20px;
            color: var(--text-muted);
            font-size: 0.9rem;
            display: none;
        }}

        /* ===== FOOTER ===== */
        .store-footer {{
            padding: 32px 0;
            border-top: 1px solid var(--border);
            text-align: center;
        }}

        .store-footer p {{
            color: var(--text-muted);
            font-size: 0.78rem;
            margin-bottom: 6px;
        }}

        .footer-cta {{
            display: inline-flex;
            align-items: center;
            gap: 4px;
            color: var(--accent);
            text-decoration: none;
            font-size: 0.82rem;
            font-weight: 600;
            transition: opacity 0.2s;
        }}

        .footer-cta:hover {{ opacity: 0.8; }}

        .kofa-badge {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            background: var(--bg-card);
            border: 1px solid var(--border);
            padding: 5px 12px;
            border-radius: 99px;
            font-size: 0.72rem;
            color: var(--text-muted);
            margin-top: 10px;
        }}

        .kofa-badge .k {{
            background: linear-gradient(135deg, var(--accent), #0070DD);
            color: #fff;
            width: 16px;
            height: 16px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 0.6rem;
        }}

        /* ===== RESPONSIVE ===== */
        @media (max-width: 600px) {{
            .product-grid {{
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }}

            .store-header {{ padding: 28px 0 20px; }}
            .store-name {{ font-size: 1.3rem; }}
            .store-avatar {{ width: 56px; height: 56px; font-size: 1.3rem; border-radius: 16px; }}
            .product-info {{ padding: 10px; }}
            .product-name {{ font-size: 0.8rem; }}
            .product-price {{ font-size: 1rem; }}
            .btn-order {{ padding: 7px; font-size: 0.72rem; }}
            .cart-fab {{ bottom: 16px; right: 16px; }}
        }}

        @media (max-width: 340px) {{
            .product-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Store Header -->
        <header class="store-header">
            <div class="store-avatar">{initials}</div>
            <h1 class="store-name">{store_name}</h1>
            <div class="store-verified">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
                Verified Store
            </div>
            <div class="store-meta">
                <span>📦 {product_count} product{"s" if product_count != 1 else ""}</span>
                <span>📍 Nigeria</span>
            </div>
            <div class="store-actions">
                <a href="{wa_general}" target="_blank" rel="noopener" class="store-wa-btn" id="store-whatsapp-btn">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.769-1.42A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.137 0-4.146-.554-5.894-1.558l-.42-.258-3.077.916.858-2.906-.266-.423C2.082 16.092 2 14.077 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                    Chat on WhatsApp
                </a>
                <button class="store-share-btn" onclick="navigator.clipboard.writeText(window.location.href).then(()=>this.textContent='Copied!')">
                    Share Store
                </button>
            </div>
        </header>

        <!-- Search Bar -->
        <div class="search-wrap">
            <div class="search-bar">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" id="search-input" placeholder="Search products..." autocomplete="off">
            </div>
        </div>

        <!-- Category Filter -->
        <div class="categories" id="category-filter">
            {cat_buttons}
        </div>

        <!-- Product Grid -->
        <div class="product-grid" id="product-grid">
            {product_cards}
        </div>

        <div class="no-results" id="no-results">No products found</div>

        <!-- Footer -->
        <footer class="store-footer">
            <p>Want your own online store?</p>
            <a href="/" class="footer-cta">Get started with KOFA — it's free →</a>
            <div><span class="kofa-badge"><span class="k">K</span> Powered by KOFA</span></div>
        </footer>
    </div>

    <!-- Cart FAB -->
    <button class="cart-fab" id="cart-fab" onclick="openCart()">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/></svg>
        Order <span class="count" id="cart-count">0</span>
    </button>

    <!-- Cart Overlay -->
    <div class="cart-overlay" id="cart-overlay" onclick="closeCart()">
        <div class="cart-sheet" onclick="event.stopPropagation()">
            <h2>🛒 Your Order</h2>
            <div id="cart-items"></div>
            <div class="cart-total">
                <span>Total</span>
                <span id="cart-total">₦0</span>
            </div>
            <a id="cart-wa-link" href="#" target="_blank" rel="noopener" class="cart-send-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.769-1.42A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.137 0-4.146-.554-5.894-1.558l-.42-.258-3.077.916.858-2.906-.266-.423C2.082 16.092 2 14.077 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Send Order via WhatsApp
            </a>
        </div>
    </div>

    <script>
        // ===== Cart Logic =====
        const cart = [];
        const VENDOR_PHONE = '{phone.replace("+", "")}';

        function addToCart(name, price) {{
            cart.push({{ name, price }});
            updateCartUI();
        }}

        function removeFromCart(index) {{
            cart.splice(index, 1);
            updateCartUI();
        }}

        function updateCartUI() {{
            const fab = document.getElementById('cart-fab');
            const countEl = document.getElementById('cart-count');
            const itemsEl = document.getElementById('cart-items');
            const totalEl = document.getElementById('cart-total');
            const waLink = document.getElementById('cart-wa-link');

            if (cart.length > 0) {{
                fab.classList.add('visible');
                countEl.textContent = cart.length;
            }} else {{
                fab.classList.remove('visible');
            }}

            // Render items
            itemsEl.innerHTML = cart.map((item, i) =>
                `<div class="cart-item">
                    <span class="cart-item-name">${{item.name}}</span>
                    <span class="cart-item-price">₦${{item.price.toLocaleString()}}</span>
                    <button class="cart-item-remove" onclick="removeFromCart(${{i}})">✕</button>
                </div>`
            ).join('');

            // Total
            const total = cart.reduce((s, item) => s + item.price, 0);
            totalEl.textContent = '₦' + total.toLocaleString();

            // WhatsApp link
            const orderList = cart.map((item, i) => `${{i+1}}. ${{item.name}} — ₦${{item.price.toLocaleString()}}`).join('%0A');
            const msg = encodeURIComponent(`Hi! I'd like to order:\\n${{cart.map((item, i) => `${{i+1}}. ${{item.name}} — ₦${{item.price.toLocaleString()}}`).join('\\n')}}\\n\\nTotal: ₦${{total.toLocaleString()}}`);
            waLink.href = `https://wa.me/${{VENDOR_PHONE}}?text=${{msg}}`;
        }}

        function openCart() {{
            document.getElementById('cart-overlay').classList.add('open');
        }}

        function closeCart() {{
            document.getElementById('cart-overlay').classList.remove('open');
        }}

        // ===== Category Filter =====
        document.querySelectorAll('.cat-btn').forEach(btn => {{
            btn.addEventListener('click', () => {{
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterProducts();
            }});
        }});

        // ===== Search =====
        const searchInput = document.getElementById('search-input');
        searchInput.addEventListener('input', () => filterProducts());

        function filterProducts() {{
            const query = searchInput.value.toLowerCase().trim();
            const activeCat = document.querySelector('.cat-btn.active')?.dataset.cat || 'all';
            let visible = 0;

            document.querySelectorAll('.product-card').forEach(card => {{
                const name = card.querySelector('.product-name')?.textContent.toLowerCase() || '';
                const cat = card.dataset.category || '';
                const matchesSearch = !query || name.includes(query);
                const matchesCat = activeCat === 'all' || cat === activeCat;

                if (matchesSearch && matchesCat) {{
                    card.style.display = '';
                    visible++;
                }} else {{
                    card.style.display = 'none';
                }}
            }});

            document.getElementById('no-results').style.display = visible === 0 ? 'block' : 'none';
        }}

        // ===== Staggered card animation =====
        document.querySelectorAll('.product-card').forEach((card, i) => {{
            card.style.animationDelay = `${{0.05 * i}}s`;
        }});
    </script>
</body>
</html>'''


@router.get("/store/{shop_name}", response_class=HTMLResponse)
async def get_storefront_page(shop_name: str):
    """
    Render the public storefront HTML page for a vendor.
    This is the shareable page vendors link from Instagram bio, WhatsApp status, etc.
    URL: /store/{shop_name}
    """
    try:
        data = _get_shop_data(shop_name)
        if not data:
            # Return a styled 404 page
            return HTMLResponse(
                content=f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Store Not Found | KOFA</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet">
    <style>
        body {{ font-family: 'Inter', sans-serif; background: #000; color: #fff; display: flex; align-items: center; justify-content: center; min-height: 100vh; text-align: center; }}
        h1 {{ font-size: 2rem; margin-bottom: 8px; }}
        p {{ color: #727272; margin-bottom: 24px; }}
        a {{ color: #1DB954; text-decoration: none; font-weight: 600; }}
    </style>
</head>
<body>
    <div>
        <h1>🏪 Store Not Found</h1>
        <p>We couldn't find a store called "{html_module.escape(shop_name)}"</p>
        <a href="/">← Back to KOFA</a>
    </div>
</body>
</html>''',
                status_code=404
            )

        html_content = _build_storefront_html(data)
        return HTMLResponse(content=html_content)

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
