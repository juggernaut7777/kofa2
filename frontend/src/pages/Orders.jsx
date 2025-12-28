import { useState, useEffect } from 'react'
import { apiCall, API_ENDPOINTS } from '../config/api'

const Orders = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, pending, paid, fulfilled

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
      setOrders([])
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
      loadOrders() // Reload to get updated data
    } catch (error) {
      console.error('Failed to update order status:', error)
      alert('Failed to update order status')
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      paid: 'bg-blue-100 text-blue-800',
      fulfilled: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const filteredOrders = filter === 'all' 
    ? orders 
    : orders.filter(order => order.status === filter)

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Orders</h2>
        <p className="text-sm text-gray-600">
          Manage orders - Fulfilled orders automatically create deliveries
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {['all', 'pending', 'paid', 'fulfilled'].map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${
              filter === status
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </button>
        ))}
      </div>

      {/* Orders List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading orders...</div>
      ) : filteredOrders.length > 0 ? (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div>
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="font-semibold text-gray-900">Order #{order.id?.slice(0, 8)}</h3>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600">Customer: {order.customer_phone}</p>
                  <p className="text-sm text-gray-600">
                    Created: {new Date(order.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="mt-2 sm:mt-0 text-right">
                  <p className="text-2xl font-bold text-gray-900">
                    ₦{order.total_amount?.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex flex-wrap gap-2 pt-4 border-t">
                {order.status === 'pending' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'paid')}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                  >
                    Mark as Paid
                  </button>
                )}
                {order.status === 'paid' && (
                  <button
                    onClick={() => updateOrderStatus(order.id, 'fulfilled')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                  >
                    Fulfill Order
                  </button>
                )}
                {order.status === 'fulfilled' && (
                  <div className="flex items-center text-sm text-green-600">
                    <span className="mr-2">✓</span>
                    <span>Delivery auto-created</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-4">🛒</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600">
            {filter === 'all' 
              ? 'You haven\'t received any orders yet'
              : `No ${filter} orders at the moment`}
          </p>
        </div>
      )}
    </div>
  )
}

export default Orders

