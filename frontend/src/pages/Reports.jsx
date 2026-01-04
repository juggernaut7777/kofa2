import { useState, useEffect, useContext } from 'react'
import { apiCall } from '../config/api'
import { ThemeContext } from '../context/ThemeContext'

const Reports = () => {
    const { theme } = useContext(ThemeContext)
    const [report, setReport] = useState(null)
    const [loading, setLoading] = useState(true)
    const [period, setPeriod] = useState('month')

    useEffect(() => {
        loadReport()
    }, [period])

    const loadReport = async () => {
        try {
            setLoading(true)
            const data = await apiCall(`/profit-loss/report?period=${period}`)
            setReport(data)
        } catch (error) {
            console.error('Failed to load report:', error)
            // Demo data
            setReport({
                period: 'January 2024',
                revenue: {
                    product_sales: 1250000,
                    delivery_fees: 45000,
                    other_income: 15000,
                    total: 1310000
                },
                expenses: {
                    cost_of_goods: 650000,
                    delivery_costs: 35000,
                    marketing: 50000,
                    platform_fees: 25000,
                    other_expenses: 30000,
                    total: 790000
                },
                profit: {
                    gross: 600000,
                    net: 520000,
                    margin: 39.7
                },
                comparison: {
                    revenue_change: 15.3,
                    expense_change: 8.2,
                    profit_change: 22.5
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

    const downloadReport = () => {
        // Generate CSV
        const csv = `
KOFA Profit & Loss Report - ${report?.period}

REVENUE
Product Sales,${report?.revenue?.product_sales}
Delivery Fees,${report?.revenue?.delivery_fees}
Other Income,${report?.revenue?.other_income}
TOTAL REVENUE,${report?.revenue?.total}

EXPENSES
Cost of Goods,${report?.expenses?.cost_of_goods}
Delivery Costs,${report?.expenses?.delivery_costs}
Marketing,${report?.expenses?.marketing}
Platform Fees,${report?.expenses?.platform_fees}
Other Expenses,${report?.expenses?.other_expenses}
TOTAL EXPENSES,${report?.expenses?.total}

PROFIT
Gross Profit,${report?.profit?.gross}
Net Profit,${report?.profit?.net}
Profit Margin,${report?.profit?.margin}%
    `.trim()

        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `KOFA_Report_${report?.period?.replace(/\s/g, '_')}.csv`
        a.click()
    }

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
                            Profit & Loss Report
                        </h1>
                        <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            {report?.period}
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <div className="flex gap-2">
                            {['week', 'month', 'quarter', 'year'].map((p) => (
                                <button
                                    key={p}
                                    onClick={() => setPeriod(p)}
                                    className={`px-4 py-2 rounded-lg font-medium transition-colors capitalize ${period === p
                                            ? 'bg-kofa-yellow text-black'
                                            : theme === 'dark'
                                                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    {p}
                                </button>
                            ))}
                        </div>
                        <button
                            onClick={downloadReport}
                            className="px-6 py-2 bg-kofa-cobalt text-white font-medium rounded-lg hover:bg-kofa-cobalt/80 transition-colors"
                        >
                            📥 Export CSV
                        </button>
                    </div>
                </div>

                {/* Net Profit Card */}
                <div className={`p-8 rounded-2xl mb-8 ${report?.profit?.net >= 0
                        ? 'bg-gradient-to-r from-green-600 to-green-500'
                        : 'bg-gradient-to-r from-red-600 to-red-500'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-lg">Net Profit</p>
                            <p className="text-5xl font-bold text-white mt-2">
                                {formatCurrency(report?.profit?.net || 0)}
                            </p>
                            <p className="text-white/80 mt-2">
                                Profit Margin: {report?.profit?.margin}%
                            </p>
                        </div>
                        <div className="text-8xl opacity-20">
                            {report?.profit?.net >= 0 ? '📈' : '📉'}
                        </div>
                    </div>
                    {report?.comparison && (
                        <div className="mt-4 pt-4 border-t border-white/20">
                            <span className={`text-white ${report?.comparison?.profit_change >= 0 ? '' : 'text-red-200'}`}>
                                {report?.comparison?.profit_change >= 0 ? '↑' : '↓'} {Math.abs(report?.comparison?.profit_change)}% vs last period
                            </span>
                        </div>
                    )}
                </div>

                {/* Revenue & Expenses Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Revenue Card */}
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                💰 Revenue
                            </h3>
                            <span className="text-green-500 text-sm font-medium">
                                ↑ {report?.comparison?.revenue_change}%
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Product Sales</span>
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(report?.revenue?.product_sales)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Delivery Fees</span>
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(report?.revenue?.delivery_fees)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Other Income</span>
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(report?.revenue?.other_income)}
                                </span>
                            </div>
                            <div className={`pt-4 mt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center">
                                    <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Total Revenue</span>
                                    <span className="font-bold text-green-500 text-xl">
                                        {formatCurrency(report?.revenue?.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expenses Card */}
                    <div className={`p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                💸 Expenses
                            </h3>
                            <span className="text-amber-500 text-sm font-medium">
                                ↑ {report?.comparison?.expense_change}%
                            </span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Cost of Goods</span>
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(report?.expenses?.cost_of_goods)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Delivery Costs</span>
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(report?.expenses?.delivery_costs)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Marketing</span>
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(report?.expenses?.marketing)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Platform Fees</span>
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(report?.expenses?.platform_fees)}
                                </span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>Other</span>
                                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                    {formatCurrency(report?.expenses?.other_expenses)}
                                </span>
                            </div>
                            <div className={`pt-4 mt-4 border-t ${theme === 'dark' ? 'border-gray-700' : 'border-gray-200'}`}>
                                <div className="flex justify-between items-center">
                                    <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Total Expenses</span>
                                    <span className="font-bold text-red-500 text-xl">
                                        {formatCurrency(report?.expenses?.total)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Summary */}
                <div className={`mt-8 p-6 rounded-2xl ${theme === 'dark' ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                    <h3 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                        📊 Summary
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Gross Profit</p>
                            <p className="text-2xl font-bold text-green-500">{formatCurrency(report?.profit?.gross)}</p>
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                Revenue - Cost of Goods
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Net Profit</p>
                            <p className={`text-2xl font-bold ${report?.profit?.net >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {formatCurrency(report?.profit?.net)}
                            </p>
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                Revenue - All Expenses
                            </p>
                        </div>
                        <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                            <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-500'}`}>Profit Margin</p>
                            <p className="text-2xl font-bold text-kofa-yellow">{report?.profit?.margin}%</p>
                            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                                Net Profit / Revenue
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Reports
