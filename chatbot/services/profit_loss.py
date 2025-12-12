# owo_flow/chatbot/services/profit_loss.py
"""
Profit/Loss Service for Nigerian SME Dashboard
Tracks actual profit by considering cost of goods sold (COGS) and expenses.
This is the "know your money" core feature.
"""
from typing import Dict, Optional, List
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
import random


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
    
    # Cost of Goods Sold
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
    Profit/Loss calculation engine for OwoFlow merchants.
    The core "know your money" feature.
    
    In production, this queries Supabase for:
    - Orders (with product cost prices)
    - Expenses (from expenses module)
    - Products (with cost prices)
    """
    
    def __init__(self):
        # Mock products with COST PRICE (this is the key addition)
        # In production: fetched from Supabase products table with cost_price_ngn column
        self._mock_products = {
            "1": {"name": "Nike Air Max Red", "price": 45000, "cost": 28000, "category": "Footwear"},
            "2": {"name": "Adidas White Sneakers", "price": 38000, "cost": 22000, "category": "Footwear"},
            "3": {"name": "Men Formal Shirt White", "price": 15000, "cost": 7500, "category": "Clothing"},
            "4": {"name": "Designer Blue Jeans", "price": 25000, "cost": 12000, "category": "Clothing"},
            "5": {"name": "Black Leather Bag", "price": 35000, "cost": 18000, "category": "Accessories"},
            "6": {"name": "Plain Round Neck T-Shirt", "price": 8000, "cost": 3500, "category": "Clothing"},
            "7": {"name": "iPhone Charger Fast Charging", "price": 12000, "cost": 4000, "category": "Electronics"},
        }
        
        # Generate mock orders with cost data
        self._mock_orders = self._generate_mock_orders()
        
        # Mock expenses (from expenses module in production)
        self._mock_expenses = self._generate_mock_expenses()
    
    def _generate_mock_orders(self) -> List[Dict]:
        """Generate realistic orders with cost data."""
        orders = []
        now = datetime.now()
        
        customers = [
            "+2348012345678", "+2349087654321", "+2348055551234",
            "+2347033332222", "+2348099998888", "+2348066667777"
        ]
        
        # Generate orders for the past 30 days
        for i in range(50):
            days_ago = random.randint(0, 30)
            hours_ago = random.randint(0, 23)
            product_id = str(random.randint(1, 7))
            product = self._mock_products[product_id]
            quantity = random.randint(1, 3)
            
            orders.append({
                "id": f"ORD-{i+1:04d}",
                "product_id": product_id,
                "product_name": product["name"],
                "quantity": quantity,
                "unit_price": product["price"],
                "unit_cost": product["cost"],
                "total_revenue": product["price"] * quantity,
                "total_cost": product["cost"] * quantity,
                "profit": (product["price"] - product["cost"]) * quantity,
                "customer_phone": random.choice(customers),
                "status": random.choices(["pending", "paid", "fulfilled"], weights=[0.1, 0.3, 0.6])[0],
                "sales_channel": random.choice(["whatsapp", "instagram", "walkin"]),
                "created_at": now - timedelta(days=days_ago, hours=hours_ago)
            })
        
        return sorted(orders, key=lambda x: x["created_at"], reverse=True)
    
    def _generate_mock_expenses(self) -> List[Dict]:
        """Generate mock expenses."""
        now = datetime.now()
        expense_types = [
            ("Delivery/Logistics", 5000, 15000),
            ("Data/Airtime", 2000, 8000),
            ("Packaging", 1000, 5000),
            ("Shop Rent", 50000, 100000),
            ("Transport", 3000, 10000),
            ("Miscellaneous", 1000, 5000),
        ]
        
        expenses = []
        for i in range(20):
            days_ago = random.randint(0, 30)
            exp_type = random.choice(expense_types)
            
            expenses.append({
                "id": f"EXP-{i+1:04d}",
                "category": exp_type[0],
                "amount_ngn": random.randint(exp_type[1], exp_type[2]),
                "is_business": random.random() > 0.2,  # 80% business
                "description": f"{exp_type[0]} expense",
                "created_at": now - timedelta(days=days_ago)
            })
        
        return expenses
    
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
        custom_end: datetime = None
    ) -> ProfitLossReport:
        """
        Generate complete profit/loss report.
        This is the core "know your money" feature.
        """
        start_date, end_date = self._get_period_bounds(period, custom_start, custom_end)
        
        # Filter orders in period (only count paid/fulfilled orders)
        period_orders = [
            o for o in self._mock_orders
            if start_date <= o["created_at"] <= end_date
            and o["status"] in ["paid", "fulfilled"]
        ]
        
        # Calculate revenue and COGS
        total_revenue = sum(o["total_revenue"] for o in period_orders)
        total_cogs = sum(o["total_cost"] for o in period_orders)
        gross_profit = total_revenue - total_cogs
        gross_margin = (gross_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Filter expenses in period (only business expenses)
        period_expenses = [
            e for e in self._mock_expenses
            if start_date <= e["created_at"] <= end_date
            and e["is_business"]
        ]
        
        total_expenses = sum(e["amount_ngn"] for e in period_expenses)
        
        # Expense breakdown by category
        expense_breakdown = {}
        for exp in period_expenses:
            cat = exp["category"]
            expense_breakdown[cat] = expense_breakdown.get(cat, 0) + exp["amount_ngn"]
        
        # Net profit
        net_profit = gross_profit - total_expenses
        net_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0
        
        # Previous period comparison
        period_length = (end_date - start_date).days
        prev_start = start_date - timedelta(days=period_length)
        prev_end = start_date
        
        prev_orders = [
            o for o in self._mock_orders
            if prev_start <= o["created_at"] < prev_end
            and o["status"] in ["paid", "fulfilled"]
        ]
        prev_profit = sum(o["profit"] for o in prev_orders)
        
        vs_previous = None
        if prev_profit > 0:
            vs_previous = ((net_profit - prev_profit) / prev_profit * 100)
        
        return ProfitLossReport(
            period=period.value,
            period_start=start_date,
            period_end=end_date,
            total_revenue_ngn=total_revenue,
            order_count=len(period_orders),
            total_cogs_ngn=total_cogs,
            gross_profit_ngn=gross_profit,
            gross_margin_percent=round(gross_margin, 1),
            total_expenses_ngn=total_expenses,
            expense_breakdown=expense_breakdown,
            net_profit_ngn=net_profit,
            net_margin_percent=round(net_margin, 1),
            vs_previous_period_percent=round(vs_previous, 1) if vs_previous else None
        )
    
    def get_daily_summary(self) -> DailySummary:
        """Get quick daily profit summary for dashboard/WhatsApp."""
        report = self.get_profit_loss_report(ReportPeriod.TODAY)
        yesterday = self.get_profit_loss_report(ReportPeriod.YESTERDAY)
        
        # Determine trend
        if yesterday.net_profit_ngn == 0:
            trend = "stable"
        elif report.net_profit_ngn > yesterday.net_profit_ngn:
            trend = "up"
        elif report.net_profit_ngn < yesterday.net_profit_ngn:
            trend = "down"
        else:
            trend = "stable"
        
        # Find top product today
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        today_orders = [o for o in self._mock_orders if o["created_at"] >= today_start]
        
        product_profits = {}
        for o in today_orders:
            pid = o["product_id"]
            product_profits[pid] = product_profits.get(pid, 0) + o["profit"]
        
        top_product = "No sales yet"
        if product_profits:
            top_pid = max(product_profits, key=product_profits.get)
            top_product = self._mock_products.get(top_pid, {}).get("name", "Unknown")
        
        return DailySummary(
            date=datetime.now().strftime("%Y-%m-%d"),
            revenue_ngn=report.total_revenue_ngn,
            profit_ngn=report.net_profit_ngn,
            order_count=report.order_count,
            top_product=top_product,
            profit_trend=trend
        )
    
    def format_whatsapp_summary(self, style: str = "street") -> str:
        """
        Format profit summary for WhatsApp notification.
        The daily "how much I make" message.
        """
        daily = self.get_daily_summary()
        report = self.get_profit_loss_report(ReportPeriod.TODAY)
        week_report = self.get_profit_loss_report(ReportPeriod.WEEK)
        
        # Trend emoji
        trend_emoji = "📈" if daily.profit_trend == "up" else ("📉" if daily.profit_trend == "down" else "➡️")
        
        # Profit status
        if daily.profit_ngn > 0:
            profit_status = "gain ✅"
            profit_word = "made"
        else:
            profit_status = "loss ❌"
            profit_word = "lost"
        
        if style == "street":
            # Nigerian pidgin style
            message = f"""💰 *OwoFlow Daily Owo Report*

