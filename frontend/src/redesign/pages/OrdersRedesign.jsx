import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, cachedApiCall, API_ENDPOINTS, CACHE_KEYS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import {
    ChevronLeft, MoreHorizontal, Search, Clock, CheckCircle,
    XCircle, Truck, Package, MessageSquare, Plus
} from 'lucide-react'

const OrdersRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => { loadOrders() }, [])

    const loadOrders = async () => {
        setLoading(true)
        try {
            const data = await cachedApiCall(API_ENDPOINTS.ORDERS, CACHE_KEYS.ORDERS, (freshData) => {
                setOrders(Array.isArray(freshData) ? freshData : [])
            })
            setOrders(Array.isArray(data) ? data : [])
        } catch (e) {
            setOrders([])
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`

    const getStatusConfig = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed':
            case 'delivered':
                return { label: 'Completed', color: 'green', icon: CheckCircle }
            case 'cancelled':
                return { label: 'Cancelled', color: 'red', icon: XCircle }
            case 'shipped':
            case 'in_transit':
                return { label: 'In Transit', color: 'orange', icon: Truck }
            default:
                return { label: 'Pending', color: 'yellow', icon: Clock }
        }
    }

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending' },
        { id: 'completed', label: 'Completed' },
        { id: 'cancelled', label: 'Cancelled' }
    ]

    const filteredOrders = orders.filter(order => {
        const matchesSearch = (order.customer_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (order.id?.toString() || '').includes(searchQuery)
        if (activeFilter === 'all') return matchesSearch
        return matchesSearch && order.status?.toLowerCase() === activeFilter
    })

    const handleMarkComplete = async (orderId) => {
        try {
            await apiCall(API_ENDPOINTS.UPDATE_ORDER_STATUS(orderId), {
                method: 'PUT',
                body: JSON.stringify({ status: 'completed' })
            })
            loadOrders()
        } catch (e) {
            alert('Failed to update order')
        }
    }

    const handleShareWhatsApp = (order) => {
        const msg = `🧾 Order #${order.id}\n\nCustomer: ${order.customer_name}\nAmount: ${formatCurrency(order.total_amount)}\n\nThank you for your purchase!`
        window.open(`https://wa.me/${order.customer_phone}?text=${encodeURIComponent(msg)}`, '_blank')
    }

    const formatDate = (dateStr) => {
        if (!dateStr) return 'Just now'
        const date = new Date(dateStr)
        const today = new Date()
        if (date.toDateString() === today.toDateString()) {
            return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
        }
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0F0F12]' : 'bg-white'}`}>
            {/* Header */}
            <header className={`px-4 pt-4 pb-2 flex items-center justify-between ${isDark ? 'text-white' : ''}`}>
                <button onClick={() => navigate('/dashboard')} className={`p-2 -ml-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-semibold">Orders</h1>
                <button className={`p-2 -mr-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <MoreHorizontal size={24} />
                </button>
            </header>

            {/* Search Bar */}
            <div className="px-4 pb-4">
                <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <Search size={20} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                    <input
                        type="text"
                        placeholder="Search by customer or order ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                    />
                </div>
            </div>

            {/* Filter Pills */}
            <div className="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                {filters.map(filter => (
                    <button
                        key={filter.id}
                        onClick={() => setActiveFilter(filter.id)}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeFilter === filter.id
                                ? 'bg-[#0095FF] text-white'
                                : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                            }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            {/* Orders List */}
            <div className="px-4 pb-32 space-y-3">
                {loading ? (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading orders...</div>
                ) : filteredOrders.length === 0 ? (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Package size={48} className="mx-auto mb-3 opacity-50" />
                        <p>No orders found</p>
                    </div>
                ) : (
                    filteredOrders.map(order => {
                        const status = getStatusConfig(order.status)
                        const StatusIcon = status.icon
                        return (
                            <div key={order.id} className={`rounded-2xl p-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <div>
                                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.customer_name || 'Customer'}</h3>
                                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Order #{order.id}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${status.color === 'green' ? 'bg-green-100 text-green-600' :
                                            status.color === 'red' ? 'bg-red-100 text-red-600' :
                                                status.color === 'orange' ? 'bg-orange-100 text-orange-600' :
                                                    'bg-yellow-100 text-yellow-600'
                                        }`}>
                                        <StatusIcon size={12} />
                                        {status.label}
                                    </span>
                                </div>

                                {/* Order Items Summary */}
                                <div className={`rounded-lg p-3 mb-3 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                        {order.items?.length || 1} item(s)
                                    </p>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className={`flex items-center gap-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        <Clock size={14} />
                                        {formatDate(order.created_at)}
                                    </div>
                                    <span className="text-lg font-bold text-[#0095FF]">{formatCurrency(order.total_amount)}</span>
                                </div>

                                {/* Actions */}
                                {order.status?.toLowerCase() === 'pending' && (
                                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                                        <button
                                            onClick={() => handleShareWhatsApp(order)}
                                            className={`flex-1 py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-1 ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}
                                        >
                                            <MessageSquare size={16} />
                                            Share
                                        </button>
                                        <button
                                            onClick={() => handleMarkComplete(order.id)}
                                            className="flex-1 py-2 bg-[#0095FF] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1"
                                        >
                                            <CheckCircle size={16} />
                                            Complete
                                        </button>
                                    </div>
                                )}
                            </div>
                        )
                    })
                )}
            </div>

            {/* Create Order FAB */}
            <button
                onClick={() => navigate('/orders', { state: { action: 'create' } })}
                className="fixed bottom-24 right-4 w-14 h-14 bg-[#0095FF] text-white rounded-2xl shadow-lg flex items-center justify-center z-30"
            >
                <Plus size={24} />
            </button>
        </div>
    )
}

export default OrdersRedesign
