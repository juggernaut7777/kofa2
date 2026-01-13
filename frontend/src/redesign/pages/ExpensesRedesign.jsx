import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import {
    ChevronLeft, Plus, TrendingUp, TrendingDown, Home, Megaphone,
    Package, Truck, Wrench, FileText, Edit2, Trash2, BarChart3, DollarSign
} from 'lucide-react'

const ExpensesRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    // Tab state: 'expenses' or 'reports'
    const [activeTab, setActiveTab] = useState('expenses')

    // Expenses state
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('all')
    const [showAddModal, setShowAddModal] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [saving, setSaving] = useState(false)

    const [newExpense, setNewExpense] = useState({
        description: '', amount: '', category: 'restock'
    })

    // Reports state
    const [reportData, setReportData] = useState({
        revenue: 0, expenses: 0, profit: 0, profitMargin: 0
    })
    const [reportsLoading, setReportsLoading] = useState(true)

    const categories = [
        { id: 'all', label: 'All' },
        { id: 'rent', label: 'Rent', icon: Home, color: 'orange' },
        { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'purple' },
        { id: 'restock', label: 'Restock', icon: Package, color: 'blue' },
        { id: 'delivery', label: 'Delivery', icon: Truck, color: 'green' },
        { id: 'misc', label: 'Misc', icon: Wrench, color: 'red' }
    ]

    useEffect(() => {
        loadExpenses()
        loadReports()
    }, [])

    const loadExpenses = async () => {
        setLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.LIST_EXPENSES)
            setExpenses(Array.isArray(data) ? data : [])
        } catch (e) { setExpenses([]) }
        finally { setLoading(false) }
    }

    const loadReports = async () => {
        setReportsLoading(true)
        try {
            const [profitData, expenseSummary] = await Promise.allSettled([
                apiCall(API_ENDPOINTS.PROFIT_SUMMARY),
                apiCall(API_ENDPOINTS.EXPENSE_SUMMARY)
            ])

            const profit = profitData.status === 'fulfilled' ? profitData.value : {}
            const expSum = expenseSummary.status === 'fulfilled' ? expenseSummary.value : {}

            setReportData({
                revenue: profit.total_revenue || profit.revenue || 0,
                expenses: expSum.total || profit.total_expenses || 0,
                profit: profit.net_profit_ngn || profit.net_profit || profit.total_profit || 0,
                profitMargin: profit.profit_margin || 0
            })
        } catch (e) { /* ignore */ }
        finally { setReportsLoading(false) }
    }

    const formatCurrency = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    const totalSpend = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

    const handleSaveExpense = async () => {
        if (!newExpense.description || !newExpense.amount) { alert('Please fill all fields'); return }
        setSaving(true)
        try {
            const endpoint = editingExpense ? API_ENDPOINTS.LOG_EXPENSE : API_ENDPOINTS.LOG_EXPENSE
            await apiCall(endpoint, {
                method: 'POST',
                body: JSON.stringify({
                    id: editingExpense?.id,
                    description: newExpense.description,
                    amount: parseFloat(newExpense.amount),
                    category: newExpense.category,
                    date: new Date().toISOString()
                })
            })
            setShowAddModal(false)
            setEditingExpense(null)
            setNewExpense({ description: '', amount: '', category: 'restock' })
            loadExpenses()
            loadReports()
        } catch (e) { alert('Failed to save expense') }
        finally { setSaving(false) }
    }

    const handleEditExpense = (expense) => {
        setEditingExpense(expense)
        setNewExpense({
            description: expense.description,
            amount: expense.amount.toString(),
            category: expense.category
        })
        setShowAddModal(true)
    }

    const filteredExpenses = activeFilter === 'all'
        ? expenses
        : expenses.filter(e => e.category === activeFilter)

    const groupedExpenses = filteredExpenses.reduce((acc, expense) => {
        const date = new Date(expense.date)
        const today = new Date()
        const yesterday = new Date(Date.now() - 86400000)
        let label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        if (date.toDateString() === today.toDateString()) label = 'TODAY'
        else if (date.toDateString() === yesterday.toDateString()) label = 'YESTERDAY'
        if (!acc[label]) acc[label] = []
        acc[label].push(expense)
        return acc
    }, {})

    const getCategoryIcon = (cat) => categories.find(c => c.id === cat) || { icon: FileText, color: 'blue', label: 'Other' }
    const formatTime = (dateStr) => new Date(dateStr).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0F0F12]' : 'bg-white'}`}>
            {/* Header */}
            <header className={`px-4 pt-4 pb-2 flex items-center justify-between ${isDark ? 'text-white' : ''}`}>
                <button onClick={() => navigate('/dashboard')} className={`p-2 -ml-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-semibold">Financials</h1>
                <div className="w-10"></div>
            </header>

            {/* Top Tabs */}
            <div className="px-4 pb-4">
                <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <button
                        onClick={() => setActiveTab('expenses')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'expenses' ? 'bg-[#0095FF] text-white' : isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                    >
                        Expenses
                    </button>
                    <button
                        onClick={() => setActiveTab('reports')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'reports' ? 'bg-[#0095FF] text-white' : isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                    >
                        Reports
                    </button>
                </div>
            </div>

            {/* EXPENSES TAB */}
            {activeTab === 'expenses' && (
                <>
                    {/* Summary Card */}
                    <div className="px-4 py-4">
                        <div className="bg-gradient-to-r from-[#0095FF] to-[#00D4FF] rounded-2xl p-5">
                            <p className="text-white/70 text-xs font-medium tracking-wide uppercase mb-1">Total Spend</p>
                            <h2 className="text-4xl font-bold text-white mb-2">{formatCurrency(totalSpend)}</h2>
                            <div className="flex items-center gap-2">
                                <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                                    <TrendingUp size={12} /> This month
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filter Pills */}
                    <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                onClick={() => setActiveFilter(cat.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === cat.id ? 'bg-[#0095FF] text-white' : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>

                    {/* Expenses List */}
                    <div className="px-4 pb-40">
                        {loading ? (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
                        ) : Object.keys(groupedExpenses).length === 0 ? (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                                <p>No expenses found</p>
                            </div>
                        ) : (
                            Object.entries(groupedExpenses).map(([dateLabel, items]) => (
                                <div key={dateLabel} className="mb-6">
                                    <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{dateLabel}</h3>
                                    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                        {items.map((expense, i) => {
                                            const cat = getCategoryIcon(expense.category)
                                            const Icon = cat.icon
                                            return (
                                                <div key={expense.id || i} className={`flex items-center justify-between p-4 ${i < items.length - 1 ? isDark ? 'border-b border-white/5' : 'border-b border-gray-50' : ''}`}>
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${cat.color === 'orange' ? 'bg-orange-100 text-orange-500' :
                                                                cat.color === 'purple' ? 'bg-purple-100 text-purple-500' :
                                                                    cat.color === 'blue' ? 'bg-blue-100 text-blue-500' :
                                                                        cat.color === 'green' ? 'bg-green-100 text-green-500' :
                                                                            'bg-red-100 text-red-500'
                                                            }`}>
                                                            <Icon size={18} />
                                                        </div>
                                                        <div>
                                                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{expense.description}</p>
                                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{cat.label}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <div className="text-right">
                                                            <p className="font-semibold text-red-500">-{formatCurrency(expense.amount)}</p>
                                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatTime(expense.date)}</p>
                                                        </div>
                                                        <button onClick={() => handleEditExpense(expense)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                                                            <Edit2 size={16} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add Button */}
                    <div className={`fixed bottom-20 left-0 right-0 p-4 ${isDark ? 'bg-[#0F0F12]' : 'bg-white'} border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                        <button onClick={() => { setEditingExpense(null); setNewExpense({ description: '', amount: '', category: 'restock' }); setShowAddModal(true) }} className="w-full py-3 bg-[#0095FF] text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                            <Plus size={20} /> Log Expense
                        </button>
                    </div>
                </>
            )}

            {/* REPORTS TAB */}
            {activeTab === 'reports' && (
                <div className="px-4 pb-32">
                    {reportsLoading ? (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
                    ) : (
                        <>
                            {/* Summary Cards */}
                            <div className="grid grid-cols-2 gap-3 mb-6">
                                <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                    <div className="w-10 h-10 rounded-lg bg-green-100 text-green-500 flex items-center justify-center mb-3">
                                        <TrendingUp size={20} />
                                    </div>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Revenue</p>
                                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(reportData.revenue)}</p>
                                </div>
                                <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                    <div className="w-10 h-10 rounded-lg bg-red-100 text-red-500 flex items-center justify-center mb-3">
                                        <TrendingDown size={20} />
                                    </div>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Expenses</p>
                                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(reportData.expenses)}</p>
                                </div>
                            </div>

                            {/* Profit Card */}
                            <div className={`p-5 rounded-2xl mb-6 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-xl bg-[#0095FF]/10 text-[#0095FF] flex items-center justify-center">
                                            <DollarSign size={24} />
                                        </div>
                                        <div>
                                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Net Profit</p>
                                            <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(reportData.profit)}</p>
                                        </div>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${reportData.profit >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                        {reportData.profitMargin.toFixed(1)}%
                                    </span>
                                </div>
                            </div>

                            {/* Weekly Bar Chart Placeholder */}
                            <div className={`p-4 rounded-2xl ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Weekly Sales</h3>
                                    <BarChart3 size={20} className="text-[#0095FF]" />
                                </div>
                                <div className="flex items-end justify-between gap-2 h-32">
                                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, i) => {
                                        const heights = [40, 65, 50, 78, 90, 55, 70]
                                        return (
                                            <div key={day} className="flex-1 flex flex-col items-center gap-2">
                                                <div className="w-full bg-[#0095FF]/20 rounded-t-lg" style={{ height: `${heights[i]}%` }}></div>
                                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{day}</span>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Add/Edit Expense Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
                    <div className={`rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 ${isDark ? 'bg-[#1A1A1F]' : 'bg-white'}`}>
                        <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : ''}`}>{editingExpense ? 'Edit Expense' : 'Log Expense'}</h2>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Description</label>
                                <input type="text" placeholder="e.g. Stock purchase" value={newExpense.description} onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Amount (₦)</label>
                                <input type="number" placeholder="0" value={newExpense.amount} onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Category</label>
                                <select value={newExpense.category} onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`}>
                                    {categories.filter(c => c.id !== 'all').map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => { setShowAddModal(false); setEditingExpense(null) }} className={`flex-1 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                            <button onClick={handleSaveExpense} disabled={saving} className="flex-1 py-3 bg-[#0095FF] text-white rounded-xl font-semibold">
                                {saving ? 'Saving...' : editingExpense ? 'Save' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ExpensesRedesign
