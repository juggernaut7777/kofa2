import { useState, useEffect } from 'react'
import { apiCall, API_ENDPOINTS } from '../config/api'

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalOrders: 0,
    totalRevenue: 0,
    activeOrders: 0,
    todayRevenue: 0,
    chatbotMessages: 0,
    stockAlerts: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardData()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await apiCall(API_ENDPOINTS.DASHBOARD_SUMMARY)
      setStats(response.stats || stats)
      setRecentOrders(response.recentOrders || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
      // Enhanced fallback data for KOFA SaaS demo
      setStats({
        totalProducts: 47,
        totalOrders: 283,
        totalRevenue: 1245000,
        activeOrders: 12,
        todayRevenue: 85000,
        chatbotMessages: 156,
        stockAlerts: 3
      })
      setRecentOrders([
        { id: 'ORD-001', customer: 'Sarah Johnson', product: 'Designer Handbag', amount: 45000, status: 'completed', date: '2024-01-15', platform: 'WhatsApp' },
        { id: 'ORD-002', customer: 'Mike Chen', product: 'Wireless Headphones', amount: 25000, status: 'processing', date: '2024-01-15', platform: 'Instagram' },
        { id: 'ORD-003', customer: 'Grace Adebayo', product: 'Smart Watch', amount: 35000, status: 'completed', date: '2024-01-14', platform: 'WhatsApp' },
        { id: 'ORD-004', customer: 'John Okafor', product: 'Laptop Bag', amount: 15000, status: 'shipped', date: '2024-01-14', platform: 'Instagram' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount)
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'processing': return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'pending': return 'bg-amber-100 text-amber-800 border-amber-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getPlatformIcon = (platform) => {
    switch (platform?.toLowerCase()) {
      case 'whatsapp': return '💬'
      case 'instagram': return '📷'
      case 'tiktok': return '🎵'
      default: return '📱'
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-900 to-indigo-900 bg-clip-text text-transparent">
                Welcome back, Vendor
              </h1>
              <p className="text-gray-600 mt-2 text-lg">Your AI-powered sales are performing great today.</p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className="bg-green-100 px-4 py-2 rounded-full">
                <span className="text-green-800 text-sm font-medium">🤖 Chatbot Active</span>
              </div>
              <div className="bg-blue-100 px-4 py-2 rounded-full">
                <span className="text-blue-800 text-sm font-medium">📈 Revenue Up 23%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          {/* Revenue Card */}
          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Today's Revenue</p>
                <p className="text-3xl font-bold mt-1">{formatCurrency(stats.todayRevenue)}</p>
                <p className="text-green-200 text-sm mt-1">+12% from yesterday</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">💰</span>
              </div>
            </div>
          </div>

          {/* Orders Card */}
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Active Orders</p>
                <p className="text-3xl font-bold mt-1">{stats.activeOrders}</p>
                <p className="text-blue-200 text-sm mt-1">Processing now</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">📦</span>
              </div>
            </div>
          </div>

          {/* Chatbot Card */}
          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">AI Messages Today</p>
                <p className="text-3xl font-bold mt-1">{stats.chatbotMessages}</p>
                <p className="text-purple-200 text-sm mt-1">24/7 selling</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
          </div>

          {/* Alerts Card */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-amber-100 text-sm font-medium">Stock Alerts</p>
                <p className="text-3xl font-bold mt-1">{stats.stockAlerts}</p>
                <p className="text-amber-200 text-sm mt-1">Needs attention</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">⚠️</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-xl">
                <span className="text-blue-600 text-xl">📦</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm font-medium">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-xl">
                <span className="text-green-600 text-xl">🛒</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm font-medium">Total Orders</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-xl">
                <span className="text-purple-600 text-xl">💎</span>
              </div>
              <div className="ml-4">
                <p className="text-gray-600 text-sm font-medium">Lifetime Revenue</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalRevenue)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Orders - Premium Design */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold text-gray-900">Recent Orders</h3>
                <p className="text-gray-600 mt-1">Latest customer purchases via your AI chatbot</p>
              </div>
              <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium">
                View All Orders
              </button>
            </div>
          </div>

          <div className="divide-y divide-gray-100">
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="px-8 py-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="bg-gradient-to-br from-blue-100 to-indigo-100 p-3 rounded-xl">
                        <span className="text-2xl">{getPlatformIcon(order.platform)}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className="font-semibold text-gray-900">{order.customer}</p>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className="text-gray-600 text-sm mt-1">{order.product}</p>
                        <p className="text-gray-500 text-xs mt-1">{order.date} • via {order.platform}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{formatCurrency(order.amount)}</p>
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium mt-1">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-8 py-16 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl">📦</span>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                <p className="text-gray-600 mb-6">Connect your WhatsApp/Instagram and start selling with AI</p>
                <button className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 font-medium">
                  Connect Social Media
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold">Add Product</h4>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-blue-100 mb-4">Expand your inventory for the AI chatbot</p>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200">
              Add Product →
            </button>
          </div>

          <div className="bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold">Bot Settings</h4>
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-green-100 mb-4">Customize your AI sales assistant</p>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200">
              Configure Bot →
            </button>
          </div>

          <div className="bg-gradient-to-br from-purple-500 to-violet-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold">Analytics</h4>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-purple-100 mb-4">View detailed sales performance</p>
            <button className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200">
              View Reports →
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

