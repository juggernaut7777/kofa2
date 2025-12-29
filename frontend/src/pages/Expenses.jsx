import { useState, useEffect, useContext } from 'react'
import { apiCall, API_BASE_URL } from '../config/api'
import { ThemeContext } from '../context/ThemeContext'

const EXPENSE_CATEGORIES = [
    { id: 'rent', label: 'Rent', icon: '🏠' },
    { id: 'data', label: 'Data/Internet', icon: '📶' },
    { id: 'packing', label: 'Packing Materials', icon: '📦' },
    { id: 'transport', label: 'Transportation', icon: '🚗' },
    { id: 'airtime', label: 'Airtime', icon: '📱' },
    { id: 'electricity', label: 'Electricity', icon: '⚡' },
    { id: 'advertising', label: 'Advertising', icon: '📢' },
    { id: 'supplies', label: 'Supplies', icon: '🛒' },
    { id: 'maintenance', label: 'Maintenance', icon: '🔧' },
    { id: 'other', label: 'Other', icon: '📝' }
]

const Expenses = () => {
    const { theme } = useContext(ThemeContext)
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingExpense, setEditingExpense] = useState(null)
    const [formData, setFormData] = useState({
        description: '',
        amount: '',
        category: 'other',
        date: new Date().toISOString().split('T')[0]
    })
    const [submitting, setSubmitting] = useState(false)

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
                // Fallback demo data - business expenses only
                setExpenses([
                    { id: '1', description: 'Shop rent - January', amount: 50000, category: 'rent', date: '2024-01-01', created_at: '2024-01-01' },
                    { id: '2', description: 'MTN Data Bundle', amount: 5000, category: 'data', date: '2024-01-05', created_at: '2024-01-05' },
                    { id: '3', description: 'Packaging boxes and tape', amount: 8000, category: 'packing', date: '2024-01-10', created_at: '2024-01-10' },
                    { id: '4', description: 'Bolt rides for deliveries', amount: 12000, category: 'transport', date: '2024-01-12', created_at: '2024-01-12' },
                    { id: '5', description: 'Instagram/Facebook Ads', amount: 15000, category: 'advertising', date: '2024-01-15', created_at: '2024-01-15' },
                ])
            }
        } catch (error) {
            console.error('Failed to load expenses:', error)
            setExpenses([
                { id: '1', description: 'Shop rent - January', amount: 50000, category: 'rent', date: '2024-01-01', created_at: '2024-01-01' },
                { id: '2', description: 'MTN Data Bundle', amount: 5000, category: 'data', date: '2024-01-05', created_at: '2024-01-05' },
                { id: '3', description: 'Packaging boxes and tape', amount: 8000, category: 'packing', date: '2024-01-10', created_at: '2024-01-10' },
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
                await fetch(`${API_BASE_URL}/expenses/${editingExpense.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(expenseData)
                })
            } else {
                await fetch(`${API_BASE_URL}/expenses`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(expenseData)
                })
            }

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
            await fetch(`${API_BASE_URL}/expenses/${id}`, { method: 'DELETE' })
        } catch (error) {
            console.error('Failed to delete expense:', error)
        }
        setExpenses(expenses.filter(e => e.id !== id))
    }

    const handleEdit = (expense) => {
        setEditingExpense(expense)
        setFormData({
            description: expense.description,
            amount: expense.amount.toString(),
            category: expense.category,
            date: expense.date
        })
        setShowForm(true)
    }

    const resetForm = () => {
        setFormData({
            description: '',
            amount: '',
            category: 'other',
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

    const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0)
    const thisMonthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date)
        const now = new Date()
        return expenseDate.getMonth() === now.getMonth() && expenseDate.getFullYear() === now.getFullYear()
    }).reduce((sum, e) => sum + e.amount, 0)

    if (loading) {
        return (
            <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
                <div className="flex justify-center items-center py-20">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-kofa-sky border-t-kofa-cobalt"></div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'}`}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'kofa-gradient-text' : 'text-kofa-navy'}`}>
                                Business Expenses
                            </h1>
                            <p className={`mt-2 text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Track your business operating costs
                            </p>
                        </div>
                        <button
                            onClick={() => setShowForm(true)}
                            className="kofa-button px-6 py-3 rounded-xl font-semibold flex items-center space-x-2"
                        >
                            <span>+</span>
                            <span>Add Expense</span>
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                    <div className="bg-gradient-to-br from-danger to-rose-600 rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-rose-100 text-sm font-medium">Total Expenses</p>
                                <p className="text-3xl font-bold mt-1">{formatCurrency(totalExpenses)}</p>
                                <p className="text-rose-200 text-sm mt-1">{expenses.length} transactions</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <span className="text-2xl">💸</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-kofa-gradient rounded-2xl p-6 text-white shadow-xl">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-blue-100 text-sm font-medium">This Month</p>
                                <p className="text-3xl font-bold mt-1">{formatCurrency(thisMonthExpenses)}</p>
                                <p className="text-blue-200 text-sm mt-1">Operating costs</p>
                            </div>
                            <div className="bg-white/20 p-3 rounded-xl">
                                <span className="text-2xl">📅</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Expenses List */}
                <div className={`rounded-2xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white border border-gray-100'
                    }`}>
                    {expenses.length > 0 ? (
                        <div className={`divide-y ${theme === 'dark' ? 'divide-dark-border' : 'divide-gray-100'}`}>
                            {expenses.map((expense) => {
                                const category = getCategoryInfo(expense.category)
                                return (
                                    <div key={expense.id} className={`px-6 py-4 transition-colors ${theme === 'dark' ? 'hover:bg-dark-border/50' : 'hover:bg-gray-50'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-4">
                                                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-kofa-cobalt/20' : 'bg-blue-100'
                                                    }`}>
                                                    <span className="text-2xl">{category.icon}</span>
                                                </div>
                                                <div>
                                                    <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                                        {expense.description}
                                                    </p>
                                                    <div className="flex items-center space-x-2 mt-1">
                                                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {category.label}
                                                        </span>
                                                        <span className={theme === 'dark' ? 'text-gray-600' : 'text-gray-300'}>•</span>
                                                        <span className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                                            {expense.date}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <p className="text-xl font-bold text-danger">-{formatCurrency(expense.amount)}</p>
                                                <div className="flex space-x-2">
                                                    <button
                                                        onClick={() => handleEdit(expense)}
                                                        className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-kofa-cobalt/20 text-gray-400 hover:text-kofa-sky' : 'hover:bg-blue-50 text-gray-400 hover:text-kofa-cobalt'
                                                            }`}
                                                    >
                                                        ✏️
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        className={`p-2 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-danger/20 text-gray-400 hover:text-danger' : 'hover:bg-red-50 text-gray-400 hover:text-danger'
                                                            }`}
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
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-dark-border' : 'bg-gray-100'
                                }`}>
                                <span className="text-4xl">💸</span>
                            </div>
                            <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                No expenses yet
                            </h3>
                            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Start tracking your business expenses
                            </p>
                            <button
                                onClick={() => setShowForm(true)}
                                className="kofa-button px-6 py-3 rounded-xl font-medium"
                            >
                                Add First Expense
                            </button>
                        </div>
                    )}
                </div>

                {/* Add/Edit Expense Modal */}
                {showForm && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                        <div className={`rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white'
                            }`}>
                            <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-dark-border' : 'border-gray-100'}`}>
                                <div className="flex items-center justify-between">
                                    <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                        {editingExpense ? 'Edit Expense' : 'Add Business Expense'}
                                    </h3>
                                    <button
                                        onClick={resetForm}
                                        className={`text-2xl ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-400 hover:text-gray-600'}`}
                                    >
                                        ×
                                    </button>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Description *
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.description}
                                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-kofa-cobalt focus:border-transparent transition-colors ${theme === 'dark'
                                                ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        placeholder="e.g., Shop rent for January"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Amount (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.amount}
                                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-kofa-cobalt focus:border-transparent transition-colors ${theme === 'dark'
                                                ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                        placeholder="50000"
                                        min="0"
                                        required
                                    />
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Category
                                    </label>
                                    <select
                                        value={formData.category}
                                        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-kofa-cobalt focus:border-transparent transition-colors ${theme === 'dark'
                                                ? 'bg-dark-bg border-dark-border text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                    >
                                        {EXPENSE_CATEGORIES.map((cat) => (
                                            <option key={cat.id} value={cat.id}>
                                                {cat.icon} {cat.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                        Date
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl border focus:ring-2 focus:ring-kofa-cobalt focus:border-transparent transition-colors ${theme === 'dark'
                                                ? 'bg-dark-bg border-dark-border text-white'
                                                : 'bg-white border-gray-300 text-gray-900'
                                            }`}
                                    />
                                </div>

                                <div className="flex space-x-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={resetForm}
                                        className={`flex-1 px-4 py-3 border rounded-xl font-medium transition-colors ${theme === 'dark'
                                                ? 'border-dark-border text-gray-300 hover:bg-dark-border'
                                                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
                                            }`}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 kofa-button px-4 py-3 rounded-xl font-medium disabled:opacity-50"
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
