# kofa/chatbot/services/analytics.py
"""
Sales Analytics Service for Nigerian SME Dashboard
Provides revenue tracking, bestsellers, and customer insights.
PRIVACY: All analytics are vendor-scoped. Each vendor only sees their own data.
NOW USES REAL DATABASE QUERIES instead of mock data.
"""
from typing import List, Dict, Optional
from dataclasses import dataclass
from datetime import datetime, timedelta
from enum import Enum
from contextlib import contextmanager
from sqlalchemy import func, desc
import logging

logger = logging.getLogger(__name__)


class TimePeriod(Enum):
    TODAY = "today"
    WEEK = "week"
    MONTH = "month"
    QUARTER = "quarter"
    YEAR = "year"


@dataclass
class RevenueMetrics:
    """Revenue breakdown."""
    period: str
    total_revenue_ngn: float
    order_count: int
    average_order_value: float
    growth_percent: float


@dataclass
class ProductPerformance:
    """Product sales performance."""
    product_id: str
    product_name: str
    units_sold: int
    revenue_ngn: float
    stock_remaining: int
    category: str


@dataclass
class CustomerInsight:
    """Customer analytics."""
    customer_phone: str
    customer_name: str
    total_orders: int
    total_spent_ngn: float
    last_order_date: datetime
    favorite_category: str


@dataclass
class DashboardData:
    """Complete dashboard snapshot."""
    revenue: RevenueMetrics
    top_products: List[ProductPerformance]
    top_customers: List[CustomerInsight]
    recent_orders: List[Dict]
    low_stock_alerts: List[Dict]
    period_comparison: Dict


