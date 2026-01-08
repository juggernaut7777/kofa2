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
}

const OrdersRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [orders, setOrders] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeStatus, setActiveStatus] = useState('all')
    const [showOrderDetail, setShowOrderDetail] = useState(null)

    const statusFilters = [
        { id: 'all', label: 'All', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg> },
        { id: 'pending', label: 'Pending', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> },
        { id: 'processing', label: 'Processing', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg> },
        { id: 'shipped', label: 'Shipped', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" /></svg> },
        { id: 'delivered', label: 'Delivered', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" /></svg> },
    ]

    useEffect(() => { loadOrders() }, [])

    const loadOrders = async () => {
        setLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.ORDERS)
            setOrders(Array.isArray(data) ? data : [])
        } catch (e) {
            setOrders([
                { id: 'ORD-2847', customer_name: 'Amaka Johnson', customer_phone: '+234 801 234 5678', total_amount: 45000, status: 'pending', items: [{ name: 'Nike Air Max', qty: 1, price: 45000 }], channel: 'WhatsApp', created_at: '2024-01-08T10:30:00Z' },
                { id: 'ORD-2846', customer_name: 'Emeka Obi', customer_phone: '+234 802 345 6789', total_amount: 32000, status: 'processing', items: [{ name: 'Designer Bag', qty: 1, price: 32000 }], channel: 'Instagram', created_at: '2024-01-08T09:15:00Z' },
                { id: 'ORD-2845', customer_name: 'Fatima Hassan', customer_phone: '+234 803 456 7890', total_amount: 58000, status: 'shipped', items: [{ name: 'Ankara Fabric', qty: 2, price: 29000 }], channel: 'Web', created_at: '2024-01-07T14:20:00Z' },
                { id: 'ORD-2844', customer_name: 'Chidi Eze', customer_phone: '+234 804 567 8901', total_amount: 89000, status: 'delivered', items: [{ name: 'Premium Sneakers', qty: 1, price: 89000 }], channel: 'WhatsApp', created_at: '2024-01-06T11:45:00Z' },
            ])
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (n) => `₦${n?.toLocaleString()}`

    const formatDate = (d) => {
        if (!d) return 'Recently'
        const date = new Date(d)
        const now = new Date()
        const diff = now - date
        if (diff < 60000) return 'Just now'
        if (diff < 3600000) return `${Math.floor(diff / 60000)} min ago`
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`
        return date.toLocaleDateString()
    }

    const getStatusConfig = (status) => ({
        pending: { label: 'Pending', bg: 'bg-amber-500/15', text: 'text-amber-400', icon: '○' },
        processing: { label: 'Processing', bg: `bg-[${colors.lavender}]/20`, text: 'text-[#A3A3CC]', icon: '◐' },
        shipped: { label: 'Shipped', bg: `bg-[${colors.violet}]/20`, text: 'text-[#5C5C99]', icon: '◑' },
        delivered: { label: 'Delivered', bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: '●' },
        cancelled: { label: 'Cancelled', bg: 'bg-red-500/15', text: 'text-red-400', icon: '✕' },
    })[status] || { label: status, bg: 'bg-gray-500/15', text: 'text-gray-400', icon: '○' }

    const handleUpdateStatus = async (orderId, newStatus) => {
        try {
            await apiCall(API_ENDPOINTS.UPDATE_ORDER(orderId), {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            })
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        } catch (e) {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        }
        setShowOrderDetail(null)
    }

    const filteredOrders = orders.filter(o => activeStatus === 'all' || o.status === activeStatus)

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>
                <div className="relative w-16 h-16">
                    <div className="absolute inset-0 rounded-full border-2 border-white/10"></div>
                    <div className="absolute inset-0 rounded-full border-2 border-transparent animate-spin" style={{ borderTopColor: colors.violet }}></div>
                </div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['SF_Pro_Display',-apple-system,sans-serif] ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>

            {/* Ambient Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-40 -right-40 w-80 h-80 rounded-full blur-[120px]" style={{ background: isDark ? `${colors.indigo}30` : `${colors.lavender}20` }}></div>
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
                        <button onClick={loadOrders} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                        </button>
                    </div>

                    <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Orders</h1>
                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>{orders.length} total orders</p>
                </header>

                {/* Status Filter */}
                <div className="flex gap-2 px-6 pt-2 overflow-x-auto no-scrollbar">
                    {statusFilters.map(f => (
                        <button
                            key={f.id}
                            onClick={() => setActiveStatus(f.id)}
                            className={`flex items-center gap-2 px-4 h-10 rounded-xl whitespace-nowrap text-sm font-medium transition-all hover:scale-105 ${activeStatus === f.id ? 'text-white' : isDark ? 'bg-white/[0.03] text-white/40 border border-white/[0.06]' : 'bg-white text-black/40 border border-black/[0.04]'
                                }`}
                            style={activeStatus === f.id ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})`, boxShadow: `0 4px 12px ${colors.indigo}40` } : {}}
                        >
                            {f.icon}
                            <span>{f.label}</span>
                        </button>
                    ))}
                </div>

                {/* Orders List */}
                {filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className={`w-24 h-24 rounded-3xl flex items-center justify-center mb-4 ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                            <svg className="w-12 h-12" style={{ color: colors.muted, opacity: 0.3 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                        </div>
                        <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>No orders found</p>
                        <p className={`text-sm text-center ${isDark ? 'text-white/40' : 'text-black/40'}`}>Orders will appear here</p>
                    </div>
                ) : (
                    <div className="px-6 pt-5 space-y-3">
                        {filteredOrders.map((order) => {
                            const status = getStatusConfig(order.status)
                            return (
                                <div
                                    key={order.id}
                                    onClick={() => setShowOrderDetail(order)}
                                    className={`p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:scale-[1.01] ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}
                                    style={{ boxShadow: isDark ? 'none' : '0 2px 8px rgba(0,0,0,0.04)' }}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-white/[0.05]' : 'bg-black/[0.03]'}`} style={{ color: colors.violet }}>
                                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{order.customer_name}</p>
                                                <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{order.id}</p>
                                            </div>
                                        </div>
                                        <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase ${status.bg} ${status.text}`}>
                                            {status.icon} {status.label}
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs px-2 py-0.5 rounded-md ${isDark ? 'bg-white/[0.05] text-white/50' : 'bg-black/[0.03] text-black/50'}`}>
                                                {order.channel || 'WhatsApp'}
                                            </span>
                                            <span className={`text-xs ${isDark ? 'text-white/30' : 'text-black/30'}`}>{formatDate(order.created_at)}</span>
                                        </div>
                                        <p className={`font-bold ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(order.total_amount)}</p>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>

            {/* Order Detail Modal */}
            {showOrderDetail && (
                <div className="fixed inset-0 z-50 flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowOrderDetail(null)}></div>
                    <div className={`relative w-full max-w-md rounded-t-3xl overflow-hidden ${isDark ? 'bg-[#0a0a14]' : 'bg-white'}`}>
                        <div className="w-full flex justify-center pt-3">
                            <div className={`w-12 h-1.5 rounded-full ${isDark ? 'bg-white/20' : 'bg-black/20'}`}></div>
                        </div>

                        <div className="p-6 max-h-[80vh] overflow-y-auto">
                            {/* Header */}
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>{showOrderDetail.id}</p>
                                    <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>{showOrderDetail.customer_name}</h3>
                                </div>
                                <span className={`px-3 py-1.5 rounded-xl text-xs font-semibold uppercase ${getStatusConfig(showOrderDetail.status).bg} ${getStatusConfig(showOrderDetail.status).text}`}>
                                    {getStatusConfig(showOrderDetail.status).label}
                                </span>
                            </div>

                            {/* Customer Info */}
                            <div className={`p-4 rounded-2xl mb-4 ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Contact</p>
                                <div className="flex items-center gap-3">
                                    <svg className="w-5 h-5" style={{ color: colors.violet }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                    <p className={isDark ? 'text-white' : 'text-black'}>{showOrderDetail.customer_phone}</p>
                                </div>
                            </div>

                            {/* Items */}
                            <div className={`p-4 rounded-2xl mb-4 ${isDark ? 'bg-white/[0.03]' : 'bg-black/[0.02]'}`}>
                                <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Items</p>
                                {(showOrderDetail.items || []).map((item, i) => (
                                    <div key={i} className="flex items-center justify-between py-2">
                                        <div>
                                            <p className={`font-medium ${isDark ? 'text-white' : 'text-black'}`}>{item.name}</p>
                                            <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>x{item.qty}</p>
                                        </div>
                                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{formatCurrency(item.price)}</p>
                                    </div>
                                ))}
                                <div className={`flex items-center justify-between pt-3 mt-2 border-t ${isDark ? 'border-white/10' : 'border-black/10'}`}>
                                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>Total</p>
                                    <p className="text-xl font-bold" style={{ color: colors.violet }}>{formatCurrency(showOrderDetail.total_amount)}</p>
                                </div>
                            </div>

                            {/* Status Actions */}
                            <p className={`text-xs font-semibold uppercase tracking-wide mb-3 ${isDark ? 'text-white/30' : 'text-black/30'}`}>Update Status</p>
                            <div className="grid grid-cols-2 gap-2">
                                {['processing', 'shipped', 'delivered', 'cancelled'].filter(s => s !== showOrderDetail.status).map(status => {
                                    const config = getStatusConfig(status)
                                    return (
                                        <button
                                            key={status}
                                            onClick={() => handleUpdateStatus(showOrderDetail.id, status)}
                                            className={`py-3 rounded-xl text-sm font-medium transition-all hover:scale-[1.02] ${config.bg} ${config.text}`}
                                        >
                                            {config.icon} {config.label}
                                        </button>
                                    )
                                })}
                            </div>
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
