"""
KOFA Subscription & Pricing Service
Database-backed usage tracking and tier management.
Survives Heroku restarts — all counters persist in Azure SQL.
"""
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from enum import Enum
from pydantic import BaseModel
import logging
import uuid

logger = logging.getLogger(__name__)


class SubscriptionTier(str, Enum):
    """KOFA subscription tiers."""
    FREE = "free"
    GROW = "grow"
    PRO = "pro"


class TierLimits(BaseModel):
    """Usage limits per tier."""
    max_products: int
    max_orders_per_month: int
    max_ai_queries_per_month: int
    max_whatsapp_messages_per_day: int
    analytics_access: bool
    csv_import: bool
    instagram_bot: bool
    bulk_messaging: bool
    priority_support: bool
    max_team_members: int


class PricingPlan(BaseModel):
    """Pricing plan details."""
    tier: SubscriptionTier
    name: str
    price_ngn_monthly: float
    price_ngn_yearly: float
    limits: TierLimits
    features: List[str]


# ============== PRICING PLANS ==============
PRICING_PLANS: Dict[SubscriptionTier, PricingPlan] = {
    SubscriptionTier.FREE: PricingPlan(
        tier=SubscriptionTier.FREE,
        name="Free",
        price_ngn_monthly=0,
        price_ngn_yearly=0,
        limits=TierLimits(
            max_products=25,
            max_orders_per_month=50,
            max_ai_queries_per_month=15,
            max_whatsapp_messages_per_day=30,
            analytics_access=False,
            csv_import=False,
            instagram_bot=False,
            bulk_messaging=False,
            priority_support=False,
            max_team_members=0,
        ),
        features=[
            "Up to 25 products",
            "50 orders / month",
            "15 AI Assistant queries / month",
            "WhatsApp bot (30 msgs/day)",
            "Online Storefront",
            "Basic inventory tracking",
        ]
    ),
    SubscriptionTier.GROW: PricingPlan(
        tier=SubscriptionTier.GROW,
        name="Grow",
        price_ngn_monthly=4500,
        price_ngn_yearly=45000,
        limits=TierLimits(
            max_products=300,
            max_orders_per_month=500,
            max_ai_queries_per_month=150,
            max_whatsapp_messages_per_day=500,
            analytics_access=True,
            csv_import=True,
            instagram_bot=False,
            bulk_messaging=False,
            priority_support=False,
            max_team_members=0,
        ),
        features=[
            "Everything in Free, plus:",
            "Up to 300 products",
            "500 orders / month",
            "150 AI Assistant queries / month",
            "WhatsApp bot (500 msgs/day)",
            "Full Analytics Dashboard",
            "CSV Import / Export",
        ]
    ),
    SubscriptionTier.PRO: PricingPlan(
        tier=SubscriptionTier.PRO,
        name="Pro",
        price_ngn_monthly=10000,
        price_ngn_yearly=100000,
        limits=TierLimits(
            max_products=999999,  # Unlimited
            max_orders_per_month=999999,
            max_ai_queries_per_month=1000,
            max_whatsapp_messages_per_day=2000,
            analytics_access=True,
            csv_import=True,
            instagram_bot=True,
            bulk_messaging=False,  # Coming Soon
            priority_support=True,
            max_team_members=3,
        ),
        features=[
            "Everything in Grow, plus:",
            "Unlimited products",
            "Unlimited orders",
            "1,000 AI queries / month",
            "WhatsApp bot (2,000 msgs/day)",
            "Instagram DM bot",
            "Up to 5 Team Members",
            "Priority Support",
        ]
    ),
}


