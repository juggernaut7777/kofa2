import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, cachedApiCall, API_ENDPOINTS, CACHE_KEYS } from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'

// Moonlight Color Palette
const colors = {
    lavender: '#CCCCFF',
    muted: '#A3A3CC',
    violet: '#5C5C99',
    indigo: '#292966',
    success: '#10B981',
    warning: '#F59E0B'
}

const DashboardRedesign = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { theme, toggleTheme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    // Start with null/0 - NO FAKE DATA!
    const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, profit: 0 })
    const [recentOrders, setRecentOrders] = useState([])
    const [products, setProducts] = useState([])
    const [lowStock, setLowStock] = useState([])
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
            // Load all data in parallel using CACHED API calls (instant if cached!)
            const [ordersRes, productsRes, profitRes] = await Promise.allSettled([
                cachedApiCall(API_ENDPOINTS.ORDERS, CACHE_KEYS.ORDERS, setRecentOrders),
                cachedApiCall(API_ENDPOINTS.PRODUCTS, CACHE_KEYS.PRODUCTS, setProducts),
                cachedApiCall(API_ENDPOINTS.PROFIT_SUMMARY, CACHE_KEYS.PROFIT_SUMMARY)
            ])

            // Process orders
            if (ordersRes.status === 'fulfilled' && Array.isArray(ordersRes.value)) {
                const orders = ordersRes.value
                setRecentOrders(orders.slice(0, 4))
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

            // Process products
            if (productsRes.status === 'fulfilled' && Array.isArray(productsRes.value)) {
                setProducts(productsRes.value)
                // Calculate low stock items
                const lowStockItems = productsRes.value.filter(p => p.stock_level < 5)
                setLowStock(lowStockItems)
            }

            // Process profit
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
        if (n >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`
        if (n >= 1000) return `₦${Math.round(n / 1000)}K`
        return `₦${n}`
    }

    // --- Chart Components (Now using REAL data!) ---

    const DonutChart = () => {
        // Calculate category distribution from real products
        const categoryData = products.reduce((acc, product) => {
            const cat = product.category || 'Other'
            acc[cat] = (acc[cat] || 0) + 1
            return acc
        }, {})

        const total = products.length || 1
        const chartColors = [colors.violet, colors.lavender, colors.indigo, colors.muted]

        const data = Object.entries(categoryData)
            .slice(0, 4)
            .map(([label, count], i) => ({
                label,
                value: Math.round((count / total) * 100),
                color: chartColors[i % chartColors.length]
            }))

        // Fallback if no products
        if (data.length === 0) {
            data.push({ label: 'No products', value: 100, color: colors.muted })
        }

        const size = 100
        const strokeWidth = 12
        const radius = (size - strokeWidth) / 2
        const circumference = 2 * Math.PI * radius
        let offset = 0

        return (
            <div className="flex items-center gap-6">
                <div className="relative w-28 h-28">
                    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="transform -rotate-90 w-full h-full">
                        {data.map((item, i) => {
                            const strokeDasharray = `${(item.value / 100) * circumference} ${circumference}`
                            const strokeDashoffset = -offset
                            offset += (item.value / 100) * circumference
                            return (
                                <circle
                                    key={i}
                                    cx={size / 2}
                                    cy={size / 2}
                                    r={radius}
                                    fill="none"
                                    stroke={item.color}
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={strokeDasharray}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    className="transition-all duration-1000 ease-out"
                                />
                            )
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>Products</span>
                        <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{products.length}</span>
                    </div>
                </div>
                <div className="space-y-2">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 group cursor-pointer">
                            <span className="w-3 h-3 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: item.color }}></span>
                            <span className={`text-sm transition-colors ${isDark ? 'text-white/70 group-hover:text-white' : 'text-black/70 group-hover:text-black'}`}>{item.label} ({item.value}%)</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    const BarChart = () => {
        // Calculate orders per day from real data
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S']
        const ordersByDay = recentOrders.reduce((acc, order) => {
            const day = new Date(order.created_at).getDay()
            acc[day] = (acc[day] || 0) + 1
            return acc
        }, {})

        const maxOrders = Math.max(...Object.values(ordersByDay), 1)

        const data = days.map((day, i) => ({
            day,
            value: ordersByDay[i] ? Math.round((ordersByDay[i] / maxOrders) * 100) : 10
        }))

        return (
            <div className="flex items-end justify-between h-32 w-full gap-2 pt-4">
                {data.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                        <div className="w-full relative flex items-end h-[100px] rounded-lg overflow-hidden">
                            <div
                                className="w-full transition-all duration-700 ease-out rounded-lg group-hover:opacity-80"
                                style={{
                                    height: `${item.value}%`,
                                    background: `linear-gradient(to top, ${colors.indigo}, ${colors.violet})`,
                                    boxShadow: `0 0 15px ${colors.violet}30`
                                }}
                            ></div>
                        </div>
                        <span className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>{item.day}</span>
                    </div>
                ))}
            </div>
        )
    }

    // Stat Card Component
    const StatCard = ({ label, value, trend, icon }) => (
        <div className={`group flex-shrink-0 w-40 p-4 rounded-2xl border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-black/[0.04] shadow-sm'}`}>
            <div className="flex justify-between items-start mb-3">
                <span className="text-xl transition-transform group-hover:scale-110">{icon}</span>
                <span className="text-xs font-semibold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{trend}</span>
            </div>
            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{label}</p>
            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{value}</p>
        </div>
    )

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>
                <div className="relative w-16 h-16">
                    <div className={`absolute inset-0 rounded-full border-2 border-[${colors.lavender}]/30`}></div>
                    <div className={`absolute inset-0 rounded-full border-2 border-transparent border-t-[${colors.violet}] animate-spin`}></div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['SF_Pro_Display',-apple-system,sans-serif] ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>

            {/* Ambient Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] ${isDark ? `bg-[${colors.indigo}]/40` : `bg-[${colors.lavender}]/30`}`}></div>
                <div className={`absolute bottom-40 -left-20 w-60 h-60 rounded-full blur-[100px] ${isDark ? `bg-[${colors.violet}]/20` : `bg-[${colors.lavender}]/15`}`}></div>
            </div>

            <div className="relative max-w-md mx-auto pb-28 pt-6">

                {/* Header */}
                <header className="px-6 mb-8 flex items-center justify-between">
                    <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{greeting}, {user?.storeName?.split(' ')[0] || 'Vendor'} 👋</h1>
                    </div>
                    <button
                        onClick={toggleTheme}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 ${isDark ? 'bg-white/10' : 'bg-black/5'}`}
                    >
                        {isDark ? '☀️' : '🌙'}
                    </button>
                </header>

                {/* Overview Cards (Horizontal Scroll) */}
                <section className="mb-6">
                    <div className="flex gap-4 px-6 overflow-x-auto no-scrollbar pb-2">
                        <StatCard label="Total Revenue" value={formatCurrency(stats.revenue)} trend="+12%" icon="💰" />
                        <StatCard label="Pending Orders" value={stats.orders} trend={`${stats.orders} new`} icon="📦" />
                        <StatCard label="Net Profit" value={formatCurrency(stats.profit)} trend="+8%" icon="📈" />
                        <StatCard label="Customers" value={stats.customers} trend="+15%" icon="👥" />
                    </div>
                </section>

                {/* Quick Actions */}
                <section className="px-6 mb-8">
                    <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>⚡ Quick Actions</h2>
                    <div className="grid grid-cols-3 gap-3">
                        <button
                            onClick={() => navigate('/products', { state: { action: 'add' } })}
                            className={`group flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all hover:scale-[1.03] active:scale-[0.98] ${isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white border border-black/[0.04] hover:bg-black/[0.02] shadow-sm'}`}
                        >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6v6m0 0v6m0-6h6m-6 0H6" /></svg>
                            </div>
                            <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Product</span>
                        </button>

                        <button
                            onClick={() => navigate('/expenses', { state: { action: 'add' } })}
                            className={`group flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all hover:scale-[1.03] active:scale-[0.98] ${isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white border border-black/[0.04] hover:bg-black/[0.02] shadow-sm'}`}
                        >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-pink-500/10 text-pink-500 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            </div>
                            <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Expense</span>
                        </button>

                        <button
                            onClick={() => navigate('/orders', { state: { action: 'invoice' } })}
                            className={`group flex flex-col items-center justify-center p-4 rounded-2xl gap-2 transition-all hover:scale-[1.03] active:scale-[0.98] ${isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white border border-black/[0.04] hover:bg-black/[0.02] shadow-sm'}`}
                        >
                            <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 group-hover:scale-110 transition-transform">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                            </div>
                            <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Invoice</span>
                        </button>
                    </div>
                </section>

                {/* Analytics Section */}
                <section className="px-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>📊 Analytics Overview</h2>
                        <button onClick={() => navigate('/insights')} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 ${isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-black/5 text-black/70 hover:bg-black/10'}`}>
                            See all →
                        </button>
                    </div>

                    <div className="space-y-4">
                        {/* Weekly Orders Chart */}
                        <div className={`p-5 rounded-3xl transition-all hover:shadow-lg ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04] shadow-sm'}`}>
                            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Orders Activity</h3>
                            <BarChart />
                        </div>

                        {/* Top Products / Categories */}
                        <div className={`p-5 rounded-3xl transition-all hover:shadow-lg ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04] shadow-sm'}`}>
                            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Top Categories</h3>
                            <DonutChart />
                        </div>
                    </div>
                </section>

                {/* Recent Activity */}
                <section className="px-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>🕐 Recent Activity</h2>
                        <button onClick={() => navigate('/orders')} className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 ${isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-black/5 text-black/70 hover:bg-black/10'}`}>
                            View all →
                        </button>
                    </div>
                    <div className={`rounded-3xl overflow-hidden ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                        {(recentOrders || []).length === 0 ? (
                            <p className={`text-center py-8 text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>No recent activity</p>
                        ) : (
                            recentOrders.map((order, i) => (
                                <div key={i} className={`flex items-center gap-4 p-4 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg ${isDark ? 'bg-white/10' : 'bg-white shadow-sm'}`}>
                                        🛍️
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>
                                            {order.customer_name || 'Customer Order'}
                                        </p>
                                        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                            {order.status || 'pending'} • {order.created_at ? new Date(order.created_at).toLocaleDateString() : 'Just now'}
                                        </p>
                                    </div>
                                    <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                        {formatCurrency(order.total_amount || order.amount || 0)}
                                    </span>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </div>

            <style>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}

export default DashboardRedesign