Today you {profit_word} *₦{abs(daily.profit_ngn):,.0f}* {profit_status}
{trend_emoji} {daily.profit_trend.upper()} from yesterday

📊 *Breakdown:*
• Revenue: ₦{report.total_revenue_ngn:,.0f}
• Cost of goods: ₦{report.total_cogs_ngn:,.0f}
• Expenses: ₦{report.total_expenses_ngn:,.0f}
• *Net Profit: ₦{report.net_profit_ngn:,.0f}*

🛒 Orders today: {daily.order_count}
🔥 Top seller: {daily.top_product}

📅 *This week:* ₦{week_report.net_profit_ngn:,.0f} profit

_Na OwoFlow dey show you the real money_ 💪
"""
        else:
            # Corporate style
            message = f"""📊 *Daily Profit & Loss Summary*

📅 Date: {daily.date}

*Financial Summary:*
• Total Revenue: ₦{report.total_revenue_ngn:,.0f}
• Cost of Goods Sold: ₦{report.total_cogs_ngn:,.0f}
• Gross Profit: ₦{report.gross_profit_ngn:,.0f} ({report.gross_margin_percent}%)
• Operating Expenses: ₦{report.total_expenses_ngn:,.0f}
• *Net Profit: ₦{report.net_profit_ngn:,.0f}* ({report.net_margin_percent}%)

📈 Orders Completed: {daily.order_count}
⭐ Best Performing Product: {daily.top_product}

*Week-to-Date:* ₦{week_report.net_profit_ngn:,.0f}

— OwoFlow Commerce Engine
"""
        
        return message
    
    def get_channel_profitability(self) -> Dict:
        """Analyze profit by sales channel (WhatsApp, Instagram, Walk-in)."""
        channel_data = {}
        
        for order in self._mock_orders:
            if order["status"] in ["paid", "fulfilled"]:
                channel = order["sales_channel"]
                if channel not in channel_data:
                    channel_data[channel] = {
                        "channel": channel,
                        "order_count": 0,
                        "revenue_ngn": 0,
                        "profit_ngn": 0
                    }
                channel_data[channel]["order_count"] += 1
                channel_data[channel]["revenue_ngn"] += order["total_revenue"]
                channel_data[channel]["profit_ngn"] += order["profit"]
        
        # Sort by profit
        return sorted(channel_data.values(), key=lambda x: x["profit_ngn"], reverse=True)


# Singleton instance
profit_loss_service = ProfitLossService()
