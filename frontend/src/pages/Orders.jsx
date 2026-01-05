import { useState, useEffect, useContext } from 'react'
import { apiCall, API_ENDPOINTS } from '../config/api'
import { ThemeContext } from '../context/ThemeContext'
import Invoices from './Invoices'
import DeliveryTracking from './DeliveryTracking'

const Orders = () => {
  const { theme } = useContext(ThemeContext)
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [activeTab, setActiveTab] = useState('orders')  // 'orders' or 'invoices'

  useEffect(() => {
    loadOrders()
  }, [filter])

  const loadOrders = async () => {
    try {
      setLoading(true)
      const data = await apiCall(API_ENDPOINTS.ORDERS)
      setOrders(data)
    } catch (error) {
      console.error('Failed to load orders:', error)
      // Demo data
      setOrders([
        { id: 'ord-001', customer_phone: '+234 803 123 4567', total_amount: 45000, status: 'pending', created_at: '2024-01-15', platform: 'WhatsApp' },
        { id: 'ord-002', customer_phone: '+234 803 234 5678', total_amount: 25000, status: 'paid', created_at: '2024-01-15', platform: 'Instagram' },
        { id: 'ord-003', customer_phone: '+234 803 345 6789', total_amount: 35000, status: 'fulfilled', created_at: '2024-01-14', platform: 'WhatsApp' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await apiCall(API_ENDPOINTS.UPDATE_ORDER_STATUS(orderId), {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      })
      loadOrders()
    } catch (error) {
      console.error('Failed to update order status:', error)
      // Update locally for demo
      setOrders(orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o))
    }
  }

  const getStatusBadge = (status) => {
    const styles = {
      pending: theme === 'dark' ? 'bg-warning/20 text-warning' : 'bg-amber-100 text-amber-800',
      paid: theme === 'dark' ? 'bg-kofa-cobalt/20 text-kofa-sky' : 'bg-blue-100 text-kofa-cobalt',
      fulfilled: theme === 'dark' ? 'bg-success/20 text-success' : 'bg-green-100 text-green-800',
      cancelled: theme === 'dark' ? 'bg-danger/20 text-danger' : 'bg-red-100 text-red-800'
    }
    return styles[status] || (theme === 'dark' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-800')
  }

  const filteredOrders = filter === 'all' ? orders : orders.filter(order => order.status === filter)
  const isDark = theme === 'dark'

  const getTabClass = (tab) => {
    return activeTab === tab
      ? 'bg-kofa-yellow text-black shadow-lg'
      : isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
  }

  // Tab Navigation Component (reused for all tabs)
  const TabNav = () => (
    <div className={`sticky top-16 z-40 px-4 py-3 ${isDark ? 'bg-dark-card border-b border-gray-800' : 'bg-white shadow-sm'}`}>
      <div className="max-w-7xl mx-auto flex gap-2 overflow-x-auto">
        <button onClick={() => setActiveTab('orders')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${getTabClass('orders')}`}>
          🛒 Orders
        </button>
        <button onClick={() => setActiveTab('invoices')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${getTabClass('invoices')}`}>
          🧾 Invoices
        </button>
        <button onClick={() => setActiveTab('delivery')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium whitespace-nowrap transition-all ${getTabClass('delivery')}`}>
          🚚 Delivery
        </button>
      </div>
    </div>
  )

  // If Invoices tab is active
  if (activeTab === 'invoices') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-slate-50'}`}>
        <TabNav />
        <Invoices />
      </div>
    )
  }

  // If Delivery tab is active
  if (activeTab === 'delivery') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-slate-50'}`}>
        <TabNav />
        <DeliveryTracking />
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-dark-bg' : 'bg-slate-50'}`}>
      <TabNav />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-kofa-navy'}`}>Orders</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-kofa-steel'}`}>
            Manage customer orders from all channels
          </p>
        </div>

        {/* Filters */}
        <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
          {['all', 'pending', 'paid', 'fulfilled'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filter === status
                ? 'bg-kofa-cobalt text-white'
                : theme === 'dark'
                  ? 'bg-dark-card text-gray-400 hover:text-white border border-dark-border'
                  : 'bg-white text-kofa-steel hover:text-kofa-navy shadow-sm'
                }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Orders List */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-kofa-sky border-t-kofa-cobalt"></div>
          </div>
        ) : filteredOrders.length > 0 ? (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <div key={order.id} className={`rounded-xl p-5 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'
                }`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <div className="flex items-center space-x-3 mb-2">
                      <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                        Order #{order.id?.slice(0, 8)}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>
                      {order.customer_phone} • {order.platform}
                    </p>
                    <p className={`text-sm ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center justify-between sm:flex-col sm:items-end gap-3">
                    <span className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                      ₦{order.total_amount?.toLocaleString()}
                    </span>
                    <div className="flex gap-2">
                      {order.status === 'pending' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'paid')}
                          className="px-4 py-2 bg-kofa-cobalt text-white rounded-lg text-sm font-medium hover:bg-kofa-navy"
                        >
                          Mark Paid
                        </button>
                      )}
                      {order.status === 'paid' && (
                        <button
                          onClick={() => updateOrderStatus(order.id, 'fulfilled')}
                          className="px-4 py-2 bg-success text-white rounded-lg text-sm font-medium hover:bg-green-600"
                        >
                          Fulfill
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`rounded-xl p-12 text-center ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'
            }`}>
            <span className="text-4xl">🛒</span>
            <h3 className={`text-lg font-semibold mt-4 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
              No orders found
            </h3>
            <p className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>
              {filter === 'all' ? "You haven't received any orders yet" : `No ${filter} orders`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Orders
