# owo_flow/chatbot/services/recommendations.py
"""
Product Recommendation Engine for Nigerian Market
Provides "Customers who bought X also bought Y" functionality.
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
import random


@dataclass
class ProductRecommendation:
    """Single product recommendation."""
    product_id: str
    product_name: str
    price_ngn: float
    reason: str  # Why recommended
    score: float  # Relevance score 0-1


class RecommendationService:
    """
    AI-powered product recommendations.
    Uses category affinity and purchase patterns.
    """
    
    def __init__(self):
        # Mock product catalog
        self._products = [
            {"id": "1", "name": "Nike Air Max Red", "category": "Footwear", "price": 45000, "tags": ["sports", "sneakers", "nike"]},
            {"id": "2", "name": "Adidas White Sneakers", "category": "Footwear", "price": 38000, "tags": ["sports", "sneakers", "adidas"]},
            {"id": "3", "name": "Men Formal Shirt White", "category": "Clothing", "price": 15000, "tags": ["formal", "office", "shirt"]},
            {"id": "4", "name": "Designer Blue Jeans", "category": "Clothing", "price": 25000, "tags": ["casual", "denim", "jeans"]},
            {"id": "5", "name": "Black Leather Bag", "category": "Accessories", "price": 35000, "tags": ["leather", "bag", "premium"]},
            {"id": "6", "name": "Plain Round Neck T-Shirt", "category": "Clothing", "price": 8000, "tags": ["casual", "basic", "tshirt"]},
            {"id": "7", "name": "iPhone Charger Fast Charging", "category": "Electronics", "price": 12000, "tags": ["phone", "charger", "apple"]},
            {"id": "8", "name": "Leather Belt Brown", "category": "Accessories", "price": 8500, "tags": ["leather", "belt", "formal"]},
            {"id": "9", "name": "Sports Watch Black", "category": "Accessories", "price": 22000, "tags": ["sports", "watch", "fitness"]},
            {"id": "10", "name": "Polo Shirt Blue", "category": "Clothing", "price": 12000, "tags": ["casual", "polo", "smart"]},
        ]
        
        # Category affinities (what categories are often bought together)
        self._category_affinity = {
            "Footwear": ["Accessories", "Clothing"],
            "Clothing": ["Footwear", "Accessories"],
            "Accessories": ["Clothing", "Footwear"],
            "Electronics": ["Accessories"],
        }
        
        # Mock "bought together" patterns
        self._bought_together = {
            "1": ["2", "9", "4"],      # Nike Air Max often bought with Adidas, Watch, Jeans
            "2": ["1", "6", "9"],      # Adidas with Nike, T-shirt, Watch
            "3": ["8", "4", "5"],      # Formal Shirt with Belt, Jeans, Bag
            "4": ["6", "3", "1"],      # Jeans with T-shirt, Shirt, Sneakers
            "5": ["3", "8"],           # Bag with Shirt, Belt
            "6": ["4", "2"],           # T-shirt with Jeans, Sneakers
            "7": [],                   # Charger (standalone)
            "8": ["3", "5"],           # Belt with Shirt, Bag
            "9": ["1", "2"],           # Watch with Sneakers
            "10": ["4", "8"],          # Polo with Jeans, Belt
        }
    
    def get_product_by_id(self, product_id: str) -> Optional[Dict]:
        """Get product by ID."""
        return next((p for p in self._products if p["id"] == product_id), None)
    
    def get_related_products(
        self,
        product_id: str,
        limit: int = 4
    ) -> List[ProductRecommendation]:
        """
        Get products related to a specific product.
        Uses "frequently bought together" data.
        """
        product = self.get_product_by_id(product_id)
        if not product:
            return []
        
        recommendations = []
        
        # First: Products frequently bought together
        bought_together_ids = self._bought_together.get(product_id, [])
        for pid in bought_together_ids[:limit]:
            related_product = self.get_product_by_id(pid)
            if related_product:
                recommendations.append(ProductRecommendation(
                    product_id=pid,
                    product_name=related_product["name"],
                    price_ngn=related_product["price"],
                    reason="Frequently bought together",
                    score=0.9
                ))
        
        # Second: Same category products
        if len(recommendations) < limit:
            same_category = [
                p for p in self._products
                if p["category"] == product["category"] and p["id"] != product_id
            ]
            for p in same_category[:limit - len(recommendations)]:
                if not any(r.product_id == p["id"] for r in recommendations):
                    recommendations.append(ProductRecommendation(
                        product_id=p["id"],
                        product_name=p["name"],
                        price_ngn=p["price"],
                        reason=f"More from {product['category']}",
                        score=0.7
                    ))
        
        return recommendations[:limit]
    
    def get_category_recommendations(
        self,
        category: str,
        limit: int = 4
    ) -> List[ProductRecommendation]:
        """Get recommended products for browsing a category."""
        # Products in this category
        category_products = [p for p in self._products if p["category"] == category]
        
        # Add products from related categories
        related_categories = self._category_affinity.get(category, [])
        related_products = [
            p for p in self._products
            if p["category"] in related_categories
        ]
        
        recommendations = []
        
        # Top from current category (shuffle for variety)
        random.shuffle(category_products)
        for p in category_products[:2]:
            recommendations.append(ProductRecommendation(
                product_id=p["id"],
                product_name=p["name"],
                price_ngn=p["price"],
                reason=f"Popular in {category}",
                score=0.85
            ))
        
        # Add related category items
        random.shuffle(related_products)
        for p in related_products[:limit - len(recommendations)]:
            recommendations.append(ProductRecommendation(
                product_id=p["id"],
                product_name=p["name"],
                price_ngn=p["price"],
                reason="You might also like",
                score=0.65
            ))
        
        return recommendations[:limit]
    
    def get_trending_products(self, limit: int = 5) -> List[ProductRecommendation]:
        """Get currently trending products."""
        # In production, this would be based on actual sales velocity
        # For now, return a curated "trending" list
        trending_ids = ["1", "4", "6", "5", "9"]
        
        recommendations = []
        for pid in trending_ids[:limit]:
            product = self.get_product_by_id(pid)
            if product:
                recommendations.append(ProductRecommendation(
                    product_id=pid,
                    product_name=product["name"],
                    price_ngn=product["price"],
                    reason="🔥 Trending now",
                    score=0.95
                ))
        
        return recommendations
    
    def get_personalized_recommendations(
        self,
        customer_phone: str,
        purchase_history: List[str],
        limit: int = 4
    ) -> List[ProductRecommendation]:
        """
        Get personalized recommendations based on purchase history.
        
        Args:
            customer_phone: Customer identifier
            purchase_history: List of previously purchased product IDs
            limit: Number of recommendations
        """
        if not purchase_history:
            # New customer - show trending
            return self.get_trending_products(limit)
        
        recommendations = []
        seen_ids = set(purchase_history)
        
        # Get recommendations based on each purchased product
        for pid in purchase_history[-3:]:  # Last 3 purchases
            related = self.get_related_products(pid, limit=2)
            for rec in related:
                if rec.product_id not in seen_ids:
                    rec.reason = "Based on your purchase history"
                    recommendations.append(rec)
                    seen_ids.add(rec.product_id)
        
        # Fill with trending if needed
        if len(recommendations) < limit:
            for rec in self.get_trending_products(limit):
                if rec.product_id not in seen_ids:
                    recommendations.append(rec)
                    seen_ids.add(rec.product_id)
        
        return recommendations[:limit]
    
    def get_upsell_products(
        self,
        cart_product_ids: List[str],
        limit: int = 2
    ) -> List[ProductRecommendation]:
        """
        Get upsell recommendations for checkout.
        "Complete your purchase with these items."
        """
        if not cart_product_ids:
            return []
        
        recommendations = []
        cart_categories = set()
        
        for pid in cart_product_ids:
            product = self.get_product_by_id(pid)
            if product:
                cart_categories.add(product["category"])
        
        # Find complementary categories not in cart
        complementary = set()
        for cat in cart_categories:
            related = self._category_affinity.get(cat, [])
            for rel_cat in related:
                if rel_cat not in cart_categories:
                    complementary.add(rel_cat)
        
        # Get products from complementary categories
        for cat in complementary:
            cat_products = [p for p in self._products if p["category"] == cat]
            if cat_products:
                product = random.choice(cat_products)
                recommendations.append(ProductRecommendation(
                    product_id=product["id"],
                    product_name=product["name"],
                    price_ngn=product["price"],
                    reason="Complete your look",
                    score=0.8
                ))
        
        return recommendations[:limit]
    
    def format_recommendations_message(
        self,
        recommendations: List[ProductRecommendation],
        style: str = "street"
    ) -> str:
        """Format recommendations for WhatsApp."""
        if not recommendations:
            return ""
        
        if style == "street":
            lines = ["🔥 *You go like these ones too:*\n"]
            for rec in recommendations:
                lines.append(f"• {rec.product_name} - ₦{rec.price_ngn:,.0f}")
            lines.append("\n_Just mention any product to check am!_")
        else:
            lines = ["📌 *Recommended for You:*\n"]
            for rec in recommendations:
                lines.append(f"• {rec.product_name} - ₦{rec.price_ngn:,.0f}")
                lines.append(f"  _{rec.reason}_")
            lines.append("\n_Let me know if you'd like details on any of these._")
        
        return "\n".join(lines)


# Singleton instance
recommendation_service = RecommendationService()
