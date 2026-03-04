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
        stock_badge = f'<span class="stock-badge stock-ok">In Stock</span>'

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
            <a href="{wa_link}" target="_blank" rel="noopener" class="btn-order" id="order-{html_module.escape(product['id'])}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.769-1.42A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.137 0-4.146-.554-5.894-1.558l-.42-.258-3.077.916.858-2.906-.266-.423C2.082 16.092 2 14.077 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Order via WhatsApp
            </a>
        </div>
    </div>
    '''


def _build_storefront_html(data: dict) -> str:
    """Build the complete storefront HTML page."""
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
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
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
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">

    <style>
        :root {{
            --bg: #000000;
            --bg-elevated: #121212;
            --bg-card: #181818;
            --bg-card-hover: #282828;
            --accent: #1DB954;
            --accent-hover: #1ed760;
            --accent-dim: rgba(29, 185, 84, 0.1);
            --text-primary: #FFFFFF;
            --text-secondary: #B3B3B3;
            --text-muted: #727272;
            --border: rgba(255, 255, 255, 0.1);
            --border-hover: rgba(255, 255, 255, 0.2);
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
            max-width: 960px;
            margin: 0 auto;
            padding: 0 20px;
        }}

        /* ===== STORE HEADER ===== */
        .store-header {{
            padding: 48px 0 32px;
            text-align: center;
            border-bottom: 1px solid var(--border);
        }}

        .store-avatar {{
            width: 80px;
            height: 80px;
            background: var(--accent);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 2rem;
            font-weight: 800;
            color: #000;
            margin: 0 auto 16px;
            letter-spacing: -0.02em;
        }}

        .store-name {{
            font-size: 1.75rem;
            font-weight: 800;
            letter-spacing: -0.03em;
            margin-bottom: 4px;
        }}

        .store-meta {{
            color: var(--text-muted);
            font-size: 0.875rem;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 16px;
            margin-bottom: 20px;
        }}

        .store-meta span {{
            display: flex;
            align-items: center;
            gap: 4px;
        }}

        .store-wa-btn {{
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 10px 24px;
            background: #25D366;
            color: #fff;
            border-radius: 500px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.875rem;
            transition: all 0.2s;
        }}

        .store-wa-btn:hover {{
            transform: scale(1.04);
            background: #20c157;
        }}

        /* ===== CATEGORY FILTER ===== */
        .categories {{
            padding: 20px 0;
            display: flex;
            gap: 8px;
            overflow-x: auto;
            scrollbar-width: none;
            -ms-overflow-style: none;
        }}

        .categories::-webkit-scrollbar {{ display: none; }}

        .cat-btn {{
            padding: 8px 18px;
            border-radius: 500px;
            border: 1px solid var(--border);
            background: transparent;
            color: var(--text-secondary);
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s;
            white-space: nowrap;
            font-family: inherit;
        }}

        .cat-btn:hover {{ border-color: var(--text-muted); color: var(--text-primary); }}

        .cat-btn.active {{
            background: var(--accent);
            color: #000;
            border-color: var(--accent);
            font-weight: 600;
        }}

        /* ===== PRODUCT GRID ===== */
        .product-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
            gap: 16px;
            padding: 24px 0 60px;
        }}

        .product-card {{
            background: var(--bg-card);
            border: 1px solid var(--border);
            border-radius: 16px;
            overflow: hidden;
            transition: all 0.25s ease;
        }}

        .product-card:hover {{
            border-color: var(--border-hover);
            transform: translateY(-4px);
            box-shadow: 0 12px 40px rgba(0, 0, 0, 0.4);
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
            font-size: 2rem;
            font-weight: 800;
            letter-spacing: -0.02em;
        }}

        .product-info {{
            padding: 16px;
        }}

        .product-category {{
            font-size: 0.7rem;
            color: var(--accent);
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }}

        .product-name {{
            font-size: 0.95rem;
            font-weight: 600;
            margin: 4px 0 8px;
            letter-spacing: -0.01em;
            line-height: 1.3;
        }}

        .product-price {{
            font-size: 1.25rem;
            font-weight: 700;
            letter-spacing: -0.02em;
            margin-bottom: 8px;
        }}

        .stock-badge {{
            display: inline-block;
            padding: 3px 10px;
            border-radius: 500px;
            font-size: 0.7rem;
            font-weight: 600;
            margin-bottom: 12px;
        }}

        .stock-ok {{ background: rgba(29, 185, 84, 0.15); color: #1DB954; }}
        .stock-med {{ background: rgba(255, 152, 0, 0.15); color: #FF9800; }}
        .stock-low {{ background: rgba(244, 67, 54, 0.15); color: #F44336; }}

        .btn-order {{
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            width: 100%;
            padding: 10px;
            background: var(--accent);
            color: #000;
            border-radius: 10px;
            text-decoration: none;
            font-weight: 600;
            font-size: 0.8rem;
            transition: all 0.2s;
        }}

        .btn-order:hover {{
            background: var(--accent-hover);
            transform: scale(1.02);
        }}

        /* ===== EMPTY STATE ===== */
        .empty-state {{
            grid-column: 1 / -1;
            text-align: center;
            padding: 80px 20px;
        }}

        .empty-icon {{ font-size: 3rem; margin-bottom: 16px; }}
        .empty-state h3 {{ font-size: 1.25rem; margin-bottom: 8px; }}
        .empty-state p {{ color: var(--text-muted); }}

        /* ===== FOOTER ===== */
        .store-footer {{
            padding: 32px 0;
            border-top: 1px solid var(--border);
            text-align: center;
        }}

        .store-footer p {{
            color: var(--text-muted);
            font-size: 0.8rem;
            margin-bottom: 8px;
        }}

        .footer-cta {{
            display: inline-flex;
            align-items: center;
            gap: 6px;
            color: var(--accent);
            text-decoration: none;
            font-size: 0.85rem;
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
            padding: 6px 14px;
            border-radius: 500px;
            font-size: 0.75rem;
            color: var(--text-muted);
            margin-top: 12px;
        }}

        .kofa-badge .k {{ 
            background: var(--accent);
            color: #000;
            width: 18px;
            height: 18px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: 800;
            font-size: 0.65rem;
        }}

        /* ===== RESPONSIVE ===== */
        @media (max-width: 600px) {{
            .product-grid {{
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
            }}

            .store-header {{ padding: 32px 0 24px; }}
            .store-name {{ font-size: 1.4rem; }}
            .store-avatar {{ width: 64px; height: 64px; font-size: 1.5rem; }}
            .product-info {{ padding: 12px; }}
            .product-name {{ font-size: 0.85rem; }}
            .product-price {{ font-size: 1.1rem; }}
            .btn-order {{ padding: 8px; font-size: 0.75rem; }}
        }}

        @media (max-width: 380px) {{
            .product-grid {{ grid-template-columns: 1fr; }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <!-- Store Header -->
        <header class="store-header">
            <div class="store-avatar">{html_module.escape(store_name[:1].upper())}</div>
            <h1 class="store-name">{store_name}</h1>
            <div class="store-meta">
                <span>📦 {product_count} product{"s" if product_count != 1 else ""}</span>
                <span>📍 Nigeria</span>
            </div>
            <a href="{wa_general}" target="_blank" rel="noopener" class="store-wa-btn" id="store-whatsapp-btn">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.612.638l4.769-1.42A11.94 11.94 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.137 0-4.146-.554-5.894-1.558l-.42-.258-3.077.916.858-2.906-.266-.423C2.082 16.092 2 14.077 2 12 2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z"/></svg>
                Chat on WhatsApp
            </a>
        </header>

        <!-- Category Filter -->
        <div class="categories" id="category-filter">
            {cat_buttons}
        </div>

        <!-- Product Grid -->
        <div class="product-grid" id="product-grid">
            {product_cards}
        </div>

        <!-- Footer -->
        <footer class="store-footer">
            <p>Want your own online store?</p>
            <a href="/" class="footer-cta">Get started with KOFA — it's free →</a>
            <div><span class="kofa-badge"><span class="k">K</span> Powered by KOFA</span></div>
        </footer>
    </div>

    <script>
        // Category filter
        document.querySelectorAll('.cat-btn').forEach(btn => {{
            btn.addEventListener('click', () => {{
                // Update active state
                document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const cat = btn.dataset.cat;
                document.querySelectorAll('.product-card').forEach(card => {{
                    if (cat === 'all' || card.dataset.category === cat) {{
                        card.style.display = '';
                    }} else {{
                        card.style.display = 'none';
                    }}
                }});
            }});
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
