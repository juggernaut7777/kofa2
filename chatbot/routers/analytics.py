# kofa/chatbot/routers/analytics.py
"""
Analytics API Router
Dashboard endpoints for revenue, products, and customers.
PRIVACY: All endpoints accept user_id to return only the requesting vendor's data.
"""
from fastapi import APIRouter
from typing import Optional

from ..services.analytics import analytics_service, get_analytics_service, TimePeriod

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard(period: Optional[str] = "month", user_id: Optional[str] = None):
    """
    Get complete dashboard data.
    PRIVACY: Returns only the requesting vendor's dashboard data.
    
    Query params:
    - period: today, week, month, quarter, year (default: month)
    - user_id: vendor ID for data isolation
    """
    try:
        time_period = TimePeriod(period)
    except ValueError:
        time_period = TimePeriod.MONTH
    
    # PRIVACY: Use vendor-scoped analytics service
    service = get_analytics_service(user_id) if user_id else analytics_service
    dashboard = service.get_dashboard(time_period)
    
    return {
        "revenue": {
            "period": dashboard.revenue.period,
            "total_ngn": dashboard.revenue.total_revenue_ngn,
            "order_count": dashboard.revenue.order_count,
            "average_order_value": dashboard.revenue.average_order_value,
            "growth_percent": dashboard.revenue.growth_percent
        },
        "top_products": [
            {
                "product_id": p.product_id,
                "name": p.product_name,
                "units_sold": p.units_sold,
                "revenue_ngn": p.revenue_ngn,
                "stock_remaining": p.stock_remaining,
                "category": p.category
            }
            for p in dashboard.top_products
        ],
        "top_customers": [
            {
                "phone": c.customer_phone,
                "name": c.customer_name,
                "total_orders": c.total_orders,
                "total_spent_ngn": c.total_spent_ngn,
                "favorite_category": c.favorite_category
            }
            for c in dashboard.top_customers
        ],
        "recent_orders": dashboard.recent_orders[:5],
        "low_stock_alerts": dashboard.low_stock_alerts,
        "trend": dashboard.period_comparison
    }


@router.get("/revenue")
async def get_revenue(period: Optional[str] = "month", user_id: Optional[str] = None):
    """
    Get revenue breakdown.
    PRIVACY: Returns only the requesting vendor's revenue.
    """
    try:
        time_period = TimePeriod(period)
    except ValueError:
        time_period = TimePeriod.MONTH
    
    service = get_analytics_service(user_id) if user_id else analytics_service
    revenue = service.get_revenue_metrics(time_period)
    
    return {
        "period": revenue.period,
        "total_revenue_ngn": revenue.total_revenue_ngn,
        "order_count": revenue.order_count,
        "average_order_value": round(revenue.average_order_value, 2),
        "growth_percent": revenue.growth_percent,
        "formatted_total": f"₦{revenue.total_revenue_ngn:,.0f}"
    }


@router.get("/products/top")
async def get_top_products(limit: int = 5, period: Optional[str] = "month", user_id: Optional[str] = None):
    """
    Get bestselling products.
    PRIVACY: Returns only the requesting vendor's top products.
    """
    try:
        time_period = TimePeriod(period)
    except ValueError:
        time_period = TimePeriod.MONTH
    
    service = get_analytics_service(user_id) if user_id else analytics_service
    products = service.get_top_products(limit, time_period)
    
    return [
        {
            "rank": i + 1,
            "product_id": p.product_id,
            "name": p.product_name,
            "units_sold": p.units_sold,
            "revenue_ngn": p.revenue_ngn,
            "stock_remaining": p.stock_remaining,
            "category": p.category
        }
        for i, p in enumerate(products)
    ]


@router.get("/customers/top")
async def get_top_customers(limit: int = 5, user_id: Optional[str] = None):
    """
    Get top customers by spending.
    PRIVACY: Returns only the requesting vendor's customer data.
    """
    service = get_analytics_service(user_id) if user_id else analytics_service
    customers = service.get_top_customers(limit)
    
    return [
        {
            "rank": i + 1,
            "phone": c.customer_phone,
            "name": c.customer_name,
            "total_orders": c.total_orders,
            "total_spent_ngn": c.total_spent_ngn,
            "last_order": c.last_order_date.isoformat(),
            "favorite_category": c.favorite_category
        }
        for i, c in enumerate(customers)
    ]


@router.get("/categories")
async def get_category_breakdown(user_id: Optional[str] = None):
    """
    Get revenue breakdown by category.
    PRIVACY: Returns only the requesting vendor's category data.
    """
    service = get_analytics_service(user_id) if user_id else analytics_service
    return service.get_category_breakdown()


@router.get("/alerts/low-stock")
async def get_low_stock_alerts(threshold: int = 5, user_id: Optional[str] = None):
    """
    Get products with low stock.
    PRIVACY: Returns only the requesting vendor's stock alerts.
    """
    service = get_analytics_service(user_id) if user_id else analytics_service
    return service.get_low_stock_alerts(threshold)


@router.get("/summary/daily")
async def get_daily_summary(style: str = "street", user_id: Optional[str] = None):
    """
    Get daily summary for WhatsApp notification.
    PRIVACY: Returns only the requesting vendor's daily summary.
    """
    service = get_analytics_service(user_id) if user_id else analytics_service
    summary = service.format_daily_summary(style)
    return {"summary": summary, "style": style}


@router.get("/cross-platform")
async def get_cross_platform_analytics(user_id: Optional[str] = None):
    """
    Get analytics breakdown by platform (WhatsApp, Instagram, TikTok).
    PRIVACY: Returns only the requesting vendor's platform data.
    """
    service = get_analytics_service(user_id) if user_id else analytics_service
    return service.get_cross_platform_analytics()


