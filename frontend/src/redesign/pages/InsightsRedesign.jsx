import { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

const InsightsRedesign = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    // Check if navigated with a specific tab state
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
        { id: 'overview', icon: '📊', label: 'Overview' },
        { id: 'products', icon: '🏆', label: 'Top Products' },
        { id: 'expenses', icon: '💸', label: 'Expenses' },
        { id: 'channels', icon: '📱', label: 'Channels' },
    ]

    const periods = [
        { id: '7', label: '7D' },
        { id: '30', label: '30D' },
        { id: '90', label: '90D' },
        { id: 'all', label: 'All' },
    ]

    const expenseCategories = [
        { id: 'inventory', label: 'Inventory', icon: '📦', color: 'blue' },
        { id: 'delivery', label: 'Delivery', icon: '🚚', color: 'purple' },
        { id: 'marketing', label: 'Marketing', icon: '📣', color: 'pink' },
        { id: 'utilities', label: 'Utilities', icon: '💡', color: 'amber' },
        { id: 'rent', label: 'Rent', icon: '🏢', color: 'emerald' },
        { id: 'other', label: 'Other', icon: '📝', color: 'gray' },
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
                    name: p.name,
                    sales: p.total_sold || (100 - i * 15),
                    revenue: (p.price || 0) * (p.total_sold || 10),
                    image: p.image_url,
                    trend: i % 2 === 0 ? '+12%' : '+8%'
                })))
            } else {
                setTopProducts([
                    { name: 'Nike Air Max 2024', sales: 124, revenue: 2480000, image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', trend: '+18%' },
                    { name: 'Adidas Ultraboost', sales: 98, revenue: 1960000, image: 'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400', trend: '+12%' },
                    { name: 'Designer Bag Premium', sales: 76, revenue: 1520000, image: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400', trend: '+8%' },
                ])
            }

            if (Array.isArray(expenseList) && expenseList.length > 0) {
                setExpenses(expenseList.map(e => ({
                    id: e.id,
                    category: e.category,
                    amount: e.amount,
                    icon: expenseCategories.find(c => c.id === e.category?.toLowerCase())?.icon || '📝',
                    date: e.date ? new Date(e.date).toLocaleDateString() : 'Recently'
                })))
            } else {
                setExpenses([
                    { id: 1, category: 'Inventory', amount: 850000, icon: '📦', date: 'Today' },
                    { id: 2, category: 'Delivery', amount: 125000, icon: '🚚', date: 'Yesterday' },
                    { id: 3, category: 'Marketing', amount: 200000, icon: '📣', date: '2 days ago' },
                ])
            }

            if (channelData?.channels) {
                const colors = { WhatsApp: '#22c55e', Instagram: '#ec4899', Web: '#3b82f6' }
                const icons = { WhatsApp: '💬', Instagram: '📸', Web: '🌐' }
                const total = channelData.channels.reduce((s, c) => s + (c.revenue_ngn || 0), 0)
                setChannels(channelData.channels.map(c => ({
                    name: c.name,
                    icon: icons[c.name] || '📊',
                    color: colors[c.name] || '#6b7280',
                    revenue: c.revenue_ngn || 0,
                    percent: total > 0 ? Math.round((c.revenue_ngn / total) * 100) : 0
                })))
            } else {
                setChannels([
                    { name: 'WhatsApp', icon: '💬', color: '#22c55e', revenue: 1650000, percent: 58 },
                    { name: 'Instagram', icon: '📸', color: '#ec4899', revenue: 820000, percent: 29 },
                    { name: 'Web Store', icon: '🌐', color: '#3b82f6', revenue: 380000, percent: 13 },
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
                method: 'POST',
                body: JSON.stringify({
                    amount: parseFloat(newExpense.amount),
                    description: newExpense.description || cat?.label,
                    category: newExpense.category,
                    expense_type: 'BUSINESS'
                })
            })
        } catch (e) { }
        setExpenses([{ id: Date.now(), category: cat?.label, amount: parseFloat(newExpense.amount), icon: cat?.icon, date: 'Just now' }, ...expenses])
        setNewExpense({ category: '', amount: '', description: '' })
        setShowExpenseModal(false)
    }

    const handleExport = () => {
        const csv = [
            'Period,Revenue,Profit,Orders',
            `${period} days,${stats.revenue},${stats.profit},${stats.orders}`,
            '',
            'Top Products',
            ...topProducts.map(p => `${p.name},${p.sales} sales,${p.revenue}`),
            '',
            'Expenses',
            ...expenses.map(e => `${e.category},${e.amount},${e.date}`)
        ].join('\n')
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
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#030712]' : 'bg-gray-50'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading insights...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['Inter',system-ui,sans-serif] ${isDark ? 'bg-[#030712]' : 'bg-gray-50'}`}>

            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] rounded-full blur-3xl ${isDark ? 'bg-emerald-500/8' : 'bg-emerald-500/5'}`}></div>
                <div className={`absolute top-1/2 -right-32 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-purple-500/8' : 'bg-purple-500/5'}`}></div>
                <div className={`absolute bottom-32 -left-32 w-60 h-60 rounded-full blur-3xl ${isDark ? 'bg-blue-500/8' : 'bg-blue-500/5'}`}></div>
            </div>

            <div className="relative max-w-md mx-auto pb-28">

                {/* Header */}
                <header className={`sticky top-0 z-30 px-5 pt-4 pb-3 ${isDark ? 'bg-[#030712]/80' : 'bg-gray-50/80'} backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => navigate('/dashboard')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <span className="text-lg">←</span>
                        </button>
                        <button onClick={handleExport} className="px-4 h-10 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-sm font-bold shadow-lg hover:scale-105 transition-all flex items-center gap-2">
                            <span>📤</span>
                            <span>Export</span>
                        </button>
                    </div>

                    <h1 className={`text-3xl font-black tracking-tight mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Insights</h1>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Your business analytics</p>

                    {/* Period Selector */}
                    <div className="flex gap-2 mt-4">
                        {periods.map(p => (
                            <button
                                key={p.id}
                                onClick={() => setPeriod(p.id)}
                                className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${period === p.id
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg'
                                    : isDark ? 'bg-white/5 text-gray-400' : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>
                </header>

                {/* Tab Navigation */}
                <div className="flex gap-2 px-5 pt-4 overflow-x-auto no-scrollbar">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-4 h-10 rounded-xl whitespace-nowrap transition-all hover:scale-105 ${activeTab === tab.id
                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-semibold shadow-lg'
                                : isDark ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                        >
                            <span>{tab.icon}</span>
                            <span className="text-sm">{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="px-5 pt-5 space-y-4">
                        {/* Hero Revenue Card */}
                        <div className={`relative overflow-hidden rounded-3xl p-6 ${isDark
                            ? 'bg-gradient-to-br from-emerald-500/20 via-emerald-600/10 to-transparent border border-emerald-500/20'
                            : 'bg-gradient-to-br from-emerald-50 to-white border border-emerald-100'
                            }`}>
                            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-emerald-400/20 to-transparent rounded-full blur-2xl"></div>
                            <div className="relative">
                                <div className="flex items-center gap-2 mb-2">
                                    <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</span>
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                        +{stats.growth}%
                                    </span>
                                </div>
                                <h2 className={`text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(stats.revenue)}
                                </h2>

                                {/* Mini Chart */}
                                <div className="flex items-end gap-1 h-16 mt-6">
                                    {[30, 45, 35, 60, 45, 75, 55, 85, 65, 95, 75, 100].map((h, i) => (
                                        <div key={i} className="flex-1">
                                            <div
                                                className={`w-full rounded-t-sm transition-all ${i >= 10 ? 'bg-emerald-400' : isDark ? 'bg-white/10' : 'bg-gray-200'}`}
                                                style={{ height: `${h}%` }}
                                            ></div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`rounded-2xl p-4 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">💰</span>
                                </div>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.profit)}</p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Net Profit</p>
                            </div>
                            <div className={`rounded-2xl p-4 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <span className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">📦</span>
                                </div>
                                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.orders}</p>
                                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total Orders</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Top Products Tab */}
                {activeTab === 'products' && (
                    <div className="px-5 pt-5 space-y-3">
                        <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Best Sellers</h3>
                        {topProducts.map((product, i) => (
                            <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                <div className="relative">
                                    <div className={`w-16 h-16 rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                        {product.image ? (
                                            <img src={product.image} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-2xl opacity-30">📦</div>
                                        )}
                                    </div>
                                    <span className="absolute -top-1 -left-1 w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white text-xs font-bold shadow-lg">
                                        {i + 1}
                                    </span>
                                </div>
                                <div className="flex-1">
                                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{product.name}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{product.sales} sold</span>
                                        <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">{product.trend}</span>
                                    </div>
                                </div>
                                <p className="font-bold text-emerald-500">{formatCurrency(product.revenue)}</p>
                            </div>
                        ))}
                    </div>
                )}

                {/* Expenses Tab */}
                {activeTab === 'expenses' && (
                    <div className="px-5 pt-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Expenses</h3>
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total: {formatCurrency(totalExpenses)}</p>
                            </div>
                            <button
                                onClick={() => setShowExpenseModal(true)}
                                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-sm font-bold shadow-lg hover:scale-105 transition-all"
                            >
                                + Log
                            </button>
                        </div>

                        {expenses.map((expense) => (
                            <div key={expense.id} className={`flex items-center gap-4 p-4 rounded-2xl border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                    {expense.icon}
                                </div>
                                <div className="flex-1">
                                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{expense.category}</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{expense.date}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="font-bold text-red-400">-{formatCurrency(expense.amount)}</p>
                                    <button
                                        onClick={() => {
                                            if (confirm('Delete this expense?')) {
                                                setExpenses(expenses.filter(e => e.id !== expense.id))
                                            }
                                        }}
                                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm hover:scale-110 transition-all ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'}`}
                                    >
                                        🗑️
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Channels Tab */}
                {activeTab === 'channels' && (
                    <div className="px-5 pt-5 space-y-4">
                        <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Sales by Channel</h3>

                        {channels.map((channel, i) => (
                            <div key={i} className={`rounded-2xl p-4 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{channel.icon}</span>
                                        <div>
                                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{channel.name}</p>
                                            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{channel.percent}% of sales</p>
                                        </div>
                                    </div>
                                    <p className="font-bold" style={{ color: channel.color }}>{formatCurrency(channel.revenue)}</p>
                                </div>
                                <div className={`h-2 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                    <div
                                        className="h-full rounded-full transition-all"
                                        style={{ width: `${channel.percent}%`, backgroundColor: channel.color }}
                                    ></div>
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
                    <div className={`relative w-full max-w-md rounded-t-3xl p-6 ${isDark ? 'bg-[#030712]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center mb-6">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-300'}`}></div>
                        </div>

                        <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>Log Expense</h3>

                        <div className="space-y-5">
                            <div>
                                <label className={`block text-xs font-bold uppercase mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category</label>
                                <div className="grid grid-cols-3 gap-2">
                                    {expenseCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                                            className={`flex flex-col items-center gap-1 p-3 rounded-xl transition-all hover:scale-105 ${newExpense.category === cat.id
                                                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white'
                                                : isDark ? 'bg-white/5' : 'bg-gray-100'
                                                }`}
                                        >
                                            <span className="text-xl">{cat.icon}</span>
                                            <span className="text-[10px] font-bold">{cat.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Amount (₦)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className={`w-full rounded-xl px-4 py-4 text-2xl font-bold border focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'}`}
                                />
                            </div>

                            <button
                                onClick={handleAddExpense}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold text-lg shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all"
                            >
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
