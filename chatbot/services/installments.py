# owo_flow/chatbot/services/installments.py
"""
Installment/BNPL Service for Nigerian Market
"Pay Small-Small" - Buy Now Pay Later integration.
Supports: Credpal, Carbon, Paystack (mock implementation)
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import uuid


class BNPLProvider(Enum):
    CREDPAL = "credpal"
    CARBON = "carbon"
    PAYSTACK_SPLIT = "paystack_split"


class InstallmentStatus(Enum):
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    ACTIVE = "active"
    COMPLETED = "completed"
    DEFAULTED = "defaulted"
    CANCELLED = "cancelled"


@dataclass
class InstallmentPlan:
    """Available installment plan."""
    plan_id: str
    name: str
    duration_months: int
    interest_rate_percent: float
    min_amount_ngn: float
    max_amount_ngn: float
    provider: BNPLProvider


@dataclass
class InstallmentApplication:
    """Customer installment application."""
    application_id: str
    customer_phone: str
    customer_name: str
    order_id: str
    plan_id: str
    principal_amount_ngn: float
    total_amount_ngn: float
    monthly_payment_ngn: float
    duration_months: int
    interest_amount_ngn: float
    status: InstallmentStatus
    provider: BNPLProvider
    created_at: datetime
    approved_at: Optional[datetime]
    payment_schedule: List[Dict]


# Available BNPL Plans
INSTALLMENT_PLANS: Dict[str, InstallmentPlan] = {
    "3_month_0": InstallmentPlan(
        plan_id="3_month_0",
        name="3 Months (0% Interest)",
        duration_months=3,
        interest_rate_percent=0,
        min_amount_ngn=20000,
        max_amount_ngn=200000,
        provider=BNPLProvider.CREDPAL
    ),
    "6_month_5": InstallmentPlan(
        plan_id="6_month_5",
        name="6 Months (5% Interest)",
        duration_months=6,
        interest_rate_percent=5,
        min_amount_ngn=50000,
        max_amount_ngn=500000,
        provider=BNPLProvider.CARBON
    ),
    "12_month_10": InstallmentPlan(
        plan_id="12_month_10",
        name="12 Months (10% Interest)",
        duration_months=12,
        interest_rate_percent=10,
        min_amount_ngn=100000,
        max_amount_ngn=1000000,
        provider=BNPLProvider.CARBON
    ),
    "4_week_0": InstallmentPlan(
        plan_id="4_week_0",
        name="4 Weekly Payments (0% Interest)",
        duration_months=1,
        interest_rate_percent=0,
        min_amount_ngn=10000,
        max_amount_ngn=100000,
        provider=BNPLProvider.PAYSTACK_SPLIT
    ),
}

# Mock applications database
_applications_db: Dict[str, InstallmentApplication] = {}


class InstallmentService:
    """
    BNPL (Buy Now Pay Later) service.
    Enables "Pay small-small" for Nigerian customers.
    """
    
    def __init__(self):
        pass
    
    def get_plans(self, order_amount: Optional[float] = None) -> List[Dict]:
        """
        Get available installment plans.
        Optionally filter by order amount eligibility.
        """
        plans = []
        for plan in INSTALLMENT_PLANS.values():
            plan_info = {
                "plan_id": plan.plan_id,
                "name": plan.name,
                "duration_months": plan.duration_months,
                "interest_rate_percent": plan.interest_rate_percent,
                "min_amount_ngn": plan.min_amount_ngn,
                "max_amount_ngn": plan.max_amount_ngn,
                "provider": plan.provider.value
            }
            
            if order_amount:
                eligible = plan.min_amount_ngn <= order_amount <= plan.max_amount_ngn
                plan_info["eligible"] = eligible
                
                if eligible:
                    calc = self.calculate_installment(order_amount, plan.plan_id)
                    plan_info["monthly_payment"] = calc["monthly_payment_ngn"]
                    plan_info["total_amount"] = calc["total_amount_ngn"]
            
            plans.append(plan_info)
        
        return plans
    
    def calculate_installment(
        self,
        principal_amount: float,
        plan_id: str
    ) -> Dict:
        """Calculate installment breakdown for a given amount and plan."""
        plan = INSTALLMENT_PLANS.get(plan_id)
        if not plan:
            raise ValueError(f"Unknown plan: {plan_id}")
        
        if principal_amount < plan.min_amount_ngn or principal_amount > plan.max_amount_ngn:
            raise ValueError(
                f"Amount ₦{principal_amount:,.0f} not eligible for {plan.name}. "
                f"Range: ₦{plan.min_amount_ngn:,.0f} - ₦{plan.max_amount_ngn:,.0f}"
            )
        
        interest_amount = principal_amount * (plan.interest_rate_percent / 100)
        total_amount = principal_amount + interest_amount
        monthly_payment = total_amount / plan.duration_months
        
        return {
            "plan_id": plan_id,
            "plan_name": plan.name,
            "principal_amount_ngn": principal_amount,
            "interest_rate_percent": plan.interest_rate_percent,
            "interest_amount_ngn": round(interest_amount, 2),
            "total_amount_ngn": round(total_amount, 2),
            "duration_months": plan.duration_months,
            "monthly_payment_ngn": round(monthly_payment, 2),
            "provider": plan.provider.value
        }
    
    def check_eligibility(
        self,
        customer_phone: str,
        order_amount: float
    ) -> Dict:
        """
        Check customer eligibility for BNPL.
        In production, this would check credit score, previous defaults, etc.
        """
        # Mock eligibility check
        # In production: call Credpal/Carbon API for credit check
        
        eligible_plans = []
        for plan in INSTALLMENT_PLANS.values():
            if plan.min_amount_ngn <= order_amount <= plan.max_amount_ngn:
                calc = self.calculate_installment(order_amount, plan.plan_id)
                eligible_plans.append({
                    "plan_id": plan.plan_id,
                    "name": plan.name,
                    "monthly_payment": calc["monthly_payment_ngn"]
                })
        
        return {
            "customer_phone": customer_phone,
            "order_amount": order_amount,
            "eligible": len(eligible_plans) > 0,
            "eligible_plans": eligible_plans,
            "credit_limit_ngn": 500000,  # Mock credit limit
            "message": "E get plan wey go work for you!" if eligible_plans else "Amount too small for installment o."
        }
    
    def create_application(
        self,
        customer_phone: str,
        customer_name: str,
        order_id: str,
        order_amount: float,
        plan_id: str
    ) -> InstallmentApplication:
        """
        Create a new installment application.
        In production, this submits to the BNPL provider.
        """
        calc = self.calculate_installment(order_amount, plan_id)
        plan = INSTALLMENT_PLANS[plan_id]
        
        application_id = f"BNPL-{uuid.uuid4().hex[:8].upper()}"
        now = datetime.now()
        
        # Generate payment schedule
        schedule = []
        for i in range(plan.duration_months):
            due_date = now + timedelta(days=30 * (i + 1))
            schedule.append({
                "installment_number": i + 1,
                "amount_ngn": calc["monthly_payment_ngn"],
                "due_date": due_date.strftime("%Y-%m-%d"),
                "status": "pending"
            })
        
        application = InstallmentApplication(
            application_id=application_id,
            customer_phone=customer_phone,
            customer_name=customer_name,
            order_id=order_id,
            plan_id=plan_id,
            principal_amount_ngn=order_amount,
            total_amount_ngn=calc["total_amount_ngn"],
            monthly_payment_ngn=calc["monthly_payment_ngn"],
            duration_months=plan.duration_months,
            interest_amount_ngn=calc["interest_amount_ngn"],
            status=InstallmentStatus.PENDING_APPROVAL,
            provider=plan.provider,
            created_at=now,
            approved_at=None,
            payment_schedule=schedule
        )
        
        _applications_db[application_id] = application
        
        # Auto-approve for demo (in production, wait for provider callback)
        self.approve_application(application_id)
        
        return application
    
    def approve_application(self, application_id: str) -> Optional[InstallmentApplication]:
        """Approve an installment application (webhook callback from provider)."""
        application = _applications_db.get(application_id)
        if application:
            application.status = InstallmentStatus.APPROVED
            application.approved_at = datetime.now()
        return application
    
    def get_application(self, application_id: str) -> Optional[InstallmentApplication]:
        """Get application by ID."""
        return _applications_db.get(application_id)
    
    def get_customer_applications(self, customer_phone: str) -> List[InstallmentApplication]:
        """Get all applications for a customer."""
        return [
            app for app in _applications_db.values()
            if app.customer_phone == customer_phone
        ]
    
    def format_installment_offer(
        self,
        order_amount: float,
        style: str = "street"
    ) -> str:
        """Format installment options for WhatsApp."""
        eligible_plans = [
            (plan_id, self.calculate_installment(order_amount, plan_id))
            for plan_id, plan in INSTALLMENT_PLANS.items()
            if plan.min_amount_ngn <= order_amount <= plan.max_amount_ngn
        ]
        
        if not eligible_plans:
            if style == "street":
                return f"For ₦{order_amount:,.0f}, installment no dey available. Pay full one time!"
            else:
                return f"Installment not available for ₦{order_amount:,.0f}. Full payment required."
        
        if style == "street":
            lines = [
                f"💳 *Pay Small-Small Options for ₦{order_amount:,.0f}:*\n"
            ]
            for plan_id, calc in eligible_plans:
                if calc["interest_rate_percent"] == 0:
                    lines.append(f"✅ *{calc['plan_name']}*")
                    lines.append(f"   Pay ₦{calc['monthly_payment_ngn']:,.0f}/month - No extra charge!")
                else:
                    lines.append(f"📌 *{calc['plan_name']}*")
                    lines.append(f"   Pay ₦{calc['monthly_payment_ngn']:,.0f}/month")
                    lines.append(f"   Total: ₦{calc['total_amount_ngn']:,.0f}")
                lines.append("")
            
            lines.append("Reply with plan number to proceed (e.g., '3 months')")
        else:
            lines = [
                f"💳 *Installment Options for ₦{order_amount:,.0f}:*\n"
            ]
            for plan_id, calc in eligible_plans:
                lines.append(f"**{calc['plan_name']}**")
                lines.append(f"• Monthly Payment: ₦{calc['monthly_payment_ngn']:,.0f}")
                lines.append(f"• Total Amount: ₦{calc['total_amount_ngn']:,.0f}")
                lines.append(f"• Interest: {calc['interest_rate_percent']}%")
                lines.append("")
            
            lines.append("Reply with your preferred plan to proceed.")
        
        return "\n".join(lines)
    
    def format_application_confirmation(
        self,
        application: InstallmentApplication,
        style: str = "street"
    ) -> str:
        """Format application confirmation for WhatsApp."""
        if style == "street":
            return f"""✅ *Pay Small-Small Don Approve!*

Application: {application.application_id}
Order: {application.order_id}

💰 *Your Payment Plan:*
• Monthly: ₦{application.monthly_payment_ngn:,.0f}
• Duration: {application.duration_months} months
• Total: ₦{application.total_amount_ngn:,.0f}

First payment go come out on {application.payment_schedule[0]['due_date']}.

Any question? Just reply! 🙏"""
        else:
            return f"""✅ *Installment Plan Approved*

Application ID: {application.application_id}
Order Reference: {application.order_id}

*Payment Schedule:*
• Monthly Payment: ₦{application.monthly_payment_ngn:,.0f}
• Duration: {application.duration_months} months
• Total Amount: ₦{application.total_amount_ngn:,.0f}

Your first payment is due on {application.payment_schedule[0]['due_date']}.

For questions, please reply to this message."""


# Singleton instance
installment_service = InstallmentService()