class SubscriptionService:
    """
    Database-backed subscription & usage tracking.
    All counters persist in Azure SQL via the usage_tracking table.
    """

    def get_plan(self, tier: SubscriptionTier) -> PricingPlan:
        """Get pricing plan details."""
        return PRICING_PLANS[tier]

    def get_all_plans(self) -> List[PricingPlan]:
        """Get all available pricing plans."""
        return list(PRICING_PLANS.values())

    def get_vendor_tier(self, db_session, user_id: str) -> SubscriptionTier:
        """Get a vendor's current subscription tier from DB."""
        from ..models import User
        user = db_session.query(User).filter(User.id == user_id).first()
        if not user or not user.subscription_tier:
            return SubscriptionTier.FREE
        
        # Check if subscription has expired
        if user.subscription_expires_at and user.subscription_expires_at < datetime.utcnow():
            # Auto-downgrade expired subscriptions
            user.subscription_tier = "free"
            user.subscription_expires_at = None
            db_session.commit()
            return SubscriptionTier.FREE
        
        try:
            return SubscriptionTier(user.subscription_tier)
        except ValueError:
            return SubscriptionTier.FREE

    def get_or_create_usage(self, db_session, user_id: str):
        """Get or create this month's usage tracking row."""
        from ..models import UsageTracking
        period = datetime.utcnow().strftime("%Y-%m")
        
        usage = db_session.query(UsageTracking).filter(
            UsageTracking.user_id == user_id,
            UsageTracking.period == period
        ).first()
        
        if not usage:
            usage = UsageTracking(
                id=str(uuid.uuid4()),
                user_id=user_id,
                period=period,
                orders_count=0,
                ai_queries_count=0,
                whatsapp_messages_count=0,
            )
            db_session.add(usage)
            db_session.commit()
            db_session.refresh(usage)
        
        return usage

    # ============== LIMIT CHECKS ==============

    def check_product_limit(self, db_session, user_id: str, current_count: int) -> dict:
        """Check if vendor can add more products."""
        tier = self.get_vendor_tier(db_session, user_id)
        plan = self.get_plan(tier)
        allowed = current_count < plan.limits.max_products
        return {
            "allowed": allowed,
            "current": current_count,
            "max": plan.limits.max_products,
            "upgrade_needed": not allowed and tier == SubscriptionTier.FREE,
        }

    def check_order_limit(self, db_session, user_id: str) -> dict:
        """Check if vendor can create more orders this month."""
        tier = self.get_vendor_tier(db_session, user_id)
        plan = self.get_plan(tier)
        usage = self.get_or_create_usage(db_session, user_id)
        allowed = usage.orders_count < plan.limits.max_orders_per_month
        return {
            "allowed": allowed,
            "current": usage.orders_count,
            "max": plan.limits.max_orders_per_month,
            "upgrade_needed": not allowed,
        }

    def check_ai_limit(self, db_session, user_id: str) -> dict:
        """Check if vendor can make more AI queries this month."""
        tier = self.get_vendor_tier(db_session, user_id)
        plan = self.get_plan(tier)
        usage = self.get_or_create_usage(db_session, user_id)
        allowed = usage.ai_queries_count < plan.limits.max_ai_queries_per_month
        return {
            "allowed": allowed,
            "current": usage.ai_queries_count,
            "max": plan.limits.max_ai_queries_per_month,
            "upgrade_needed": not allowed,
        }

    def check_whatsapp_limit(self, db_session, user_id: str) -> dict:
        """Check if vendor can send more WhatsApp messages today."""
        tier = self.get_vendor_tier(db_session, user_id)
        plan = self.get_plan(tier)
        usage = self.get_or_create_usage(db_session, user_id)
        # For daily limits we approximate using monthly total / days elapsed
        allowed = usage.whatsapp_messages_count < (plan.limits.max_whatsapp_messages_per_day * 30)
        return {
            "allowed": allowed,
            "current": usage.whatsapp_messages_count,
            "max": plan.limits.max_whatsapp_messages_per_day * 30,
            "upgrade_needed": not allowed,
        }

    def check_feature_access(self, db_session, user_id: str, feature: str) -> bool:
        """Check if vendor has access to a specific feature."""
        tier = self.get_vendor_tier(db_session, user_id)
        plan = self.get_plan(tier)
        
        feature_map = {
            "analytics": plan.limits.analytics_access,
            "csv_import": plan.limits.csv_import,
            "instagram_bot": plan.limits.instagram_bot,
            "bulk_messaging": plan.limits.bulk_messaging,
            "priority_support": plan.limits.priority_support,
            "team_members": plan.limits.max_team_members > 0,
        }
        return feature_map.get(feature, False)

    def check_team_limit(self, db_session, user_id: str) -> dict:
        """Check if vendor can add more team members (Pro only)."""
        from ..models import TeamMember
        tier = self.get_vendor_tier(db_session, user_id)
        plan = self.get_plan(tier)
        
        current_count = db_session.query(TeamMember).filter(
            TeamMember.owner_id == user_id,
            TeamMember.status.in_(["pending", "active"])
        ).count()
        
        allowed = current_count < plan.limits.max_team_members
        return {
            "allowed": allowed,
            "current": current_count,
            "max": plan.limits.max_team_members,
            "upgrade_needed": not allowed,
        }

    # ============== INCREMENT USAGE ==============

    def increment_order_count(self, db_session, user_id: str):
        """Increment order count for this month."""
        usage = self.get_or_create_usage(db_session, user_id)
        usage.orders_count += 1
        usage.updated_at = datetime.utcnow()
        db_session.commit()

    def increment_ai_count(self, db_session, user_id: str):
        """Increment AI query count for this month."""
        usage = self.get_or_create_usage(db_session, user_id)
        usage.ai_queries_count += 1
        usage.updated_at = datetime.utcnow()
        db_session.commit()

    def increment_whatsapp_count(self, db_session, user_id: str):
        """Increment WhatsApp message count for this month."""
        usage = self.get_or_create_usage(db_session, user_id)
        usage.whatsapp_messages_count += 1
        usage.updated_at = datetime.utcnow()
        db_session.commit()

    # ============== SUBSCRIPTION MANAGEMENT ==============

    def upgrade_subscription(self, db_session, user_id: str, new_tier: SubscriptionTier, payment_ref: Optional[str] = None):
        """Upgrade vendor to a new tier."""
        from ..models import User
        user = db_session.query(User).filter(User.id == user_id).first()
        if not user:
            return None
        
        user.subscription_tier = new_tier.value
        user.subscription_expires_at = datetime.utcnow() + timedelta(days=30)
        db_session.commit()
        
        logger.info(f"Vendor {user_id} upgraded to {new_tier.value}")
        return {"tier": new_tier.value, "expires_at": user.subscription_expires_at.isoformat()}

    # ============== TEAM MEMBER MANAGEMENT ==============

    def invite_team_member(self, db_session, owner_id: str, member_email: str, role: str = "staff") -> dict:
        """Invite a team member (Pro tier only)."""
        from ..models import TeamMember
        
        # Check feature access
        if not self.check_feature_access(db_session, owner_id, "team_members"):
            return {"error": "Team members require Pro subscription", "upgrade_needed": True}
        
        # Check team limit
        limit_check = self.check_team_limit(db_session, owner_id)
        if not limit_check["allowed"]:
            return {"error": f"Team member limit reached ({limit_check['max']})", "upgrade_needed": True}
        
        # Check for duplicate
        existing = db_session.query(TeamMember).filter(
            TeamMember.owner_id == owner_id,
            TeamMember.member_email == member_email,
            TeamMember.status.in_(["pending", "active"])
        ).first()
        if existing:
            return {"error": "This email has already been invited"}
        
        invite = TeamMember(
            id=str(uuid.uuid4()),
            owner_id=owner_id,
            member_email=member_email,
            role=role,
            status="pending",
        )
        db_session.add(invite)
        db_session.commit()
        
        logger.info(f"Team invite: {owner_id} invited {member_email} as {role}")
        return {"success": True, "invite_id": invite.id, "email": member_email, "role": role}

    def accept_team_invite(self, db_session, invite_id: str, member_user_id: str) -> dict:
        """Accept a team member invitation."""
        from ..models import TeamMember
        
        invite = db_session.query(TeamMember).filter(
            TeamMember.id == invite_id,
            TeamMember.status == "pending"
        ).first()
        
        if not invite:
            return {"error": "Invitation not found or already used"}
        
        invite.member_user_id = member_user_id
        invite.status = "active"
        invite.accepted_at = datetime.utcnow()
        db_session.commit()
        
        return {"success": True, "role": invite.role, "owner_id": invite.owner_id}

    def get_team_members(self, db_session, owner_id: str) -> list:
        """Get all team members for a vendor."""
        from ..models import TeamMember
        members = db_session.query(TeamMember).filter(
            TeamMember.owner_id == owner_id,
            TeamMember.status.in_(["pending", "active"])
        ).all()
        
        return [{
            "id": m.id,
            "email": m.member_email,
            "role": m.role,
            "status": m.status,
            "invited_at": m.invited_at.isoformat() if m.invited_at else None,
            "accepted_at": m.accepted_at.isoformat() if m.accepted_at else None,
        } for m in members]

    def revoke_team_member(self, db_session, owner_id: str, member_id: str) -> dict:
        """Remove a team member."""
        from ..models import TeamMember
        member = db_session.query(TeamMember).filter(
            TeamMember.id == member_id,
            TeamMember.owner_id == owner_id
        ).first()
        
        if not member:
            return {"error": "Team member not found"}
        
        member.status = "revoked"
        db_session.commit()
        return {"success": True, "revoked": member.member_email}

    def get_usage_summary(self, db_session, user_id: str) -> dict:
        """Get a complete usage summary for the vendor's dashboard."""
        tier = self.get_vendor_tier(db_session, user_id)
        plan = self.get_plan(tier)
        usage = self.get_or_create_usage(db_session, user_id)
        
        return {
            "tier": tier.value,
            "plan_name": plan.name,
            "price_monthly": plan.price_ngn_monthly,
            "period": usage.period,
            "usage": {
                "orders": {"used": usage.orders_count, "limit": plan.limits.max_orders_per_month},
                "ai_queries": {"used": usage.ai_queries_count, "limit": plan.limits.max_ai_queries_per_month},
                "whatsapp_messages": {"used": usage.whatsapp_messages_count, "limit": plan.limits.max_whatsapp_messages_per_day * 30},
            },
            "features": {
                "analytics": plan.limits.analytics_access,
                "csv_import": plan.limits.csv_import,
                "instagram_bot": plan.limits.instagram_bot,
                "team_members": plan.limits.max_team_members,
                "priority_support": plan.limits.priority_support,
            }
        }


# Singleton instance
subscription_service = SubscriptionService()
