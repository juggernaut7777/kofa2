import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, cachedApiCall, API_ENDPOINTS, CACHE_KEYS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import {
    ChevronLeft, Search, Clock, CheckCircle, XCircle, Truck, Package,
    MessageSquare, Plus, FileText, Send, DollarSign
} from 'lucide-react'

const OrdersRedesign = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    // Tab state: 'orders' or 'invoices'
    const [activeTab, setActiveTab] = useState('orders')

    // Orders state
    const [orders, setOrders] = useState([])
    const [ordersLoading, setOrdersLoading] = useState(true)
    const [orderFilter, setOrderFilter] = useState('all')
    const [orderSearch, setOrderSearch] = useState('')

    // Invoices state
    const [invoices, setInvoices] = useState([])
    const [invoicesLoading, setInvoicesLoading] = useState(true)
    const [invoiceFilter, setInvoiceFilter] = useState('all')

    // Create invoice modal
    const [showCreateInvoice, setShowCreateInvoice] = useState(false)
    const [newInvoice, setNewInvoice] = useState({
        customer_name: '', customer_phone: '', items: '', amount: ''
    })

    useEffect(() => {
        loadOrders()
        loadInvoices()
    }, [])

    const loadOrders = async () => {
        setOrdersLoading(true)
        try {
            const data = await cachedApiCall(API_ENDPOINTS.ORDERS, CACHE_KEYS.ORDERS)
            setOrders(Array.isArray(data) ? data : [])
        } catch (e) { setOrders([]) }
        finally { setOrdersLoading(false) }
    }

    const loadInvoices = async () => {
        setInvoicesLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.LIST_INVOICES)
            setInvoices(Array.isArray(data) ? data : [])
        } catch (e) { setInvoices([]) }
        finally { setInvoicesLoading(false) }
    }

    const formatCurrency = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`

    const getOrderStatus = (status) => {
        switch (status?.toLowerCase()) {
            case 'completed': case 'delivered': return { label: 'Completed', color: 'green', icon: CheckCircle }
            case 'cancelled': return { label: 'Cancelled', color: 'red', icon: XCircle }
            case 'shipped': case 'in_transit': return { label: 'In Transit', color: 'orange', icon: Truck }
            default: return { label: 'Pending', color: 'yellow', icon: Clock }
        }
    }

    const getInvoiceStatus = (status) => {
        if (status === 'paid') return { label: 'Paid', color: 'green' }
        if (status === 'overdue') return { label: 'Overdue', color: 'red' }
        return { label: 'Pending', color: 'yellow' }
    }

    const handleMarkComplete = async (orderId) => {
        try {
            await apiCall(API_ENDPOINTS.UPDATE_ORDER_STATUS(orderId), {
                method: 'PUT',
                body: JSON.stringify({ status: 'completed' })
            })
            loadOrders()
        } catch (e) { alert('Failed to update order') }
    }

    const handleMarkInvoicePaid = async (invoiceId) => {
        try {
            await apiCall(API_ENDPOINTS.MARK_INVOICE_PAID(invoiceId), { method: 'PUT' })
            loadInvoices()
        } catch (e) { alert('Failed to mark as paid') }
    }

    const handleCreateInvoice = async () => {
        if (!newInvoice.customer_name || !newInvoice.amount) { alert('Fill required fields'); return }
        try {
            await apiCall(API_ENDPOINTS.CREATE_INVOICE, {
                method: 'POST',
                body: JSON.stringify({
                    order_id: `INV-${Date.now()}`,
                    customer_name: newInvoice.customer_name,
                    customer_phone: newInvoice.customer_phone || '+234',
                    items: [{
                        product_name: newInvoice.items || 'Service/Product',
                        quantity: 1,
                        unit_price_ngn: parseFloat(newInvoice.amount)
                    }],
                    delivery_fee: 0
                })
            })
            setShowCreateInvoice(false)
            setNewInvoice({ customer_name: '', customer_phone: '', items: '', amount: '' })
            loadInvoices()
        } catch (e) { alert('Failed to create invoice') }
    }

    const handleShareWhatsApp = (order) => {
        const msg = `🧾 Order #${order.id}\n\nCustomer: ${order.customer_name}\nAmount: ${formatCurrency(order.total_amount)}\n\nThank you!`
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

    const orderFilters = [{ id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' }, { id: 'completed', label: 'Completed' }]
    const invoiceFilters = [{ id: 'all', label: 'All' }, { id: 'pending', label: 'Pending' }, { id: 'paid', label: 'Paid' }]

    const filteredOrders = orders.filter(o => {
        const matchesSearch = (o.customer_name || '').toLowerCase().includes(orderSearch.toLowerCase())
        if (orderFilter === 'all') return matchesSearch
        return matchesSearch && o.status?.toLowerCase() === orderFilter
    })

    const filteredInvoices = invoices.filter(inv => {
        if (invoiceFilter === 'all') return true
        return inv.status === invoiceFilter
    })

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0F0F12]' : 'bg-white'}`}>
            {/* Header */}
            <header className={`px-4 pt-4 pb-2 flex items-center justify-between ${isDark ? 'text-white' : ''}`}>
                <button onClick={() => navigate('/dashboard')} className={`p-2 -ml-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-semibold">Orders & Invoices</h1>
                <div className="w-10"></div>
            </header>

            {/* Top Tabs */}
            <div className="px-4 pb-4">
                <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <button
                        onClick={() => setActiveTab('orders')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'orders'
                            ? 'bg-[#0095FF] text-white'
                            : isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                    >
                        Orders
                    </button>
                    <button
                        onClick={() => setActiveTab('invoices')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${activeTab === 'invoices'
                            ? 'bg-[#0095FF] text-white'
                            : isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                    >
                        Invoices
                    </button>
                </div>
            </div>

            {/* ORDERS TAB */}
            {activeTab === 'orders' && (
                <>
                    {/* Search */}
                    <div className="px-4 pb-4">
                        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                            <Search size={20} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                            <input
                                type="text"
                                placeholder="Search orders..."
                                value={orderSearch}
                                onChange={(e) => setOrderSearch(e.target.value)}
                                className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                            />
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
                        {orderFilters.map(f => (
                            <button key={f.id} onClick={() => setOrderFilter(f.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${orderFilter === f.id ? 'bg-[#0095FF] text-white' : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Orders List */}
                    <div className="px-4 pb-32 space-y-3">
                        {ordersLoading ? (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
                        ) : filteredOrders.length === 0 ? (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <Package size={48} className="mx-auto mb-3 opacity-50" />
                                <p>No orders found</p>
                            </div>
                        ) : filteredOrders.map(order => {
                            const status = getOrderStatus(order.status)
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
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(order.created_at)}</span>
                                        <span className="text-lg font-bold text-[#0095FF]">{formatCurrency(order.total_amount)}</span>
                                    </div>
                                    {order.status?.toLowerCase() === 'pending' && (
                                        <div className={`flex gap-2 mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                            <button onClick={() => handleShareWhatsApp(order)} className={`flex-1 py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-1 ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                                <MessageSquare size={16} /> Share
                                            </button>
                                            <button onClick={() => handleMarkComplete(order.id)} className="flex-1 py-2 bg-[#0095FF] text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1">
                                                <CheckCircle size={16} /> Complete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* INVOICES TAB */}
            {activeTab === 'invoices' && (
                <>
                    {/* Filters */}
                    <div className="px-4 pb-4 flex gap-2 overflow-x-auto">
                        {invoiceFilters.map(f => (
                            <button key={f.id} onClick={() => setInvoiceFilter(f.id)}
                                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${invoiceFilter === f.id ? 'bg-[#0095FF] text-white' : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'
                                    }`}>
                                {f.label}
                            </button>
                        ))}
                    </div>

                    {/* Invoices List */}
                    <div className="px-4 pb-32 space-y-3">
                        {invoicesLoading ? (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
                        ) : filteredInvoices.length === 0 ? (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                <FileText size={48} className="mx-auto mb-3 opacity-50" />
                                <p>No invoices found</p>
                                <button onClick={() => setShowCreateInvoice(true)} className="mt-3 text-[#0095FF] font-medium">Create your first invoice</button>
                            </div>
                        ) : filteredInvoices.map(invoice => {
                            const status = getInvoiceStatus(invoice.status)
                            return (
                                <div key={invoice.id} className={`rounded-2xl p-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}`}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{invoice.customer_name}</h3>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Invoice #{invoice.id}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color === 'green' ? 'bg-green-100 text-green-600' :
                                            status.color === 'red' ? 'bg-red-100 text-red-600' :
                                                'bg-yellow-100 text-yellow-600'
                                            }`}>
                                            {status.label}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(invoice.created_at)}</span>
                                        <span className="text-lg font-bold text-[#0095FF]">{formatCurrency(invoice.amount)}</span>
                                    </div>
                                    {invoice.status !== 'paid' && (
                                        <div className={`flex gap-2 mt-4 pt-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                            <button className={`flex-1 py-2 rounded-xl font-medium text-sm flex items-center justify-center gap-1 ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>
                                                <Send size={16} /> Send
                                            </button>
                                            <button onClick={() => handleMarkInvoicePaid(invoice.id)} className="flex-1 py-2 bg-green-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1">
                                                <DollarSign size={16} /> Mark Paid
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </>
            )}

            {/* FAB */}
            <button
                onClick={() => activeTab === 'invoices' ? setShowCreateInvoice(true) : null}
                className="fixed bottom-24 right-4 w-14 h-14 bg-[#0095FF] text-white rounded-2xl shadow-lg flex items-center justify-center z-30"
            >
                <Plus size={24} />
            </button>

            {/* Create Invoice Modal */}
            {showCreateInvoice && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center">
                    <div className={`rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 ${isDark ? 'bg-[#1A1A1F]' : 'bg-white'}`}>
                        <h2 className={`text-xl font-bold mb-6 ${isDark ? 'text-white' : ''}`}>Create Invoice</h2>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Customer Name *</label>
                                <input type="text" value={newInvoice.customer_name} onChange={(e) => setNewInvoice({ ...newInvoice, customer_name: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</label>
                                <input type="text" value={newInvoice.customer_phone} onChange={(e) => setNewInvoice({ ...newInvoice, customer_phone: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Items Description</label>
                                <textarea value={newInvoice.items} onChange={(e) => setNewInvoice({ ...newInvoice, items: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none resize-none h-20 ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Amount (₦) *</label>
                                <input type="number" value={newInvoice.amount} onChange={(e) => setNewInvoice({ ...newInvoice, amount: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setShowCreateInvoice(false)} className={`flex-1 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                            <button onClick={handleCreateInvoice} className="flex-1 py-3 bg-[#0095FF] text-white rounded-xl font-semibold">Create</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default OrdersRedesign
