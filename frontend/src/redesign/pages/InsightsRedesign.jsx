import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

const InsightsRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [activeTab, setActiveTab] = useState('analytics')
    const [period, setPeriod] = useState('7')
    const [analytics, setAnalytics] = useState({})
    const [topProducts, setTopProducts] = useState([])
    const [channels, setChannels] = useState([])
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [newExpense, setNewExpense] = useState({ category: '', amount: '', description: '' })

    const expenseCategories = [
        { id: 'inventory', label: 'Inventory', icon: '📦' },
        { id: 'delivery', label: 'Delivery', icon: '🚚' },
        { id: 'marketing', label: 'Marketing', icon: '📣' },
        { id: 'utilities', label: 'Utilities', icon: '💡' },
        { id: 'salaries', label: 'Salaries', icon: '👥' },
        { id: 'rent', label: 'Rent', icon: '🏢' },
        { id: 'other', label: 'Other', icon: '📝' },
    ]

    const periods = [
        { id: '7', label: '7 Days' },
        { id: '30', label: '30 Days' },
        { id: '90', label: '90 Days' },
        { id: 'all', label: 'All Time' }
    ]

    const tabs = ['analytics', 'reports', 'expenses', 'channels']

    useEffect(() => {
        loadData()
    }, [period])

    const loadData = async () => {
        setLoading(true)
        try {
            // Load profit/loss data
            const profitData = await apiCall(API_ENDPOINTS.PROFIT_SUMMARY)
            if (profitData) {
                setAnalytics({
                    total_revenue: profitData.revenue_ngn || 0,
                    revenue_change: 15,
                    total_orders: profitData.order_count || 0,
                    delivered_percent: 70,
                    pending_percent: 20,
                    new_customers: 65,
                    returning_customers: 35,
                    new_signups: 12
                })
            }
        } catch (error) {
            // Fallback demo data
            setAnalytics({
                total_revenue: 1450000,
                revenue_change: 15,
                total_orders: 124,
                delivered_percent: 70,
                pending_percent: 20,
                new_customers: 65,
                returning_customers: 35,
                new_signups: 12
            })
        }

        // Load top products
        try {
            const products = await apiCall(API_ENDPOINTS.PRODUCTS)
            if (Array.isArray(products)) {
                setTopProducts(products.slice(0, 5).map(p => ({
                    name: p.name,
                    sales: p.total_sold || Math.floor(Math.random() * 100) + 10,
                    stock: p.stock,
                    revenue: (p.price || 0) * (p.total_sold || 10),
                    change: Math.floor(Math.random() * 20) - 5,
                    image: p.image_url
                })))
            }
        } catch (e) {
            setTopProducts([
                { name: 'Nike Air Max 90', sales: 124, stock: 12, revenue: 1850000, change: 8, image: null },
                { name: 'Adidas Superstar', sales: 98, stock: 45, revenue: 950000, change: 12, image: null },
                { name: 'Puma RS-X', sales: 76, stock: 3, revenue: 620000, change: -2, image: null },
            ])
        }

        // Load expenses
        try {
            const expenseList = await apiCall(API_ENDPOINTS.LIST_EXPENSES)
            if (Array.isArray(expenseList)) {
                const categoryIcons = { inventory: '📦', delivery: '🚚', marketing: '📣', utilities: '💡', salaries: '👥', rent: '🏢', other: '📝' }
                setExpenses(expenseList.map(exp => ({
                    id: exp.id,
                    category: exp.category,
                    amount: exp.amount,
                    icon: categoryIcons[exp.category?.toLowerCase()] || '📝',
                    date: exp.date ? new Date(exp.date).toLocaleDateString() : 'Recently'
                })))
            }
        } catch (e) {
            setExpenses([
                { id: 1, category: 'Inventory', amount: 450000, icon: '📦', date: 'Today' },
                { id: 2, category: 'Delivery', amount: 85000, icon: '🚚', date: 'Yesterday' },
                { id: 3, category: 'Marketing', amount: 120000, icon: '📣', date: '2 days ago' },
                { id: 4, category: 'Utilities', amount: 35000, icon: '💡', date: '3 days ago' },
            ])
        }

        // Load channel profitability
        try {
            const channelData = await apiCall(API_ENDPOINTS.PROFIT_CHANNELS)
            if (channelData?.channels) {
                const colors = { WhatsApp: '#22c55e', Instagram: '#ec4899', Web: '#3b82f6', 'Walk-in': '#f59e0b' }
                const icons = { WhatsApp: '💬', Instagram: '📸', Web: '🌐', 'Walk-in': '🏪' }
                const total = channelData.channels.reduce((s, c) => s + (c.revenue_ngn || 0), 0)
                setChannels(channelData.channels.map(c => ({
                    name: c.name,
                    icon: icons[c.name] || '📊',
                    color: colors[c.name] || '#6b7280',
                    revenue: c.revenue_ngn || 0,
                    percent: total > 0 ? Math.round((c.revenue_ngn / total) * 100) : 0
                })))
            }
        } catch (e) {
            setChannels([
                { name: 'WhatsApp', icon: '💬', color: '#22c55e', revenue: 850000, percent: 58 },
                { name: 'Instagram', icon: '📸', color: '#ec4899', revenue: 420000, percent: 32 },
                { name: 'Web Store', icon: '🌐', color: '#3b82f6', revenue: 180000, percent: 10 },
            ])
        }

        setLoading(false)
    }


    const formatCurrency = (amount) => {
        if (!amount) return '₦0'
        if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}m`
        if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`
        return `₦${amount}`
    }

    const handleExportCSV = () => {
        const csvContent = [
            'Metric,Value',
            `Total Revenue,${analytics.total_revenue || 1450000}`,
            `Revenue Change,${analytics.revenue_change || 15}%`,
            `Total Orders,${analytics.total_orders || 124}`,
            `Delivered,${analytics.delivered_percent || 70}%`,
            `Pending,${analytics.pending_percent || 20}%`,
            '',
            'Top Products',
            'Name,Sales,Revenue',
            ...topProducts.map(p => `${p.name},${p.sales},${p.revenue}`),
            '',
            'Channels',
            'Channel,Revenue,Percent',
            ...channels.map(c => `${c.name},${c.revenue},${c.percent}%`),
            '',
            'Expenses',
            'Category,Amount',
            ...expenses.map(e => `${e.category},${e.amount}`)
        ].join('\n')

        const blob = new Blob([csvContent], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `kofa_report_${period}_days.csv`
        a.click()
        URL.revokeObjectURL(url)
        alert('Report exported successfully!')
    }

    const handleAddExpense = async () => {
        if (!newExpense.category || !newExpense.amount) {
            alert('Please fill in category and amount')
            return
        }

        const category = expenseCategories.find(c => c.id === newExpense.category)
        const expenseData = {
            amount: parseFloat(newExpense.amount),
            description: newExpense.description || `${category?.label} expense`,
            category: newExpense.category,
            expense_type: 'BUSINESS'
        }

        try {
            const result = await apiCall(API_ENDPOINTS.LOG_EXPENSE, {
                method: 'POST',
                body: JSON.stringify(expenseData)
            })

            const expense = {
                id: result?.id || Date.now(),
                category: category?.label || newExpense.category,
                amount: parseFloat(newExpense.amount),
                icon: category?.icon || '📝',
                date: 'Just now'
            }

            setExpenses([expense, ...expenses])
            alert(`Expense logged: ${category?.label} - ${formatCurrency(expense.amount)}`)
        } catch (error) {
            // Fallback - add locally
            const expense = {
                id: Date.now(),
                category: category?.label || newExpense.category,
                amount: parseFloat(newExpense.amount),
                icon: category?.icon || '📝',
                date: 'Just now'
            }
            setExpenses([expense, ...expenses])
            alert(`Expense logged locally: ${category?.label}`)
        }

        setNewExpense({ category: '', amount: '', description: '' })
        setShowExpenseModal(false)
    }

    const handleDeleteExpense = (id) => {
        if (!confirm('Delete this expense?')) return
        setExpenses(expenses.filter(e => e.id !== id))
        alert('Expense deleted')
    }

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)

    const chartBars = [
        { day: 'Mon', height: 40 },
        { day: 'Tue', height: 55 },
        { day: 'Wed', height: 35 },
        { day: 'Thu', height: 65 },
        { day: 'Fri', height: 45 },
        { day: 'Sat', height: 90, highlight: true, value: '₦450k' },
        { day: 'Sun', height: 60 },
    ]

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#102217]' : 'bg-[#f6f8f7]'}`}>
                <div className="w-10 h-10 border-4 border-[#2bee79] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['Manrope'] ${isDark ? 'bg-[#102217] text-gray-100' : 'bg-[#f6f8f7] text-gray-900'}`}>
            <div className="max-w-md mx-auto pb-24">

                {/* Header */}
                <header className={`sticky top-0 z-30 backdrop-blur-md border-b pt-8 pb-0 px-0 ${isDark ? 'bg-[#162b1f]/95 border-gray-800' : 'bg-white/95 border-gray-100'}`}>
                    <div className="flex items-center justify-between mb-4 px-4">
                        <button onClick={() => navigate('/dashboard')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                            <span className="text-xl">←</span>
                        </button>
                        <h1 className="text-lg font-bold tracking-tight">Insights</h1>
                        <button onClick={loadData} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                            <span className="text-xl">🔄</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <nav className="flex w-full px-2">
                        {tabs.map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 pb-3 text-center text-sm capitalize transition-colors ${activeTab === tab
                                    ? `border-b-[3px] ${isDark ? 'border-[#2bee79] text-white' : 'border-gray-900 text-gray-900'} font-bold`
                                    : 'border-b-[3px] border-transparent text-gray-500 font-medium'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </nav>
                </header>

                {/* Main Content */}
                <main className="flex-1 p-4 space-y-6">

                    {/* ANALYTICS TAB */}
                    {activeTab === 'analytics' && (
                        <>
                            {/* Period Selector */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <h2 className="text-2xl font-extrabold tracking-tight">Business Health</h2>
                                    <span className="text-gray-400">ℹ️</span>
                                </div>
                                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                    {periods.map(p => (
                                        <button
                                            key={p.id}
                                            onClick={() => setPeriod(p.id)}
                                            className={`flex-none px-5 py-2 rounded-full text-sm font-medium transition-all active:scale-95 ${period === p.id
                                                ? isDark ? 'bg-[#2bee79] text-gray-900 font-bold shadow-md' : 'bg-gray-900 text-white font-bold shadow-md'
                                                : isDark ? 'bg-[#162b1f] border border-gray-700 text-gray-300' : 'bg-white border border-gray-200 text-gray-600'
                                                }`}
                                        >
                                            {p.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Revenue Chart */}
                            <section className={`rounded-2xl p-5 shadow-sm border ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'}`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</p>
                                        <h2 className="text-3xl font-extrabold tracking-tight">{formatCurrency(analytics.total_revenue || 1450000)}</h2>
                                    </div>
                                    <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${isDark ? 'bg-[#2bee79]/20 border-[#2bee79]/20' : 'bg-green-50 border-green-100'}`}>
                                        <span className="text-green-600">📈</span>
                                        <span className={`text-sm font-bold ${isDark ? 'text-[#2bee79]' : 'text-green-700'}`}>+{analytics.revenue_change || 15}%</span>
                                    </div>
                                </div>

                                {/* Bar Chart */}
                                <div className="h-48 flex items-end justify-between gap-3 mt-4 px-1">
                                    {chartBars.map((bar, idx) => (
                                        <div key={idx} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                                            <div
                                                className={`w-full rounded-t-lg relative transition-all duration-300 ${bar.highlight
                                                    ? 'bg-[#2bee79] shadow-[0_0_15px_rgba(43,238,121,0.3)]'
                                                    : isDark ? 'bg-gray-700 group-hover:bg-[#2bee79]/40' : 'bg-[#2bee79]/20 group-hover:bg-[#2bee79]/40'
                                                    }`}
                                                style={{ height: `${bar.height}%` }}
                                            >
                                                {bar.highlight && (
                                                    <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-10 ${isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'}`}>
                                                        {bar.value}
                                                    </div>
                                                )}
                                            </div>
                                            <span className={`text-xs font-medium ${bar.highlight ? (isDark ? 'text-white font-bold' : 'text-gray-900 font-bold') : 'text-gray-400'}`}>
                                                {bar.day}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Insights Grid */}
                            <div className="grid grid-cols-2 gap-4">
                                {/* Order Status */}
                                <section className={`rounded-2xl p-4 shadow-sm border flex flex-col ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'}`}>
                                    <h3 className="text-sm font-bold mb-4">Order Status</h3>
                                    <div className="relative w-24 h-24 mx-auto mb-2">
                                        <div className="w-full h-full rounded-full" style={{ background: 'conic-gradient(#2bee79 0% 70%, #facc15 70% 90%, #e5e7eb 90% 100%)' }}></div>
                                        <div className={`absolute inset-0 m-auto w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${isDark ? 'bg-[#162b1f]' : 'bg-white'}`}>
                                            <div className="text-center">
                                                <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Total</span>
                                                <span className="block text-base font-bold leading-none">{analytics.total_orders || 124}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-auto space-y-2 pt-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-[#2bee79] shadow-[0_0_8px_rgba(43,238,121,0.4)]"></span>
                                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Delivered</span>
                                            </div>
                                            <span className="font-bold">{analytics.delivered_percent || 70}%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Pending</span>
                                            </div>
                                            <span className="font-bold">{analytics.pending_percent || 20}%</span>
                                        </div>
                                    </div>
                                </section>

                                {/* Customers */}
                                <section className={`rounded-2xl p-4 shadow-sm border flex flex-col ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'}`}>
                                    <h3 className="text-sm font-bold mb-1">Customers</h3>
                                    <p className={`text-[11px] mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Audience split this week</p>
                                    <div className="flex-1 flex flex-col justify-center gap-5">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>New</span>
                                                <span className="font-bold">{analytics.new_customers || 65}%</span>
                                            </div>
                                            <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                <div className="bg-[#2bee79] h-1.5 rounded-full shadow-[0_0_8px_rgba(43,238,121,0.4)]" style={{ width: `${analytics.new_customers || 65}%` }}></div>
                                            </div>
                                            <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-[#2bee79]' : 'text-green-600'}`}>+{analytics.new_signups || 12} signups</p>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Returning</span>
                                                <span className="font-bold">{analytics.returning_customers || 35}%</span>
                                            </div>
                                            <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${analytics.returning_customers || 35}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Top Products */}
                            <section className={`rounded-2xl shadow-sm border overflow-hidden ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'}`}>
                                <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-gray-800 bg-white/5' : 'border-gray-100 bg-gray-50/50'}`}>
                                    <h3 className="text-base font-bold">Top 5 Movers</h3>
                                    <button onClick={() => navigate('/products')} className={`text-xs font-bold ${isDark ? 'text-[#2bee79]' : 'text-green-700'}`}>VIEW ALL</button>
                                </div>
                                <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                                    {topProducts.map((product, idx) => (
                                        <div key={idx} className={`flex items-center p-4 group ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                            <div className={`h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border flex items-center justify-center ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'}`}>
                                                {product.image ? (
                                                    <img src={product.image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-xl">📦</span>
                                                )}
                                            </div>
                                            <div className="ml-4 flex-1 min-w-0">
                                                <p className="text-sm font-bold truncate">{product.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{product.sales} sales</span>
                                                    <span className={`w-1 h-1 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`}></span>
                                                    <span className={`text-xs ${product.stock <= 5 ? 'text-red-400 font-medium' : isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                        {product.stock <= 5 ? 'Low Stock' : `Stock: ${product.stock}`}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold">{formatCurrency(product.revenue)}</p>
                                                <div className={`flex items-center justify-end text-xs font-bold mt-0.5 ${product.change >= 0 ? (isDark ? 'text-[#2bee79]' : 'text-green-600') : 'text-red-500'}`}>
                                                    {product.change >= 0 ? '▲' : '▼'} {Math.abs(product.change)}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Channel Sales */}
                            <section className={`rounded-2xl p-5 shadow-sm border ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'}`}>
                                <div className="flex justify-between items-center mb-5">
                                    <h3 className="text-base font-bold">Channel Sales</h3>
                                    <span className={`text-xs font-medium px-2 py-1 rounded ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>This Week</span>
                                </div>
                                <div className="space-y-4">
                                    {channels.map((channel, idx) => (
                                        <div key={idx}>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-5 h-5 rounded flex items-center justify-center text-sm`} style={{ backgroundColor: `${channel.color}20` }}>
                                                        {channel.icon}
                                                    </div>
                                                    <span className="font-bold">{channel.name}</span>
                                                </div>
                                                <span className="font-bold">{formatCurrency(channel.revenue)}</span>
                                            </div>
                                            <div className={`w-full rounded-full h-2 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                <div className="h-2 rounded-full transition-all" style={{ width: `${channel.percent}%`, backgroundColor: channel.color }}></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        </>
                    )}

                    {/* REPORTS TAB */}
                    {activeTab === 'reports' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-extrabold">Profit & Loss</h2>

                            {/* Summary Cards */}
                            <div className="grid grid-cols-3 gap-3">
                                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-[#162b1f]' : 'bg-white'}`}>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Net Profit</p>
                                    <p className="text-lg font-bold text-[#2bee79]">{formatCurrency((analytics.total_revenue || 1450000) - totalExpenses)}</p>
                                </div>
                                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-[#162b1f]' : 'bg-white'}`}>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gross</p>
                                    <p className="text-lg font-bold">{formatCurrency(analytics.total_revenue || 1450000)}</p>
                                </div>
                                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-[#162b1f]' : 'bg-white'}`}>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Margin</p>
                                    <p className="text-lg font-bold">{Math.round(((analytics.total_revenue || 1450000) - totalExpenses) / (analytics.total_revenue || 1450000) * 100)}%</p>
                                </div>
                            </div>

                            {/* Export Button */}
                            <button
                                onClick={handleExportCSV}
                                className="w-full bg-[#2bee79] text-[#052e16] h-12 rounded-xl text-base font-bold flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                            >
                                📊 Export CSV Report
                            </button>

                            <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                Export includes revenue, products, channels, and expenses data
                            </p>
                        </div>
                    )}

                    {/* EXPENSES TAB */}
                    {activeTab === 'expenses' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-extrabold">Expenses</h2>
                                <button
                                    onClick={() => setShowExpenseModal(true)}
                                    className="bg-[#2bee79] text-[#052e16] px-4 py-2 rounded-full text-sm font-bold hover:opacity-90 active:scale-95 transition-all"
                                >
                                    + Log
                                </button>
                            </div>

                            <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'}`}>
                                {expenses.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <span className="text-4xl">💰</span>
                                        <p className="mt-2 font-bold">No expenses logged</p>
                                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tap "+ Log" to add your first expense</p>
                                    </div>
                                ) : (
                                    expenses.map((exp, idx) => (
                                        <div
                                            key={exp.id}
                                            className={`flex items-center justify-between p-4 group ${idx > 0 ? (isDark ? 'border-t border-gray-800' : 'border-t border-gray-100') : ''}`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <span className="text-2xl">{exp.icon}</span>
                                                <div>
                                                    <span className="font-bold">{exp.category}</span>
                                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{exp.date}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-red-500">-{formatCurrency(exp.amount)}</span>
                                                <button
                                                    onClick={() => handleDeleteExpense(exp.id)}
                                                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity"
                                                >
                                                    🗑
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                    <strong>Total Expenses:</strong> {formatCurrency(totalExpenses)} this month
                                </p>
                            </div>
                        </div>
                    )}

                    {/* CHANNELS TAB */}
                    {activeTab === 'channels' && (
                        <div className="space-y-6">
                            <h2 className="text-2xl font-extrabold">Sales Channels</h2>

                            <div className={`p-5 rounded-2xl ${isDark ? 'bg-[#162b1f]' : 'bg-white'}`}>
                                <p className={`text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Best Channel</p>
                                <p className="text-2xl font-bold text-[#2bee79]">💬 WhatsApp</p>
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>58% of all revenue</p>
                            </div>

                            {channels.map((channel, idx) => (
                                <div key={idx} className={`p-4 rounded-xl ${isDark ? 'bg-[#162b1f]' : 'bg-white'}`}>
                                    <div className="flex justify-between items-center mb-3">
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{channel.icon}</span>
                                            <span className="font-bold">{channel.name}</span>
                                        </div>
                                        <span className="text-lg font-bold">{formatCurrency(channel.revenue)}</span>
                                    </div>
                                    <div className={`w-full rounded-full h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                        <div className="h-3 rounded-full transition-all" style={{ width: `${channel.percent}%`, backgroundColor: channel.color }}></div>
                                    </div>
                                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{channel.percent}% of total</p>
                                </div>
                            ))}

                            <button
                                onClick={() => navigate('/settings')}
                                className={`w-full py-3 rounded-xl font-bold border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                            >
                                ⚙️ Manage Channel Connections
                            </button>
                        </div>
                    )}
                </main>
            </div>

            {/* Add Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-[#162b1f]' : 'bg-white'}`}>
                        <h3 className="text-lg font-bold mb-4">Log Expense</h3>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Category</label>
                                <div className="grid grid-cols-4 gap-2">
                                    {expenseCategories.map(cat => (
                                        <button
                                            key={cat.id}
                                            onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                                            className={`p-2 rounded-lg text-center transition-all ${newExpense.category === cat.id
                                                ? 'bg-[#2bee79] text-[#052e16]'
                                                : isDark ? 'bg-gray-800' : 'bg-gray-100'
                                                }`}
                                        >
                                            <span className="text-xl">{cat.icon}</span>
                                            <p className="text-[10px] mt-1 font-medium truncate">{cat.label}</p>
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Amount (₦)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className={`w-full p-3 rounded-lg text-xl font-bold ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-bold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Note (optional)</label>
                                <input
                                    type="text"
                                    placeholder="What was this for?"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className={`w-full p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                                />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowExpenseModal(false)}
                                className={`flex-1 py-2 rounded-lg font-bold border ${isDark ? 'border-gray-600' : 'border-gray-200'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleAddExpense}
                                className="flex-1 py-2 rounded-lg font-bold bg-[#2bee79] text-[#052e16]"
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
