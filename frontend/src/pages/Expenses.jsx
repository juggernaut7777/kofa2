import { useState, useEffect } from 'react'
import { apiCall, API_BASE_URL } from '../config/api'

const EXPENSE_CATEGORIES = [
    { id: 'rent', label: 'Rent', icon: '🏠' },
    { id: 'data', label: 'Data/Internet', icon: '📶' },
    { id: 'packing', label: 'Packing Materials', icon: '📦' },
    { id: 'transport', label: 'Transportation', icon: '🚗' },
    { id: 'airtime', label: 'Airtime', icon: '📱' },
    { id: 'electricity', label: 'Electricity', icon: '⚡' },
    { id: 'advertising', label: 'Advertising', icon: '📢' },
    { id: 'other', label: 'Other', icon: '📝' }
]

const Expenses = () => {
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'other',
        expenseType: 'business',
        date: new Date().toISOString().split('T')[0]
    })
    const [submitting, setSubmitting] = useState(false)
    const [filter, setFilter] = useState('all') // all, business, personal

    useEffect(() => {
        loadExpenses()
    }, [])

    const loadExpenses = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_BASE_URL}/expenses`)
            if (response.ok) {
                const data = await response.json()
                setExpenses(data)
            } else {
                // Fallback demo data
                setExpenses([
                    { id: '1', description: 'Shop rent - January', amount: 50000, category: 'rent', expenseType: 'business', date: '2024-01-01', created_at: '2024-01-01' },
                    { id: '2', description: 'MTN Data Bundle', amount: 5000, category: 'data', expenseType: 'business', date: '2024-01-05', created_at: '2024-01-05' },
                    { id: '3', description: 'Packaging boxes and tape', amount: 8000, category: 'packing', expenseType: 'business', date: '2024-01-10', created_at: '2024-01-10' },
                    { id: '4', description: 'Bolt rides for deliveries', amount: 12000, category: 'transport', expenseType: 'business', date: '2024-01-12', created_at: '2024-01-12' },
                    { id: '5', description: 'Personal airtime', amount: 2000, category: 'airtime', expenseType: 'personal', date: '2024-01-15', created_at: '2024-01-15' },
                ])
            }
        } catch (error) {
            console.error('Failed to load expenses:', error)
            // Use demo data
            setExpenses([
                { id: '1', description: 'Shop rent - January', amount: 50000, category: 'rent', expenseType: 'business', date: '2024-01-01', created_at: '2024-01-01' },
                { id: '2', description: 'MTN Data Bundle', amount: 5000, category: 'data', expenseType: 'business', date: '2024-01-05', created_at: '2024-01-05' },
                { id: '3', description: 'Packaging boxes and tape', amount: 8000, category: 'packing', expenseType: 'business', date: '2024-01-10', created_at: '2024-01-10' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        if (!formData.description || !formData.amount) {
            alert('Please fill in all required fields')
            return
        }

        setSubmitting(true)
        try {
            const expenseData = {
                ...formData,
                amount: parseFloat(formData.amount)
            }

            if (editingExpense) {
                // Update existing expense
                await fetch(`${API_BASE_URL}/expenses/${editingExpense.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(expenseData)
                })
            } else {
                // Create new expense
                await fetch(`${API_BASE_URL}/expenses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(expenseData)
                })
            }

            // For demo, add locally
            const newExpense = {
                id: editingExpense?.id || Date.now().toString(),
                ...expenseData,
                created_at: new Date().toISOString()
            }

            if (editingExpense) {
                setExpenses(expenses.map(e => e.id === editingExpense.id ? newExpense : e))
            } else {
                setExpenses([newExpense, ...expenses])
            }

            resetForm()
        } catch (error) {
            console.error('Failed to save expense:', error)
            // Still add locally for demo
            const newExpense = {
                id: editingExpense?.id || Date.now().toString(),
                ...formData,
                amount: parseFloat(formData.amount),
                created_at: new Date().toISOString()
            }
            if (editingExpense) {
                setExpenses(expenses.map(e => e.id === editingExpense.id ? newExpense : e))
            } else {
                setExpenses([newExpense, ...expenses])
            }
            resetForm()
        } finally {
            setSubmitting(false)
        }
    }

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this expense?')) return

        try {
            await fetch(`${API_BASE_URL}/expenses/${id}`, {
                method: 'DELETE'
            })
        } catch (error) {
            console.error('Failed to delete expense:', error)
        }

        // Remove locally
        setExpenses(expenses.filter(e => e.id !== id))
    }

    const handleEdit = (expense) => {
        setEditingExpense(expense)
        setFormData({
            description: expense.description,
            amount: expense.amount.toString(),
            category: expense.category,
            expenseType: expense.expenseType,
            date: expense.date
        })
        setShowForm(true)
    }

    const resetForm = () => {
        setFormData({
            description: '',
            amount: '',
            category: 'other',
            expenseType: 'business',
            date: new Date().toISOString().split('T')[0]
        })
        setEditingExpense(null)
        setShowForm(false)
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN'
        }).format(amount)
    }

    const getCategoryInfo = (categoryId) => {
        return EXPENSE_CATEGORIES.find(c => c.id === categoryId) || { label: categoryId, icon: '📝' }
    }

    const filteredExpenses = filter === 'all'
        ? expenses
        : expenses.filter(e => e.expenseType === filter)

    const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0)
    const businessTotal = expenses.filter(e => e.expenseType === 'business').reduce((sum, e) => sum + e.amount, 0)
    const personalTotal = expenses.filter(e => e.expenseType === 'personal').reduce((sum, e) => sum + e.amount, 0)

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                                Expenses
                            </h1>
                            <p className="text-gray-600 mt-2 text-lg">Track your business and personal expenses</p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-semibold flex items-center space-x-2"
                        >
                            <span>+</span>
                            <span>Add Expense</span>
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-red-100 text-sm font-medium">Total Expenses</p>
                                <p className="text-3xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
                                <p className="text-red-200 text-sm mt-1">{filteredExpenses.length} transactions</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <span className="text-2xl">💸</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">Business Expenses</p>
                                <p className="text-3xl font-bold mt-1">{formatCurrency(businessTotal)}</p>
                                <p className="text-blue-200 text-sm mt-1">Tax deductible</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <span className="text-2xl">🏢</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-purple-100 text-sm font-medium">Personal Expenses</p>
                                <p className="text-3xl font-bold mt-1">{formatCurrency(personalTotal)}</p>
                                <p className="text-purple-200 text-sm mt-1">Non-business</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <span className="text-2xl">👤</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex space-x-2 mb-6">
                    {[
                        { id: 'all', label: 'All Expenses' },
                        { id: 'business', label: 'Business' },
                        { id: 'personal', label: 'Personal' }
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${filter === tab.id
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Expenses List */}
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                    {filteredExpenses.length > 0 ? (
                        <div className="divide-y divide-gray-100">
                            {filteredExpenses.map((expense) => {
                                const category = getCategoryInfo(expense.category)
                                return (
                                    <div key={expense.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-3 rounded-xl ${expense.expenseType === 'business' ? 'bg-blue-100' : 'bg-purple-100'}`}>
                                                    <span className="text-2xl">{category.icon}</span>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-900">{expense.description}</p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className="text-sm text-gray-500">{category.label}</span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className={`text-xs px-2 py-1 rounded-full ${expense.expenseType === 'business'
                                                                ? 'bg-blue-100 text-blue-700'
                                                                : 'bg-purple-100 text-purple-700'
                                                            }`}>
                                                            {expense.expenseType}
                                                        </span>
                                                        <span className="text-gray-300">•</span>
                                                        <span className="text-sm text-gray-500">{expense.date}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <p className="text-xl font-bold text-red-600">-{formatCurrency(expense.amount)}</p>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(expense)}
                                                        className="text-gray-400 hover:text-blue-600 p-2"
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        className="text-gray-400 hover:text-red-600 p-2"
                                                    >
                                                        🗑️
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <div className="px-8 py-16 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <span className="text-4xl">💸</span>
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses yet</h3>
                            <p className="text-gray-600 mb-6">Start tracking your business expenses</p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium"
                            >
                                Add First Expense
                            </button>
                        </div>
                    )}
                </div>

                {/* Add/Edit Expense Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="px-6 py-4 border-b border-gray-100">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xl font-bold text-gray-900">
                                        {editingExpense ? 'Edit Expense' : 'Add New Expense'}
                                    </h3>
                                    <button
                                        onClick={resetForm}
                                        className="text-gray-400 hover:text-gray-600 text-2xl"
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Description *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="e.g., Shop rent for January"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Amount (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="50000"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    >
                                        {EXPENSE_CATEGORIES.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, expenseType: 'business' })}
                                            className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${formData.expenseType === 'business'
                                                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            🏢 Business
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData({ ...formData, expenseType: 'personal' })}
                                            className={`px-4 py-3 rounded-xl border-2 font-medium transition-all ${formData.expenseType === 'personal'
                                                    ? 'border-purple-600 bg-purple-50 text-purple-700'
                                                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                                                }`}
                                        >
                                            👤 Personal
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 font-medium disabled:opacity-50"
                                    >
                                        {submitting ? 'Saving...' : (editingExpense ? 'Update' : 'Add Expense')}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Expenses
