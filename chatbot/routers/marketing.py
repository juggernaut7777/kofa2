# chatbot/routers/marketing.py
"""
Marketing router — AI ad generation for KOFA vendors.
Handles ad generation requests, asset management, and VM bridge webhook.

Flow:
1. Vendor clicks "Generate AI Ad" on a product
2. KOFA backend stores request (status=pending)
3. KOFA sends request to Google Cloud VM (kofa_bridge.py)
4. VM generates ad using FlowBridge + NVIDIA + Grok
5. VM calls back webhook with result
6. Asset updated (status=completed, file_url set)
"""
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
import uuid
import os
import logging
import aiohttp

logger = logging.getLogger(__name__)
router = APIRouter()

# Google Cloud VM bridge endpoint (set when VM is deployed)
VM_BRIDGE_URL = os.getenv("KOFA_VM_BRIDGE_URL", "")
VM_BRIDGE_SECRET = os.getenv("KOFA_VM_BRIDGE_SECRET", "kofa-bridge-2026")


# --- Pydantic Models ---

class AdGenerateRequest(BaseModel):
    """Request to generate an AI ad for a product."""
    product_id: str
    user_id: str
    asset_type: str = "image"  # image, video, carousel, caption
    platform: str = "all"  # tiktok, instagram, whatsapp, all
    style: Optional[str] = "luxury"  # luxury, minimal, bold, editorial
    custom_prompt: Optional[str] = None  # Vendor can add custom instructions


class AdWebhookPayload(BaseModel):
    """Webhook payload from Google Cloud VM when ad is ready."""
    asset_id: str
    status: str  # completed, failed
    file_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    caption: Optional[str] = None
    hashtags: Optional[List[str]] = None
    error_message: Optional[str] = None
    secret: str  # Authentication for webhook


class CaptionGenerateRequest(BaseModel):
    """Request to generate just a caption (no image/video)."""
    product_name: str
    product_price: float
    product_description: Optional[str] = None
    platform: str = "instagram"  # tiktok, instagram, whatsapp
    user_id: str


# --- API Endpoints ---

@router.post("/generate")
async def generate_ad(request: AdGenerateRequest):
    """
    Request AI ad generation for a product.
    Creates a pending asset and (if VM is live) sends to the bridge.
    """
    from ..database import SessionLocal
    from ..models import MarketingAsset, Product

    db = SessionLocal()
    try:
        # Verify product exists
        product = db.query(Product).filter(
            Product.id == request.product_id,
            Product.user_id == request.user_id
        ).first()
        
        if not product:
            raise HTTPException(status_code=404, detail="Product not found")
        
        # Create pending asset
        asset_id = str(uuid.uuid4())
        asset = MarketingAsset(
            id=asset_id,
            user_id=request.user_id,
            product_id=request.product_id,
            asset_type=request.asset_type,
            title=f"AI Ad — {product.name}",
            prompt_used=request.custom_prompt or f"{request.style} style ad for {product.name}",
            platform_target=request.platform,
            status="pending"
        )
        db.add(asset)
        db.commit()
        
        # Try to send to VM bridge (non-blocking)
        vm_sent = False
        if VM_BRIDGE_URL:
            try:
                vm_sent = await _send_to_vm_bridge(asset_id, product, request)
                if vm_sent:
                    asset.status = "generating"
                    db.commit()
            except Exception as e:
                logger.warning(f"VM bridge unavailable: {e}")
        
        return {
            "status": "success",
            "asset_id": asset_id,
            "message": "Ad generation queued" if vm_sent else "Ad request saved (VM not connected yet)",
            "vm_connected": vm_sent,
            "asset": {
                "id": asset_id,
                "title": asset.title,
                "asset_type": request.asset_type,
                "status": asset.status,
                "platform": request.platform,
                "created_at": asset.created_at.isoformat() if asset.created_at else None
            }
        }
    finally:
        db.close()


@router.post("/generate-caption")
async def generate_caption(request: CaptionGenerateRequest):
    """
    Generate JUST a marketing caption using AI (instant, no VM needed).
    Uses Groq → Gemini → Grok fallback chain.
    """
    from ..ai_unified import send_to_ai
    from ..database import SessionLocal
    from ..models import MarketingAsset

    platform_hints = {
        "tiktok": "TikTok (short, punchy, use trending language, include emojis, max 150 chars)",
        "instagram": "Instagram (luxury feel, use line breaks, include relevant hashtags, max 2200 chars)",
        "whatsapp": "WhatsApp (conversational, include price, use bullet points, max 1000 chars)"
    }
    
    platform_guide = platform_hints.get(request.platform, platform_hints["instagram"])
    
    prompt = f"""Generate a compelling marketing caption for this product:

Product: {request.product_name}
Price: ₦{request.product_price:,.0f}
Description: {request.product_description or 'N/A'}
Platform: {platform_guide}

Write ONLY the caption text (no explanations). Make it persuasive, professional, and include a call-to-action.
If for Instagram, include 5-8 relevant hashtags at the end.
If for TikTok, use coded luxury language (avoid brand names directly).
"""

    messages = [{"role": "user", "content": prompt}]
    system_prompt = "You are an expert social media marketing copywriter specializing in Nigerian e-commerce. Write engaging, conversion-focused captions."
    
    response_text, api_used = await send_to_ai(
        messages=messages,
        system_prompt=system_prompt,
        max_tokens=500,
        temperature=0.8
    )
    
    # Save as a caption asset
    db = SessionLocal()
    try:
        asset_id = str(uuid.uuid4())
        asset = MarketingAsset(
            id=asset_id,
            user_id=request.user_id,
            asset_type="caption",
            title=f"Caption — {request.product_name}",
            caption=response_text,
            platform_target=request.platform,
            status="completed",
            completed_at=datetime.utcnow()
        )
        db.add(asset)
        db.commit()
    finally:
        db.close()
    
    return {
        "status": "success",
        "caption": response_text,
        "platform": request.platform,
        "ai_model": api_used,
        "asset_id": asset_id
    }


