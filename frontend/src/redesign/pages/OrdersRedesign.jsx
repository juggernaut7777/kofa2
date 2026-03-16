import { useState, useEffect, useContext } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiCall, cachedApiCall, API_ENDPOINTS, CACHE_KEYS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
    ChevronLeft, Search, Clock, CheckCircle, XCircle, Truck, Package,
    MessageSquare, Plus, FileText, Send, DollarSign, ShoppingCart, CreditCard, Banknote, Smartphone,
    AlertTriangle, Trash2, Wallet
} from 'lucide-react'
import ExportButton from '../../components/ExportButton'

const OrdersRedesign = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { theme } = useContext(ThemeContext)
    const { user } = useAuth()
    const isDark = theme === 'dark'

    // Tab state: 'orders', 'invoices', or 'quicksale'
    const [activeTab, setActiveTab] = useState(location.state?.action === 'quick-sale' ? 'quicksale' : 'orders')

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

    // Quick Sale state
    const [products, setProducts] = useState([])
    const [quickSale, setQuickSale] = useState({
        product_id: '', quantity: 1, payment_method: 'cash', customer_name: '', customer_phone: ''
    })
    const [quickSaleLoading, setQuickSaleLoading] = useState(false)
    const [confirmingPayment, setConfirmingPayment] = useState(null)

    // Credit Book state
    const [credits, setCredits] = useState([])
    const [creditsLoading, setCreditsLoading] = useState(false)
    const [creditFilter, setCreditFilter] = useState('unpaid')
    const [creditSummary, setCreditSummary] = useState(null)
    const [showAddCredit, setShowAddCredit] = useState(false)
    const [newCredit, setNewCredit] = useState({ customer_name: '', customer_phone: '', amount: '', items_description: '', due_date: '', notes: '' })
    const [payingCredit, setPayingCredit] = useState(null)
    const [paymentAmount, setPaymentAmount] = useState('')

    useEffect(() => {
        loadOrders()
        loadInvoices()
        loadProducts()
        loadCredits()
    }, [])

    const loadProducts = async () => {
        try {
            const endpoint = user?.id ? `${API_ENDPOINTS.PRODUCTS}?user_id=${user.id}` : API_ENDPOINTS.PRODUCTS
            const data = await apiCall(endpoint)
            setProducts(Array.isArray(data) ? data : [])
        } catch (e) { setProducts([]) }
    }

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

    const loadCredits = async () => {
        if (!user?.id) return
        setCreditsLoading(true)
        try {
            const url = creditFilter === 'all'
                ? `${API_ENDPOINTS.CREDIT_SALES}?user_id=${user.id}`
                : `${API_ENDPOINTS.CREDIT_SALES}?user_id=${user.id}&status=${creditFilter}`
            const data = await apiCall(url)
            setCredits(data?.credit_sales || [])
        } catch (e) { console.error('Credits error:', e) }
        finally { setCreditsLoading(false) }

        // Also load summary
        try {
            const summary = await apiCall(`${API_ENDPOINTS.CREDIT_SALES_SUMMARY}?user_id=${user.id}`)
            setCreditSummary(summary?.summary || null)
        } catch (e) { console.error('Credit summary error:', e) }
    }

    useEffect(() => { if (activeTab === 'credit') loadCredits() }, [creditFilter])

    const handleAddCredit = async () => {
        if (!newCredit.customer_name || !newCredit.amount) { alert('Name and amount required'); return }
        try {
            await apiCall(API_ENDPOINTS.CREDIT_SALES, {
                method: 'POST',
                body: JSON.stringify({ ...newCredit, amount: parseFloat(newCredit.amount), user_id: user?.id })
            })
            setShowAddCredit(false)
            setNewCredit({ customer_name: '', customer_phone: '', amount: '', items_description: '', due_date: '', notes: '' })
            loadCredits()
        } catch (e) { alert('Failed to add credit sale') }
    }

    const handleRecordPayment = async () => {
        if (!paymentAmount || parseFloat(paymentAmount) <= 0) { alert('Enter a valid amount'); return }
        try {
            await apiCall(API_ENDPOINTS.CREDIT_PAYMENT(payingCredit.id), {
                method: 'POST',
                body: JSON.stringify({ amount: parseFloat(paymentAmount) })
            })
            setPayingCredit(null)
            setPaymentAmount('')
            loadCredits()
        } catch (e) { alert('Failed to record payment') }
    }

    const handleDeleteCredit = async (credit) => {
        if (!window.confirm(`Write off ₦${credit.balance?.toLocaleString()} from ${credit.customer_name}?`)) return
        try {
            await apiCall(`${API_ENDPOINTS.DELETE_CREDIT(credit.id)}?user_id=${user?.id}`, { method: 'DELETE' })
            loadCredits()
        } catch (e) { alert('Failed to delete') }
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

    const handleConfirmPayment = async (order) => {
        if (!confirm(`Confirm payment of ${formatCurrency(order.total_amount)} for order #${order.id}?`)) return
        setConfirmingPayment(order.id)
        try {
            const res = await apiCall(API_ENDPOINTS.CONFIRM_PAYMENT, {
                method: 'POST',
                body: JSON.stringify({
                    order_id: order.id,
                    amount: order.total_amount,
                    method: 'transfer',
                    user_id: user?.id
                })
            })
            if (res.status === 'success' || res.status === 'already_paid') {
                alert('✅ Payment confirmed!')
                loadOrders()
            } else if (res.status === 'partial') {
                alert(res.message)
                loadOrders()
            } else {
                alert(res.message || 'Payment confirmation failed')
            }
        } catch (e) { alert('Failed to confirm payment') }
        finally { setConfirmingPayment(null) }
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
        const q = orderSearch.toLowerCase()
        const matchesSearch = !q ||
            (o.customer_name || '').toLowerCase().includes(q) ||
            (o.customer_phone || '').toLowerCase().includes(q) ||
            (o.id || '').toLowerCase().includes(q)
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
                <div className="w-10"><ExportButton type="orders" label="Export" isDark={isDark} /></div>
            </header>

            {/* Top Tabs */}
            <div className="px-4 pb-4">
                <div className={`flex rounded-xl p-1 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <button
                        onClick={() => setActiveTab('quicksale')}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'quicksale'
                            ? 'bg-[#0095FF] text-white'
                            : isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                    >
                        <ShoppingCart size={16} />
                        Sale
                    </button>
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
                    <button
                        onClick={() => { setActiveTab('credit'); loadCredits() }}
                        className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-1 ${activeTab === 'credit'
                            ? 'bg-[#0095FF] text-white'
                            : isDark ? 'text-gray-400' : 'text-gray-500'
                            }`}
                    >
                        <Wallet size={16} />
                        Credit
                    </button>
                </div>
            </div>

            {/* QUICK SALE TAB */}
            {activeTab === 'quicksale' && (
                <div className="px-4 pb-6 space-y-4">
                    <div className={`rounded-2xl p-6 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-50 border border-gray-100'}`}>
                        <h2 className={`text-lg font-semibold mb-4 flex items-center gap-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                            <ShoppingCart size={20} className="text-green-500" />
                            Record Walk-in Sale
                        </h2>

                        {/* Product Selection */}
                        <div className="mb-4">
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Product *</label>
                            <select
                                value={quickSale.product_id}
                                onChange={(e) => setQuickSale({ ...quickSale, product_id: e.target.value })}
                                className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-white border border-gray-200'}`}
                            >
                                <option value="">Select a product</option>
                                {products.map(p => (
                                    <option key={p.id} value={p.id}>{p.name} - ₦{Number(p.price || 0).toLocaleString()} ({p.stock} in stock)</option>
                                ))}
                            </select>
                        </div>

                        {/* Quantity */}
                        <div className="mb-4">
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Quantity *</label>
                            <input
                                type="number"
                                min="1"
                                value={quickSale.quantity}
                                onChange={(e) => setQuickSale({ ...quickSale, quantity: parseInt(e.target.value) || 1 })}
                                className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-white border border-gray-200'}`}
                            />
                        </div>

                        {/* Payment Method */}
                        <div className="mb-4">
                            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Payment Method *</label>
                            <div className="grid grid-cols-4 gap-2">
                                {[
                                    { id: 'cash', label: 'Cash', icon: Banknote, color: 'green' },
                                    { id: 'transfer', label: 'Transfer', icon: Smartphone, color: 'blue' },
                                    { id: 'pos', label: 'POS', icon: CreditCard, color: 'purple' },
                                    { id: 'credit', label: 'Credit', icon: Clock, color: 'orange' },
                                ].map(method => {
                                    const Icon = method.icon
                                    const isSelected = quickSale.payment_method === method.id
                                    return (
                                        <button
                                            key={method.id}
                                            onClick={() => setQuickSale({ ...quickSale, payment_method: method.id })}
                                            className={`p-3 rounded-xl text-center transition-all ${isSelected
                                                ? `bg-${method.color}-500 text-white ring-2 ring-${method.color}-300`
                                                : isDark ? 'bg-white/10 text-gray-400 hover:bg-white/20' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                            style={isSelected ? { backgroundColor: method.color === 'green' ? '#22c55e' : method.color === 'blue' ? '#3b82f6' : method.color === 'purple' ? '#a855f7' : '#f97316' } : {}}
                                        >
                                            <Icon size={20} className="mx-auto mb-1" />
                                            <span className="text-xs font-medium">{method.label}</span>
                                        </button>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Customer Info (for Credit sales) */}
                        {quickSale.payment_method === 'credit' && (
                            <div className="mb-4 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                                <p className="text-sm text-orange-500 font-medium mb-3">Customer Info (required for credit)</p>
                                <input
                                    type="text"
                                    placeholder="Customer Name"
                                    value={quickSale.customer_name}
                                    onChange={(e) => setQuickSale({ ...quickSale, customer_name: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none mb-2 ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-white border border-gray-200'}`}
                                />
                                <input
                                    type="tel"
                                    placeholder="Phone Number"
                                    value={quickSale.customer_phone}
                                    onChange={(e) => setQuickSale({ ...quickSale, customer_phone: e.target.value })}
                                    className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-white border border-gray-200'}`}
                                />
                            </div>
                        )}

                        {/* Total Display */}
                        {quickSale.product_id && (
                            <div className={`p-4 rounded-xl mb-4 ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                <div className="flex justify-between items-center">
                                    <span className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Total:</span>
                                    <span className="text-2xl font-bold text-[#0095FF]">
                                        ₦{(Number(products.find(p => p.id === quickSale.product_id)?.price || 0) * quickSale.quantity).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Submit Button */}
                        <button
                            onClick={async () => {
                                if (!quickSale.product_id) return alert('Please select a product')
                                if (quickSale.payment_method === 'credit' && !quickSale.customer_name) return alert('Customer name required for credit sales')

                                setQuickSaleLoading(true)
                                try {
                                    const product = products.find(p => p.id === quickSale.product_id)
                                    const unitPrice = product?.price || product?.price_ngn || 0
                                    await apiCall(API_ENDPOINTS.SALES_RECORD, {
                                        method: 'POST',
                                        body: JSON.stringify({
                                            user_id: user?.id,
                                            product_id: quickSale.product_id,
                                            product_name: product?.name,
                                            quantity: quickSale.quantity,
                                            unit_price: unitPrice,
                                            total_amount: unitPrice * quickSale.quantity,
                                            payment_method: quickSale.payment_method,
                                            customer_name: quickSale.customer_name,
                                            customer_phone: quickSale.customer_phone,
                                        })
                                    })
                                    alert('✅ Sale recorded successfully!')
                                    setQuickSale({ product_id: '', quantity: 1, payment_method: 'cash', customer_name: '', customer_phone: '' })
                                    loadProducts() // Refresh to show updated stock
                                    loadOrders()
                                } catch (e) {
                                    alert('Failed to record sale: ' + e.message)
                                } finally {
                                    setQuickSaleLoading(false)
                                }
                            }}
                            disabled={quickSaleLoading || !quickSale.product_id}
                            className="w-full py-4 bg-gradient-to-r from-[#0095FF] to-[#0077CC] hover:from-[#0077CC] hover:to-[#005599] text-white rounded-xl font-semibold text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                        >
                            {quickSaleLoading ? (
                                <span>Recording...</span>
                            ) : (
                                <><CheckCircle size={20} /> Complete Sale</>
                            )}
                        </button>
                    </div>
                </div>
            )}

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
                                            <button
                                                onClick={() => handleConfirmPayment(order)}
                                                disabled={confirmingPayment === order.id}
                                                className="flex-1 py-2 bg-green-500 text-white rounded-xl font-medium text-sm flex items-center justify-center gap-1"
                                            >
                                                <DollarSign size={16} /> {confirmingPayment === order.id ? 'Confirming...' : 'Paid'}
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

            {/* CREDIT BOOK TAB */}
            {activeTab === 'credit' && (
                <div className="px-4 pb-6 space-y-4">
                    {/* Summary Card */}
                    {creditSummary && (
                        <div className={`rounded-2xl p-4 ${isDark ? 'bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30' : 'bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200'}`}>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Credit Summary</h3>
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${creditSummary.overdue_count > 0 ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                                    {creditSummary.overdue_count > 0 ? `${creditSummary.overdue_count} Overdue` : 'All Good'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                <div className="text-center">
                                    <div className={`text-xl font-bold ${isDark ? 'text-orange-400' : 'text-orange-600'}`}>₦{(creditSummary.total_owed || 0).toLocaleString()}</div>
                                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Owed</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>₦{(creditSummary.total_collected || 0).toLocaleString()}</div>
                                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Collected</div>
                                </div>
                                <div className="text-center">
                                    <div className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{creditSummary.unpaid_count + creditSummary.partial_count}</div>
                                    <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Open</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Filter + Add Button */}
                    <div className="flex items-center gap-2">
                        {['unpaid', 'partial', 'paid', 'all'].map(f => (
                            <button key={f} onClick={() => setCreditFilter(f)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize ${creditFilter === f
                                    ? 'bg-[#0095FF] text-white'
                                    : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'
                                    }`}>{f}</button>
                        ))}
                        <button onClick={() => setShowAddCredit(true)}
                            className="ml-auto px-3 py-1.5 rounded-lg text-xs font-medium bg-orange-500 text-white flex items-center gap-1">
                            <Plus size={14} /> Add Credit
                        </button>
                    </div>

                    {/* Credit List */}
                    {creditsLoading ? (
                        <div className="text-center py-8"><div className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Loading...</div></div>
                    ) : credits.length === 0 ? (
                        <div className={`text-center py-12 rounded-2xl ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                            <Wallet size={40} className={`mx-auto mb-3 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                            <p className={`font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No credit sales yet</p>
                            <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tap "Add Credit" when a customer buys on credit</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {credits.map(c => (
                                <div key={c.id} className={`rounded-2xl p-4 ${isDark ? 'bg-white/5 border border-white/10' : 'bg-white border border-gray-100 shadow-sm'} ${c.is_overdue ? (isDark ? 'border-red-500/30' : 'border-red-200') : ''}`}>
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.customer_name}</h4>
                                                {c.is_overdue && <AlertTriangle size={14} className="text-red-400" />}
                                            </div>
                                            {c.customer_phone && <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{c.customer_phone}</p>}
                                            {c.items_description && <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{c.items_description}</p>}
                                        </div>
                                        <div className="text-right">
                                            <div className={`font-bold ${c.status === 'paid' ? 'text-green-500' : isDark ? 'text-orange-400' : 'text-orange-600'}`}>₦{(c.balance || 0).toLocaleString()}</div>
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${c.status === 'paid' ? 'bg-green-500/20 text-green-400'
                                                : c.status === 'partial' ? 'bg-yellow-500/20 text-yellow-400'
                                                    : 'bg-red-500/20 text-red-400'
                                                }`}>{c.status}</span>
                                        </div>
                                    </div>
                                    {c.status !== 'paid' && (
                                        <div className="flex gap-2 mt-3">
                                            <button onClick={() => { setPayingCredit(c); setPaymentAmount('') }}
                                                className="flex-1 py-2 rounded-xl text-xs font-semibold bg-green-500/20 text-green-400 flex items-center justify-center gap-1">
                                                <Banknote size={14} /> Record Payment
                                            </button>
                                            <button onClick={() => handleDeleteCredit(c)}
                                                className="py-2 px-3 rounded-xl text-xs font-semibold bg-red-500/20 text-red-400">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    )}
                                    <div className={`text-xs mt-2 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                        {new Date(c.created_at).toLocaleDateString()}
                                        {c.due_date && <span className={c.is_overdue ? ' text-red-400' : ''}> · Due {new Date(c.due_date).toLocaleDateString()}</span>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Add Credit Modal */}
                    {showAddCredit && (
                        <div className="fixed inset-0 z-50 bg-black/50 flex items-end">
                            <div className={`w-full rounded-t-3xl p-6 ${isDark ? 'bg-[#1A1A1F]' : 'bg-white'}`}>
                                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Add Credit Sale</h3>
                                <div className="space-y-3">
                                    <input placeholder="Customer Name *" value={newCredit.customer_name} onChange={e => setNewCredit({ ...newCredit, customer_name: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100'}`} />
                                    <input placeholder="Phone (optional)" value={newCredit.customer_phone} onChange={e => setNewCredit({ ...newCredit, customer_phone: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100'}`} />
                                    <input type="number" placeholder="Amount (₦) *" value={newCredit.amount} onChange={e => setNewCredit({ ...newCredit, amount: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100'}`} />
                                    <input placeholder="Items sold (e.g. 2 bags of rice)" value={newCredit.items_description} onChange={e => setNewCredit({ ...newCredit, items_description: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100'}`} />
                                    <input type="date" value={newCredit.due_date} onChange={e => setNewCredit({ ...newCredit, due_date: e.target.value })}
                                        className={`w-full px-4 py-3 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100'}`} />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setShowAddCredit(false)} className={`flex-1 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                                    <button onClick={handleAddCredit} className="flex-1 py-3 bg-orange-500 text-white rounded-xl font-semibold">Add Credit</button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Record Payment Modal */}
                    {payingCredit && (
                        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center px-4">
                            <div className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-[#1A1A1F]' : 'bg-white'}`}>
                                <h3 className={`text-lg font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Record Payment</h3>
                                <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{payingCredit.customer_name} owes ₦{(payingCredit.balance || 0).toLocaleString()}</p>
                                <input type="number" placeholder={`Amount (max ₦${(payingCredit.balance || 0).toLocaleString()})`}
                                    value={paymentAmount} onChange={e => setPaymentAmount(e.target.value)}
                                    className={`w-full px-4 py-3 rounded-xl outline-none mb-3 ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100'}`} />
                                <button onClick={() => setPaymentAmount(String(payingCredit.balance || 0))}
                                    className={`w-full py-2 rounded-xl text-xs font-medium mb-4 ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>
                                    Pay Full Balance (₦{(payingCredit.balance || 0).toLocaleString()})
                                </button>
                                <div className="flex gap-3">
                                    <button onClick={() => setPayingCredit(null)} className={`flex-1 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                                    <button onClick={handleRecordPayment} className="flex-1 py-3 bg-green-500 text-white rounded-xl font-semibold">Confirm</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

export default OrdersRedesign
