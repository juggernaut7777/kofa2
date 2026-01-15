# KOFA Public Storefront Router
# Serves public shop pages for vendors

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy import func

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


@router.get("/shop/{shop_name}", response_model=ShopResponse)
async def get_public_shop(shop_name: str):
    """
    Get public storefront for a vendor.
    Lookup by business_name (case-insensitive, URL-decoded).
    """
    try:
        from ..database import SessionLocal
        from ..models import User, Product
        
        # URL decode and normalize the shop name
        import urllib.parse
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
                raise HTTPException(
                    status_code=404,
                    detail=f"Shop '{decoded_name}' not found"
                )
            
            # Get vendor's products (only in-stock items)
            products = db.query(Product).filter(
                Product.user_id == vendor.id,
                Product.stock_level > 0
            ).order_by(Product.name).all()
            
            # Build product list
            product_list = []
            for p in products:
                product_list.append(ProductItem(
                    id=p.id,
                    name=p.name,
                    price=p.price_ngn,
                    stock=p.stock_level,
                    image_url=p.image_url,
                    category=p.category
                ))
            
            return ShopResponse(
                vendor_id=vendor.id,
                business_name=vendor.business_name or "Shop",
                display_name=vendor.first_name or vendor.business_name or "Shop",
                phone=vendor.phone,
                avatar_url=None,  # Can add avatar field later
                products=product_list
            )
            
        finally:
            db.close()
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