class AnalyticsService:
    """
    Analytics engine for KOFA merchants.
    PRIVACY: ALL queries filter by vendor_id.
    Each vendor only sees their own sales, products, and customer data.
    Uses REAL database queries — no mock data.
    """
    
    def __init__(self, vendor_id: str = "default"):
        self.vendor_id = vendor_id
    
    @contextmanager
    def _get_db_session(self):
        """Context manager for database sessions."""
        from ..database import SessionLocal
        db = SessionLocal()
        try:
            yield db
        except Exception:
            db.rollback()
            raise
        finally:
            db.close()
    
    def _get_period_start(self, period: TimePeriod) -> datetime:
        """Get the start datetime for a time period."""
        now = datetime.utcnow()
        if period == TimePeriod.TODAY:
            return now.replace(hour=0, minute=0, second=0, microsecond=0)
        elif period == TimePeriod.WEEK:
            return now - timedelta(days=7)
        elif period == TimePeriod.MONTH:
            return now - timedelta(days=30)
        elif period == TimePeriod.QUARTER:
            return now - timedelta(days=90)
        else:  # YEAR
            return now - timedelta(days=365)
    
    def get_revenue_metrics(self, period: TimePeriod = TimePeriod.MONTH) -> RevenueMetrics:
        """Calculate revenue metrics for a time period from real order data."""
        from ..models import Order as OrderModel
        
        now = datetime.utcnow()
        start_date = self._get_period_start(period)
        period_length = (now - start_date).days or 1
        prev_start = start_date - timedelta(days=period_length)
        
        with self._get_db_session() as db:
            # Current period orders
            current_query = db.query(
                func.count(OrderModel.id).label("order_count"),
                func.coalesce(func.sum(OrderModel.total_amount), 0).label("total_revenue")
            ).filter(
                OrderModel.user_id == self.vendor_id,
                OrderModel.created_at >= start_date,
                OrderModel.status.in_(["paid", "fulfilled"])
            ).first()
            
            current_revenue = float(current_query.total_revenue or 0)
            current_count = int(current_query.order_count or 0)
            
            # Previous period for growth comparison
            prev_query = db.query(
                func.coalesce(func.sum(OrderModel.total_amount), 0).label("total_revenue")
            ).filter(
                OrderModel.user_id == self.vendor_id,
                OrderModel.created_at >= prev_start,
                OrderModel.created_at < start_date,
                OrderModel.status.in_(["paid", "fulfilled"])
            ).first()
            
            prev_revenue = float(prev_query.total_revenue or 0)
            
            # Calculate growth
            if prev_revenue > 0:
                growth = ((current_revenue - prev_revenue) / prev_revenue) * 100
            elif current_revenue > 0:
                growth = 100.0  # All new revenue
            else:
                growth = 0.0
            
            return RevenueMetrics(
                period=period.value,
                total_revenue_ngn=current_revenue,
                order_count=current_count,
                average_order_value=current_revenue / current_count if current_count > 0 else 0,
                growth_percent=round(growth, 1)
            )
    
    def get_top_products(self, limit: int = 5, period: TimePeriod = TimePeriod.MONTH) -> List[ProductPerformance]:
        """Get best-selling products from real order data."""
        from ..models import Order as OrderModel, OrderItem as OrderItemModel, Product as ProductModel
        
        start_date = self._get_period_start(period)
        
        with self._get_db_session() as db:
            # Join orders with order items to get sales data
            results = db.query(
                OrderItemModel.product_id,
                OrderItemModel.product_name,
                func.sum(OrderItemModel.quantity).label("units_sold"),
                func.sum(OrderItemModel.total).label("revenue"),
            ).join(
                OrderModel, OrderModel.id == OrderItemModel.order_id
            ).filter(
                OrderModel.user_id == self.vendor_id,
                OrderModel.created_at >= start_date,
                OrderModel.status.in_(["paid", "fulfilled"])
            ).group_by(
                OrderItemModel.product_id,
                OrderItemModel.product_name
            ).order_by(
                desc("revenue")
            ).limit(limit).all()
            
            top_products = []
            for row in results:
                # Get current stock level
                product = db.query(ProductModel).filter(
                    ProductModel.id == row.product_id
                ).first()
                
                stock = int(product.stock_level) if product else 0
                category = product.category or "Uncategorized" if product else "Uncategorized"
                
                top_products.append(ProductPerformance(
                    product_id=str(row.product_id),
                    product_name=row.product_name,
                    units_sold=int(row.units_sold),
                    revenue_ngn=float(row.revenue),
                    stock_remaining=stock,
                    category=category,
                ))
            
            return top_products
    
    def get_top_customers(self, limit: int = 5) -> List[CustomerInsight]:
        """Get top customers by spending from real order data."""
        from ..models import Order as OrderModel, OrderItem as OrderItemModel
        
        with self._get_db_session() as db:
            results = db.query(
                OrderModel.customer_phone,
                func.count(OrderModel.id).label("total_orders"),
                func.sum(OrderModel.total_amount).label("total_spent"),
                func.max(OrderModel.created_at).label("last_order"),
            ).filter(
                OrderModel.user_id == self.vendor_id,
                OrderModel.status.in_(["paid", "fulfilled"])
            ).group_by(
                OrderModel.customer_phone
            ).order_by(
                desc("total_spent")
            ).limit(limit).all()
            
            customers = []
            for row in results:
                # Get the most-purchased category for this customer
                fav_cat_query = db.query(
                    OrderItemModel.product_name,
                    func.count(OrderItemModel.id).label("cnt")
                ).join(
                    OrderModel, OrderModel.id == OrderItemModel.order_id
                ).filter(
                    OrderModel.customer_phone == row.customer_phone,
                    OrderModel.user_id == self.vendor_id,
                ).group_by(
                    OrderItemModel.product_name
                ).order_by(desc("cnt")).first()
                
                fav_category = fav_cat_query.product_name if fav_cat_query else "N/A"
                
                customers.append(CustomerInsight(
                    customer_phone=row.customer_phone,
                    customer_name=row.customer_phone,  # Phone as name until we have customer names
                    total_orders=int(row.total_orders),
                    total_spent_ngn=float(row.total_spent),
                    last_order_date=row.last_order,
                    favorite_category=fav_category,
                ))
            
            return customers
    
    def get_low_stock_alerts(self, threshold: int = 5) -> List[Dict]:
        """Get products with stock below threshold from real database."""
        from ..models import Product as ProductModel
        
        with self._get_db_session() as db:
            products = db.query(ProductModel).filter(
                ProductModel.user_id == self.vendor_id,
                ProductModel.stock_level <= threshold
            ).order_by(ProductModel.stock_level).all()
            
            return [
                {
                    "product_id": str(p.id),
                    "product_name": p.name,
                    "stock_remaining": int(p.stock_level),
                    "category": p.category or "Uncategorized",
                    "alert_level": "critical" if p.stock_level <= 2 else "warning"
                }
                for p in products
            ]
    
    def get_category_breakdown(self) -> List[Dict]:
        """Get revenue breakdown by category from real order data."""
        from ..models import Order as OrderModel, OrderItem as OrderItemModel, Product as ProductModel
        
        with self._get_db_session() as db:
            results = db.query(
                ProductModel.category,
                func.sum(OrderItemModel.total).label("revenue"),
            ).join(
                OrderItemModel, OrderItemModel.product_id == ProductModel.id
            ).join(
                OrderModel, OrderModel.id == OrderItemModel.order_id
            ).filter(
                OrderModel.user_id == self.vendor_id,
                OrderModel.status.in_(["paid", "fulfilled"])
            ).group_by(
                ProductModel.category
            ).order_by(desc("revenue")).all()
            
            total = sum(float(r.revenue or 0) for r in results) or 1
            
            return [
                {
                    "category": r.category or "Uncategorized",
                    "revenue_ngn": float(r.revenue or 0),
                    "percentage": round((float(r.revenue or 0) / total) * 100, 1)
                }
                for r in results
            ]
    
    def get_recent_orders(self, limit: int = 10) -> List[Dict]:
        """Get recent orders from real database."""
        from ..models import Order as OrderModel, OrderItem as OrderItemModel
        
        with self._get_db_session() as db:
            orders = db.query(OrderModel).filter(
                OrderModel.user_id == self.vendor_id
            ).order_by(desc(OrderModel.created_at)).limit(limit).all()
            
            result = []
            for order in orders:
                items = db.query(OrderItemModel).filter(
                    OrderItemModel.order_id == order.id
                ).all()
                
                result.append({
                    "id": str(order.id),
                    "customer_phone": order.customer_phone,
                    "total_amount": float(order.total_amount),
                    "status": order.status,
                    "created_at": order.created_at.isoformat() if order.created_at else "",
                    "items": [
                        {
                            "product_name": item.product_name,
                            "quantity": item.quantity,
                            "price": float(item.price),
                            "total": float(item.total),
                        }
                        for item in items
                    ]
                })
            
            return result
    
    def get_dashboard(self, period: TimePeriod = TimePeriod.MONTH) -> DashboardData:
        """Get complete dashboard data from real database."""
        revenue = self.get_revenue_metrics(period)
        top_products = self.get_top_products(5, period)
        top_customers = self.get_top_customers(5)
        low_stock = self.get_low_stock_alerts()
        recent_orders = self.get_recent_orders(10)
        
        return DashboardData(
            revenue=revenue,
            top_products=top_products,
            top_customers=top_customers,
            recent_orders=recent_orders,
            low_stock_alerts=low_stock,
            period_comparison={
                "vs_previous": f"{revenue.growth_percent:+.1f}%",
                "trend": "up" if revenue.growth_percent > 0 else "down"
            }
        )
    
    def format_daily_summary(self, style: str = "street") -> str:
        """Format daily summary for WhatsApp from real data."""
        today = self.get_revenue_metrics(TimePeriod.TODAY)
        week = self.get_revenue_metrics(TimePeriod.WEEK)
        low_stock = self.get_low_stock_alerts(3)
        top_products = self.get_top_products(3, TimePeriod.TODAY)
        
        if style == "street":
            summary = f"""📊 *KOFA Daily Update*

💰 Today: ₦{today.total_revenue_ngn:,.0f} ({today.order_count} orders)
📈 This week: ₦{week.total_revenue_ngn:,.0f}
{'🔥' if today.growth_percent > 0 else '📉'} Growth: {today.growth_percent:+.1f}%
"""
            if top_products:
                summary += "\n🏆 *Top Sellers Today:*\n"
                for i, p in enumerate(top_products, 1):
                    summary += f"{i}. {p.product_name} — {p.units_sold} sold (₦{p.revenue_ngn:,.0f})\n"
            
            if low_stock:
                summary += "\n⚠️ *Low Stock Alert:*\n"
                for item in low_stock[:3]:
                    summary += f"• {item['product_name']}: {item['stock_remaining']} left\n"
        else:
            summary = f"""📊 *Daily Business Summary*

Revenue Today: ₦{today.total_revenue_ngn:,.0f}
Orders: {today.order_count}
Weekly Total: ₦{week.total_revenue_ngn:,.0f}
Growth: {today.growth_percent:+.1f}%
"""
            if top_products:
                summary += "\n🏆 *Best Performing Products:*\n"
                for i, p in enumerate(top_products, 1):
                    summary += f"{i}. {p.product_name} — {p.units_sold} units (₦{p.revenue_ngn:,.0f})\n"
            
            if low_stock:
                summary += "\n⚠️ *Inventory Alerts:*\n"
                for item in low_stock[:3]:
                    summary += f"• {item['product_name']}: {item['stock_remaining']} remaining\n"
        
        return summary
    
    def get_cross_platform_analytics(self) -> Dict:
        """
        Get analytics breakdown by platform (WhatsApp, Instagram, TikTok).
        Uses real order data for WhatsApp metrics, message stores for others.
        """
        from ..models import Order as OrderModel
        
        with self._get_db_session() as db:
            # Real WhatsApp data from orders
            wa_orders = db.query(
                func.count(OrderModel.id).label("count"),
                func.coalesce(func.sum(OrderModel.total_amount), 0).label("revenue")
            ).filter(
                OrderModel.user_id == self.vendor_id,
                OrderModel.status.in_(["paid", "fulfilled"])
            ).first()
            
            wa_count = int(wa_orders.count or 0)
            wa_revenue = float(wa_orders.revenue or 0)
        
        # Get platform-specific message counts
        try:
            from ..routers import instagram
            ig_messages = instagram.INSTAGRAM_MESSAGES
        except Exception:
            ig_messages = []
        
        try:
            from ..routers import tiktok
            tt_messages = tiktok.TIKTOK_MESSAGES
        except Exception:
            tt_messages = []
        
        platforms = {
            "whatsapp": {
                "total_messages": wa_count * 3,  # Estimate: ~3 messages per order
                "orders_generated": wa_count,
                "revenue_ngn": wa_revenue
            },
            "instagram": {
                "total_messages": len(ig_messages),
                "orders_generated": 0,
                "revenue_ngn": 0
            },
            "tiktok": {
                "total_messages": len(tt_messages),
                "orders_generated": 0,
                "revenue_ngn": 0
            }
        }
        
        total_messages = sum(p["total_messages"] for p in platforms.values())
        total_orders = sum(p["orders_generated"] for p in platforms.values())
        total_revenue = sum(p["revenue_ngn"] for p in platforms.values())
        
        best_platform = max(platforms.keys(), key=lambda p: platforms[p]["revenue_ngn"])
        
        return {
            "platforms": platforms,
            "summary": {
                "total_messages": total_messages,
                "total_orders": total_orders,
                "total_revenue_ngn": total_revenue,
                "best_platform": best_platform,
                "platform_breakdown": {
                    name: {
                        "message_share": round((p["total_messages"] / max(total_messages, 1)) * 100, 1),
                        "revenue_share": round((p["revenue_ngn"] / max(total_revenue, 1)) * 100, 1)
                    }
                    for name, p in platforms.items()
                }
            }
        }


# Default instance for backward compatibility
# PRIVACY: In production, create per-vendor instances via get_analytics_service()
analytics_service = AnalyticsService()


def get_analytics_service(vendor_id: str = "default") -> AnalyticsService:
    """Create a vendor-scoped analytics service instance.
    PRIVACY: Each vendor gets their own analytics context."""
    return AnalyticsService(vendor_id=vendor_id)
