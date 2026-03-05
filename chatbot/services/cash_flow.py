"""
Cash Flow Forecast Service for KOFA
AI predicts future cash position based on historical sales and expense trends.
"""
import logging
from typing import Dict, List
from datetime import datetime, timedelta
from contextlib import contextmanager

logger = logging.getLogger(__name__)


class CashFlowService:
    """
    Predicts future cash flow based on historical order revenue and expense patterns.
    Uses simple moving average and trend projection — no ML dependency needed.
    """
    
    def __init__(self, vendor_id: str):
        self.vendor_id = vendor_id
    
    @contextmanager
    def _get_db_session(self):
        from ..database import SessionLocal
        db = SessionLocal()
        try:
            yield db
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
    
    def _get_daily_revenue(self, days: int = 30) -> List[Dict]:
        """Get daily revenue for the past N days."""
        from ..models import Order
        from sqlalchemy import func, cast, Date
        
        start = datetime.utcnow() - timedelta(days=days)
        
        with self._get_db_session() as db:
            results = db.query(
                func.date(Order.created_at).label("day"),
                func.sum(Order.total_amount).label("revenue"),
                func.count(Order.id).label("orders"),
            ).filter(
                Order.user_id == self.vendor_id,
                Order.created_at >= start,
                Order.status.in_(["paid", "fulfilled"]),
            ).group_by(
                func.date(Order.created_at)
            ).order_by("day").all()
            
            return [
                {"day": str(r.day), "revenue": float(r.revenue or 0), "orders": int(r.orders)}
                for r in results
            ]
    
    def _get_daily_expenses(self, days: int = 30) -> List[Dict]:
        """Get daily expenses for the past N days."""
        from ..models import Expense
        from sqlalchemy import func
        
        start = datetime.utcnow() - timedelta(days=days)
        
        with self._get_db_session() as db:
            results = db.query(
                func.date(Expense.date).label("day"),
                func.sum(Expense.amount).label("total"),
            ).filter(
                Expense.user_id == self.vendor_id,
                Expense.date >= start,
            ).group_by(
                func.date(Expense.date)
            ).order_by("day").all()
            
            return [
                {"day": str(r.day), "expenses": float(r.total or 0)}
                for r in results
            ]
    
    def forecast(self, forecast_days: int = 14) -> Dict:
        """
        Generate cash flow forecast for the next N days.
        
        Uses 7-day moving average of (revenue - expenses) to project forward.
        Flags critical days when cumulative balance may go negative.
        """
        daily_revenue = self._get_daily_revenue(30)
        daily_expenses = self._get_daily_expenses(30)
        
        # Build revenue lookup
        rev_by_day = {r["day"]: r["revenue"] for r in daily_revenue}
        exp_by_day = {e["day"]: e["expenses"] for e in daily_expenses}
        
        # Calculate daily net for past 30 days
        today = datetime.utcnow().date()
        daily_nets = []
        for i in range(30):
            day = str(today - timedelta(days=30 - i))
            rev = rev_by_day.get(day, 0)
            exp = exp_by_day.get(day, 0)
            daily_nets.append(rev - exp)
        
        # Calculate averages
        avg_daily_net = sum(daily_nets) / len(daily_nets) if daily_nets else 0
        
        # 7-day moving average for recent trend
        recent_7 = daily_nets[-7:] if len(daily_nets) >= 7 else daily_nets
        recent_avg = sum(recent_7) / len(recent_7) if recent_7 else 0
        
        # Detect trend direction
        if len(daily_nets) >= 14:
            first_half = sum(daily_nets[:14]) / 14
            second_half = sum(daily_nets[14:]) / max(len(daily_nets[14:]), 1)
            trend = "improving" if second_half > first_half else "declining" if second_half < first_half else "stable"
        else:
            trend = "insufficient_data"
        
        # Project forward
        projections = []
        cumulative = 0
        danger_day = None
        
        for i in range(1, forecast_days + 1):
            day = str(today + timedelta(days=i))
            projected_net = recent_avg  # Simple projection based on recent average
            cumulative += projected_net
            
            is_danger = cumulative < 0 and danger_day is None
            if is_danger:
                danger_day = day
            
            projections.append({
                "day": day,
                "projected_daily_net": round(projected_net, 0),
                "projected_cumulative": round(cumulative, 0),
            })
        
        # Generate summary
        total_revenue_30d = sum(rev_by_day.values())
        total_expenses_30d = sum(exp_by_day.values())
        
        summary = {
            "period_analyzed": "30 days",
            "forecast_days": forecast_days,
            "avg_daily_revenue": round(total_revenue_30d / 30, 0),
            "avg_daily_expenses": round(total_expenses_30d / 30, 0),
            "avg_daily_net": round(avg_daily_net, 0),
            "trend": trend,
            "projections": projections,
            "danger_day": danger_day,
            "health": "healthy" if recent_avg > 0 else "at_risk" if recent_avg > -5000 else "critical",
        }
        
        return summary
    
    def format_whatsapp_forecast(self) -> str:
        """Format cash flow forecast for WhatsApp."""
        try:
            data = self.forecast(14)
        except Exception as e:
            return "📊 Cash flow forecast needs more data. Keep recording sales and expenses!"
        
        trend_emoji = {"improving": "📈", "declining": "📉", "stable": "➡️"}.get(data["trend"], "📊")
        health_emoji = {"healthy": "✅", "at_risk": "⚠️", "critical": "🚨"}.get(data["health"], "📊")
        
        msg = f"""{health_emoji} *Cash Flow Forecast*

{trend_emoji} Trend: {data['trend'].title()}
💰 Avg Daily Revenue: ₦{data['avg_daily_revenue']:,.0f}
💸 Avg Daily Expenses: ₦{data['avg_daily_expenses']:,.0f}
📊 Avg Daily Net: ₦{data['avg_daily_net']:,.0f}
"""
        
        if data.get("danger_day"):
            msg += f"\n🚨 *Warning:* Cash may run low by {data['danger_day']}\n"
        else:
            msg += f"\n✅ Cash looking healthy for next {data['forecast_days']} days\n"
        
        return msg
