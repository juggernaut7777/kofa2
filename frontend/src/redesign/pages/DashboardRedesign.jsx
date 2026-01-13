import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, cachedApiCall, API_ENDPOINTS, CACHE_KEYS } from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'
import {
    TrendingUp,
    Users,
    Package,
    CreditCard,
    ArrowRight,
    Plus,
    FileText,
    ShoppingBag,
    Clock,
    DollarSign
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'

const DashboardRedesign = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, profit: 0 })
    const [recentOrders, setRecentOrders] = useState([])
    const [products, setProducts] = useState([])
    const [loading, setLoading] = useState(true)
    const [greeting, setGreeting] = useState('')

    useEffect(() => {
        const hour = new Date().getHours()
        if (hour < 12) setGreeting('Good morning')
        else if (hour < 17) setGreeting('Good afternoon')
        else setGreeting('Good evening')
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const [ordersRes, productsRes, profitRes] = await Promise.allSettled([
                cachedApiCall(API_ENDPOINTS.ORDERS, CACHE_KEYS.ORDERS, setRecentOrders),
                cachedApiCall(API_ENDPOINTS.PRODUCTS, CACHE_KEYS.PRODUCTS, setProducts),
                cachedApiCall(API_ENDPOINTS.PROFIT_SUMMARY, CACHE_KEYS.PROFIT_SUMMARY)
            ])

            if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
                const orders = ordersRes.value
                setRecentOrders(orders.slice(0, 5))
                const pendingOrders = orders.filter(o => o.status === 'pending').length
                const totalRevenue = orders.reduce((sum, o) => sum + (o.total_amount || 0), 0)
                const uniqueCustomers = new Set(orders.map(o => o.customer_phone)).size
                setStats(prev => ({
                    ...prev,
                    orders: pendingOrders || orders.length,
                    revenue: totalRevenue,
                    customers: uniqueCustomers
                }))
            }

            if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
                setProducts(productsRes.value)
            }

            if (profitRes.status === 'fulfilled' && profitRes.value) {
                setStats(prev => ({
                    ...prev,
                    profit: profitRes.value.net_profit_ngn || profitRes.value.total_profit || 0
                }))
            }
        } catch (error) {
            console.error('Dashboard load error:', error)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => {
        if (n == null || isNaN(n)) return '₦0'
        return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(n)
    }

    // --- Stats Grid ---
    const StatItem = ({ label, value, icon: Icon, colorClass, trend }) => (
        <Card glass className="p-5 transition-all hover:-translate-y-1">
            <div className="flex justify-between items-start mb-4">
                <div className={`p-3 rounded-xl ${colorClass}`}>
                    <Icon size={22} />
                </div>
                {trend && (
                    <Badge variant="success" size="sm" dot>
                        {trend}
                    </Badge>
                )}
            </div>
            <div className="space-y-1">
                <p className="text-muted text-sm font-medium">{label}</p>
                <h3 className="text-2xl font-bold text-main tracking-tight">{value}</h3>
            </div>
        </Card>
    )

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
            </div>
        )
    }

    return (
        <div className="space-y-8 animate-fadeIn pb-10">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-main">
                        {greeting}, {user?.storeName?.split(' ')[0] || 'Vendor'}
                    </h1>
                    <p className="text-muted mt-1">
                        Here's what's happening with your business today.
                    </p>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatItem
                    label="Total Revenue"
                    value={formatCurrency(stats.revenue)}
                    icon={DollarSign}
                    colorClass="bg-blue-500/10 text-blue-500"
                />
                <StatItem
                    label="Active Orders"
                    value={stats.orders}
                    icon={ShoppingBag}
                    colorClass="bg-amber-500/10 text-amber-500"
                />
                <StatItem
                    label="Net Profit"
                    value={formatCurrency(stats.profit)}
                    icon={TrendingUp}
                    colorClass="bg-green-500/10 text-green-500"
                />
                <StatItem
                    label="Customers"
                    value={stats.customers}
                    icon={Users}
                    colorClass="bg-purple-500/10 text-purple-500"
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart / Activity Area */}
                <div className="lg:col-span-2 space-y-6">
                    <Card glass className="min-h-[300px]">
                        <CardHeader>
                            <CardTitle>Sales Overview</CardTitle>
                            <Button variant="ghost" size="sm">View Report</Button>
                        </CardHeader>
                        <CardContent>
                            <div className="h-64 flex items-end justify-between gap-2 px-2">
                                {/* Simple CSS Bar Chart for now */}
                                {[45, 60, 35, 70, 85, 65, 90].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col justify-end gap-2 group">
                                        <div
                                            className="w-full bg-brand-primary/20 rounded-t-lg relative overflow-hidden transition-all duration-300 group-hover:bg-brand-primary/40 group-hover:shadow-[0_0_20px_var(--brand-glow)]"
                                            style={{ height: `${h}%` }}
                                        >
                                            <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-t from-brand-primary/30 to-transparent" />
                                        </div>
                                        <span className="text-xs text-center text-muted">
                                            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][i]}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card glass>
                        <CardHeader>
                            <CardTitle>Recent Orders</CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => navigate('/orders')}>
                                View All <ArrowRight size={16} className="ml-1" />
                            </Button>
                        </CardHeader>
                        <div className="divide-y divide-border-subtle">
                            {(recentOrders || []).length === 0 ? (
                                <div className="p-8 text-center text-muted">No recent orders</div>
                            ) : (
                                recentOrders.map((order, i) => (
                                    <div key={i} className="p-4 flex items-center justify-between hover:bg-surface-2/50 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-surface-3 flex items-center justify-center text-lg">
                                                🛍️
                                            </div>
                                            <div>
                                                <p className="font-medium text-main">{order.customer_name || 'Customer'}</p>
                                                <div className="flex items-center gap-2 text-xs text-muted">
                                                    <Clock size={12} />
                                                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Just now'}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-main">{formatCurrency(order.total_amount)}</p>
                                            <Badge variant={order.status === 'completed' ? 'success' : 'warning'} size="sm">
                                                {order.status || 'Pending'}
                                            </Badge>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>
                </div>

                {/* Side Panel: Inventory & Quick Actions */}
                <div className="space-y-6">
                    <Card glass>
                        <CardHeader>
                            <CardTitle>Quick Actions</CardTitle>
                        </CardHeader>
                        <CardContent className="grid grid-cols-2 gap-3">
                            <button onClick={() => navigate('/products', { state: { action: 'add' } })} className="p-4 rounded-xl bg-surface-2 hover:bg-surface-3 transition-colors text-center group">
                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <Package size={20} />
                                </div>
                                <span className="text-xs font-medium">Add Product</span>
                            </button>
                            <button onClick={() => navigate('/expenses', { state: { action: 'add' } })} className="p-4 rounded-xl bg-surface-2 hover:bg-surface-3 transition-colors text-center group">
                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                    <CreditCard size={20} />
                                </div>
                                <span className="text-xs font-medium">Add Expense</span>
                            </button>
                        </CardContent>
                    </Card>

                    {/* Inventory Health */}
                    <Card glass>
                        <CardHeader>
                            <CardTitle>Inventory Health</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-surface-2">
                                <span className="text-sm font-medium">Total Products</span>
                                <span className="font-bold">{products.length}</span>
                            </div>
                            <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                                <span className="text-sm font-medium text-red-500">Low Stock</span>
                                <Badge variant="danger" size="sm">{products.filter(p => p.stock_level < 5).length}</Badge>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

export default DashboardRedesign
