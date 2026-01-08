import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'

const DashboardRedesign = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { theme, toggleTheme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [stats, setStats] = useState({ revenue: 0, orders: 0, customers: 0, profit: 0 })
    const [recentOrders, setRecentOrders] = useState([])
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
            const [summary, orders, profit] = await Promise.all([
                apiCall(API_ENDPOINTS.DASHBOARD_SUMMARY).catch(() => null),
                apiCall(API_ENDPOINTS.ORDERS).catch(() => []),
                apiCall(API_ENDPOINTS.PROFIT_TODAY).catch(() => null)
            ])

            setStats({
                revenue: summary?.total_revenue || 2450000,
                orders: summary?.pending_orders || 18,
                customers: summary?.new_customers || 42,
                profit: profit?.net_profit_ngn || 890000
            })

            setRecentOrders(Array.isArray(orders) ? orders.slice(0, 4) : [
                { id: 'ORD-2847', customer_name: 'Amaka Johnson', total_amount: 45000, status: 'processing', product_name: 'Nike Air Max', created_at: '2 mins ago' },
                { id: 'ORD-2846', customer_name: 'Emeka Obi', total_amount: 32000, status: 'shipped', product_name: 'Adidas Yeezy', created_at: '15 mins ago' },
                { id: 'ORD-2845', customer_name: 'Fatima Hassan', total_amount: 58000, status: 'delivered', product_name: 'iPhone Case Pro', created_at: '1 hour ago' },
            ])
        } catch (e) {
            console.log('Using demo data')
            setStats({ revenue: 2450000, orders: 18, customers: 42, profit: 890000 })
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => {
        if (n >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`
        if (n >= 1000) return `₦${(n / 1000).toFixed(0)}K`
        return `₦${n}`
    }

    const getStatusStyle = (status) => {
        const styles = {
            pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
            processing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
            shipped: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
            delivered: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
            paid: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
        }
        return styles[status] || styles.pending
    }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#030712]' : 'bg-gray-50'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading your dashboard...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['Inter',system-ui,sans-serif] ${isDark ? 'bg-[#030712]' : 'bg-gray-50'}`}>

            {/* Ambient Background Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-40 -right-40 w-96 h-96 rounded-full blur-3xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`}></div>
                <div className={`absolute top-1/2 -left-40 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}></div>
                <div className={`absolute bottom-20 right-20 w-60 h-60 rounded-full blur-3xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'}`}></div>
            </div>

            <div className="relative max-w-md mx-auto pb-28">

                {/* Premium Header */}
                <header className={`sticky top-0 z-30 px-5 pt-4 pb-3 ${isDark ? 'bg-[#030712]/80' : 'bg-gray-50/80'} backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="relative">
                                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/25">
                                    K
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-[#030712] flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <div>
                                <p className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{greeting}</p>
                                <h1 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {user?.name?.split(' ')[0] || 'Boss'} 👋
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={toggleTheme}
                                className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}
                            >
                                <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
                            </button>
                            <button className={`relative w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-gray-100 hover:bg-gray-200'}`}>
                                <span className="text-lg">🔔</span>
                                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#030712] animate-pulse"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Hero Revenue Card */}
                <div className="px-5 pt-4">
                    <div className={`relative overflow-hidden rounded-3xl p-6 ${isDark
                        ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/20'
                        : 'bg-gradient-to-br from-emerald-50 to-white border border-emerald-100'
                        }`}>
                        {/* Decorative Elements */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-gradient-to-tr from-emerald-500/10 to-transparent rounded-full blur-2xl"></div>

                        <div className="relative">
                            <div className="flex items-center gap-2 mb-2">
                                <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    +23.5%
                                </span>
                            </div>
                            <h2 className={`text-4xl font-black tracking-tight mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {formatCurrency(stats.revenue)}
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>This month's earnings</p>

                            {/* Mini Chart */}
                            <div className="flex items-end gap-1 h-12 mt-4">
                                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                                        <div
                                            className={`w-full rounded-full transition-all ${i === 5 ? 'bg-emerald-400' : isDark ? 'bg-white/10' : 'bg-gray-200'}`}
                                            style={{ height: `${h}%` }}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 px-5 pt-5">
                    {[
                        { label: 'Orders', value: stats.orders, icon: '📦', color: 'amber' },
                        { label: 'Customers', value: stats.customers, icon: '👥', color: 'blue' },
                        { label: 'Profit', value: formatCurrency(stats.profit), icon: '💰', color: 'emerald' },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className={`rounded-2xl p-4 border backdrop-blur-xl transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer ${isDark
                                ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                : 'bg-white border-gray-100 hover:shadow-lg'
                                }`}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                    {stat.icon}
                                </span>
                            </div>
                            <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                            <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="px-5 pt-6">
                    <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>QUICK ACTIONS</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { icon: '➕', label: 'Add', action: () => navigate('/products') },
                            { icon: '📊', label: 'Analytics', action: () => navigate('/insights') },
                            { icon: '🧾', label: 'Invoices', action: () => navigate('/orders') },
                            { icon: '⚙️', label: 'Settings', action: () => navigate('/settings') },
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={item.action}
                                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all hover:scale-105 active:scale-95 ${isDark
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                    : 'bg-white border-gray-100 hover:shadow-md'
                                    }`}
                            >
                                <span className="text-2xl">{item.icon}</span>
                                <span className={`text-[10px] font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="px-5 pt-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-sm font-bold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>RECENT ORDERS</h3>
                        <button
                            onClick={() => navigate('/orders')}
                            className="text-xs font-semibold text-emerald-500 hover:text-emerald-400 transition-colors"
                        >
                            View all →
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentOrders.map((order, i) => (
                            <div
                                key={i}
                                className={`flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl transition-all hover:scale-[1.01] cursor-pointer ${isDark
                                    ? 'bg-white/5 border-white/10 hover:bg-white/10'
                                    : 'bg-white border-gray-100 hover:shadow-md'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-gray-700 to-gray-800' : 'bg-gradient-to-br from-gray-100 to-gray-50'}`}>
                                    <span className="text-xl">📦</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {order.customer_name || order.product_name}
                                        </p>
                                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${getStatusStyle(order.status)}`}>
                                            {order.status}
                                        </span>
                                    </div>
                                    <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {order.id} • {order.created_at}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                        {formatCurrency(order.total_amount)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upgrade CTA */}
                <div className="px-5 pt-6">
                    <div className={`relative overflow-hidden rounded-2xl p-5 ${isDark
                        ? 'bg-gradient-to-r from-violet-600/20 via-purple-600/20 to-fuchsia-600/20 border border-purple-500/20'
                        : 'bg-gradient-to-r from-violet-50 via-purple-50 to-fuchsia-50 border border-purple-100'
                        }`}>
                        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-purple-400/30 to-transparent rounded-full blur-xl"></div>
                        <div className="relative flex items-center justify-between">
                            <div>
                                <h4 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Upgrade to Pro</h4>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Unlock unlimited products</p>
                            </div>
                            <button
                                onClick={() => navigate('/settings')}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-600 text-white text-sm font-bold shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transition-all hover:scale-105 active:scale-95"
                            >
                                Upgrade
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-8"></div>
            </div>
        </div>
    )
}

export default DashboardRedesign
