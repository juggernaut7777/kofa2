import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../config/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    pendingOrders: 0,
    activeDeliveries: 0,
    todaySales: 0,
  })
  const [loading, setLoading] = useState(true)
  const [recentOrders, setRecentOrders] = useState([])

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)

      const summaryData = await apiCall(API_ENDPOINTS.DASHBOARD_SUMMARY)

      setStats({
        totalProducts: summaryData.total_products || 0,
        pendingOrders: summaryData.pending_orders || 0,
        activeDeliveries: summaryData.fulfilled_orders || 0,
        todaySales: summaryData.total_revenue || 0,
      })

      // Load recent orders (limit to 5)
      const ordersData = await apiCall(API_ENDPOINTS.ORDERS)
      setRecentOrders(ordersData.slice(0, 5))
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Fallback to empty data
      setStats({
        totalProducts: 0,
        pendingOrders: 0,
        activeDeliveries: 0,
        todaySales: 0,
      })
      setRecentOrders([])
    } finally {
      setLoading(false)
    }
  }

  const statCards = [
    {
      title: 'Total Products',
      value: stats.totalProducts,
      icon: '📦',
      color: 'bg-blue-500',
      link: '/products',
    },
    {
      title: 'Pending Orders',
      value: stats.pendingOrders,
      icon: '🛒',
      color: 'bg-yellow-500',
      link: '/orders',
    },
    {
      title: 'Active Deliveries',
      value: stats.activeDeliveries,
      icon: '🚚',
      color: 'bg-green-500',
      link: '/deliveries',
    },
    {
      title: 'Today\'s Sales',
      value: `₦${stats.todaySales.toLocaleString()}`,
      icon: '💰',
      color: 'bg-purple-500',
      link: '/orders',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Unified Header - Shows the "Merger" Concept */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Unified Dashboard</h2>
        <p className="text-gray-600 text-sm">
          Sales & Logistics in one view - Orders automatically trigger deliveries
        </p>
      </div>

      {/* Stats Grid - Mobile First */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {statCards.map((card, index) => (
          <Link
            key={index}
            to={card.link}
            className="bg-white rounded-lg shadow p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{card.icon}</span>
              <div className={`w-3 h-3 rounded-full ${card.color}`}></div>
            </div>
            <div className="text-2xl font-bold text-gray-900">{card.value}</div>
            <div className="text-xs text-gray-600 mt-1">{card.title}</div>
          </Link>
        ))}
      </div>

      {/* Two-Column Layout: Sales + Logistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Sales Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Sales & Orders</h3>
            <Link
              to="/orders"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div
                  key={order.id}
                  className="border-l-4 border-blue-500 pl-4 py-2"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-gray-900">Order #{order.id}</p>
                      <p className="text-sm text-gray-600">{order.customer_phone}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      ₦{order.total_amount?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <p>No recent orders</p>
                <Link
                  to="/orders"
                  className="text-blue-600 hover:text-blue-700 text-sm mt-2 inline-block"
                >
                  Create your first order →
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Logistics Panel */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Delivery & Fulfillment</h3>
            <Link
              to="/deliveries"
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            <div className="text-center py-8 text-gray-500">
              <p className="mb-2">🚚 Auto-triggered from orders</p>
              <p className="text-sm">
                When an order is created, a delivery is automatically dispatched
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Link
            to="/products"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl mb-2">➕</span>
            <span className="text-sm text-gray-700">Add Product</span>
          </Link>
          <Link
            to="/orders"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl mb-2">🛒</span>
            <span className="text-sm text-gray-700">New Order</span>
          </Link>
          <Link
            to="/deliveries"
            className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <span className="text-2xl mb-2">🚚</span>
            <span className="text-sm text-gray-700">Track Delivery</span>
          </Link>
          <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
            <span className="text-2xl mb-2">📊</span>
            <span className="text-sm text-gray-700">Analytics</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

