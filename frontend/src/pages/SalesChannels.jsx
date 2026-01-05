import { useState, useEffect, useContext } from 'react'
import { apiCall } from '../config/api'
import { ThemeContext } from '../context/ThemeContext'

const SalesChannels = () => {
    const { theme } = useContext(ThemeContext)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const isDark = theme === 'dark'

    useEffect(() => {
        loadChannelData()
    }, [])

    const loadChannelData = async () => {
        try {
            setLoading(true)
            const response = await apiCall('/channels/summary')
            setData(response)
        } catch (error) {
            console.error('Failed to load channel data:', error)
            // Demo data
            setData({
                channels: [
                    { name: 'WhatsApp', orders: 45, revenue: 450000, color: '#25D366' },
                    { name: 'Instagram', orders: 28, revenue: 280000, color: '#E4405F' },
                    { name: 'TikTok', orders: 12, revenue: 95000, color: '#000000' },
                    { name: 'Web/Direct', orders: 8, revenue: 75000, color: '#0066FF' },
                ],
                total_revenue: 900000,
                total_orders: 93,
                best_channel: 'WhatsApp'
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

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <div className="animate-spin w-10 h-10 border-4 border-kofa-yellow border-t-transparent rounded-full"></div>
            </div>
        )
    }

    const totalRevenue = data?.total_revenue || 0

    return (
        <div className="max-w-7xl mx-auto px-4 py-8">
            {/* Header */}
            <div className="mb-8">
                <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Sales Channels
                </h2>
                <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    Track where your sales come from
                </p>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Revenue</p>
                    <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {formatCurrency(data?.total_revenue || 0)}
                    </p>
                </div>
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Orders</p>
                    <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {data?.total_orders || 0}
                    </p>
                </div>
                <div className={`p-6 rounded-2xl ${isDark ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Best Channel</p>
                    <p className={`text-3xl font-bold mt-2 text-green-500`}>
                        {data?.best_channel || 'WhatsApp'}
                    </p>
                </div>
            </div>

            {/* Channel Breakdown */}
            <div className={`p-6 rounded-2xl ${isDark ? 'bg-dark-card border border-gray-800' : 'bg-white shadow-lg'}`}>
                <h3 className={`text-lg font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    Revenue by Channel
                </h3>

                <div className="space-y-4">
                    {data?.channels?.map((channel, idx) => {
                        const percentage = totalRevenue > 0 ? (channel.revenue / totalRevenue) * 100 : 0
                        return (
                            <div key={idx} className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-4 h-4 rounded-full"
                                            style={{ backgroundColor: channel.color }}
                                        ></div>
                                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {channel.name}
                                        </span>
                                    </div>
                                    <div className="text-right">
                                        <span className={`font-bold ${isDark ? 'text-kofa-yellow' : 'text-kofa-cobalt'}`}>
                                            {formatCurrency(channel.revenue)}
                                        </span>
                                        <span className={`text-sm ml-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                            ({channel.orders} orders)
                                        </span>
                                    </div>
                                </div>
                                <div className={`w-full h-3 rounded-full ${isDark ? 'bg-gray-800' : 'bg-gray-200'}`}>
                                    <div
                                        className="h-3 rounded-full transition-all duration-500"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: channel.color
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Channel Tips */}
            <div className={`mt-6 p-4 rounded-xl ${isDark ? 'bg-kofa-cobalt/20 border border-kofa-cobalt/30' : 'bg-blue-50 border border-blue-200'}`}>
                <p className={`text-sm ${isDark ? 'text-kofa-sky' : 'text-kofa-cobalt'}`}>
                    💡 <strong>Tip:</strong> {data?.best_channel || 'WhatsApp'} is your best channel! Consider investing more marketing there.
                </p>
            </div>
        </div>
    )
}

export default SalesChannels
