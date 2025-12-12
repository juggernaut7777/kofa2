# owo_flow/chatbot/routers/recommendations.py
"""
Recommendations API Router
Product recommendations and personalization.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from ..services.recommendations import recommendation_service

router = APIRouter()


class RecommendationResponse(BaseModel):
    product_id: str
    product_name: str
    price_ngn: float
    reason: str


class PersonalizedRequest(BaseModel):
    customer_phone: str
    purchase_history: List[str] = []


@router.get("/product/{product_id}")
async def get_related_products(product_id: str, limit: int = 4):
    """
    Get products related to a specific product.
    "Customers who bought X also bought Y"
    """
    recommendations = recommendation_service.get_related_products(product_id, limit)
    
    if not recommendations:
        return {"product_id": product_id, "recommendations": []}
    
    return {
        "product_id": product_id,
        "recommendations": [
            {
                "product_id": r.product_id,
                "product_name": r.product_name,
                "price_ngn": r.price_ngn,
                "reason": r.reason,
                "score": r.score
            }
            for r in recommendations
        ]
    }


@router.get("/category/{category}")
async def get_category_recommendations(category: str, limit: int = 4):
    """
    Get recommended products for a category.
    """
    recommendations = recommendation_service.get_category_recommendations(category, limit)
    
    return {
        "category": category,
        "recommendations": [
            {
                "product_id": r.product_id,
                "product_name": r.product_name,
                "price_ngn": r.price_ngn,
                "reason": r.reason,
                "score": r.score
            }
            for r in recommendations
        ]
    }


@router.get("/trending")
async def get_trending_products(limit: int = 5):
    """
    Get currently trending products.
    """
    recommendations = recommendation_service.get_trending_products(limit)
    
    return {
        "trending": [
            {
                "product_id": r.product_id,
                "product_name": r.product_name,
                "price_ngn": r.price_ngn,
                "reason": r.reason
            }
            for r in recommendations
        ]
    }


@router.post("/personalized")
async def get_personalized_recommendations(request: PersonalizedRequest, limit: int = 4):
    """
    Get personalized recommendations based on purchase history.
    """
    recommendations = recommendation_service.get_personalized_recommendations(
        request.customer_phone,
        request.purchase_history,
        limit
    )
    
    return {
        "customer_phone": request.customer_phone,
        "recommendations": [
            {
                "product_id": r.product_id,
                "product_name": r.product_name,
                "price_ngn": r.price_ngn,
                "reason": r.reason
            }
            for r in recommendations
        ]
    }


@router.post("/upsell")
async def get_upsell_recommendations(cart_product_ids: List[str], limit: int = 2):
    """
    Get upsell recommendations for checkout.
    "Complete your look with these items"
    """
    recommendations = recommendation_service.get_upsell_products(cart_product_ids, limit)
    
    return {
        "cart_items": cart_product_ids,
        "upsell_suggestions": [
            {
                "product_id": r.product_id,
                "product_name": r.product_name,
                "price_ngn": r.price_ngn,
                "reason": r.reason
            }
            for r in recommendations
        ]
    }


@router.get("/product/{product_id}/whatsapp")
async def get_recommendations_whatsapp(product_id: str, style: str = "street"):
    """
    Get recommendations formatted for WhatsApp.
    """
    recommendations = recommendation_service.get_related_products(product_id, 3)
    message = recommendation_service.format_recommendations_message(recommendations, style)
    
    return {
        "product_id": product_id,
        "whatsapp_message": message,
        "style": style
    }
