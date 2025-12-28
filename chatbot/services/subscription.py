"""
KOFA Subscription & Pricing Service
Manages freemium tiers, usage limits, and subscription status.
"""
import os
from typing import Optional, Dict, Any, List
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel
import logging

logger = logging.getLogger(__name__)


class SubscriptionTier(str, Enum):
    """KOFA subscription tiers."""
    FREE = "free"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class TierLimits(BaseModel):
    """Usage limits per tier."""
    messages_per_day: int
    products_limit: int
    analytics_access: bool
    voice_transcription: bool
    multi_platform: bool
    bulk_operations: bool
    priority_support: bool
    api_access: bool
    team_members: int


class PricingPlan(BaseModel):
    """Pricing plan details."""
    tier: SubscriptionTier
    name: str
    price_ngn_monthly: float
    price_ngn_yearly: float  # With discount
    limits: TierLimits
    features: List[str]


# Define pricing tiers
PRICING_PLANS: Dict[SubscriptionTier, PricingPlan] = {
    SubscriptionTier.FREE: PricingPlan(
        tier=SubscriptionTier.FREE,
        name="Starter",
        price_ngn_monthly=0,
        price_ngn_yearly=0,
        limits=TierLimits(
            messages_per_day=100,
            products_limit=50,
            analytics_access=False,
            voice_transcription=True,  # Free with Gemini
            multi_platform=False,
            bulk_operations=False,
            priority_support=False,
            api_access=False,
            team_members=1
        ),
        features=[
            "WhatsApp chatbot (100 msgs/day)",
            "Up to 50 products",
            "Basic inventory tracking",
            "Voice note support (Pidgin)",
            "Offline mode",
            "Payment link generation"
        ]
    ),
    SubscriptionTier.PRO: PricingPlan(
        tier=SubscriptionTier.PRO,
        name="Pro",
        price_ngn_monthly=2000,
        price_ngn_yearly=20000,  # 2 months free
        limits=TierLimits(
            messages_per_day=1000,
            products_limit=500,
            analytics_access=True,
            voice_transcription=True,
            multi_platform=True,
            bulk_operations=True,
            priority_support=False,
            api_access=False,
            team_members=3
        ),
        features=[
            "Everything in Starter, plus:",
            "1,000 messages/day",
            "Up to 500 products",
            "Full analytics dashboard",
            "Instagram + TikTok bots",
            "Bulk CSV import/export",
            "Push notifications",
            "3 team members"
        ]
    ),
    SubscriptionTier.ENTERPRISE: PricingPlan(
        tier=SubscriptionTier.ENTERPRISE,
        name="Enterprise",
        price_ngn_monthly=10000,
        price_ngn_yearly=100000,  # 2 months free
        limits=TierLimits(
            messages_per_day=10000,
            products_limit=5000,
            analytics_access=True,
            voice_transcription=True,
            multi_platform=True,
            bulk_operations=True,
            priority_support=True,
            api_access=True,
            team_members=20
        ),
        features=[
            "Everything in Pro, plus:",
            "Unlimited messages",
            "Up to 5,000 products",
            "API access for integrations",
            "Priority WhatsApp support",
            "Custom bot personality",
            "White-label options",
            "20 team members",
            "Dedicated account manager"
        ]
    )
}


class VendorSubscription(BaseModel):
    """Vendor's current subscription status."""
    vendor_id: str
    tier: SubscriptionTier
    started_at: str
    expires_at: Optional[str] = None
    is_active: bool = True
    messages_used_today: int = 0
    products_count: int = 0
    payment_method: Optional[str] = None


