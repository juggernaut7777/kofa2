import { useState, useEffect } from 'react'
import { apiCall, API_ENDPOINTS } from '../config/api'

const Deliveries = () => {
  const [deliveries, setDeliveries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDeliveries()
  }, [])

  const loadDeliveries = async () => {
    try {
      setLoading(true)
      // For now, show orders that might have deliveries
      // In future, this could be a dedicated deliveries endpoint
      const orders = await apiCall(API_ENDPOINTS.ORDERS)
      // Mock delivery data based on orders - in real app this would come from delivery service
      const mockDeliveries = orders.map(order => ({
        id: order.id,
        tracking_id: `TRK${order.id.slice(-6)}`,
        order_id: order.id,
        customer_name: order.customer_phone,
        customer_phone: order.customer_phone,
        destination: 'Lagos, Nigeria', // Mock destination
        status: order.status === 'fulfilled' ? 'delivered' :
                order.status === 'paid' ? 'in-transit' : 'pending',
        provider: 'KOFA Logistics',
        created_at: order.created_at || new Date().toISOString()
      }))
      setDeliveries(mockDeliveries)
    } catch (error) {
      console.error('Failed to load deliveries:', error)
      setDeliveries([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-yellow-100 text-yellow-800',
      dispatched: 'bg-blue-100 text-blue-800',
      'in-transit': 'bg-purple-100 text-purple-800',
      delivered: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
    }
    return colors[status] || 'bg-gray-100 text-gray-800'
  }

  const getStatusIcon = (status) => {
    const icons = {
      pending: '⏳',
      dispatched: '📦',
      'in-transit': '🚚',
      delivered: '✅',
      cancelled: '❌',
    }
    return icons[status] || '📋'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Delivery & Fulfillment</h2>
        <p className="text-sm text-gray-600">
          Track deliveries - Automatically created when orders are fulfilled
        </p>
      </div>

      {/* Info Banner - Shows the "Merger" Concept */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <span className="text-2xl mr-3">🔄</span>
          <div>
            <h3 className="font-semibold text-blue-900 mb-1">Auto-Dispatch System</h3>
            <p className="text-sm text-blue-700">
              When an order status changes to "fulfilled", a delivery is automatically created and dispatched.
              No manual handoff needed - the system handles the entire flow from sale to delivery.
            </p>
          </div>
        </div>
      </div>

      {/* Deliveries List */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading deliveries...</div>
      ) : deliveries.length > 0 ? (
        <div className="space-y-4">
          {deliveries.map((delivery) => (
            <div key={delivery.id} className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">{getStatusIcon(delivery.status)}</span>
                  <div>
                    <div className="flex items-center space-x-2 mb-2">
                      <h3 className="font-semibold text-gray-900">
                        Delivery #{delivery.id?.slice(0, 8)}
                      </h3>
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(delivery.status)}`}>
                        {delivery.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">Order: {delivery.order_id?.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">Customer: {delivery.customer_phone}</p>
                    <p className="text-sm text-gray-600">
                      Address: {delivery.delivery_address || 'Not specified'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 sm:mt-0">
                  {delivery.tracking_id && (
                    <div className="text-right">
                      <p className="text-xs text-gray-500 mb-1">Tracking ID</p>
                      <p className="font-mono text-sm font-semibold text-gray-900">
                        {delivery.tracking_id}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Delivery Timeline */}
              <div className="pt-4 border-t">
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <span>Created:</span>
                  <span>{new Date(delivery.created_at).toLocaleString()}</span>
                  {delivery.estimated_delivery && (
                    <>
                      <span className="mx-2">•</span>
                      <span>Est. Delivery:</span>
                      <span>{new Date(delivery.estimated_delivery).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <div className="text-4xl mb-4">🚚</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No deliveries yet</h3>
          <p className="text-gray-600 mb-4">
            Deliveries are automatically created when you fulfill orders
          </p>
          <div className="text-sm text-gray-500">
            <p>To create a delivery:</p>
            <p className="mt-2">1. Go to Orders</p>
            <p>2. Mark an order as "Fulfilled"</p>
            <p>3. A delivery will be auto-created here</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default Deliveries

