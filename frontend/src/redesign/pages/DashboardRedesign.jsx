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

            setRecentOrders(Array.isArray(orders) ? orders.slice(0, 4) : [
                { id: 'ORD-2847', customer_name: 'Amaka Johnson', total_amount: 45000, status: 'processing', created_at: '2 mins ago' },
                { id: 'ORD-2846', customer_name: 'Emeka Obi', total_amount: 32000, status: 'shipped', created_at: '15 mins ago' },
                { id: 'ORD-2845', customer_name: 'Fatima Hassan', total_amount: 58000, status: 'delivered', created_at: '1 hour ago' },
            ])
        } catch (e) {
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

    const getStatusStyle = (status) => ({
        pending: { bg: 'bg-amber-500/15', text: 'text-amber-400', icon: '○' },
        processing: { bg: `bg-[${colors.lavender}]/20`, text: `text-[${colors.lavender}]`, icon: '◐' },
        shipped: { bg: `bg-[${colors.violet}]/20`, text: `text-[${colors.muted}]`, icon: '◑' },
        delivered: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: '●' },
    })[status] || { bg: 'bg-gray-500/15', text: 'text-gray-400', icon: '○' }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="relative w-16 h-16">
                        <div className={`absolute inset-0 rounded-full border-2 border-[${colors.lavender}]/30`}></div>
                        <div className={`absolute inset-0 rounded-full border-2 border-transparent border-t-[${colors.violet}] animate-spin`}></div>
                    </div>
                    <p className={`text-sm font-medium tracking-wide ${isDark ? 'text-white/50' : 'text-black/40'}`}>Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>

            {/* Ambient Gradient Orbs */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-32 -right-32 w-96 h-96 rounded-full blur-[120px] ${isDark ? `bg-[${colors.indigo}]/40` : `bg-[${colors.lavender}]/30`}`}></div>
                <div className={`absolute top-1/2 -left-32 w-72 h-72 rounded-full blur-[100px] ${isDark ? `bg-[${colors.violet}]/20` : `bg-[${colors.muted}]/20`}`}></div>
                <div className={`absolute bottom-20 right-10 w-48 h-48 rounded-full blur-[80px] ${isDark ? `bg-[${colors.lavender}]/10` : `bg-[${colors.violet}]/10`}`}></div>
            </div>

            <div className="relative max-w-md mx-auto pb-28">

                {/* Premium Header */}
                <header className={`sticky top-0 z-30 px-6 pt-5 pb-4 ${isDark ? 'bg-[#0a0a14]/70' : 'bg-[#fafaff]/70'} backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-semibold text-lg shadow-xl ${isDark ? `bg-gradient-to-br from-[${colors.violet}] to-[${colors.indigo}]` : `bg-gradient-to-br from-[${colors.muted}] to-[${colors.violet}]`}`} style={{ background: isDark ? `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` : `linear-gradient(135deg, ${colors.muted}, ${colors.violet})` }}>
                                    K
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-[#0a0a14] flex items-center justify-center">
                                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                                </div>
                            </div>
                            <div>
                                <p className={`text-xs font-medium tracking-wide ${isDark ? 'text-white/40' : 'text-black/40'}`}>{greeting}</p>
                                <h1 className={`text-xl font-semibold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                                    {user?.name?.split(' ')[0] || 'Boss'}
                                </h1>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={toggleTheme}
                                className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}
                            >
                                <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    {isDark ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />}
                                </svg>
                            </button>
                            <button className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}>
                                <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Hero Revenue Card */}
                <div className="px-6 pt-2">
                    <div className={`relative overflow-hidden rounded-3xl p-6 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'} backdrop-blur-xl`} style={{ boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.3)' : '0 8px 32px rgba(92,92,153,0.08)' }}>
                        {/* Gradient Accent */}
                        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${colors.lavender}20, transparent)` }}></div>

                        <div className="relative">
                            <div className="flex items-center gap-2 mb-3">
                                <p className={`text-sm font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>Total Revenue</p>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${colors.lavender}20`, color: colors.violet }}>
                                    +23.5%
                                </span>
                            </div>
                            <h2 className={`text-5xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>
                                {formatCurrency(stats.revenue)}
                            </h2>
                            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>This month</p>

                            {/* Mini Chart */}
                            <div className="flex items-end gap-1 h-14 mt-5">
                                {[35, 50, 40, 65, 45, 80, 60, 90, 70, 95, 80, 100].map((h, i) => (
                                    <div key={i} className="flex-1">
                                        <div
                                            className="w-full rounded-sm transition-all duration-500"
                                            style={{
                                                height: `${h}%`,
                                                background: i >= 10 ? `linear-gradient(to top, ${colors.violet}, ${colors.lavender})` : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
                                            }}
                                        ></div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-3 px-6 pt-5">
                    {[
                        {
                            label: 'Orders', value: stats.orders, icon: (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                            )
                        },
                        {
                            label: 'Customers', value: stats.customers, icon: (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                            )
                        },
                        {
                            label: 'Profit', value: formatCurrency(stats.profit), icon: (
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                            )
                        },
                    ].map((stat, i) => (
                        <div
                            key={i}
                            className={`rounded-2xl p-4 transition-all duration-300 hover:scale-[1.02] cursor-pointer ${isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]' : 'bg-white border border-black/[0.04] hover:shadow-lg'}`}
                        >
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.04]'}`} style={{ color: colors.violet }}>
                                {stat.icon}
                            </div>
                            <p className={`text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>{stat.value}</p>
                            <p className={`text-xs font-medium mt-0.5 ${isDark ? 'text-white/40' : 'text-black/40'}`}>{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="px-6 pt-7">
                    <h3 className={`text-xs font-semibold tracking-wider uppercase mb-4 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Quick Actions</h3>
                    <div className="grid grid-cols-4 gap-3">
                        {[
                            { icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" /></svg>), label: 'Add', action: () => navigate('/products') },
                            { icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>), label: 'Expenses', action: () => navigate('/insights', { state: { tab: 'expenses' } }) },
                            { icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>), label: 'Orders', action: () => navigate('/orders') },
                            { icon: (<svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>), label: 'Analytics', action: () => navigate('/insights') },
                        ].map((item, i) => (
                            <button
                                key={i}
                                onClick={item.action}
                                className={`flex flex-col items-center gap-2 py-4 rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 ${isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]' : 'bg-white border border-black/[0.04] hover:shadow-md'}`}
                            >
                                <div style={{ color: colors.violet }}>{item.icon}</div>
                                <span className={`text-[10px] font-semibold ${isDark ? 'text-white/50' : 'text-black/50'}`}>{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Recent Orders */}
                <div className="px-6 pt-7">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className={`text-xs font-semibold tracking-wider uppercase ${isDark ? 'text-white/30' : 'text-black/30'}`}>Recent Orders</h3>
                        <button
                            onClick={() => navigate('/orders')}
                            className={`text-xs font-semibold transition-colors`} style={{ color: colors.violet }}
                        >
                            View all →
                        </button>
                    </div>

                    <div className="space-y-3">
                        {recentOrders.map((order, i) => {
                            const style = getStatusStyle(order.status)
                            return (
                                <div
                                    key={i}
                                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover:scale-[1.01] cursor-pointer ${isDark ? 'bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.05]' : 'bg-white border border-black/[0.04] hover:shadow-md'}`}
                                >
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.04]'}`}>
                                        <svg className="w-5 h-5" style={{ color: colors.violet }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                                        </svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-black'}`}>
                                                {order.customer_name}
                                            </p>
                                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase ${style.bg} ${style.text}`}>
                                                {style.icon} {order.status}
                                            </span>
                                        </div>
                                        <p className={`text-xs mt-0.5 ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                            {order.id} · {order.created_at}
                                        </p>
                                    </div>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                                        {formatCurrency(order.total_amount)}
                                    </p>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="h-8"></div>
            </div>
        </div>
    )
}

export default DashboardRedesign
