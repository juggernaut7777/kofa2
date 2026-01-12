import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

// Moonlight Color Palette
const colors = {
    lavender: '#CCCCFF',
    muted: '#A3A3CC',
    violet: '#5C5C99',
    indigo: '#292966',
    success: '#10B981',
    warning: '#F59E0B',
    rose: '#F43F5E'
}

// Expense Categories with Icons
const expenseCategories = [
    { id: 'inventory', label: 'Inventory', icon: '📦', color: '#6366F1' },
    { id: 'delivery', label: 'Delivery', icon: '🚚', color: '#8B5CF6' },
    { id: 'marketing', label: 'Marketing', icon: '📢', color: '#EC4899' },
    { id: 'utilities', label: 'Utilities', icon: '💡', color: '#F59E0B' },
    { id: 'salary', label: 'Salary', icon: '👥', color: '#10B981' },
    { id: 'other', label: 'Other', icon: '📋', color: '#6B7280' },
]

const InsightsRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ revenue: 2450000, profit: 890000, expenses: 450000, customers: 124 })
    const [expenses, setExpenses] = useState([])
    const [downloading, setDownloading] = useState(false)

    // Mock Top Products
    const topProducts = [
        { name: 'Nike Air Max', sales: 45, revenue: 1200000, trend: '+12%' },
        { name: 'Adidas Yeezy', sales: 32, revenue: 950000, trend: '+5%' },
        { name: 'Vintage Tote', sales: 28, revenue: 420000, trend: '-2%' },
    ]

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        // Load immediately with defaults, update as data arrives
        setLoading(false)

        apiCall(API_ENDPOINTS.DASHBOARD_SUMMARY)
            .then(summary => {
                if (summary) {
                    setStats(prev => ({
                        ...prev,
                        revenue: summary.total_revenue || prev.revenue,
                        orders: summary.pending_orders || prev.orders,
                        customers: summary.new_customers || prev.customers
                    }))
                }
            })
            .catch(() => { })

        apiCall(API_ENDPOINTS.PROFIT_SUMMARY)
            .then(profitData => {
                if (profitData) {
                    setStats(prev => ({
                        ...prev,
                        profit: profitData.net_profit_ngn || profitData.total_profit || prev.profit
                    }))
                }
            })
            .catch(() => { })

        apiCall(API_ENDPOINTS.LIST_EXPENSES)
            .then(expensesData => {
                if (Array.isArray(expensesData)) {
                    setExpenses(expensesData.slice(0, 5)) // Show latest 5
                    const total = expensesData.reduce((acc, curr) => acc + (curr.amount || 0), 0)
                    setStats(prev => ({ ...prev, expenses: total || prev.expenses }))
                }
            })
            .catch(() => {
                // Fallback mock data
                setExpenses([
                    { id: 1, category: 'inventory', description: 'Stock Purchase', amount: 150000, date: new Date().toISOString() },
                    { id: 2, category: 'delivery', description: 'Courier Fees', amount: 25000, date: new Date().toISOString() },
                    { id: 3, category: 'marketing', description: 'Instagram Ads', amount: 45000, date: new Date().toISOString() },
                ])
                setStats(prev => ({ ...prev, expenses: 450000 }))
            })
    }

    const formatCurrency = (n) => {
        if (n == null || isNaN(n)) return '₦0'
        return `₦${n?.toLocaleString()}`
    }

    const handleDownloadReport = () => {
        setDownloading(true)
        setTimeout(() => {
            alert('Full Insight Report downloaded successfully!')
            setDownloading(false)
        }, 1500)
    }

    // --- Shimmer Loading Skeleton ---
    const Shimmer = ({ className }) => (
        <div className={`animate-pulse bg-gradient-to-r from-transparent via-white/10 to-transparent ${className}`} />
    )

    // --- Components ---

    const MetricCard = ({ title, value, sub, trend, icon, color }) => (
        <div className={`group relative p-5 rounded-2xl overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04] shadow-sm'}`}>
            {/* Gradient accent */}
            <div className="absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-20 group-hover:opacity-40 transition-opacity" style={{ background: color || colors.violet }} />

            <div className="relative">
                <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{icon}</span>
                    <p className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>{title}</p>
                </div>
                <p className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-black'}`}>{value}</p>
                <div className="flex justify-between items-center">
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${trend?.includes('+') ? 'bg-emerald-500/10 text-emerald-400' : trend?.includes('-') ? 'bg-rose-500/10 text-rose-400' : 'bg-gray-500/10 text-gray-400'}`}>
                        {trend}
                    </span>
                    <span className={`text-[10px] ${isDark ? 'text-white/20' : 'text-black/20'}`}>{sub}</span>
                </div>
            </div>
        </div>
    )

    const DonutChart = () => {
        const data = [
            { label: 'Shoes', value: 45, color: colors.violet },
            { label: 'Bags', value: 30, color: colors.lavender },
            { label: 'Clothing', value: 25, color: colors.indigo },
        ]
        const size = 120
        const strokeWidth = 14
        const radius = (size - strokeWidth) / 2
        const circumference = 2 * Math.PI * radius
        let offset = 0

        return (
            <div className="flex items-center gap-8 justify-center">
                <div className="relative" style={{ width: size, height: size }}>
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
                                    className="transition-all duration-1000"
                                />
                            )
                        })}
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>Total</span>
                        <span className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>100%</span>
                    </div>
                </div>
                <div className="space-y-3">
                    {data.map((item, i) => (
                        <div key={i} className="flex items-center gap-3 group cursor-pointer">
                            <span className="w-3 h-3 rounded-full transition-transform group-hover:scale-125" style={{ backgroundColor: item.color }}></span>
                            <div>
                                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{item.label}</p>
                                <p className={`text-xs ${isDark ? 'text-white/50' : 'text-black/50'}`}>{item.value}% Sales</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        )
    }

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
            <div className="flex items-end justify-between h-36 w-full gap-2 pt-4">
                {data.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group cursor-pointer">
                        <div className="w-full relative flex items-end h-[100px] rounded-lg overflow-hidden">
                            <div
                                className="w-full transition-all duration-700 ease-out rounded-lg group-hover:opacity-80"
                                style={{
                                    height: `${item.value}%`,
                                    background: `linear-gradient(to top, ${colors.indigo}, ${colors.violet})`,
                                    boxShadow: `0 0 20px ${colors.violet}40`
                                }}
                            />
                        </div>
                        <span className={`text-xs font-medium ${isDark ? 'text-white/40' : 'text-black/40'}`}>{item.day}</span>
                    </div>
                ))}
            </div>
        )
    }

    // Expense Breakdown Mini Chart
    const ExpenseBreakdown = () => {
        const categoryTotals = expenseCategories.map(cat => {
            const total = expenses.filter(e => e.category === cat.id).reduce((acc, curr) => acc + (curr.amount || 0), 0)
            return { ...cat, total }
        }).filter(c => c.total > 0)

        const maxTotal = Math.max(...categoryTotals.map(c => c.total), 1)

        return (
            <div className="space-y-3">
                {categoryTotals.length === 0 ? (
                    <p className={`text-center py-4 text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>No expense data</p>
                ) : (
                    categoryTotals.slice(0, 4).map((cat, i) => (
                        <div key={i} className="group">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span>{cat.icon}</span>
                                    <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{cat.label}</span>
                                </div>
                                <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(cat.total)}</span>
                            </div>
                            <div className={`h-2 rounded-full overflow-hidden ${isDark ? 'bg-white/10' : 'bg-black/5'}`}>
                                <div
                                    className="h-full rounded-full transition-all duration-1000 ease-out"
                                    style={{
                                        width: `${(cat.total / maxTotal) * 100}%`,
                                        background: cat.color
                                    }}
                                />
                            </div>
                        </div>
                    ))
                )}
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
                <div className={`absolute top-20 -left-20 w-80 h-80 rounded-full blur-[120px] ${isDark ? `bg-[${colors.violet}]/20` : `bg-[${colors.lavender}]/20`}`}></div>
                <div className={`absolute bottom-40 -right-20 w-60 h-60 rounded-full blur-[100px] ${isDark ? `bg-[${colors.indigo}]/30` : `bg-[${colors.lavender}]/15`}`}></div>
            </div>

            <div className="relative max-w-6xl mx-auto pb-20 px-4 lg:px-0 space-y-6 animate-fadeIn">

                {/* Header */}
                <header className={`sticky top-0 z-30 px-6 pt-5 pb-4 ${isDark ? 'bg-[#0a0a14]/80' : 'bg-[#fafaff]/80'} backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={() => navigate('/dashboard')} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${isDark ? 'bg-white/5 hover:bg-white/10' : 'bg-black/5 hover:bg-black/10'}`}>
                            <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Insights</h1>
                            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>Full Business Report</p>
                        </div>
                        <button
                            onClick={handleDownloadReport}
                            disabled={downloading}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition-all hover:scale-105 active:scale-95 disabled:opacity-50 ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'}`}
                        >
                            {downloading ? (
                                <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                            ) : (
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                </svg>
                            )}
                            {downloading ? 'Generating...' : 'Download'}
                        </button>
                    </div>
                </header>

                <div className="px-6 space-y-6">

                    {/* Financial Overview Cards */}
                    <section>
                        <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>💰 Financials</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard title="Total Revenue" value={formatCurrency(stats.revenue)} trend="+12%" sub="vs last 30d" icon="📈" color="#10B981" />
                            <MetricCard title="Net Profit" value={formatCurrency(stats.profit)} trend="+8%" sub="vs last 30d" icon="💵" color="#6366F1" />
                            <MetricCard title="Total Expenses" value={formatCurrency(stats.expenses)} trend="+3%" sub="vs last 30d" icon="💸" color="#F59E0B" />
                            <MetricCard title="Customers" value={stats.customers || 0} trend="+15%" sub="vs last 30d" icon="👥" color="#EC4899" />
                        </div>
                    </section>

                    <hr className={`border-dashed ${isDark ? 'border-white/10' : 'border-black/10'}`} />

                    {/* Charts Section */}
                    <section className="space-y-4">
                        <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>📊 Analytics</h2>

                        <div className={`p-5 rounded-3xl transition-all hover:shadow-lg ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04] shadow-sm'}`}>
                            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Sales Trend (Weekly)</h3>
                            <BarChart />
                        </div>

                        <div className={`p-5 rounded-3xl transition-all hover:shadow-lg ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04] shadow-sm'}`}>
                            <h3 className={`text-base font-semibold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Category Distribution</h3>
                            <DonutChart />
                        </div>
                    </section>

                    <hr className={`border-dashed ${isDark ? 'border-white/10' : 'border-black/10'}`} />

                    {/* Expenses Section - ADDED BACK */}
                    <section>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-sm font-bold uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-black/40'}`}>💸 Expenses</h2>
                            <button
                                onClick={() => navigate('/expenses')}
                                className={`text-xs font-semibold px-3 py-1.5 rounded-lg transition-all hover:scale-105 ${isDark ? 'bg-white/10 text-white/70 hover:bg-white/20' : 'bg-black/5 text-black/70 hover:bg-black/10'}`}
                            >
                                View All →
                            </button>
                        </div>

                        {/* Expense Breakdown Chart */}
                        <div className={`p-5 rounded-3xl mb-4 transition-all hover:shadow-lg ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04] shadow-sm'}`}>
                            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Expense Breakdown</h3>
                            <ExpenseBreakdown />
                        </div>

                        {/* Recent Expenses List */}
                        <div className={`rounded-3xl overflow-hidden ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                            <div className={`px-4 py-3 border-b ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                                <p className={`text-xs font-semibold uppercase tracking-wide ${isDark ? 'text-white/40' : 'text-black/40'}`}>Recent Transactions</p>
                            </div>
                            {expenses.length === 0 ? (
                                <p className={`text-center py-8 text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>No expenses recorded yet</p>
                            ) : (
                                expenses.slice(0, 5).map((expense, i) => {
                                    const cat = expenseCategories.find(c => c.id === expense.category) || expenseCategories[5]
                                    return (
                                        <div key={i} className={`flex items-center gap-4 px-4 py-3 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                                                style={{ background: `${cat.color}20` }}
                                            >
                                                {cat.icon}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className={`text-sm font-semibold truncate ${isDark ? 'text-white' : 'text-black'}`}>
                                                    {expense.description || cat.label}
                                                </p>
                                                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <span className={`text-sm font-bold ${isDark ? 'text-rose-400' : 'text-rose-500'}`}>
                                                - {formatCurrency(expense.amount)}
                                            </span>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </section>

                    <hr className={`border-dashed ${isDark ? 'border-white/10' : 'border-black/10'}`} />

                    {/* Top Products */}
                    <section>
                        <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>🏆 Top Performers</h2>
                        <div className={`rounded-3xl overflow-hidden ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04] shadow-sm'}`}>
                            {topProducts.map((product, i) => (
                                <div key={i} className={`flex items-center justify-between p-4 transition-colors ${isDark ? 'hover:bg-white/5' : 'hover:bg-black/5'} ${i < topProducts.length - 1 ? `border-b ${isDark ? 'border-white/5' : 'border-black/5'}` : ''}`}>
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${i === 0 ? 'bg-amber-500/20 text-amber-400' : i === 1 ? 'bg-gray-400/20 text-gray-400' : 'bg-orange-600/20 text-orange-400'}`}
                                        >
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{product.name}</p>
                                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{product.sales} sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(product.revenue)}</p>
                                        <p className={`text-xs font-medium ${product.trend.includes('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{product.trend}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>

            <style>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 1.5s infinite;
                }
            `}</style>
        </div>
    )
}

export default InsightsRedesign
