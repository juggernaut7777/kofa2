import { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

// Moonlight Color Palette
const colors = {
    lavender: '#CCCCFF',
    muted: '#A3A3CC',
    violet: '#5C5C99',
    indigo: '#292966',
}

const InsightsRedesign = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const initialTab = location.state?.tab || 'overview'
    const [activeTab, setActiveTab] = useState(initialTab)
    const [period, setPeriod] = useState('7')
    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({})
    const [topProducts, setTopProducts] = useState([])
    const [channels, setChannels] = useState([])
    const [expenses, setExpenses] = useState([])
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [newExpense, setNewExpense] = useState({ category: '', amount: '', description: '' })

    const tabs = [
        { id: 'overview', label: 'Overview', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg> },
        { id: 'products', label: 'Top Products', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg> },
        { id: 'expenses', label: 'Expenses', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg> },
        { id: 'channels', label: 'Channels', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg> },
    ]

    const periods = [
        { id: '7', label: '7D' },
        { id: '30', label: '30D' },
        { id: '90', label: '90D' },
    ]

    const expenseCategories = [
        { id: 'inventory', label: 'Inventory', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
        { id: 'delivery', label: 'Delivery', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
        { id: 'marketing', label: 'Marketing', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
        { id: 'utilities', label: 'Utilities', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
        { id: 'rent', label: 'Rent', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
        { id: 'other', label: 'Other', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg> },
    ]

    useEffect(() => { loadData() }, [period])

    const loadData = async () => {
        setLoading(true)
        try {
            const [profitData, products, expenseList, channelData] = await Promise.all([
                apiCall(API_ENDPOINTS.PROFIT_SUMMARY).catch(() => null),
                apiCall(API_ENDPOINTS.PRODUCTS).catch(() => []),
                apiCall(API_ENDPOINTS.LIST_EXPENSES).catch(() => []),
                apiCall(API_ENDPOINTS.PROFIT_CHANNELS).catch(() => null)
            ])

            setStats({
                revenue: profitData?.revenue_ngn || 2850000,
                profit: profitData?.profit_ngn || 1240000,
                orders: profitData?.order_count || 156,
                growth: 23.5
            })

            if (Array.isArray(products) && products.length > 0) {
                setTopProducts(products.slice(0, 5).map((p, i) => ({
                    name: p.name, sales: p.total_sold || (100 - i * 15), revenue: (p.price || 0) * (p.total_sold || 10), image: p.image_url, trend: `+${12 - i * 2}%`
                })))
            } else {
                setTopProducts([
                    { name: 'Nike Air Max 2024', sales: 124, revenue: 2480000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', trend: '+18%' },
                    { name: 'Adidas Ultraboost', sales: 98, revenue: 1960000, image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', trend: '+12%' },
                    { name: 'Designer Bag Premium', sales: 76, revenue: 1520000, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', trend: '+8%' },
                ])
            }

            if (Array.isArray(expenseList) && expenseList.length > 0) {
                setExpenses(expenseList.map(e => ({ id: e.id, category: e.category, amount: e.amount, date: e.date ? new Date(e.date).toLocaleDateString() : 'Recently' })))
            } else {
                setExpenses([
                    { id: 1, category: 'inventory', amount: 850000, date: 'Today' },
                    { id: 2, category: 'delivery', amount: 125000, date: 'Yesterday' },
                    { id: 3, category: 'marketing', amount: 200000, date: '2 days ago' },
                ])
            }

            if (channelData?.channels) {
                setChannels(channelData.channels.map(c => ({ name: c.name, revenue: c.revenue_ngn || 0, percent: 0 })))
            } else {
                setChannels([
                    { name: 'WhatsApp', revenue: 1650000, percent: 58, color: '#22c55e' },
                    { name: 'Instagram', revenue: 820000, percent: 29, color: '#ec4899' },
                    { name: 'Web Store', revenue: 380000, percent: 13, color: colors.violet },
                ])
            }
        } catch (e) {
            console.log('Using demo data')
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => {
        if (n >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`
        if (n >= 1000) return `₦${Math.round(n / 1000)}K`
        return `₦${n}`
    }

    const handleAddExpense = async () => {
        if (!newExpense.category || !newExpense.amount) return
        const cat = expenseCategories.find(c => c.id === newExpense.category)
        try {
            await apiCall(API_ENDPOINTS.LOG_EXPENSE, {
                method: 'POST', body: JSON.stringify({ amount: parseFloat(newExpense.amount), description: newExpense.description || cat?.label, category: newExpense.category, expense_type: 'BUSINESS' })
            })
        } catch (e) { }
        setExpenses([{ id: Date.now(), category: newExpense.category, amount: parseFloat(newExpense.amount), date: 'Just now' }, ...expenses])
        setNewExpense({ category: '', amount: '', description: '' })
        setShowExpenseModal(false)
    }

    const handleDeleteExpense = (id) => {
        if (!confirm('Delete this expense?')) return
        setExpenses(expenses.filter(e => e.id !== id))
    }

    const handleExport = () => {
        const csv = ['Period,Revenue,Profit,Orders', `${period} days,${stats.revenue},${stats.profit},${stats.orders}`].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kofa_report_${period}d.csv`
        a.click()
    }

    const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0)

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: colors.violet }}></div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['SF_Pro_Display',-apple-system,sans-serif] ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>

            {/* Ambient Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-[150px]" style={{ background: isDark ? `${colors.indigo}30` : `${colors.lavender}20` }}></div>
            </div>

            <div className="relative max-w-md mx-auto pb-28">

                {/* Header */}
                <header className={`sticky top-0 z-30 px-6 pt-5 pb-4 ${isDark ? 'bg-[#0a0a14]/70' : 'bg-[#fafaff]/70'} backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={() => navigate('/dashboard')} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button onClick={handleExport} className="px-4 h-10 rounded-xl flex items-center gap-2 text-white text-sm font-medium transition-all hover:scale-105" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                            </svg>
                            Export
                        </button>
                    </div>

                    <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Insights</h1>
                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>Your business analytics</p>

                    {/* Period Selector */}
                    <div className="flex gap-2 mt-5">
                        {periods.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${period === p.id ? 'text-white' : isDark ? 'bg-white/[0.03] text-white/40' : 'bg-black/[0.02] text-black/40'}`}
                                style={period === p.id ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` } : {}}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="flex gap-2 px-6 pt-2 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 h-10 rounded-xl whitespace-nowrap text-sm font-medium transition-all hover:scale-105 ${activeTab === tab.id ? 'text-white' : isDark ? 'bg-white/[0.03] text-white/40 border border-white/[0.06]' : 'bg-white text-black/40 border border-black/[0.04]'
                                }`}
                            style={activeTab === tab.id ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})`, boxShadow: `0 4px 12px ${colors.indigo}40` } : {}}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="px-6 pt-5 space-y-4">
                        {/* Hero Revenue Card */}
                        <div className={`relative overflow-hidden rounded-3xl p-6 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-3xl" style={{ background: `radial-gradient(circle, ${colors.lavender}20, transparent)` }}></div>
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-3">
                                    <p className={`text-sm font-medium ${isDark ? 'text-white/50' : 'text-black/50'}`}>Total Revenue</p>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold" style={{ background: `${colors.lavender}20`, color: colors.violet }}>+{stats.growth}%</span>
                                </div>
                                <h2 className={`text-4xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(stats.revenue)}</h2>

                                {/* Mini Chart */}
                                <div className="flex items-end gap-1 h-16 mt-6">
                                    {[30, 45, 35, 60, 45, 80, 55, 90, 70, 95, 80, 100].map((h, i) => (
                                        <div key={i} className="flex-1">
                                            <div className="w-full rounded-sm transition-all duration-500" style={{ height: `${h}%`, background: i >= 10 ? `linear-gradient(to top, ${colors.violet}, ${colors.lavender})` : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(stats.profit)}</p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Net Profit</p>
                            </div>
                            <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{stats.orders}</p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Total Orders</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Products Tab */}
                {activeTab === 'products' && (
                    <div className="px-6 pt-5 space-y-3">
                        {topProducts.map((product, i) => (
                            <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                                <div className="relative">
                                    <div className={`w-14 h-14 rounded-xl overflow-hidden ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                                        {product.image ? <img src={product.image} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center" style={{ color: colors.muted }}>📦</div>}
                                    </div>
                                    <span className="absolute -top-1 -left-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>{i + 1}</span>
                                </div>
                                <div className="flex-1">
                                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-black'}`}>{product.name}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{product.sales} sold</span>
                                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded" style={{ background: `${colors.lavender}20`, color: colors.violet }}>{product.trend}</span>
                                    </div>
                                </div>
                                <p className="font-bold" style={{ color: colors.violet }}>{formatCurrency(product.revenue)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Expenses Tab */}
                {activeTab === 'expenses' && (
                    <div className="px-6 pt-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Expenses</h3>
                                <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>Total: {formatCurrency(totalExpenses)}</p>
                            </div>
                            <button onClick={() => setShowExpenseModal(true)} className="px-4 py-2.5 rounded-xl text-white text-sm font-medium transition-all hover:scale-105" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                                + Log Expense
                            </button>
                        </div>

                        {expenses.map((expense) => {
                            const cat = expenseCategories.find(c => c.id === expense.category) || expenseCategories[5]
                            return (
                                <div key={expense.id} className={`flex items-center gap-4 p-4 rounded-2xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/[0.05]' : 'bg-black/[0.03]'}`} style={{ color: colors.violet }}>
                                        {cat.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{cat.label}</p>
                                        <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{expense.date}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <p className="font-bold text-red-400">-{formatCurrency(expense.amount)}</p>
                                        <button onClick={() => handleDeleteExpense(expense.id)} className="w-8 h-8 rounded-lg flex items-center justify-center bg-red-500/10 text-red-400 hover:scale-110 transition-all">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Channels Tab */}
                {activeTab === 'channels' && (
                    <div className="px-6 pt-5 space-y-4">
                        {channels.map((channel, i) => (
                            <div key={i} className={`rounded-2xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${channel.color}20`, color: channel.color }}>
                                            {channel.name === 'WhatsApp' ? '💬' : channel.name === 'Instagram' ? '📸' : '🌐'}
                                        </div>
                                        <div>
                                            <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{channel.name}</p>
                                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{channel.percent}% of sales</p>
                                        </div>
                                    </div>
                                    <p className="font-bold" style={{ color: channel.color }}>{formatCurrency(channel.revenue)}</p>
                                </div>
                                <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/[0.06]' : 'bg-black/[0.04]'}`}>
                                    <div className="h-full rounded-full transition-all" style={{ width: `${channel.percent}%`, background: channel.color }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Add Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExpenseModal(false)}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl p-6 ${isDark ? 'bg-[#0a0a14]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center mb-6">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`}></div>
                        </div>

                        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Log Expense</h3>

                        <div className="space-y-5">
                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Category</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {expenseCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                                            className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 ${newExpense.category === cat.id ? 'text-white' : isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}
                                            style={newExpense.category === cat.id ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` } : { color: colors.violet }}
                                        >
                                            {cat.icon}
                                            <span className="text-[10px] font-semibold">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Amount (₦)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className={`w-full rounded-xl px-4 py-4 text-2xl font-bold border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`}
                                />
                            </div>

                            <button onClick={handleAddExpense} className="w-full py-4 rounded-xl text-white font-semibold text-lg transition-all hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                                Log Expense
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    )
}

export default InsightsRedesign
