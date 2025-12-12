# owo_flow/chatbot/routers/installments.py
"""
Installments API Router
BNPL (Buy Now Pay Later) endpoints.
"""
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional

from ..services.installments import installment_service

router = APIRouter()


class CheckEligibilityRequest(BaseModel):
    customer_phone: str
    order_amount: float


class CreateInstallmentRequest(BaseModel):
    customer_phone: str
    customer_name: str
    order_id: str
    order_amount: float
    plan_id: str


@router.get("/plans")
async def get_installment_plans(order_amount: Optional[float] = None):
    """
    Get available installment plans.
    Optionally filter by order amount eligibility.
    """
    return {"plans": installment_service.get_plans(order_amount)}


@router.post("/check-eligibility")
async def check_eligibility(request: CheckEligibilityRequest):
    """
    Check if customer is eligible for installment payment.
    """
    result = installment_service.check_eligibility(
        request.customer_phone,
        request.order_amount
    )
    return result


@router.get("/calculate")
async def calculate_installment(amount: float, plan_id: str):
    """
    Calculate installment breakdown for an amount.
    """
    try:
        result = installment_service.calculate_installment(amount, plan_id)
        return result
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.post("/create-plan")
async def create_installment_plan(request: CreateInstallmentRequest):
    """
    Create a new installment plan application.
    """
    try:
        application = installment_service.create_application(
            customer_phone=request.customer_phone,
            customer_name=request.customer_name,
            order_id=request.order_id,
            order_amount=request.order_amount,
            plan_id=request.plan_id
        )
        
        return {
            "application_id": application.application_id,
            "order_id": application.order_id,
            "status": application.status.value,
            "plan": {
                "monthly_payment": application.monthly_payment_ngn,
                "duration_months": application.duration_months,
                "total_amount": application.total_amount_ngn,
                "interest_amount": application.interest_amount_ngn
            },
            "payment_schedule": application.payment_schedule,
            "provider": application.provider.value,
            "created_at": application.created_at.isoformat()
        }
    except ValueError as e:
        raise HTTPException(400, str(e))


@router.get("/application/{application_id}")
async def get_application(application_id: str):
    """
    Get installment application details.
    """
    application = installment_service.get_application(application_id)
    
    if not application:
        raise HTTPException(404, f"Application {application_id} not found")
    
    return {
        "application_id": application.application_id,
        "customer_phone": application.customer_phone,
        "customer_name": application.customer_name,
        "order_id": application.order_id,
        "status": application.status.value,
        "plan": {
            "principal": application.principal_amount_ngn,
            "monthly_payment": application.monthly_payment_ngn,
            "duration_months": application.duration_months,
            "total_amount": application.total_amount_ngn,
            "interest_amount": application.interest_amount_ngn
        },
        "payment_schedule": application.payment_schedule,
        "provider": application.provider.value,
        "created_at": application.created_at.isoformat(),
        "approved_at": application.approved_at.isoformat() if application.approved_at else None
    }


@router.get("/customer/{customer_phone}")
async def get_customer_applications(customer_phone: str):
    """
    Get all installment applications for a customer.
    """
    applications = installment_service.get_customer_applications(customer_phone)
    
    return {
        "customer_phone": customer_phone,
        "applications": [
            {
                "application_id": app.application_id,
                "order_id": app.order_id,
                "status": app.status.value,
                "monthly_payment": app.monthly_payment_ngn,
                "total_amount": app.total_amount_ngn,
                "created_at": app.created_at.isoformat()
            }
            for app in applications
        ]
    }


@router.get("/offer")
async def get_installment_offer(amount: float, style: str = "street"):
    """
    Get formatted installment offer for WhatsApp.
    """
    message = installment_service.format_installment_offer(amount, style)
    
    return {
        "order_amount": amount,
        "whatsapp_message": message,
        "style": style
    }
