# kofa/chatbot/services/profit_loss.py
"""
Profit/Loss Service for Nigerian SME Dashboard
Tracks actual profit by considering orders and expenses from database.
This is the "know your money" core feature.
"""
from typing import Dict, Optional, List
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum


class ReportPeriod(Enum):
    TODAY = "today"
    YESTERDAY = "yesterday"
    WEEK = "week"
    MONTH = "month"
    CUSTOM = "custom"


@dataclass
class ProfitLossReport:
    """Complete profit/loss report."""
    period: str
    period_start: datetime
    period_end: datetime
    
    # Revenue
    total_revenue_ngn: float
    order_count: int
    
    # Cost of Goods Sold (estimated at 50% of revenue for now)
    total_cogs_ngn: float
    
    # Gross Profit
    gross_profit_ngn: float
    gross_margin_percent: float
    
    # Expenses
    total_expenses_ngn: float
    expense_breakdown: Dict[str, float]
    
    # Net Profit
    net_profit_ngn: float
    net_margin_percent: float
    
    # Comparison
    vs_previous_period_percent: Optional[float] = None


@dataclass
class DailySummary:
    """Quick daily profit summary for WhatsApp."""
    date: str
    revenue_ngn: float
    profit_ngn: float
    order_count: int
    top_product: str
    profit_trend: str  # "up", "down", "stable"


