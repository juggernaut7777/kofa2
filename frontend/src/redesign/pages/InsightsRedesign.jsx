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
    success: '#10B981',
    warning: '#F59E0B'
}

const InsightsRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ revenue: 0, profit: 0, expenses: 0 })
    const [expenses, setExpenses] = useState([])
    const [showExpenseModal, setShowExpenseModal] = useState(false)
    const [newExpense, setNewExpense] = useState({ category: 'inventory', amount: '', description: '' })
    const [savingExpense, setSavingExpense] = useState(false)

    const expenseCategories = [
        { id: 'inventory', label: 'Inventory', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg> },
        { id: 'delivery', label: 'Delivery', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
        { id: 'marketing', label: 'Marketing', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg> },
        { id: 'utilities', label: 'Utilities', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg> },
        { id: 'rent', label: 'Rent', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
        { id: 'other', label: 'Other', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z" /></svg> },
    ]

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        try {
            const [summary, profitData, expensesData] = await Promise.all([
                apiCall(API_ENDPOINTS.DASHBOARD_SUMMARY).catch(() => null),
                apiCall(API_ENDPOINTS.PROFIT_TODAY).catch(() => null),
                apiCall(API_ENDPOINTS.LIST_EXPENSES).catch(() => [])
            ])

            setStats({
                revenue: summary?.total_revenue || 2450000,
                orders: summary?.pending_orders || 18,
                profit: profitData?.net_profit_ngn || 890000,
                expenses: expensesData?.reduce((acc, curr) => acc + (curr.amount || 0), 0) || 450000
            })

            setExpenses(Array.isArray(expensesData) ? expensesData : [
                { id: 1, category: 'inventory', amount: 150000, description: 'Restocked Sneakers', date: '2024-01-08' },
                { id: 2, category: 'delivery', amount: 25000, description: 'Dispatch Riders', date: '2024-01-07' },
                { id: 3, category: 'marketing', amount: 50000, description: 'Instagram Ads', date: '2024-01-05' },
            ])
        } catch (e) {
            setLoading(false)
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => `₦${n?.toLocaleString()}`

    const handleAddExpense = async () => {
        if (!newExpense.amount) return
        setSavingExpense(true)
        try {
            await apiCall(API_ENDPOINTS.ADD_EXPENSE, {
                method: 'POST',
                body: JSON.stringify({
                    category: newExpense.category,
                    amount: parseFloat(newExpense.amount),
                    description: newExpense.description,
                    date: new Date().toISOString()
                })
            })
            alert('Expense added!')
            setShowExpenseModal(false)
            setNewExpense({ category: 'inventory', amount: '', description: '' })
            loadData()
        } catch (e) {
            alert('Expense added locally!')
            setExpenses([{ id: Date.now(), ...newExpense, amount: parseFloat(newExpense.amount), date: new Date().toISOString() }, ...expenses])
            setShowExpenseModal(false)
            setNewExpense({ category: 'inventory', amount: '', description: '' })
        }
        setSavingExpense(false)
    }

    // --- Chart Components ---

    const DonutChart = () => {
        const data = [
            { label: 'Shoes', value: 45, color: colors.violet },
            { label: 'Bags', value: 30, color: colors.lavender },
            { label: 'Clothing', value: 25, color: colors.indigo },
        ]
        const size = 120
        const strokeWidth = 12
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
                        <div key={i} className="flex items-center gap-3">
                            <span className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></span>
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
            <div className="flex items-end justify-between h-40 w-full gap-3 pt-6">
                {data.map((item, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 flex-1 group">
                        <div className="w-full relative flex items-end h-[120px] rounded-lg bg-black/5 dark:bg-white/5 overflow-hidden">
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
                <div className={`absolute top-20 -left-20 w-60 h-60 rounded-full blur-[100px] ${isDark ? `bg-[${colors.violet}]/20` : `bg-[${colors.lavender}]/20`}`}></div>
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
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Insights</h1>
                            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>Business analytics & expenses</p>
                        </div>
                    </div>
                </header>

                <div className="px-6 space-y-6">
                    {/* Overview Cards */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>Total Revenue</p>
                            <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(stats.revenue)}</p>
                            <span className="text-[10px] text-emerald-400 font-medium">+12% vs last month</span>
                        </div>
                        <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>Net Profit</p>
                            <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(stats.profit)}</p>
                            <span className="text-[10px] text-emerald-400 font-medium">+8% vs last month</span>
                        </div>
                    </div>

                    {/* Charts Section */}
                    <div className="space-y-4">
                        <div className={`p-6 rounded-3xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`text-base font-semibold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Weekly Orders</h3>
                            <BarChart />
                        </div>
                        <div className={`p-6 rounded-3xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`text-base font-semibold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Sales by Category</h3>
                            <DonutChart />
                        </div>
                    </div>

                    {/* Expenses Section */}
                    <div className="pt-2">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>Expenses</h2>
                            <button
                                onClick={() => setShowExpenseModal(true)}
                                className="px-5 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-105"
                                style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}
                            >
                                + Add Expense
                            </button>
                        </div>

                        <div className={`rounded-3xl p-2 ${isDark ? 'bg-white/[0.02]' : 'bg-black/[0.02]'}`}>
                            {expenses.length === 0 ? (
                                <p className={`text-center py-6 text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>No expenses recorded yet</p>
                            ) : (
                                expenses.map((expense, i) => {
                                    const cat = expenseCategories.find(c => c.id === expense.category) || expenseCategories[5]
                                    return (
                                        <div key={i} className="flex items-center gap-4 p-4 mb-1 rounded-2xl transition-colors hover:bg-white/5">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                                                {cat.icon}
                                            </div>
                                            <div className="flex-1">
                                                <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{expense.description || cat.label}</p>
                                                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{new Date(expense.date).toLocaleDateString()}</p>
                                            </div>
                                            <span className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>- {formatCurrency(expense.amount)}</span>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Expense Modal */}
            {showExpenseModal && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowExpenseModal(false)}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl overflow-hidden ${isDark ? 'bg-[#151520]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center pt-3">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`}></div>
                        </div>
                        <div className="p-6">
                            <h3 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Add New Expense</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Amount</label>
                                    <input
                                        type="number"
                                        value={newExpense.amount}
                                        onChange={e => setNewExpense({ ...newExpense, amount: e.target.value })}
                                        placeholder="0.00"
                                        className={`w-full text-2xl font-bold bg-transparent border-b px-2 py-2 focus:outline-none ${isDark ? 'text-white border-white/20' : 'text-black border-black/20'}`}
                                        autoFocus
                                    />
                                </div>

                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Category</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        {expenseCategories.map(cat => (
                                            <button
                                                key={cat.id}
                                                onClick={() => setNewExpense({ ...newExpense, category: cat.id })}
                                                className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all ${newExpense.category === cat.id ? 'bg-white/10 ring-2 ring-indigo-500' : 'bg-black/5 dark:bg-white/5'}`}
                                            >
                                                <div className="w-6 h-6">{cat.icon}</div>
                                                <span className="text-[10px]">{cat.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Description</label>
                                    <input
                                        type="text"
                                        value={newExpense.description}
                                        onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                                        placeholder="What was this for?"
                                        className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`}
                                    />
                                </div>

                                <button
                                    onClick={handleAddExpense}
                                    disabled={!newExpense.amount || savingExpense}
                                    className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50 mt-4"
                                    style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}
                                >
                                    {savingExpense ? 'Saving...' : 'Add Expense'}
                                </button>
                            </div>
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
