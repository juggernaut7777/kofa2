import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

const OrdersRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [activeTab, setActiveTab] = useState('orders')
    const [orders, setOrders] = useState([])
    const [invoices, setInvoices] = useState([])
    const [shipments, setShipments] = useState([])
    const [loading, setLoading] = useState(true)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [filter, setFilter] = useState('all')

    const tabs = [
        { id: 'orders', icon: '📦', label: 'Orders' },
        { id: 'invoices', icon: '🧾', label: 'Invoices' },
        { id: 'delivery', icon: '🚚', label: 'Delivery' },
    ]

    const filters = ['all', 'pending', 'processing', 'shipped', 'delivered']

    useEffect(() => { loadData() }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.ORDERS)
            setOrders(Array.isArray(data) ? data : [])
        } catch (e) {
            setOrders([
                { id: 'ORD-9847', customer_name: 'Amaka Johnson', customer_phone: '+234 801 234 5678', total_amount: 125000, status: 'pending', items: 3, created_at: '2 mins ago', product_name: 'Nike Air Max Collection' },
                { id: 'ORD-9846', customer_name: 'Emeka Obi', customer_phone: '+234 802 345 6789', total_amount: 78000, status: 'processing', items: 2, created_at: '15 mins ago', product_name: 'Wireless Headphones Pro' },
                { id: 'ORD-9845', customer_name: 'Fatima Hassan', customer_phone: '+234 803 456 7890', total_amount: 245000, status: 'shipped', items: 5, created_at: '1 hour ago', product_name: 'Designer Collection Bundle' },
                { id: 'ORD-9844', customer_name: 'Chidi Nwosu', customer_phone: '+234 804 567 8901', total_amount: 56000, status: 'delivered', items: 1, created_at: '3 hours ago', product_name: 'Premium Watch Series' },
            ])
        }

        setInvoices([
            { id: 'INV-001', order_id: 'ORD-9847', amount: 125000, status: 'paid', date: 'Today' },
            { id: 'INV-002', order_id: 'ORD-9846', amount: 78000, status: 'pending', date: 'Yesterday' },
        ])

        setShipments([
            { id: 'SHP-001', order_id: 'ORD-9845', destination: 'Abuja', status: 'in_transit', eta: '2 days' },
        ])

        setLoading(false)
    }

    const formatCurrency = (n) => {
        if (n >= 1000000) return `₦${(n / 1000000).toFixed(1)}M`
        if (n >= 1000) return `₦${Math.round(n / 1000)}K`
        return `₦${n}`
    }

    const getStatusStyle = (status) => ({
        pending: { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30', icon: '⏳' },
        processing: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', icon: '⚙️' },
        shipped: { bg: 'bg-purple-500/15', text: 'text-purple-400', border: 'border-purple-500/30', icon: '📦' },
        delivered: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: '✅' },
        paid: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30', icon: '✓' },
        in_transit: { bg: 'bg-blue-500/15', text: 'text-blue-400', border: 'border-blue-500/30', icon: '🚚' },
    })[status] || { bg: 'bg-gray-500/15', text: 'text-gray-400', border: 'border-gray-500/30', icon: '•' }

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await apiCall(API_ENDPOINTS.UPDATE_ORDER_STATUS(orderId), {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            })
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
            setSelectedOrder(null)
        } catch (e) {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
            setSelectedOrder(null)
        }
    }

    const filteredOrders = orders.filter(o => filter === 'all' || o.status === filter)

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#030712]' : 'bg-gray-50'}`}>
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin"></div>
                    <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading orders...</p>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['Inter',system-ui,sans-serif] ${isDark ? 'bg-[#030712]' : 'bg-gray-50'}`}>

            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute -top-40 right-20 w-80 h-80 rounded-full blur-3xl ${isDark ? 'bg-blue-500/10' : 'bg-blue-500/5'}`}></div>
                <div className={`absolute bottom-40 -left-20 w-60 h-60 rounded-full blur-3xl ${isDark ? 'bg-purple-500/10' : 'bg-purple-500/5'}`}></div>
            </div>

            <div className="relative max-w-md mx-auto pb-28">

                {/* Header */}
                <header className={`sticky top-0 z-30 px-5 pt-4 pb-3 ${isDark ? 'bg-[#030712]/80' : 'bg-gray-50/80'} backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => navigate('/dashboard')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <span className="text-lg">←</span>
                        </button>
                        <button onClick={loadData} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <span className="text-lg">🔄</span>
                        </button>
                    </div>

                    <h1 className={`text-3xl font-black tracking-tight mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Orders</h1>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{orders.length} total orders</p>

                    {/* Tab Navigation */}
                    <div className={`flex mt-4 p-1 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${activeTab === tab.id
                                        ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg'
                                        : isDark ? 'text-gray-400' : 'text-gray-500'
                                    }`}
                            >
                                <span>{tab.icon}</span>
                                <span>{tab.label}</span>
                            </button>
                        ))}
                    </div>
                </header>

                {/* Orders Tab */}
                {activeTab === 'orders' && (
                    <>
                        {/* Status Filters */}
                        <div className="flex gap-2 px-5 pt-4 overflow-x-auto no-scrollbar">
                            {filters.map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 h-9 rounded-xl text-sm font-semibold capitalize whitespace-nowrap transition-all hover:scale-105 ${filter === f
                                            ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg'
                                            : isDark ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-white text-gray-600 border border-gray-200'
                                        }`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>

                        {/* Order Cards */}
                        <div className="space-y-3 p-5">
                            {filteredOrders.length === 0 ? (
                                <div className="flex flex-col items-center py-20">
                                    <span className="text-5xl mb-4">📭</span>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>No orders found</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Try a different filter</p>
                                </div>
                            ) : (
                                filteredOrders.map((order) => {
                                    const style = getStatusStyle(order.status)
                                    return (
                                        <div
                                            key={order.id}
                                            onClick={() => setSelectedOrder(order)}
                                            className={`rounded-2xl p-4 border backdrop-blur-xl cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}
                                        >
                                            <div className="flex items-start justify-between mb-3">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.id}</p>
                                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${style.bg} ${style.text} ${style.border}`}>
                                                            {style.icon} {order.status}
                                                        </span>
                                                    </div>
                                                    <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{order.created_at}</p>
                                                </div>
                                                <p className="text-lg font-black text-emerald-500">{formatCurrency(order.total_amount)}</p>
                                            </div>

                                            <div className={`flex items-center gap-3 pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                    <span className="text-lg">👤</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{order.customer_name}</p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{order.items} item{order.items > 1 ? 's' : ''} • {order.product_name}</p>
                                                </div>
                                                <button className={`w-8 h-8 rounded-lg flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                                    <span className="text-sm">→</span>
                                                </button>
                                            </div>
                                        </div>
                                    )
                                })
                            )}
                        </div>
                    </>
                )}

                {/* Invoices Tab */}
                {activeTab === 'invoices' && (
                    <div className="space-y-3 p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Recent Invoices</h3>
                            <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-sm font-bold shadow-lg hover:scale-105 transition-all">
                                + Generate
                            </button>
                        </div>

                        {invoices.map((invoice) => {
                            const style = getStatusStyle(invoice.status)
                            return (
                                <div key={invoice.id} className={`rounded-2xl p-4 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{invoice.id}</p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{invoice.order_id} • {invoice.date}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-500">{formatCurrency(invoice.amount)}</p>
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${style.bg} ${style.text}`}>
                                                {invoice.status}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button className={`flex-1 py-2 rounded-xl text-sm font-semibold ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>📥 Download</button>
                                        <button className={`flex-1 py-2 rounded-xl text-sm font-semibold ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>🖨️ Print</button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* Delivery Tab */}
                {activeTab === 'delivery' && (
                    <div className="space-y-4 p-5">
                        <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Active Shipments</h3>

                        {shipments.length === 0 ? (
                            <div className="flex flex-col items-center py-20">
                                <span className="text-5xl mb-4">🚚</span>
                                <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>No active shipments</p>
                            </div>
                        ) : (
                            shipments.map((shipment) => (
                                <div key={shipment.id} className={`rounded-2xl p-4 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{shipment.id}</p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{shipment.order_id}</p>
                                        </div>
                                        <span className="px-2 py-1 rounded-lg bg-blue-500/15 text-blue-400 text-xs font-bold">
                                            🚚 In Transit
                                        </span>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="relative">
                                        <div className={`h-1.5 rounded-full ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-emerald-400 to-blue-500"></div>
                                        </div>
                                        <div className="flex justify-between mt-2 text-xs">
                                            <span className="text-emerald-400">Picked up</span>
                                            <span className="text-blue-400 font-semibold">In Transit</span>
                                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{shipment.destination}</span>
                                        </div>
                                    </div>

                                    <div className={`flex items-center justify-between mt-4 pt-3 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>ETA: {shipment.eta}</span>
                                        <button className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white text-sm font-bold shadow-lg hover:scale-105 transition-all">
                                            Track
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl p-6 ${isDark ? 'bg-[#030712]' : 'bg-white'}`}>
                        <div className="flex items-center justify-between mb-6">
                            <div>
                                <p className={`font-bold text-xl ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.id}</p>
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{selectedOrder.created_at}</p>
                            </div>
                            <button onClick={() => setSelectedOrder(null)} className={`w-10 h-10 rounded-full flex items-center justify-center ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                                ✕
                            </button>
                        </div>

                        <div className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <p className={`text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Customer</p>
                            <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedOrder.customer_name}</p>
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedOrder.customer_phone}</p>
                        </div>

                        <div className="flex items-center justify-between mb-6">
                            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{selectedOrder.items} items</p>
                            <p className="text-2xl font-black text-emerald-500">{formatCurrency(selectedOrder.total_amount)}</p>
                        </div>

                        {/* Quick Actions */}
                        <div className="grid grid-cols-2 gap-3">
                            {selectedOrder.status === 'pending' && (
                                <>
                                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'processing')} className="py-3 rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold">
                                        ⚙️ Process
                                    </button>
                                    <button onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')} className="py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold">
                                        ✓ Mark Paid
                                    </button>
                                </>
                            )}
                            {selectedOrder.status === 'processing' && (
                                <button onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')} className="col-span-2 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold">
                                    📦 Mark Shipped
                                </button>
                            )}
                            {selectedOrder.status === 'shipped' && (
                                <button onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')} className="col-span-2 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold">
                                    ✅ Mark Delivered
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    )
}

export default OrdersRedesign