class ProfitLossService:
    """
    Profit/Loss calculation engine using REAL database data.
    Queries orders and expenses from Azure SQL with user_id filtering.
    """
    
    def _get_period_bounds(self, period: ReportPeriod, custom_start: datetime = None, custom_end: datetime = None):
        """Calculate period start and end dates."""
        now = datetime.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        
        if period == ReportPeriod.TODAY:
            return today_start, now
        elif period == ReportPeriod.YESTERDAY:
            yesterday_start = today_start - timedelta(days=1)
            return yesterday_start, today_start
        elif period == ReportPeriod.WEEK:
            week_start = today_start - timedelta(days=7)
            return week_start, now
        elif period == ReportPeriod.MONTH:
            month_start = today_start - timedelta(days=30)
            return month_start, now
        elif period == ReportPeriod.CUSTOM and custom_start and custom_end:
            return custom_start, custom_end
        else:
            return today_start - timedelta(days=30), now
    
    def get_profit_loss_report(
        self,
        period: ReportPeriod = ReportPeriod.TODAY,
        custom_start: datetime = None,
        custom_end: datetime = None,
        user_id: str = None
    ) -> ProfitLossReport:
        """
        Generate complete profit/loss report from REAL database data.
        """
        from ..database import SessionLocal
        from ..models import Order, Expense
        from sqlalchemy import func
        
        start_date, end_date = self._get_period_bounds(period, custom_start, custom_end)
        
        db = SessionLocal()
        try:
            # Query real orders from database
            order_query = db.query(
                func.count(Order.id).label('count'),
                func.sum(Order.total_amount).label('revenue')
            ).filter(
                Order.created_at >= start_date,
                Order.created_at <= end_date,
                Order.status.in_(['paid', 'fulfilled', 'completed'])
            )
            
            if user_id:
                order_query = order_query.filter(Order.user_id == user_id)
            
            order_result = order_query.first()
            order_count = order_result.count or 0
            total_revenue = float(order_result.revenue or 0)
            
            # COGS estimated at 50% of revenue (can be refined with cost_price field later)
            total_cogs = total_revenue * 0.5
            gross_profit = total_revenue - total_cogs
            gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
            
            # Query real expenses from database
            expense_query = db.query(
                func.sum(Expense.amount).label('total'),
                Expense.category
            ).filter(
                Expense.date >= start_date,
                Expense.date <= end_date
            )
            
            if user_id:
                expense_query = expense_query.filter(Expense.user_id == user_id)
            
            # Get total expenses
            total_expense_query = db.query(func.sum(Expense.amount)).filter(
                Expense.date >= start_date,
                Expense.date <= end_date
            )
            if user_id:
                total_expense_query = total_expense_query.filter(Expense.user_id == user_id)
            
            total_expenses = float(total_expense_query.scalar() or 0)
            
            # Get expense breakdown by category
            breakdown_query = db.query(
                Expense.category,
                func.sum(Expense.amount).label('total')
            ).filter(
                Expense.date >= start_date,
                Expense.date <= end_date
            )
            if user_id:
                breakdown_query = breakdown_query.filter(Expense.user_id == user_id)
            
            breakdown_results = breakdown_query.group_by(Expense.category).all()
            expense_breakdown = {row.category: float(row.total) for row in breakdown_results}
            
            # Net profit = Gross profit - Expenses
            net_profit = gross_profit - total_expenses
            net_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
            
            return ProfitLossReport(
                period=period.value,
                period_start=start_date,
                period_end=end_date,
                total_revenue_ngn=total_revenue,
                order_count=order_count,
                total_cogs_ngn=total_cogs,
                gross_profit_ngn=gross_profit,
                gross_margin_percent=round(gross_margin, 1),
                total_expenses_ngn=total_expenses,
                expense_breakdown=expense_breakdown,
                net_profit_ngn=net_profit,
                net_margin_percent=round(net_margin, 1),
                vs_previous_period_percent=None
            )
        finally:
            db.close()
    
    def get_daily_summary(self, user_id: str = None) -> DailySummary:
        """Get quick daily profit summary for dashboard."""
        report = self.get_profit_loss_report(ReportPeriod.TODAY, user_id=user_id)
        yesterday = self.get_profit_loss_report(ReportPeriod.YESTERDAY, user_id=user_id)
        
        # Determine trend
        if yesterday.net_profit_ngn == 0:
            trend = "stable"
        elif report.net_profit_ngn > yesterday.net_profit_ngn:
            trend = "up"
        elif report.net_profit_ngn < yesterday.net_profit_ngn:
            trend = "down"
        else:
            trend = "stable"
        
        return DailySummary(
            date=datetime.now().strftime("%Y-%m-%d"),
            revenue_ngn=report.total_revenue_ngn,
            profit_ngn=report.net_profit_ngn,
            order_count=report.order_count,
            top_product="Product data",  # Can be enhanced later
            profit_trend=trend
        )
    
    def format_whatsapp_summary(self, style: str = "corporate", user_id: str = None) -> str:
        """
        Format profit summary for WhatsApp notification.
        ALWAYS uses professional/corporate style.
        """
        daily = self.get_daily_summary(user_id=user_id)
        report = self.get_profit_loss_report(ReportPeriod.TODAY, user_id=user_id)
        week_report = self.get_profit_loss_report(ReportPeriod.WEEK, user_id=user_id)
        
        # Trend emoji
        trend_emoji = "📈" if daily.profit_trend == "up" else ("📉" if daily.profit_trend == "down" else "➡️")
        
        # Always use professional/corporate style
        message = f"""📊 *Daily Profit & Loss Summary*

📅 Date: {daily.date}

*Financial Summary:*
• Total Revenue: ₦{report.total_revenue_ngn:,.0f}
• Cost of Goods Sold: ₦{report.total_cogs_ngn:,.0f}
• Gross Profit: ₦{report.gross_profit_ngn:,.0f} ({report.gross_margin_percent}%)
• Operating Expenses: ₦{report.total_expenses_ngn:,.0f}
• *Net Profit: ₦{report.net_profit_ngn:,.0f}* ({report.net_margin_percent}%)

📈 Orders Completed: {daily.order_count}
{trend_emoji} Trend: {daily.profit_trend.upper()} from yesterday

*Week-to-Date:* ₦{week_report.net_profit_ngn:,.0f}

— KOFA Business Assistant
"""
        
        return message
    
    def get_channel_profitability(self, user_id: str = None) -> List[Dict]:
        """Analyze profit by sales channel (placeholder for future)."""
        return [
            {"channel": "whatsapp", "order_count": 0, "revenue_ngn": 0, "profit_ngn": 0},
            {"channel": "instagram", "order_count": 0, "revenue_ngn": 0, "profit_ngn": 0},
            {"channel": "walkin", "order_count": 0, "revenue_ngn": 0, "profit_ngn": 0}
        ]


# Singleton instance
profit_loss_service = ProfitLossService()
