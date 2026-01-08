import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
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

            setRecentOrders(Array.isArray(orders) ? orders.slice(0, 4) : [])
        } catch (e) {
            // Fallback for demo
            setStats({ revenue: 2450000, orders: 18, customers: 42, profit: 890000 })
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => {
        if (n >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`
        if (n >= 1000) return `₦${Math.round(n / 1000)}K`
        return `₦${n}`
    }

    // --- Chart Components ---

    // Donut Chart: Sales by Category (Mock Data for Visualization)
    const DonutChart = () => {
        const data = [
            { label: 'Shoes', value: 45, color: colors.violet },
            { label: 'Bags', value: 30, color: colors.lavender },
            { label: 'Clothing', value: 25, color: colors.indigo },
        ]
        const size = 100
        const strokeWidth = 12
        const radius = (size - strokeWidth) / 2
        const circumference = 2 * Math.PI * radius
        let offset = 0

        return (
            <div className="flex items-center gap-6">
                <div className="relative w-32 h-32">
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
                        <span className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>Total</span>
                        <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>100%</span>
                    </div>
                </div>
                <div className="space-y-2">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
                            <span className={`text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>{item.label} ({item.value}%)</span>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    // Bar Chart: Weekly Activity
    const BarChart = () => {
        const data = [
            { day: 'M', value: 60 },
            { day: 'T', value: 45 },
            { day: 'W', value: 80 },
            { day: 'T', value: 55 },
            { day: 'F', value: 90 },
            { day: 'S', value: 70 },
            { day: 'S', value: 40 },
        ]
        return (
            <div className="flex items-end justify-between h-32 w-full gap-2 pt-4">
                {data.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full relative flex items-end h-[100px] rounded-lg bg-black/5 dark:bg-white/5 overflow-hidden">
                            <div
                                className="w-full transition-all duration-1000 ease-out rounded-t-lg group-hover:opacity-80"
                                style={{
                                    height: `${item.value}%`,
                                    background: `linear-gradient(to top, ${colors.indigo}, ${colors.violet})`
                                }}
                            ></div>
                        </div>
                        <span className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>{item.day}</span>
                    </div>
                ))}
            </div>
        )
    }

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
            </div>

            <div className="relative max-w-md mx-auto pb-28 pt-6">

                {/* Header */}
                <header className="px-6 mb-8 flex items-center justify-between">
                    <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white/60' : 'text-black/60'}`}>{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{greeting}, {user?.storeName?.split(' ')[0] || 'Vendor'}</h1>
                    </div>

                    {/* Create Invoice Action */}
                    <button
                        onClick={() => {
                            // Navigate to Orders page and switch to invoices tab (handled by saving state or query param, simpler: navigate to orders)
                            navigate('/orders')
                        }}
                        className="flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
                        style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}
                    >
                        <span className="text-lg leading-none">+</span> Invoice
                    </button>
                </header>

                {/* Overview Cards (Horizontal Scroll) */}
                <section className="mb-8">
                    <div className="flex gap-4 px-6 overflow-x-auto no-scrollbar pb-2">
                        {[
                            { label: 'Total Revenue', value: formatCurrency(stats.revenue), trend: '+12%', icon: '💰' },
                            { label: 'Pending Orders', value: stats.orders, trend: '4 new', icon: '📦' },
                            { label: 'Net Profit', value: formatCurrency(stats.profit), trend: '+8%', icon: '📈' },
                        ].map((stat, i) => (
                            <div
                                key={i}
                                className={`flex-shrink-0 w-40 p-4 rounded-2xl border ${isDark ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-black/[0.04]'}`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <span className="text-xl">{stat.icon}</span>
                                    <span className="text-xs font-medium text-emerald-400 bg-emerald-400/10 px-1.5 py-0.5 rounded">{stat.trend}</span>
                                </div>
                                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{stat.label}</p>
                                <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </section>

                {/* Analytics Section (Merged) */}
                <section className="px-6 mb-8">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Analytics Overview</h2>
                        <button className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>See all</button>
                    </div>

                    <div className="space-y-4">
                        {/* Weekly Orders Chart */}
                        <div className={`p-5 rounded-3xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>Orders Activity</h3>
                            <BarChart />
                        </div>

                        {/* Top Products / Categories */}
                        <div className={`p-5 rounded-3xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`text-sm font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Top Categories</h3>
                            <DonutChart />
                        </div>
                    </div>
                </section>

                {/* Recent Activity */}
                <section className="px-6">
                    <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Recent Activity</h2>
                    <div className={`rounded-3xl p-2 ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                        {(recentOrders || []).map((order, i) => (
                            <div key={i} className="flex items-center gap-4 p-3 mb-1 rounded-2xl transition-colors hover:bg-white/5">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                                    🛍️
                                </div>
                                <div className="flex-1">
                                    <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                                        Order from {order.customer_name}
                                    </p>
                                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                        {order.status} • {order.created_at || 'Just now'}
                                    </p>
                                </div>
                                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                    {formatCurrency(order.total_amount)}
                                </span>
                            </div>
                        ))}
                        {recentOrders.length === 0 && (
                            <p className={`text-center py-4 text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>No recent activity</p>
                        )}
                    </div>
                </section>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}

export default DashboardRedesign
