import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'

const DashboardRedesign = () => {
    const navigate = useNavigate()
    const { user } = useAuth()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [stats, setStats] = useState({
        revenue: 0,
        orders: 0,
        customers: 0,
        botChats: 0
    })
    const [recentOrders, setRecentOrders] = useState([])
    const [usage, setUsage] = useState({ products: 0, maxProducts: 5 })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        loadDashboardData()
    }, [])

    const loadDashboardData = async () => {
        try {
            // Load dashboard summary
            const summary = await apiCall(API_ENDPOINTS.DASHBOARD_SUMMARY)
            setStats({
                revenue: summary.total_revenue || 0,
                orders: summary.pending_orders || 0,
                customers: summary.new_customers || 0,
                botChats: summary.bot_conversations || 0
            })

            // Load recent orders
            const orders = await apiCall(API_ENDPOINTS.ORDERS)
            setRecentOrders(orders.slice(0, 5))

            // Load usage
            const usageData = await apiCall(API_ENDPOINTS.USAGE_STATS)
            setUsage({
                products: usageData.products?.current || 0,
                maxProducts: usageData.products?.max || 5
            })
        } catch (error) {
            console.log('Using demo data')
            // Demo data
            setStats({ revenue: 450200, orders: 24, customers: 15, botChats: 12 })
            setRecentOrders([
                { id: '2201', product_name: 'T-Shirt (Black)', total_amount: 5000, status: 'paid', created_at: 'Just now' },
                { id: '2200', product_name: 'Sneakers', total_amount: 15000, status: 'pending', created_at: '2 mins ago' },
                { id: '2199', product_name: 'Red Cap', total_amount: 3500, status: 'paid', created_at: '1 hour ago' },
                { id: '2198', product_name: 'Blue Jeans', total_amount: 8000, status: 'fulfilled', created_at: '3 hours ago' },
                { id: '2197', product_name: 'Wristwatch', total_amount: 12500, status: 'paid', created_at: 'Yesterday' },
            ])
            setUsage({ products: 4, maxProducts: 5 })
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 0 }).format(amount)
    }

    const getGreeting = () => {
        const hour = new Date().getHours()
        if (hour < 12) return 'Good Morning'
        if (hour < 17) return 'Good Afternoon'
        return 'Good Evening'
    }

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
            paid: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-400',
            fulfilled: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300',
        }
        return styles[status] || styles.pending
    }

    const usagePercent = (usage.products / usage.maxProducts) * 100

    return (
        <div className={`min-h-screen font-['Manrope'] ${isDark ? 'bg-[#102217] text-gray-100' : 'bg-[#f6f8f7] text-[#111814]'}`}>
            <div className="max-w-md mx-auto pb-24">

                {/* Top App Bar */}
                <div className={`flex items-center px-5 py-4 justify-between sticky top-0 z-20 backdrop-blur-md border-b ${isDark ? 'bg-[#1a2c22]/80 border-gray-800' : 'bg-white/80 border-gray-100'
                    }`}>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2bee79] to-[#25d66d] flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            K
                        </div>
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                            {user?.storeName || 'KOFA Store'}
                        </h2>
                    </div>
                    <button className={`w-10 h-10 rounded-full flex items-center justify-center relative ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-100'
                        }`}>
                        <span className="text-2xl">🔔</span>
                        <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white dark:border-[#1a2c22]"></span>
                    </button>
                </div>

                {/* Welcome Header */}
                <div className="px-5 pt-6 pb-2">
                    <p className={`text-sm font-medium mb-1 ${isDark ? 'text-[#8baaa1]' : 'text-[#618971]'}`}>
                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                    <h1 className={`text-2xl font-extrabold ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                        {getGreeting()}, {user?.name?.split(' ')[0] || 'Boss'}! ☀️
                    </h1>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-3 p-5">
                    {/* Revenue Card */}
                    <div className={`flex flex-col gap-3 rounded-2xl p-4 shadow-sm border ${isDark ? 'bg-[#1a2c22] border-white/5' : 'bg-white border-gray-100'
                        }`}>
                        <div className="flex items-center justify-between">
                            <div className="p-2 rounded-full bg-[#2bee79]/10 text-[#2bee79]">
                                <span className="text-xl">💰</span>
                            </div>
                            <span className="text-xs font-bold text-green-600 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-full">
                                +12%
                            </span>
                        </div>
                        <div>
                            <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Total Revenue
                            </p>
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                                ₦{formatCurrency(stats.revenue)}
                            </p>
                        </div>
                    </div>

                    {/* Orders Card */}
                    <div className={`flex flex-col gap-3 rounded-2xl p-4 shadow-sm border ${isDark ? 'bg-[#1a2c22] border-white/5' : 'bg-white border-gray-100'
                        }`}>
                        <div className="p-2 rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-500 w-fit">
                            <span className="text-xl">📦</span>
                        </div>
                        <div>
                            <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Pending Orders
                            </p>
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                                {stats.orders}
                            </p>
                        </div>
                    </div>

                    {/* Customers Card */}
                    <div className={`flex flex-col gap-3 rounded-2xl p-4 shadow-sm border ${isDark ? 'bg-[#1a2c22] border-white/5' : 'bg-white border-gray-100'
                        }`}>
                        <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-500 w-fit">
                            <span className="text-xl">👥</span>
                        </div>
                        <div>
                            <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                New Customers
                            </p>
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                                {stats.customers}
                            </p>
                        </div>
                    </div>

                    {/* Bot Chats Card */}
                    <div className={`flex flex-col gap-3 rounded-2xl p-4 shadow-sm border ${isDark ? 'bg-[#1a2c22] border-white/5' : 'bg-white border-gray-100'
                        }`}>
                        <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-500 w-fit">
                            <span className="text-xl">🤖</span>
                        </div>
                        <div>
                            <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Bot Chats
                            </p>
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                                {stats.botChats}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="px-5 mb-6">
                    <h3 className={`text-sm font-bold mb-3 ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                        Quick Actions
                    </h3>
                    <div className="flex justify-between gap-2 overflow-x-auto pb-1">
                        <button onClick={() => navigate('/products')} className="flex flex-col items-center gap-2 min-w-[72px] group">
                            <div className={`w-14 h-14 rounded-2xl border shadow-sm flex items-center justify-center group-active:scale-95 transition-transform ${isDark ? 'bg-[#1a2c22] border-white/5' : 'bg-white border-gray-100'
                                }`}>
                                <span className="text-2xl">➕</span>
                            </div>
                            <span className={`text-[10px] font-medium text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Add Product
                            </span>
                        </button>
                        <button onClick={() => navigate('/orders')} className="flex flex-col items-center gap-2 min-w-[72px] group">
                            <div className={`w-14 h-14 rounded-2xl border shadow-sm flex items-center justify-center group-active:scale-95 transition-transform ${isDark ? 'bg-[#1a2c22] border-white/5' : 'bg-white border-gray-100'
                                }`}>
                                <span className="text-2xl">🧾</span>
                            </div>
                            <span className={`text-[10px] font-medium text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                View Orders
                            </span>
                        </button>
                        <button onClick={() => navigate('/insights')} className="flex flex-col items-center gap-2 min-w-[72px] group">
                            <div className={`w-14 h-14 rounded-2xl border shadow-sm flex items-center justify-center group-active:scale-95 transition-transform ${isDark ? 'bg-[#1a2c22] border-white/5' : 'bg-white border-gray-100'
                                }`}>
                                <span className="text-2xl">📊</span>
                            </div>
                            <span className={`text-[10px] font-medium text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Analytics
                            </span>
                        </button>
                        <button onClick={() => navigate('/settings')} className="flex flex-col items-center gap-2 min-w-[72px] group">
                            <div className={`w-14 h-14 rounded-2xl border shadow-sm flex items-center justify-center group-active:scale-95 transition-transform ${isDark ? 'bg-[#1a2c22] border-white/5' : 'bg-white border-gray-100'
                                }`}>
                                <span className="text-2xl">⚙️</span>
                            </div>
                            <span className={`text-[10px] font-medium text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                Settings
                            </span>
                        </button>
                    </div>
                </div>

                {/* Freemium Tracker */}
                <div className="px-5 mb-8">
                    <div className={`relative overflow-hidden rounded-2xl p-5 shadow-sm border ${isDark ? 'bg-[#1a2c22] border-white/5' : 'bg-white border-gray-100'
                        }`}>
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                            <span className="text-8xl transform rotate-12">🚀</span>
                        </div>
                        <div className="relative z-10">
                            <div className="flex justify-between items-end mb-3">
                                <div>
                                    <h3 className={`text-base font-bold ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                                        Free Plan Usage
                                    </h3>
                                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        You've used {Math.round(usagePercent)}% of your product limit
                                    </p>
                                </div>
                                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                                    {usage.products}<span className="text-gray-400 text-sm font-normal">/{usage.maxProducts}</span>
                                </span>
                            </div>
                            <div className={`h-2.5 w-full rounded-full mb-4 overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                <div
                                    className="h-full bg-[#2bee79] rounded-full transition-all duration-500"
                                    style={{ width: `${usagePercent}%` }}
                                ></div>
                            </div>
                            <button className={`w-full h-11 font-bold rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity active:scale-[0.98] ${isDark ? 'bg-white text-black' : 'bg-[#111814] text-white'
                                }`}>
                                <span>Upgrade to Pro</span>
                                <span>→</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Feed */}
                <div className="px-5">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                            Recent Activity
                        </h3>
                        <button onClick={() => navigate('/orders')} className="text-[#2bee79] text-sm font-semibold">
                            View All
                        </button>
                    </div>
                    <div className="flex flex-col gap-3">
                        {recentOrders.map((order, idx) => (
                            <div
                                key={idx}
                                className={`flex items-center gap-4 p-3 rounded-xl border shadow-sm ${isDark ? 'bg-[#1a2c22] border-white/5' : 'bg-white border-gray-50'
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${isDark ? 'bg-gray-800' : 'bg-gray-100'
                                    }`}>
                                    📦
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className={`font-bold text-sm truncate ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                                        Order #{order.id} - {order.product_name}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {order.created_at}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className={`font-bold text-sm ${isDark ? 'text-white' : 'text-[#111814]'}`}>
                                        ₦{formatCurrency(order.total_amount)}
                                    </p>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold capitalize ${getStatusBadge(order.status)}`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="h-6"></div>
            </div>
        </div>
    )
}

export default DashboardRedesign
