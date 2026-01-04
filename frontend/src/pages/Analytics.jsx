import { useState, useEffect, useContext } from 'react'
import { apiCall } from '../config/api'
import { ThemeContext } from '../context/ThemeContext'

const Analytics = () => {
    const { theme } = useContext(ThemeContext)
    const [analytics, setAnalytics] = useState(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('30d')

    useEffect(() => {
        loadAnalytics()
    }, [period])

    const loadAnalytics = async () => {
        try {
            setLoading(true)
            const data = await apiCall(`/analytics/summary?period=${period}`)
            setAnalytics(data)
        } catch (error) {
            console.error('Failed to load analytics:', error)
            // Demo data
            setAnalytics({
                revenue: {
                    total: 1250000,
                    change: 12.5,
                    by_day: [45000, 52000, 38000, 67000, 55000, 72000, 48000]
                },
                orders: {
                    total: 156,
                    completed: 142,
                    pending: 10,
                    cancelled: 4,
                    change: 8.3
                },
                products: {
                    total: 24,
                    low_stock: 3,
                    out_of_stock: 1,
                    top_selling: [
                        { name: 'Nike Air Max', sales: 45, revenue: 2025000 },
                        { name: 'Adidas Sneakers', sales: 32, revenue: 1280000 },
                        { name: 'Polo Shirt', sales: 28, revenue: 420000 }
                    ]
                },
                customers: {
                    total: 89,
                    new_this_month: 23,
                    returning: 66
                },
                conversations: {
                    total: 412,
                    converted: 156,
                    conversion_rate: 37.8
                }
            })
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', {
            style: 'currency',
            currency: 'NGN',
            minimumFractionDigits: 0
        }).format(amount)
    }

    const StatCard = ({ title, value, change, icon, color = 'kofa-yellow' }) => (
        <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
            <div className="flex items-center justify-between">
                <div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
                    <p className={`text-3xl font-bold mt-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        {value}
                    </p>
                    {change !== undefined && (
                        <p className={`text-sm mt-1 ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {change >= 0 ? '↑' : '↓'} {Math.abs(change)}% from last period
                        </p>
                    )}
                </div>
                <div className={`text-4xl`}>{icon}</div>
            </div>
        </div>
    )

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
                <div className="animate-spin w-12 h-12 border-4 border-kofa-yellow border-t-transparent rounded-full"></div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
            <div className="max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Analytics
                        </h1>
                        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            Track your business performance
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {['7d', '30d', '90d', 'all'].map((p) => (
                            <button
                                key={p}
                                onClick={() => setPeriod(p)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${period === p
                                        ? 'bg-kofa-yellow text-black'
                                        : theme === 'dark'
                                            ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                    }`}
                            >
                                {p === '7d' ? '7 Days' : p === '30d' ? '30 Days' : p === '90d' ? '90 Days' : 'All Time'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Main Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <StatCard
                        title="Total Revenue"
                        value={formatCurrency(analytics?.revenue?.total || 0)}
                        change={analytics?.revenue?.change}
                        icon="💰"
                    />
                    <StatCard
                        title="Total Orders"
                        value={analytics?.orders?.total || 0}
                        change={analytics?.orders?.change}
                        icon="📦"
                    />
                    <StatCard
                        title="Total Customers"
                        value={analytics?.customers?.total || 0}
                        icon="👥"
                    />
                    <StatCard
                        title="Conversion Rate"
                        value={`${analytics?.conversations?.conversion_rate || 0}%`}
                        icon="📈"
                    />
                </div>

                {/* Order Breakdown & Top Products */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                    {/* Order Status Breakdown */}
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Order Status
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Completed</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-green-500 h-2 rounded-full"
                                            style={{ width: `${(analytics?.orders?.completed / analytics?.orders?.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-green-500 font-medium">{analytics?.orders?.completed}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Pending</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-amber-500 h-2 rounded-full"
                                            style={{ width: `${(analytics?.orders?.pending / analytics?.orders?.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-amber-500 font-medium">{analytics?.orders?.pending}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Cancelled</span>
                                <div className="flex items-center gap-3">
                                    <div className="w-32 bg-gray-700 rounded-full h-2">
                                        <div
                                            className="bg-red-500 h-2 rounded-full"
                                            style={{ width: `${(analytics?.orders?.cancelled / analytics?.orders?.total) * 100}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-red-500 font-medium">{analytics?.orders?.cancelled}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Top Selling Products */}
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Top Selling Products
                        </h3>
                        <div className="space-y-4">
                            {analytics?.products?.top_selling?.map((product, index) => (
                                <div key={index} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-kofa-yellow text-black' :
                                                index === 1 ? 'bg-gray-400 text-black' :
                                                    'bg-amber-600 text-black'
                                            }`}>
                                            {index + 1}
                                        </span>
                                        <span className={theme === 'dark' ? 'text-white' : 'text-gray-900'}>{product.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-semibold ${theme === 'dark' ? 'text-kofa-yellow' : 'text-kofa-cobalt'}`}>
                                            {product.sales} sold
                                        </p>
                                        <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>
                                            {formatCurrency(product.revenue)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Customer & Bot Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Customer Stats */}
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Customer Insights
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>New Customers</p>
                                <p className="text-2xl font-bold text-green-500">{analytics?.customers?.new_this_month}</p>
                            </div>
                            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Returning</p>
                                <p className="text-2xl font-bold text-kofa-sky">{analytics?.customers?.returning}</p>
                            </div>
                        </div>
                    </div>

                    {/* Bot Performance */}
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                        <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Bot Performance
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Conversations</p>
                                <p className="text-2xl font-bold text-kofa-yellow">{analytics?.conversations?.total}</p>
                            </div>
                            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Converted to Sales</p>
                                <p className="text-2xl font-bold text-green-500">{analytics?.conversations?.converted}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Analytics