@router.get("/assets")
async def list_assets(
    user_id: str = Query(...),
    asset_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = Query(20, le=100)
):
    """List marketing assets for a vendor."""
    from ..database import SessionLocal
    from ..models import MarketingAsset

    db = SessionLocal()
    try:
        query = db.query(MarketingAsset).filter(
            MarketingAsset.user_id == user_id
        )
        
        if asset_type:
            query = query.filter(MarketingAsset.asset_type == asset_type)
        if status:
            query = query.filter(MarketingAsset.status == status)
        
        assets = query.order_by(MarketingAsset.created_at.desc()).limit(limit).all()
        
        return {
            "assets": [
                {
                    "id": a.id,
                    "title": a.title,
                    "asset_type": a.asset_type,
                    "file_url": a.file_url,
                    "thumbnail_url": a.thumbnail_url,
                    "caption": a.caption,
                    "hashtags": a.hashtags,
                    "status": a.status,
                    "platform": a.platform_target,
                    "downloads": a.downloads,
                    "posted": bool(a.posted),
                    "created_at": a.created_at.isoformat() if a.created_at else None,
                    "completed_at": a.completed_at.isoformat() if a.completed_at else None,
                }
                for a in assets
            ],
            "total": len(assets)
        }
    finally:
        db.close()


@router.delete("/assets/{asset_id}")
async def delete_asset(asset_id: str, user_id: str = Query(...)):
    """Delete a marketing asset."""
    from ..database import SessionLocal
    from ..models import MarketingAsset

    db = SessionLocal()
    try:
        asset = db.query(MarketingAsset).filter(
            MarketingAsset.id == asset_id,
            MarketingAsset.user_id == user_id
        ).first()
        
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        db.delete(asset)
        db.commit()
        return {"status": "deleted", "asset_id": asset_id}
    finally:
        db.close()


@router.post("/webhook")
async def ad_generation_webhook(payload: AdWebhookPayload):
    """
    Webhook endpoint called by Google Cloud VM when ad generation is complete.
    Authenticated via shared secret.
    """
    if payload.secret != VM_BRIDGE_SECRET:
        raise HTTPException(status_code=403, detail="Invalid webhook secret")
    
    from ..database import SessionLocal
    from ..models import MarketingAsset

    db = SessionLocal()
    try:
        asset = db.query(MarketingAsset).filter(
            MarketingAsset.id == payload.asset_id
        ).first()
        
        if not asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        asset.status = payload.status
        asset.file_url = payload.file_url
        asset.thumbnail_url = payload.thumbnail_url
        asset.caption = payload.caption
        asset.hashtags = str(payload.hashtags) if payload.hashtags else None
        asset.error_message = payload.error_message
        
        if payload.status == "completed":
            asset.completed_at = datetime.utcnow()
        
        db.commit()
        
        logger.info(f"✅ Marketing asset {payload.asset_id} updated: {payload.status}")
        return {"status": "received", "asset_id": payload.asset_id}
    finally:
        db.close()


# --- Internal Helper ---

async def _send_to_vm_bridge(asset_id: str, product, request: AdGenerateRequest) -> bool:
    """Send ad generation request to Google Cloud VM."""
    payload = {
        "asset_id": asset_id,
        "product": {
            "name": product.name,
            "price": product.price_ngn,
            "description": product.description,
            "category": product.category,
            "image_url": product.image_url,
        },
        "asset_type": request.asset_type,
        "platform": request.platform,
        "style": request.style,
        "custom_prompt": request.custom_prompt,
        "callback_url": f"{os.getenv('BACKEND_URL', 'https://kofa-backend-eu-2bb681b4e51a.herokuapp.com')}/marketing/webhook",
        "secret": VM_BRIDGE_SECRET,
    }
    
    async with aiohttp.ClientSession() as session:
        async with session.post(
            f"{VM_BRIDGE_URL}/generate",
            json=payload,
            timeout=aiohttp.ClientTimeout(total=10)
        ) as response:
            if response.status == 200:
                logger.info(f"📤 Sent ad request to VM bridge: {asset_id}")
                return True
            else:
                logger.error(f"❌ VM bridge error: {response.status}")
                return False
