import { useState, useEffect, useContext } from 'react'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

const InsightsRedesign = () => {
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [activeTab, setActiveTab] = useState('analytics')
    const [period, setPeriod] = useState('7')
    const [analytics, setAnalytics] = useState({})
    const [topProducts, setTopProducts] = useState([])
    const [channels, setChannels] = useState([])
    const [expenses, setExpenses] = useState([])
    const [loading, setLoading] = useState(true)

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
        try {
            const data = await apiCall(API_ENDPOINTS.ANALYTICS)
            setAnalytics(data)
        } catch (error) {
            // Demo data
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
            setTopProducts([
                { name: 'Nike Air Max 90', sales: 124, stock: 12, revenue: 1850000, change: 8, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCqySHNESoo886M1xDh4huYXAInrxeyM5ida5aaTm34HvhczYxX0XIOneUAtfvhMfGh5N_xnyaGh418rAXzx3jqKdFjgsrygr-LMrPGuAdJYJsobzBqbcySESipwO-hJHZjdigdBjogCNdVj7x5zF2Ap0mZcN0j5Bw_cGA9qvsg8sbMui66YchlXhXoF6438Dl03C52QSR9Q-EPkVwAq-VDcCNPDmuY0LHjtL3s8SAnsH0zRucm2wvtcu8VW19E5g1Sjca2qbph8kP9' },
                { name: 'Adidas Superstar', sales: 98, stock: 45, revenue: 950000, change: 12, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCraAblmuLdTMko4Y5rUpZ_-ro6K1BRd6x5OtIbQSj3XaZX4aBaMZ4SSSUrBHHLs0Oi7Vw4w9GT0Yl2rvbktCKYo33EEtwTZ6itUWgwygbzU06DA5njVyfulfVl2UW0b1X7pXvqKZdny6-ZoGhFjTJctC3XZTWVoKgxpWcARGuyGBpPynHhpx05YWckaUgBbKJ1KFg3WXzVyyIp-ip_i_Hi5WJc-YhvU4Pavtmt-w8gqYRv-XzHnthTmDqTxunzLCoK4jUduNNYnO0F' },
                { name: 'Puma RS-X', sales: 76, stock: 3, revenue: 620000, change: -2, image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDp-xkWGaoR5osXBrN_QsaIAq8nIxxU0lsjVXJ8vmd-LosDP2tt02zp7X-QVCeRnsPPl1P-kPs4f-8ChJ-YiE0iJc-MNWFpJwRI8RROKxi7bHAWCFXnZc2KowgS1dkp1mntZViDEKX-1SdUdZoUGnDvN75t1LGMlPvzvWLIoW1dx1AwOXqBLbeZMwxmTtwzAW9g_CR7-7uXDjfI73d4_Je-5eVGMnPe-9nsf6LzvPDjL_0lb6bZLGfZq8DFcekr7XZGmZYopGUuiuvn' },
            ])
            setChannels([
                { name: 'WhatsApp', icon: '💬', color: '#22c55e', revenue: 850000, percent: 58 },
                { name: 'Instagram', icon: '📸', color: '#ec4899', revenue: 420000, percent: 32 },
                { name: 'Web Store', icon: '🌐', color: '#3b82f6', revenue: 180000, percent: 10 },
            ])
            setExpenses([
                { category: 'Inventory', amount: 450000, icon: '📦' },
                { category: 'Delivery', amount: 85000, icon: '🚚' },
                { category: 'Marketing', amount: 120000, icon: '📣' },
                { category: 'Utilities', amount: 35000, icon: '💡' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}m`
        if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`
        return `₦${amount}`
    }

    const chartBars = [
        { day: 'Mon', height: 40 },
        { day: 'Tue', height: 55 },
        { day: 'Wed', height: 35 },
        { day: 'Thu', height: 65 },
        { day: 'Fri', height: 45 },
        { day: 'Sat', height: 90, highlight: true, value: '₦450k' },
        { day: 'Sun', height: 60 },
    ]

    return (
        <div className={`min-h-screen font-['Manrope'] ${isDark ? 'bg-[#102217] text-gray-100' : 'bg-[#f6f8f7] text-gray-900'}`}>
            <div className="max-w-md mx-auto pb-24">

                {/* Header */}
                <header className={`sticky top-0 z-30 backdrop-blur-md border-b pt-8 pb-0 px-0 ${isDark ? 'bg-[#162b1f]/95 border-gray-800' : 'bg-white/95 border-gray-100'
                    }`}>
                    <div className="flex items-center justify-between mb-4 px-4">
                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                            <span className="text-xl">←</span>
                        </button>
                        <h1 className="text-lg font-bold tracking-tight">Insights</h1>
                        <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/5">
                            <span className="text-xl">📅</span>
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
                            <section className={`rounded-2xl p-5 shadow-sm border ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'
                                }`}>
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</p>
                                        <h2 className="text-3xl font-extrabold tracking-tight">₦1,450,000</h2>
                                    </div>
                                    <div className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border ${isDark ? 'bg-[#2bee79]/20 border-[#2bee79]/20' : 'bg-green-50 border-green-100'
                                        }`}>
                                        <span className="text-green-600">📈</span>
                                        <span className={`text-sm font-bold ${isDark ? 'text-[#2bee79]' : 'text-green-700'}`}>+15%</span>
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
                                                    <div className={`absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[10px] font-bold py-1 px-2 rounded whitespace-nowrap z-10 ${isDark ? 'bg-white text-gray-900' : 'bg-gray-900 text-white'
                                                        }`}>
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
                                <section className={`rounded-2xl p-4 shadow-sm border flex flex-col ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'
                                    }`}>
                                    <h3 className="text-sm font-bold mb-4">Order Status</h3>
                                    <div className="relative w-24 h-24 mx-auto mb-2">
                                        <div className="w-full h-full rounded-full" style={{ background: 'conic-gradient(#2bee79 0% 70%, #facc15 70% 90%, #e5e7eb 90% 100%)' }}></div>
                                        <div className={`absolute inset-0 m-auto w-16 h-16 rounded-full flex items-center justify-center shadow-sm ${isDark ? 'bg-[#162b1f]' : 'bg-white'
                                            }`}>
                                            <div className="text-center">
                                                <span className="block text-[10px] text-gray-400 uppercase tracking-wider">Total</span>
                                                <span className="block text-base font-bold leading-none">124</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="mt-auto space-y-2 pt-2">
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-[#2bee79] shadow-[0_0_8px_rgba(43,238,121,0.4)]"></span>
                                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Delivered</span>
                                            </div>
                                            <span className="font-bold">70%</span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                            <div className="flex items-center gap-1.5">
                                                <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                                                <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>Pending</span>
                                            </div>
                                            <span className="font-bold">20%</span>
                                        </div>
                                    </div>
                                </section>

                                {/* Customers */}
                                <section className={`rounded-2xl p-4 shadow-sm border flex flex-col ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'
                                    }`}>
                                    <h3 className="text-sm font-bold mb-1">Customers</h3>
                                    <p className={`text-[11px] mb-6 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Audience split this week</p>
                                    <div className="flex-1 flex flex-col justify-center gap-5">
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>New</span>
                                                <span className="font-bold">65%</span>
                                            </div>
                                            <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                <div className="bg-[#2bee79] h-1.5 rounded-full shadow-[0_0_8px_rgba(43,238,121,0.4)]" style={{ width: '65%' }}></div>
                                            </div>
                                            <p className={`text-[10px] mt-1 font-medium ${isDark ? 'text-[#2bee79]' : 'text-green-600'}`}>+12 signups</p>
                                        </div>
                                        <div>
                                            <div className="flex justify-between text-xs mb-1.5">
                                                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>Returning</span>
                                                <span className="font-bold">35%</span>
                                            </div>
                                            <div className={`w-full rounded-full h-1.5 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                                <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: '35%' }}></div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </div>

                            {/* Top Products */}
                            <section className={`rounded-2xl shadow-sm border overflow-hidden ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'
                                }`}>
                                <div className={`p-5 border-b flex justify-between items-center ${isDark ? 'border-gray-800 bg-white/5' : 'border-gray-100 bg-gray-50/50'
                                    }`}>
                                    <h3 className="text-base font-bold">Top 5 Movers</h3>
                                    <button className={`text-xs font-bold ${isDark ? 'text-[#2bee79]' : 'text-green-700'}`}>VIEW ALL</button>
                                </div>
                                <div className={`divide-y ${isDark ? 'divide-gray-800' : 'divide-gray-100'}`}>
                                    {topProducts.map((product, idx) => (
                                        <div key={idx} className={`flex items-center p-4 group ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                            <div className={`h-12 w-12 rounded-lg overflow-hidden flex-shrink-0 border ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-200'
                                                }`}>
                                                <img src={product.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
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
                                                <div className={`flex items-center justify-end text-xs font-bold mt-0.5 ${product.change >= 0 ? (isDark ? 'text-[#2bee79]' : 'text-green-600') : 'text-red-500'
                                                    }`}>
                                                    {product.change >= 0 ? '▲' : '▼'} {Math.abs(product.change)}%
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            {/* Channel Sales */}
                            <section className={`rounded-2xl p-5 shadow-sm border ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'
                                }`}>
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
                                                <div className="h-2 rounded-full" style={{ width: `${channel.percent}%`, backgroundColor: channel.color }}></div>
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
                                    <p className="text-lg font-bold text-[#2bee79]">₦690k</p>
                                </div>
                                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-[#162b1f]' : 'bg-white'}`}>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gross</p>
                                    <p className="text-lg font-bold">₦1.45m</p>
                                </div>
                                <div className={`p-4 rounded-xl text-center ${isDark ? 'bg-[#162b1f]' : 'bg-white'}`}>
                                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Margin</p>
                                    <p className="text-lg font-bold">48%</p>
                                </div>
                            </div>

                            {/* Export Button */}
                            <button className="w-full bg-[#2bee79] text-[#052e16] h-12 rounded-xl text-base font-bold flex items-center justify-center gap-2">
                                📊 Export CSV Report
                            </button>
                        </div>
                    )}

                    {/* EXPENSES TAB */}
                    {activeTab === 'expenses' && (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center">
                                <h2 className="text-2xl font-extrabold">Expenses</h2>
                                <button className="bg-[#2bee79] text-[#052e16] px-4 py-2 rounded-full text-sm font-bold">+ Log</button>
                            </div>

                            <div className={`rounded-2xl overflow-hidden border ${isDark ? 'bg-[#162b1f] border-gray-800' : 'bg-white border-gray-100'}`}>
                                {expenses.map((exp, idx) => (
                                    <div key={idx} className={`flex items-center justify-between p-4 ${idx > 0 ? (isDark ? 'border-t border-gray-800' : 'border-t border-gray-100') : ''}`}>
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl">{exp.icon}</span>
                                            <span className="font-bold">{exp.category}</span>
                                        </div>
                                        <span className="font-bold text-red-500">-{formatCurrency(exp.amount)}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={`p-4 rounded-xl ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                                <p className={`text-sm ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                                    <strong>Total Expenses:</strong> ₦690,000 this month
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
                                        <div className="h-3 rounded-full" style={{ width: `${channel.percent}%`, backgroundColor: channel.color }}></div>
                                    </div>
                                    <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{channel.percent}% of total</p>
                                </div>
                            ))}
                        </div>
                    )}
                </main>
            </div>

            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    )
}

export default InsightsRedesign
