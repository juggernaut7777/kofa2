import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import { ChevronLeft, MoreHorizontal, Plus, TrendingUp, Home, Megaphone, Package, Truck, Wrench, FileText } from 'lucide-react'

const ExpensesRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('all')
    const [showAddModal, setShowAddModal] = useState(false)
    const [saving, setSaving] = useState(false)
    const [selectedMonth] = useState('January 2026')

    const [newExpense, setNewExpense] = useState({
        description: '', amount: '', category: 'restock'
    })

    const categories = [
        { id: 'all', label: 'All' },
        { id: 'rent', label: 'Rent', icon: Home, color: 'orange' },
        { id: 'marketing', label: 'Marketing', icon: Megaphone, color: 'purple' },
        { id: 'restock', label: 'Restock', icon: Package, color: 'blue' },
        { id: 'delivery', label: 'Delivery', icon: Truck, color: 'green' },
        { id: 'misc', label: 'Misc', icon: Wrench, color: 'red' }
    ]

    useEffect(() => { loadExpenses() }, [])

    const loadExpenses = async () => {
        setLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.LIST_EXPENSES)
            setExpenses(Array.isArray(data) ? data : [])
        } catch (e) {
            setExpenses([])
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    const totalSpend = expenses.reduce((sum, e) => sum + (e.amount || 0), 0)

    const handleAddExpense = async () => {
        if (!newExpense.description || !newExpense.amount) { alert('Please fill all fields'); return }
        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.LOG_EXPENSE, {
                method: 'POST',
                body: JSON.stringify({
                    description: newExpense.description,
                    amount: parseFloat(newExpense.amount),
                    category: newExpense.category,
                    date: new Date().toISOString()
                })
            })
            setShowAddModal(false)
            setNewExpense({ description: '', amount: '', category: 'restock' })
            loadExpenses()
        } catch (e) {
            alert('Failed to add expense')
        } finally {
            setSaving(false)
        }
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
                <h1 className="text-lg font-semibold">Financial Ledger</h1>
                <button className={`p-2 -mr-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <MoreHorizontal size={24} />
                </button>
            </header>

            {/* Gradient Summary Card */}
            <div className="px-4 py-4">
                <div className="bg-gradient-to-r from-[#0095FF] to-[#00D4FF] rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-white/80 text-sm">{selectedMonth}</span>
                    </div>
                    <p className="text-white/70 text-xs font-medium tracking-wide uppercase mb-1">Total Spend</p>
                    <h2 className="text-4xl font-bold text-white mb-2">{formatCurrency(totalSpend)}</h2>
                    <div className="flex items-center gap-2">
                        <span className="bg-white/20 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                            <TrendingUp size={12} /> 12%
                        </span>
                        <span className="text-white/60 text-xs">vs last month</span>
                    </div>
                </div>
            </div>

            {/* Filter Pills */}
            <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => setActiveFilter(cat.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === cat.id
                                ? 'bg-[#0095FF] text-white'
                                : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Expenses List */}
            <div className="px-4 pb-40">
                {loading ? (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading expenses...</div>
                ) : Object.keys(groupedExpenses).length === 0 ? (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No expenses found</div>
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
                                            <div className="text-right">
                                                <p className="font-semibold text-red-500">-{formatCurrency(expense.amount)}</p>
                                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatTime(expense.date)}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Bottom Button */}
            <div className={`fixed bottom-20 left-0 right-0 p-4 ${isDark ? 'bg-[#0F0F12]' : 'bg-white'} border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <button onClick={() => setShowAddModal(true)} className="w-full py-3 bg-[#0095FF] text-white font-semibold rounded-xl flex items-center justify-center gap-2">
                    <Plus size={20} />
                    Log Expense
                </button>
            </div>

            {/* Add Expense Modal */}
            {showAddModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
                    <div className={`rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 ${isDark ? 'bg-[#1A1A1F]' : 'bg-white'}`}>
                        <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : ''}`}>Log Expense</h2>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Description</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Stock purchase"
                                    value={newExpense.description}
                                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10 focus:border-[#0095FF]' : 'bg-gray-100 focus:bg-white border border-gray-100 focus:border-[#0095FF]'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Amount (₦)</label>
                                <input
                                    type="number"
                                    placeholder="0"
                                    value={newExpense.amount}
                                    onChange={(e) => setNewExpense({ ...newExpense, amount: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10 focus:border-[#0095FF]' : 'bg-gray-100 focus:bg-white border border-gray-100 focus:border-[#0095FF]'}`}
                                />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Category</label>
                                <select
                                    value={newExpense.category}
                                    onChange={(e) => setNewExpense({ ...newExpense, category: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`}
                                >
                                    {categories.filter(c => c.id !== 'all').map(cat => (
                                        <option key={cat.id} value={cat.id}>{cat.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowAddModal(false)} className={`flex-1 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                            <button onClick={handleAddExpense} disabled={saving} className="flex-1 py-3 bg-[#0095FF] text-white rounded-xl font-semibold">
                                {saving ? 'Saving...' : 'Add'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ExpensesRedesign
