import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS, API_BASE_URL } from '../../config/api'
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
    const [actionLoading, setActionLoading] = useState(null)
    const [filter, setFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')
    const [showInvoiceModal, setShowInvoiceModal] = useState(false)
    const [selectedOrder, setSelectedOrder] = useState(null)
    const [invoiceStats, setInvoiceStats] = useState({ revenue: 0, unpaid: 0, unpaidAmount: 0 })
    const [showZoneModal, setShowZoneModal] = useState(false)
    const [editingZone, setEditingZone] = useState(null)
    const [deliveryZones, setDeliveryZones] = useState([
        { id: 1, name: 'Lagos Island', time: '1-2 Days', fee: 2500 },
        { id: 2, name: 'Mainland', time: '1-3 Days', fee: 1500 },
        { id: 3, name: 'Abuja', time: '2-4 Days', fee: 3500 },
        { id: 4, name: 'Other States', time: '3-5 Days', fee: 5000 },
    ])

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        setLoading(true)
        try {
            const ordersData = await apiCall(API_ENDPOINTS.ORDERS)
            setOrders(Array.isArray(ordersData) ? ordersData : [])

            // Calculate invoice stats from orders
            const paid = ordersData.filter(o => o.status === 'paid' || o.status === 'fulfilled')
            const unpaid = ordersData.filter(o => o.status === 'pending')
            setInvoiceStats({
                revenue: paid.reduce((sum, o) => sum + (o.total_amount || 0), 0),
                unpaid: unpaid.length,
                unpaidAmount: unpaid.reduce((sum, o) => sum + (o.total_amount || 0), 0)
            })

            // Map orders to invoices
            setInvoices(ordersData.map(o => ({
                id: `INV-${o.id}`,
                order_id: o.id,
                customer: o.customer_name || 'Customer',
                amount: o.total_amount,
                status: o.status === 'pending' ? 'unpaid' : 'paid',
                date: o.created_at
            })))

            // Map fulfilled orders to shipments
            const fulfilledOrders = ordersData.filter(o => o.status === 'fulfilled')
            setShipments(fulfilledOrders.map(o => ({
                id: `TRK-${o.id}`,
                order_id: o.id,
                destination: o.delivery_address || 'Lagos',
                carrier: 'GIG Logistics',
                status: 'in_transit',
                progress: 75
            })))
        } catch (error) {
            console.log('Using demo data')
            setOrders([
                { id: '2045', product_name: '2x Nike Air Max, 1x Socks', total_amount: 25000, status: 'pending', platform: 'WhatsApp', customer_phone: '0801 234 5678', customer_name: 'John Doe', created_at: 'Today, 10:30 AM', image_url: null },
                { id: '2042', product_name: '1x Casio Vintage Watch', total_amount: 12500, status: 'paid', platform: 'Instagram', customer_phone: '0909 876 5432', customer_name: 'Jane Smith', created_at: 'Yesterday, 4:15 PM', image_url: null },
                { id: '2040', product_name: '3x T-Shirts', total_amount: 15000, status: 'fulfilled', platform: 'WhatsApp', customer_phone: '0803 555 1234', customer_name: 'Chidi Okoro', created_at: '2 days ago', image_url: null },
            ])
            setInvoiceStats({ revenue: 450000, unpaid: 5, unpaidAmount: 85000 })
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        if (!amount) return '₦0'
        if (amount >= 1000000) return `₦${(amount / 1000000).toFixed(1)}m`
        if (amount >= 1000) return `₦${(amount / 1000).toFixed(0)}k`
        return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 0 }).format(amount)
    }

    const updateOrderStatus = async (orderId, newStatus) => {
        setActionLoading(orderId)
        try {
            await apiCall(API_ENDPOINTS.UPDATE_ORDER_STATUS(orderId), {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            })
            await loadData()
            alert(`Order #${orderId} marked as ${newStatus}`)
        } catch (error) {
            // Update locally if API fails
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
            alert(`Order #${orderId} updated (offline mode)`)
        } finally {
            setActionLoading(null)
        }
    }

    const generateInvoice = async (order) => {
        setActionLoading('invoice')
        try {
            const result = await apiCall(API_ENDPOINTS.GENERATE_INVOICE, {
                method: 'POST',
                body: JSON.stringify({
                    order_id: order.id,
                    customer_name: order.customer_name || 'Customer',
                    customer_phone: order.customer_phone,
                    items: order.product_name,
                    total_amount: order.total_amount
                })
            })
            if (result.invoice_url) {
                window.open(result.invoice_url, '_blank')
            }
            alert(`Invoice generated for Order #${order.id}`)
            setShowInvoiceModal(false)
            await loadData()
        } catch (error) {
            // Generate local invoice
            const invoiceText = `
INVOICE #INV-${order.id}
------------------------
Customer: ${order.customer_name || 'Customer'}
Phone: ${order.customer_phone}
Items: ${order.product_name}
Total: ₦${formatCurrency(order.total_amount)}
Date: ${new Date().toLocaleDateString()}
      `.trim()

            // Create and download
            const blob = new Blob([invoiceText], { type: 'text/plain' })
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `invoice-${order.id}.txt`
            a.click()
            URL.revokeObjectURL(url)

            alert(`Invoice downloaded for Order #${order.id}`)
            setShowInvoiceModal(false)
        } finally {
            setActionLoading(null)
        }
    }

    const downloadInvoice = (invoice) => {
        const invoiceText = `
INVOICE ${invoice.id}
------------------------
Customer: ${invoice.customer}
Amount: ₦${formatCurrency(invoice.amount)}
Status: ${invoice.status.toUpperCase()}
Date: ${invoice.date}
    `.trim()

        const blob = new Blob([invoiceText], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${invoice.id}.txt`
        a.click()
        URL.revokeObjectURL(url)
    }

    const printInvoice = (invoice) => {
        const printWindow = window.open('', '_blank')
        printWindow.document.write(`
      <html>
        <head><title>Invoice ${invoice.id}</title></head>
        <body style="font-family: Arial, sans-serif; padding: 40px;">
          <h1>Invoice ${invoice.id}</h1>
          <hr/>
          <p><strong>Customer:</strong> ${invoice.customer}</p>
          <p><strong>Amount:</strong> ₦${formatCurrency(invoice.amount)}</p>
          <p><strong>Status:</strong> ${invoice.status.toUpperCase()}</p>
          <p><strong>Date:</strong> ${invoice.date}</p>
          <hr/>
          <p style="text-align: center; color: #888;">Thank you for your business!</p>
        </body>
      </html>
    `)
        printWindow.document.close()
        printWindow.print()
    }

    const copyInvoiceLink = (invoice) => {
        const link = `${window.location.origin}/invoice/${invoice.id}`
        navigator.clipboard.writeText(link)
        alert(`Invoice link copied: ${link}`)
    }

    const viewOrder = (order) => {
        alert(`Order #${order.id}\n\nItems: ${order.product_name}\nAmount: ₦${formatCurrency(order.total_amount)}\nCustomer: ${order.customer_phone}\nStatus: ${order.status}`)
    }

    const shareOrder = (order) => {
        const text = `Order #${order.id} - ${order.product_name} - ₦${formatCurrency(order.total_amount)}`
        if (navigator.share) {
            navigator.share({ title: `Order #${order.id}`, text })
        } else {
            navigator.clipboard.writeText(text)
            alert('Order details copied to clipboard!')
        }
    }

    const updateShipmentStatus = async (shipment) => {
        const statuses = ['picked_up', 'in_transit', 'out_for_delivery', 'delivered']
        const currentIdx = statuses.indexOf(shipment.status) || 1
        const nextStatus = statuses[Math.min(currentIdx + 1, statuses.length - 1)]

        setShipments(shipments.map(s =>
            s.id === shipment.id
                ? { ...s, status: nextStatus, progress: Math.min(s.progress + 25, 100) }
                : s
        ))
        alert(`Shipment ${shipment.id} updated to: ${nextStatus.replace('_', ' ')}`)
    }

    const saveDeliveryZone = (zone) => {
        if (zone.id) {
            setDeliveryZones(deliveryZones.map(z => z.id === zone.id ? zone : z))
        } else {
            setDeliveryZones([...deliveryZones, { ...zone, id: Date.now() }])
        }
        setShowZoneModal(false)
        setEditingZone(null)
        alert('Delivery zone saved!')
    }

    const pendingCount = orders.filter(o => o.status === 'pending').length

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending', count: pendingCount },
        { id: 'paid', label: 'Paid' },
        { id: 'fulfilled', label: 'Fulfilled' }
    ]

    const filteredOrders = orders.filter(o => {
        const matchesFilter = filter === 'all' || o.status === filter
        const matchesSearch = !searchQuery ||
            o.id?.toString().includes(searchQuery) ||
            o.customer_phone?.includes(searchQuery) ||
            o.customer_name?.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesFilter && matchesSearch
    })

    const getStatusBadge = (status) => {
        const styles = {
            pending: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400',
            paid: 'bg-[#2bee79]/20 text-green-700 dark:text-green-400',
            fulfilled: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300',
        }
        return styles[status] || styles.pending
    }

    const getPlatformIcon = (platform) => {
        if (platform === 'WhatsApp') return '💬'
        if (platform === 'Instagram') return '📸'
        if (platform === 'TikTok') return '🎵'
        return '🌐'
    }

    if (loading) {
        return (
            <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-[#102217]' : 'bg-[#f6f8f7]'}`}>
                <div className="w-10 h-10 border-4 border-[#2bee79] border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    return (
        <div className={`min-h-screen font-['Manrope'] ${isDark ? 'bg-[#102217] text-white' : 'bg-[#f6f8f7] text-[#111814]'}`}>
            <div className="max-w-md mx-auto pb-24">

                {/* Header */}
                <header className={`sticky top-0 z-50 backdrop-blur-sm border-b px-4 py-3 ${isDark ? 'bg-[#102217]/95 border-[#2a4034]' : 'bg-[#f6f8f7]/95 border-[#dbe6df]'}`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => navigate('/dashboard')} className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                                <span className="text-xl">←</span>
                            </button>
                            <h1 className="text-xl font-bold tracking-tight">Orders</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={loadData} className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                                <span className="text-xl">🔄</span>
                            </button>
                        </div>
                    </div>
                </header>

                {/* Tabs Navigation */}
                <nav className={`px-4 pt-2 sticky top-[60px] z-40 ${isDark ? 'bg-[#102217]' : 'bg-[#f6f8f7]'}`}>
                    <div className={`flex border-b w-full ${isDark ? 'border-[#2a4034]' : 'border-[#dbe6df]'}`}>
                        {['orders', 'invoices', 'delivery'].map(tab => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 pb-3 text-center text-sm capitalize transition-colors ${activeTab === tab
                                    ? 'border-b-[3px] border-[#2bee79] font-bold'
                                    : `border-b-[3px] border-transparent ${isDark ? 'text-[#618971]' : 'text-[#618971]'} font-medium`
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>
                </nav>

                {/* ORDERS TAB */}
                {activeTab === 'orders' && (
                    <main className="flex flex-col gap-5 p-4">
                        {/* Filters */}
                        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                            {filters.map(f => (
                                <button
                                    key={f.id}
                                    onClick={() => setFilter(f.id)}
                                    className={`flex h-9 shrink-0 items-center px-4 rounded-full text-sm font-medium whitespace-nowrap transition-all ${filter === f.id
                                        ? 'bg-[#2bee79] text-[#052e16] font-bold shadow-sm'
                                        : isDark
                                            ? 'bg-[#1a2c22] border border-[#2a4034] text-[#618971]'
                                            : 'bg-white border border-[#dbe6df] text-[#618971]'
                                        }`}
                                >
                                    {f.label}
                                    {f.count > 0 && (
                                        <span className="ml-1.5 flex items-center justify-center bg-orange-100 text-orange-700 text-[10px] w-5 h-5 rounded-full">
                                            {f.count}
                                        </span>
                                    )}
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <span className="text-[#618971]">🔍</span>
                            </div>
                            <input
                                type="text"
                                placeholder="Search order ID, phone or name..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className={`block w-full pl-10 pr-3 py-2.5 border-none rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-[#2bee79] ${isDark ? 'bg-[#1a2c22] text-white placeholder-[#618971]' : 'bg-white text-[#111814] placeholder-[#618971]'}`}
                            />
                        </div>

                        {/* Order List */}
                        {filteredOrders.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="text-4xl">📦</span>
                                <p className="mt-2 font-bold">No orders found</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {filteredOrders.map(order => (
                                    <article key={order.id} className={`rounded-2xl p-4 shadow-sm border flex flex-col gap-3 ${isDark ? 'bg-[#1a2c22] border-[#2a4034]' : 'bg-white border-[#dbe6df]'}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex gap-2 items-center">
                                                <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                                                    {order.status}
                                                </span>
                                                <span className={`text-xs ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>{order.created_at}</span>
                                            </div>
                                            <button
                                                onClick={() => { setSelectedOrder(order); setShowInvoiceModal(true) }}
                                                className="text-[#618971] hover:text-[#2bee79] px-2"
                                            >
                                                📄
                                            </button>
                                        </div>

                                        <div className="flex gap-3">
                                            <div className={`w-16 h-16 rounded-lg shrink-0 overflow-hidden flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                <span className="text-2xl">📦</span>
                                            </div>
                                            <div className="flex flex-col flex-1">
                                                <div className="flex justify-between items-baseline">
                                                    <h3 className="font-bold text-lg">Order #{order.id}</h3>
                                                    <span className="font-bold text-lg">₦{formatCurrency(order.total_amount)}</span>
                                                </div>
                                                <p className={`text-sm line-clamp-1 ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>{order.product_name}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span>{getPlatformIcon(order.platform)}</span>
                                                    <span className={`text-xs ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>
                                                        {order.platform} • {order.customer_phone}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className={`border-t my-1 ${isDark ? 'border-[#2a4034]' : 'border-[#dbe6df]'}`}></div>

                                        <div className="flex gap-2">
                                            {order.status === 'pending' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'paid')}
                                                    disabled={actionLoading === order.id}
                                                    className="flex-1 flex items-center justify-center gap-2 bg-[#2bee79] text-[#052e16] h-10 rounded-lg text-sm font-bold hover:opacity-90 disabled:opacity-50"
                                                >
                                                    {actionLoading === order.id ? '...' : '✓ Mark Paid'}
                                                </button>
                                            )}
                                            {order.status === 'paid' && (
                                                <button
                                                    onClick={() => updateOrderStatus(order.id, 'fulfilled')}
                                                    disabled={actionLoading === order.id}
                                                    className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold border ${isDark ? 'bg-[#102217] border-[#2a4034]' : 'bg-[#f6f8f7] border-[#dbe6df]'}`}
                                                >
                                                    {actionLoading === order.id ? '...' : '🚚 Ship Order'}
                                                </button>
                                            )}
                                            {order.status === 'fulfilled' && (
                                                <span className="flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold text-green-600">
                                                    ✓ Completed
                                                </span>
                                            )}
                                            <button
                                                onClick={() => viewOrder(order)}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isDark ? 'bg-[#102217] border-[#2a4034]' : 'bg-[#f6f8f7] border-[#dbe6df]'}`}
                                            >
                                                👁
                                            </button>
                                            <button
                                                onClick={() => shareOrder(order)}
                                                className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isDark ? 'bg-[#102217] border-[#2a4034]' : 'bg-[#f6f8f7] border-[#dbe6df]'}`}
                                            >
                                                📤
                                            </button>
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </main>
                )}

                {/* INVOICES TAB */}
                {activeTab === 'invoices' && (
                    <section className="flex flex-col gap-5 p-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-xl border shadow-sm ${isDark ? 'bg-[#1a2c22] border-[#2a4034]' : 'bg-white border-[#dbe6df]'}`}>
                                <p className={`text-xs font-medium ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>Total Revenue</p>
                                <p className="text-xl font-bold mt-1">{formatCurrency(invoiceStats.revenue)}</p>
                                <div className="flex items-center mt-1 text-xs text-green-600 font-bold">
                                    📈 +12%
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl border shadow-sm ${isDark ? 'bg-[#1a2c22] border-[#2a4034]' : 'bg-white border-[#dbe6df]'}`}>
                                <p className={`text-xs font-medium ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>Unpaid Inv.</p>
                                <p className="text-xl font-bold mt-1">{invoiceStats.unpaid}</p>
                                <div className="flex items-center mt-1 text-xs text-orange-600 font-bold">
                                    {formatCurrency(invoiceStats.unpaidAmount)} pending
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button
                            onClick={() => {
                                const pendingOrders = orders.filter(o => o.status === 'pending')
                                if (pendingOrders.length > 0) {
                                    setSelectedOrder(pendingOrders[0])
                                    setShowInvoiceModal(true)
                                } else {
                                    alert('No pending orders to generate invoice for')
                                }
                            }}
                            className="w-full bg-[#2bee79] text-[#052e16] h-12 rounded-xl text-base font-bold shadow-sm flex items-center justify-center gap-2 hover:opacity-90 active:scale-[0.98] transition-all"
                        >
                            ➕ Generate New Invoice
                        </button>

                        {/* Invoice List */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold px-1">Recent Invoices</h3>
                            {invoices.length === 0 ? (
                                <p className={`text-center py-8 ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>No invoices yet</p>
                            ) : (
                                invoices.map(inv => (
                                    <div key={inv.id} className={`rounded-xl p-4 shadow-sm border flex flex-col gap-3 ${isDark ? 'bg-[#1a2c22] border-[#2a4034]' : 'bg-white border-[#dbe6df]'}`}>
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-sm font-bold">{inv.id}</p>
                                                <p className={`text-xs ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>{inv.customer} • {inv.date}</p>
                                            </div>
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase ${inv.status === 'paid'
                                                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
                                                }`}>
                                                {inv.status}
                                            </span>
                                        </div>
                                        <div className={`flex items-center justify-between border-t pt-3 mt-1 ${isDark ? 'border-[#2a4034]' : 'border-[#dbe6df]'}`}>
                                            <span className="font-bold text-lg">₦{formatCurrency(inv.amount)}</span>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => downloadInvoice(inv)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg hover:scale-110 transition-transform ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                                                >
                                                    ⬇
                                                </button>
                                                <button
                                                    onClick={() => printInvoice(inv)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg hover:scale-110 transition-transform ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                                                >
                                                    🖨
                                                </button>
                                                <button
                                                    onClick={() => copyInvoiceLink(inv)}
                                                    className={`w-8 h-8 flex items-center justify-center rounded-lg hover:scale-110 transition-transform ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}
                                                >
                                                    📋
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </section>
                )}

                {/* DELIVERY TAB */}
                {activeTab === 'delivery' && (
                    <section className="flex flex-col gap-5 p-4">
                        {/* Active Shipments */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold px-1">Active Shipments</h3>
                            {shipments.length === 0 ? (
                                <p className={`text-center py-8 ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>No active shipments</p>
                            ) : (
                                shipments.map(ship => (
                                    <div key={ship.id} className={`rounded-2xl overflow-hidden shadow-sm border ${isDark ? 'bg-[#1a2c22] border-[#2a4034]' : 'bg-white border-[#dbe6df]'}`}>
                                        <div className={`h-32 w-full relative overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                            <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">🗺️</div>
                                            <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] font-bold shadow-sm ${isDark ? 'bg-[#1a2c22]' : 'bg-white'}`}>
                                                {ship.status.replace('_', ' ').toUpperCase()}
                                            </div>
                                        </div>
                                        <div className="p-4 flex flex-col gap-3">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <p className="text-sm font-bold">To: {ship.destination}</p>
                                                    <p className={`text-xs ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>
                                                        Order #{ship.order_id} • {ship.carrier}
                                                    </p>
                                                </div>
                                                <span className={`text-xs font-mono px-2 py-1 rounded ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                    {ship.id}
                                                </span>
                                            </div>
                                            <div className={`w-full rounded-full h-1.5 mt-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                                <div className="bg-[#2bee79] h-1.5 rounded-full transition-all" style={{ width: `${ship.progress}%` }}></div>
                                            </div>
                                            <div className={`flex justify-between text-[10px] font-medium ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>
                                                <span className={ship.progress >= 25 ? 'text-[#2bee79]' : ''}>Picked Up</span>
                                                <span className={ship.progress >= 50 ? 'text-[#2bee79]' : ''}>In Transit</span>
                                                <span className={ship.progress >= 75 ? 'text-[#2bee79] font-bold' : ''}>Out for Delivery</span>
                                                <span className={ship.progress >= 100 ? 'text-[#2bee79]' : ''}>Delivered</span>
                                            </div>
                                            <button
                                                onClick={() => updateShipmentStatus(ship)}
                                                className={`w-full mt-1 border rounded-lg py-2 text-sm font-bold transition-colors hover:bg-[#2bee79] hover:text-[#052e16] hover:border-[#2bee79] ${isDark ? 'border-[#2a4034]' : 'border-[#dbe6df]'}`}
                                            >
                                                Update Status →
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Delivery Zones */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-sm font-bold">Delivery Zones</h3>
                                <button
                                    onClick={() => { setEditingZone({ name: '', time: '', fee: 0 }); setShowZoneModal(true) }}
                                    className="text-[#2bee79] text-xs font-bold"
                                >
                                    + Add New
                                </button>
                            </div>
                            <div className={`rounded-xl border divide-y ${isDark ? 'bg-[#1a2c22] border-[#2a4034] divide-[#2a4034]' : 'bg-white border-[#dbe6df] divide-[#dbe6df]'}`}>
                                {deliveryZones.map((zone) => (
                                    <div key={zone.id} className="flex items-center justify-between p-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-blue-900/20 text-blue-400' : 'bg-blue-50 text-blue-600'}`}>
                                                📍
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold">{zone.name}</p>
                                                <p className={`text-xs ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>{zone.time}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="font-bold text-sm">₦{formatCurrency(zone.fee)}</span>
                                            <button
                                                onClick={() => { setEditingZone(zone); setShowZoneModal(true) }}
                                                className={`${isDark ? 'text-[#618971]' : 'text-[#618971]'} hover:text-[#2bee79]`}
                                            >
                                                ✏️
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* Invoice Generation Modal */}
            {showInvoiceModal && selectedOrder && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-[#1a2c22]' : 'bg-white'}`}>
                        <h3 className="text-lg font-bold mb-4">Generate Invoice</h3>
                        <div className="space-y-3">
                            <p><strong>Order:</strong> #{selectedOrder.id}</p>
                            <p><strong>Customer:</strong> {selectedOrder.customer_name || selectedOrder.customer_phone}</p>
                            <p><strong>Items:</strong> {selectedOrder.product_name}</p>
                            <p><strong>Amount:</strong> ₦{formatCurrency(selectedOrder.total_amount)}</p>
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => setShowInvoiceModal(false)}
                                className={`flex-1 py-2 rounded-lg font-bold border ${isDark ? 'border-[#2a4034]' : 'border-gray-200'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => generateInvoice(selectedOrder)}
                                disabled={actionLoading === 'invoice'}
                                className="flex-1 py-2 rounded-lg font-bold bg-[#2bee79] text-[#052e16] disabled:opacity-50"
                            >
                                {actionLoading === 'invoice' ? 'Generating...' : 'Generate & Download'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Delivery Zone Modal */}
            {showZoneModal && editingZone && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
                    <div className={`w-full max-w-sm rounded-2xl p-6 ${isDark ? 'bg-[#1a2c22]' : 'bg-white'}`}>
                        <h3 className="text-lg font-bold mb-4">{editingZone.id ? 'Edit' : 'Add'} Delivery Zone</h3>
                        <div className="space-y-4">
                            <input
                                type="text"
                                placeholder="Zone Name"
                                value={editingZone.name}
                                onChange={(e) => setEditingZone({ ...editingZone, name: e.target.value })}
                                className={`w-full p-3 rounded-lg ${isDark ? 'bg-[#102217]' : 'bg-gray-50'}`}
                            />
                            <input
                                type="text"
                                placeholder="Delivery Time (e.g. 1-2 Days)"
                                value={editingZone.time}
                                onChange={(e) => setEditingZone({ ...editingZone, time: e.target.value })}
                                className={`w-full p-3 rounded-lg ${isDark ? 'bg-[#102217]' : 'bg-gray-50'}`}
                            />
                            <input
                                type="number"
                                placeholder="Fee"
                                value={editingZone.fee}
                                onChange={(e) => setEditingZone({ ...editingZone, fee: parseInt(e.target.value) || 0 })}
                                className={`w-full p-3 rounded-lg ${isDark ? 'bg-[#102217]' : 'bg-gray-50'}`}
                            />
                        </div>
                        <div className="flex gap-3 mt-6">
                            <button
                                onClick={() => { setShowZoneModal(false); setEditingZone(null) }}
                                className={`flex-1 py-2 rounded-lg font-bold border ${isDark ? 'border-[#2a4034]' : 'border-gray-200'}`}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => saveDeliveryZone(editingZone)}
                                className="flex-1 py-2 rounded-lg font-bold bg-[#2bee79] text-[#052e16]"
                            >
                                Save
                            </button>
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
