import { useState, useEffect, useContext } from 'react'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'

const OrdersRedesign = () => {
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const [activeTab, setActiveTab] = useState('orders')
    const [orders, setOrders] = useState([])
    const [invoices, setInvoices] = useState([])
    const [shipments, setShipments] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [searchQuery, setSearchQuery] = useState('')

    const filters = [
        { id: 'all', label: 'All' },
        { id: 'pending', label: 'Pending', count: 3 },
        { id: 'paid', label: 'Paid' },
        { id: 'fulfilled', label: 'Fulfilled' }
    ]

    const deliveryZones = [
        { name: 'Lagos Island', time: '1-2 Days', fee: 2500 },
        { name: 'Mainland', time: '1-3 Days', fee: 1500 },
        { name: 'Abuja', time: '2-4 Days', fee: 3500 },
        { name: 'Other States', time: '3-5 Days', fee: 5000 },
    ]

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            const ordersData = await apiCall(API_ENDPOINTS.ORDERS)
            setOrders(ordersData)
        } catch (error) {
            // Demo data
            setOrders([
                { id: '2045', product_name: '2x Nike Air Max, 1x Socks', total_amount: 25000, status: 'pending', platform: 'WhatsApp', customer_phone: '0801 234 5678', created_at: 'Today, 10:30 AM', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBHMScCeZeogjZ8evaahhL0YQWUiCGl2FugAx2K01huRISuIAeikauvlCTMSLTzXA_wCQ9Lms0gpz_LdK_MrWCnlU0fI6zice3gFMk81-u9mL80CrrNXYA8Pyld89vYdcvkwaiW5x5ZNiAAmLj_l2jp9CILIwKQjQzL6V3lj834R9nRliV5-iCI8WXr3-ECpC0LxYMdFQNM8JwuCYAlgm5tcGajG-ipXZEcXn39AbpnaVjbTAdGqmiLMkX8rg1c-fSIhV0jyK3JFQWo' },
                { id: '2042', product_name: '1x Casio Vintage Watch', total_amount: 12500, status: 'paid', platform: 'Instagram', customer_phone: '0909 876 5432', created_at: 'Yesterday, 4:15 PM', image_url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCZkNCgfwAdRuF5ToEUhlLSF0bXainGOVr7F1cOe5JaIZjtt54ofy1KC6FnRmyib_jKiGoCIw5LcszUyPgBbOpU88wdkwTiQ73fAwwH7glW63WVbSrAKzsJVExc2REDoRotKZgOHMMtQfoJ84nvDBRHWWk-azkaijoAn2i1_YemMU-HZ11BCr99HZqm69NnR3YZCWYxzRJxEtSccqalmBeOzSClQzmQ6HK-UkCh0KqgMI8IKLPT2tOA-gJeNwDDWa4Fpovnl5Udyxez' },
                { id: '2040', product_name: '3x T-Shirts', total_amount: 15000, status: 'fulfilled', platform: 'WhatsApp', customer_phone: '0803 555 1234', created_at: '2 days ago', image_url: null },
            ])
            setInvoices([
                { id: 'INV-2024-001', customer: 'Chinedu Okafor', amount: 45000, status: 'paid', date: 'Oct 24, 2023' },
                { id: 'INV-2024-002', customer: 'Amaka Johnson', amount: 28000, status: 'unpaid', date: 'Oct 25, 2023' },
            ])
            setShipments([
                { id: 'TRK-8892', order_id: '2042', destination: 'Victoria Island, Lagos', carrier: 'GIG Logistics', status: 'in_transit', progress: 75 }
            ])
        } finally {
            setLoading(false)
        }
    }

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-NG', { minimumFractionDigits: 0 }).format(amount)
    }

    const updateOrderStatus = async (orderId, newStatus) => {
        try {
            await apiCall(API_ENDPOINTS.UPDATE_ORDER_STATUS(orderId), {
                method: 'PUT',
                body: JSON.stringify({ status: newStatus })
            })
            loadData()
        } catch (error) {
            setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
        }
    }

    const filteredOrders = orders.filter(o => {
        const matchesFilter = filter === 'all' || o.status === filter
        const matchesSearch = o.id.includes(searchQuery) || o.customer_phone?.includes(searchQuery)
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

    return (
        <div className={`min-h-screen font-['Manrope'] ${isDark ? 'bg-[#102217] text-white' : 'bg-[#f6f8f7] text-[#111814]'}`}>
            <div className="max-w-md mx-auto pb-24">

                {/* Header */}
                <header className={`sticky top-0 z-50 backdrop-blur-sm border-b px-4 py-3 ${isDark ? 'bg-[#102217]/95 border-[#2a4034]' : 'bg-[#f6f8f7]/95 border-[#dbe6df]'
                    }`}>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button className="p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                                <span className="text-xl">☰</span>
                            </button>
                            <h1 className="text-xl font-bold tracking-tight">Orders</h1>
                        </div>
                        <div className="flex items-center gap-2">
                            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 relative">
                                <span className="text-xl">🔔</span>
                                <span className={`absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border ${isDark ? 'border-[#102217]' : 'border-white'}`}></span>
                            </button>
                            <div className="w-8 h-8 rounded-full bg-[#2bee79]/20 flex items-center justify-center border border-[#2bee79]/30 text-sm font-bold">
                                K
                            </div>
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
                                    className={`flex h-9 shrink-0 items-center px-4 rounded-full text-sm font-medium whitespace-nowrap ${filter === f.id
                                            ? 'bg-[#2bee79] text-[#052e16] font-bold shadow-sm'
                                            : isDark
                                                ? 'bg-[#1a2c22] border border-[#2a4034] text-[#618971]'
                                                : 'bg-white border border-[#dbe6df] text-[#618971]'
                                        }`}
                                >
                                    {f.label}
                                    {f.count && (
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
                                className={`block w-full pl-10 pr-3 py-2.5 border-none rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-[#2bee79] ${isDark ? 'bg-[#1a2c22] text-white placeholder-[#618971]' : 'bg-white text-[#111814] placeholder-[#618971]'
                                    }`}
                            />
                        </div>

                        {/* Order List */}
                        <div className="flex flex-col gap-4">
                            {filteredOrders.map(order => (
                                <article key={order.id} className={`rounded-2xl p-4 shadow-sm border flex flex-col gap-3 ${isDark ? 'bg-[#1a2c22] border-[#2a4034]' : 'bg-white border-[#dbe6df]'
                                    }`}>
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-2 items-center">
                                            <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider ${getStatusBadge(order.status)}`}>
                                                {order.status}
                                            </span>
                                            <span className={`text-xs ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>{order.created_at}</span>
                                        </div>
                                        <button className="text-[#618971] hover:text-inherit">⋯</button>
                                    </div>

                                    <div className="flex gap-3">
                                        <div className={`w-16 h-16 rounded-lg shrink-0 overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                            {order.image_url ? (
                                                <img src={order.image_url} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                                            )}
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
                                                className="flex-1 flex items-center justify-center gap-2 bg-[#2bee79] text-[#052e16] h-10 rounded-lg text-sm font-bold hover:opacity-90"
                                            >
                                                ✓ Mark Paid
                                            </button>
                                        )}
                                        {order.status === 'paid' && (
                                            <button
                                                onClick={() => updateOrderStatus(order.id, 'fulfilled')}
                                                className={`flex-1 flex items-center justify-center gap-2 h-10 rounded-lg text-sm font-bold border ${isDark ? 'bg-[#102217] border-[#2a4034]' : 'bg-[#f6f8f7] border-[#dbe6df]'
                                                    }`}
                                            >
                                                🚚 Ship Order
                                            </button>
                                        )}
                                        <button className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isDark ? 'bg-[#102217] border-[#2a4034]' : 'bg-[#f6f8f7] border-[#dbe6df]'
                                            }`}>
                                            👁
                                        </button>
                                        <button className={`w-10 h-10 rounded-lg flex items-center justify-center border ${isDark ? 'bg-[#102217] border-[#2a4034]' : 'bg-[#f6f8f7] border-[#dbe6df]'
                                            }`}>
                                            📤
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    </main>
                )}

                {/* INVOICES TAB */}
                {activeTab === 'invoices' && (
                    <section className="flex flex-col gap-5 p-4">
                        {/* Stats */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className={`p-3 rounded-xl border shadow-sm ${isDark ? 'bg-[#1a2c22] border-[#2a4034]' : 'bg-white border-[#dbe6df]'}`}>
                                <p className={`text-xs font-medium ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>Total Revenue</p>
                                <p className="text-xl font-bold mt-1">₦450k</p>
                                <div className="flex items-center mt-1 text-xs text-green-600 font-bold">
                                    📈 +12%
                                </div>
                            </div>
                            <div className={`p-3 rounded-xl border shadow-sm ${isDark ? 'bg-[#1a2c22] border-[#2a4034]' : 'bg-white border-[#dbe6df]'}`}>
                                <p className={`text-xs font-medium ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>Unpaid Inv.</p>
                                <p className="text-xl font-bold mt-1">5</p>
                                <div className="flex items-center mt-1 text-xs text-orange-600 font-bold">
                                    ₦85,000 pending
                                </div>
                            </div>
                        </div>

                        {/* Generate Button */}
                        <button className="w-full bg-[#2bee79] text-[#052e16] h-12 rounded-xl text-base font-bold shadow-sm flex items-center justify-center gap-2 hover:opacity-90">
                            ➕ Generate New Invoice
                        </button>

                        {/* Invoice List */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold px-1">Recent Invoices</h3>
                            {invoices.map(inv => (
                                <div key={inv.id} className={`rounded-xl p-4 shadow-sm border flex flex-col gap-3 ${isDark ? 'bg-[#1a2c22] border-[#2a4034]' : 'bg-white border-[#dbe6df]'
                                    }`}>
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
                                            <button className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>⬇</button>
                                            <button className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>🖨</button>
                                            <button className={`w-8 h-8 flex items-center justify-center rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>📋</button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* DELIVERY TAB */}
                {activeTab === 'delivery' && (
                    <section className="flex flex-col gap-5 p-4">
                        {/* Active Shipments */}
                        <div className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold px-1">Active Shipments</h3>
                            {shipments.map(ship => (
                                <div key={ship.id} className={`rounded-2xl overflow-hidden shadow-sm border ${isDark ? 'bg-[#1a2c22] border-[#2a4034]' : 'bg-white border-[#dbe6df]'
                                    }`}>
                                    {/* Map Placeholder */}
                                    <div className={`h-32 w-full relative overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                                        <div className="w-full h-full flex items-center justify-center text-4xl opacity-50">🗺️</div>
                                        <div className={`absolute bottom-2 right-2 px-2 py-1 rounded text-[10px] font-bold shadow-sm ${isDark ? 'bg-[#1a2c22]' : 'bg-white'
                                            }`}>
                                            In Transit
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
                                        {/* Progress Bar */}
                                        <div className={`w-full rounded-full h-1.5 mt-1 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                            <div className="bg-[#2bee79] h-1.5 rounded-full" style={{ width: `${ship.progress}%` }}></div>
                                        </div>
                                        <div className={`flex justify-between text-[10px] font-medium ${isDark ? 'text-[#618971]' : 'text-[#618971]'}`}>
                                            <span>Picked Up</span>
                                            <span className="text-[#2bee79] font-bold">Out for Delivery</span>
                                            <span>Delivered</span>
                                        </div>
                                        <button className={`w-full mt-1 border rounded-lg py-2 text-sm font-bold transition-colors ${isDark ? 'border-[#2a4034] hover:bg-gray-800' : 'border-[#dbe6df] hover:bg-gray-50'
                                            }`}>
                                            Update Status
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Delivery Zones */}
                        <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-center px-1">
                                <h3 className="text-sm font-bold">Delivery Zones</h3>
                                <button className="text-[#2bee79] text-xs font-bold">Add New</button>
                            </div>
                            <div className={`rounded-xl border divide-y ${isDark ? 'bg-[#1a2c22] border-[#2a4034] divide-[#2a4034]' : 'bg-white border-[#dbe6df] divide-[#dbe6df]'
                                }`}>
                                {deliveryZones.map((zone, idx) => (
                                    <div key={idx} className="flex items-center justify-between p-3">
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
                                            <button className={`${isDark ? 'text-[#618971]' : 'text-[#618971]'} hover:text-[#2bee79]`}>✏️</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>
                )}
            </div>

            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    )
}

export default OrdersRedesign
