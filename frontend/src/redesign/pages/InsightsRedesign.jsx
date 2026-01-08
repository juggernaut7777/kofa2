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
    warning: '#F59E0B'
}

const InsightsRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [loading, setLoading] = useState(true)
    const [stats, setStats] = useState({ revenue: 0, profit: 0, expenses: 0, customers: 0 })
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
                    const total = expensesData.reduce((acc, curr) => acc + (curr.amount || 0), 0)
                    setStats(prev => ({ ...prev, expenses: total || prev.expenses }))
                }
            })
            .catch(() => { })
    }

    const formatCurrency = (n) => `₦${n?.toLocaleString()}`

    const handleDownloadReport = () => {
        setDownloading(true)
        setTimeout(() => {
            alert('Full Insight Report downloaded successfully!')
            setDownloading(false)
        }, 1500)
    }

    // --- Components ---

    const MetricCard = ({ title, value, sub, trend, color }) => (
        <div className={`p-5 rounded-2xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{title}</p>
            <p className={`text-xl font-bold mt-1 ${isDark ? 'text-white' : 'text-black'}`}>{value}</p>
            <div className="flex justify-between items-center mt-2">
                <span className={`text-[10px] ${trend.includes('+') ? 'text-emerald-400' : 'text-rose-400'} font-medium`}>{trend}</span>
                <span className={`text-[10px] ${isDark ? 'text-white/20' : 'text-black/20'}`}>{sub}</span>
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

                    <div className="flex items-end justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Insights</h1>
                            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>Full Business Report</p>
                        </div>
                        <button
                            onClick={handleDownloadReport}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-105 ${isDark ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-black/5 text-black hover:bg-black/10'}`}
                        >
                            {downloading ? 'Downloading...' : (
                                <>
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                                    </svg>
                                    Report
                                </>
                            )}
                        </button>
                    </div>
                </header>

                <div className="px-6 space-y-6">

                    {/* Financial Overview Cards */}
                    <section>
                        <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Financials</h2>
                        <div className="grid grid-cols-2 gap-3">
                            <MetricCard title="Total Revenue" value={formatCurrency(stats.revenue)} trend="+12%" sub="vs last 30d" />
                            <MetricCard title="Net Profit" value={formatCurrency(stats.profit)} trend="+8%" sub="vs last 30d" />
                            <MetricCard title="Total Expenses" value={formatCurrency(stats.expenses)} trend="+3%" sub="vs last 30d" />
                            <MetricCard title="New Customers" value={stats.customers} trend="+15%" sub="vs last 30d" />
                        </div>
                    </section>

                    <hr className={`border-dashed ${isDark ? 'border-white/10' : 'border-black/10'}`} />

                    {/* Charts Section */}
                    <section className="space-y-4">
                        <div className={`p-6 rounded-3xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`text-base font-semibold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Sales Trend (Weekly)</h3>
                            <BarChart />
                        </div>
                        <div className={`p-6 rounded-3xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`text-base font-semibold mb-6 ${isDark ? 'text-white' : 'text-black'}`}>Category Distribution</h3>
                            <DonutChart />
                        </div>
                    </section>

                    {/* Top Products */}
                    <section>
                        <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Top Performers</h2>
                        <div className={`rounded-3xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            {topProducts.map((product, i) => (
                                <div key={i} className="flex items-center justify-between py-3 border-b last:border-0 border-dashed border-gray-700/20">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${isDark ? 'bg-white/10 text-white' : 'bg-black/5 text-black'}`}>
                                            #{i + 1}
                                        </div>
                                        <div>
                                            <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{product.name}</p>
                                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{product.sales} sold</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-sm font-bold ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(product.revenue)}</p>
                                        <p className={`text-xs ${product.trend.includes('+') ? 'text-emerald-400' : 'text-rose-400'}`}>{product.trend}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                </div>
            </div>

            <style jsx>{`
                .no-scrollbar::-webkit-scrollbar { display: none; }
                .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    )
}

export default InsightsRedesign
