# owo_flow/chatbot/routers/profit_loss.py
"""
Profit/Loss API Router
Real-time profit visibility for Nigerian vendors.
"Know your money" feature - the core OwoFlow value prop.
"""
from fastapi import APIRouter, Query
from typing import Optional
from datetime import datetime

from ..services.profit_loss import profit_loss_service, ReportPeriod

router = APIRouter()


@router.get("/today")
async def get_today_profit():
    """
    Get today's profit/loss.
    The quick "how much I make today" answer.
    """
    report = profit_loss_service.get_profit_loss_report(ReportPeriod.TODAY)
    
    return {
        "date": datetime.now().strftime("%Y-%m-%d"),
        "revenue_ngn": report.total_revenue_ngn,
        "cost_of_goods_ngn": report.total_cogs_ngn,
        "gross_profit_ngn": report.gross_profit_ngn,
        "expenses_ngn": report.total_expenses_ngn,
        "net_profit_ngn": report.net_profit_ngn,
        "net_margin_percent": report.net_margin_percent,
        "order_count": report.order_count,
        "status": "profit" if report.net_profit_ngn > 0 else "loss",
        "formatted": f"₦{abs(report.net_profit_ngn):,.0f}"
    }


@router.get("/summary")
async def get_daily_summary():
    """
    Get quick daily summary for dashboard.
    """
    summary = profit_loss_service.get_daily_summary()
    
    return {
        "date": summary.date,
        "revenue_ngn": summary.revenue_ngn,
        "profit_ngn": summary.profit_ngn,
        "order_count": summary.order_count,
        "top_product": summary.top_product,
        "trend": summary.profit_trend,
        "message": f"Today: ₦{summary.profit_ngn:,.0f} {'profit' if summary.profit_ngn > 0 else 'loss'}"
    }


@router.get("/report")
async def get_profit_loss_report(
    period: Optional[str] = Query("today", description="today, yesterday, week, month"),
    start_date: Optional[str] = Query(None, description="Custom start date YYYY-MM-DD"),
    end_date: Optional[str] = Query(None, description="Custom end date YYYY-MM-DD")
):
    """
    Get detailed profit/loss report.
    Full breakdown of revenue, COGS, expenses, and net profit.
    """
    # Parse period
    try:
        report_period = ReportPeriod(period)
    except ValueError:
        report_period = ReportPeriod.TODAY
    
    # Parse custom dates if provided
    custom_start = None
    custom_end = None
    if start_date and end_date:
        try:
            custom_start = datetime.strptime(start_date, "%Y-%m-%d")
            custom_end = datetime.strptime(end_date, "%Y-%m-%d").replace(hour=23, minute=59, second=59)
            report_period = ReportPeriod.CUSTOM
        except ValueError:
            pass
    
    report = profit_loss_service.get_profit_loss_report(
        period=report_period,
        custom_start=custom_start,
        custom_end=custom_end
    )
    
    return {
        "period": report.period,
        "period_start": report.period_start.isoformat(),
        "period_end": report.period_end.isoformat(),
        "revenue": {
            "total_ngn": report.total_revenue_ngn,
            "order_count": report.order_count,
            "formatted": f"₦{report.total_revenue_ngn:,.0f}"
        },
        "cost_of_goods": {
            "total_ngn": report.total_cogs_ngn,
            "formatted": f"₦{report.total_cogs_ngn:,.0f}"
        },
        "gross_profit": {
            "total_ngn": report.gross_profit_ngn,
            "margin_percent": report.gross_margin_percent,
            "formatted": f"₦{report.gross_profit_ngn:,.0f}"
        },
        "expenses": {
            "total_ngn": report.total_expenses_ngn,
            "breakdown": report.expense_breakdown,
            "formatted": f"₦{report.total_expenses_ngn:,.0f}"
        },
        "net_profit": {
            "total_ngn": report.net_profit_ngn,
            "margin_percent": report.net_margin_percent,
            "status": "profit" if report.net_profit_ngn > 0 else "loss",
            "formatted": f"₦{abs(report.net_profit_ngn):,.0f}"
        },
        "comparison": {
            "vs_previous_period_percent": report.vs_previous_period_percent,
            "trend": "up" if (report.vs_previous_period_percent or 0) > 0 else "down"
        }
    }


@router.get("/week")
async def get_week_profit():
    """Get this week's profit/loss."""
    report = profit_loss_service.get_profit_loss_report(ReportPeriod.WEEK)
    
    return {
        "period": "week",
        "revenue_ngn": report.total_revenue_ngn,
        "net_profit_ngn": report.net_profit_ngn,
        "net_margin_percent": report.net_margin_percent,
        "order_count": report.order_count,
        "vs_previous_week_percent": report.vs_previous_period_percent,
        "formatted": f"₦{abs(report.net_profit_ngn):,.0f}",
        "status": "profit" if report.net_profit_ngn > 0 else "loss"
    }


@router.get("/month")
async def get_month_profit():
    """Get this month's profit/loss."""
    report = profit_loss_service.get_profit_loss_report(ReportPeriod.MONTH)
    
    return {
        "period": "month",
        "revenue_ngn": report.total_revenue_ngn,
        "net_profit_ngn": report.net_profit_ngn,
        "gross_margin_percent": report.gross_margin_percent,
        "net_margin_percent": report.net_margin_percent,
        "order_count": report.order_count,
        "expense_breakdown": report.expense_breakdown,
        "formatted": f"₦{abs(report.net_profit_ngn):,.0f}",
        "status": "profit" if report.net_profit_ngn > 0 else "loss"
    }


@router.get("/channels")
async def get_channel_profitability():
    """
    Get profit breakdown by sales channel.
    See which platform (WhatsApp, Instagram, Walk-in) makes the most money.
    """
    channels = profit_loss_service.get_channel_profitability()
    
    return {
        "channels": [
            {
                "name": c["channel"],
                "order_count": c["order_count"],
                "revenue_ngn": c["revenue_ngn"],
                "profit_ngn": c["profit_ngn"],
                "formatted_profit": f"₦{c['profit_ngn']:,.0f}"
            }
            for c in channels
        ],
        "most_profitable": channels[0]["channel"] if channels else None
    }


@router.get("/whatsapp-summary")
async def get_whatsapp_summary(style: str = Query("street", description="street or corporate")):
    """
    Get formatted profit summary for WhatsApp notification.
    Daily "how much you make" message.
    """
    message = profit_loss_service.format_whatsapp_summary(style)
    
    return {
        "message": message,
        "style": style,
        "send_via": "whatsapp"
    }