class SubscriptionService:
    """
    Manage vendor subscriptions and usage limits.
    """
    
    def __init__(self):
        # In production, this would be stored in Supabase
        self._subscriptions: Dict[str, VendorSubscription] = {}
        self._usage_cache: Dict[str, Dict[str, int]] = {}  # vendor_id -> {date: count}
    
    def get_plan(self, tier: SubscriptionTier) -> PricingPlan:
        """Get pricing plan details."""
        return PRICING_PLANS[tier]
    
    def get_all_plans(self) -> List[PricingPlan]:
        """Get all available pricing plans."""
        return list(PRICING_PLANS.values())
    
    def get_subscription(self, vendor_id: str) -> VendorSubscription:
        """
        Get vendor's current subscription.
        New vendors start on FREE tier.
        """
        if vendor_id not in self._subscriptions:
            # Create default free subscription
            self._subscriptions[vendor_id] = VendorSubscription(
                vendor_id=vendor_id,
                tier=SubscriptionTier.FREE,
                started_at=datetime.now().isoformat(),
                is_active=True
            )
        
        return self._subscriptions[vendor_id]
    
    def check_message_limit(self, vendor_id: str) -> tuple[bool, int, int]:
        """
        Check if vendor can send more messages today.
        
        Returns:
            (can_send, used_today, daily_limit)
        """
        subscription = self.get_subscription(vendor_id)
        plan = self.get_plan(subscription.tier)
        
        today = datetime.now().strftime("%Y-%m-%d")
        
        # Get or initialize today's usage
        if vendor_id not in self._usage_cache:
            self._usage_cache[vendor_id] = {}
        
        used_today = self._usage_cache[vendor_id].get(today, 0)
        daily_limit = plan.limits.messages_per_day
        
        can_send = used_today < daily_limit
        
        return (can_send, used_today, daily_limit)
    
    def increment_message_count(self, vendor_id: str) -> int:
        """
        Increment message count for today.
        Returns new count.
        """
        today = datetime.now().strftime("%Y-%m-%d")
        
        if vendor_id not in self._usage_cache:
            self._usage_cache[vendor_id] = {}
        
        current = self._usage_cache[vendor_id].get(today, 0)
        self._usage_cache[vendor_id][today] = current + 1
        
        return current + 1
    
    def check_feature_access(self, vendor_id: str, feature: str) -> bool:
        """
        Check if vendor has access to a specific feature.
        
        Features: analytics, multi_platform, bulk_operations, api_access, priority_support
        """
        subscription = self.get_subscription(vendor_id)
        plan = self.get_plan(subscription.tier)
        
        feature_map = {
            "analytics": plan.limits.analytics_access,
            "multi_platform": plan.limits.multi_platform,
            "bulk_operations": plan.limits.bulk_operations,
            "api_access": plan.limits.api_access,
            "priority_support": plan.limits.priority_support,
            "voice_transcription": plan.limits.voice_transcription
        }
        
        return feature_map.get(feature, False)
    
    def check_product_limit(self, vendor_id: str, current_count: int) -> tuple[bool, int]:
        """
        Check if vendor can add more products.
        
        Returns:
            (can_add, limit)
        """
        subscription = self.get_subscription(vendor_id)
        plan = self.get_plan(subscription.tier)
        
        return (current_count < plan.limits.products_limit, plan.limits.products_limit)
    
    def upgrade_subscription(
        self, 
        vendor_id: str, 
        new_tier: SubscriptionTier,
        payment_reference: Optional[str] = None
    ) -> VendorSubscription:
        """
        Upgrade vendor to a new tier.
        """
        subscription = self.get_subscription(vendor_id)
        
        # Calculate expiry (1 month from now)
        expires_at = (datetime.now() + timedelta(days=30)).isoformat()
        
        subscription.tier = new_tier
        subscription.started_at = datetime.now().isoformat()
        subscription.expires_at = expires_at
        subscription.is_active = True
        subscription.payment_method = payment_reference
        
        self._subscriptions[vendor_id] = subscription
        
        logger.info(f"Vendor {vendor_id} upgraded to {new_tier.value}")
        return subscription
    
    def get_upgrade_url(self, vendor_id: str, target_tier: SubscriptionTier) -> str:
        """
        Generate a payment URL for upgrading subscription.
        This would integrate with Paystack.
        """
        plan = self.get_plan(target_tier)
        
        # In production, create a Paystack payment link
        return f"https://paystack.com/pay/kofa-{target_tier.value}-{vendor_id}"


# Singleton instance
subscription_service = SubscriptionService()
