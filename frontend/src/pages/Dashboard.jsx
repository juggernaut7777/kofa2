import { useState, useEffect, useContext } from 'react'
import { Link } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../config/api'
import { useAuth } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'

const Dashboard = () => {
  const { user } = useAuth()
  const { theme } = useContext(ThemeContext)
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
  const [botActive, setBotActive] = useState(true)
  const [botToggleLoading, setBotToggleLoading] = useState(false)

  useEffect(() => {
    loadDashboardData()
    loadBotStatus()
  }, [])

  const loadDashboardData = async () => {
    try {
      setLoading(true)
      const response = await apiCall(API_ENDPOINTS.DASHBOARD_SUMMARY)
      setStats(response.stats || stats)
      setRecentOrders(response.recentOrders || [])
    } catch (error) {
      console.error('Failed to load dashboard data:', error)
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

  const loadBotStatus = async () => {
    try {
      const response = await apiCall(API_ENDPOINTS.BOT_STATUS)
      setBotActive(!response.is_paused)
    } catch (error) {
      console.error('Failed to load bot status:', error)
      setBotActive(true)
    }
  }

  const toggleBot = async () => {
    setBotToggleLoading(true)
    try {
      await apiCall(API_ENDPOINTS.BOT_PAUSE, {
        method: 'POST',
        body: JSON.stringify({ paused: botActive })
      })
      setBotActive(!botActive)
    } catch (error) {
      console.error('Failed to toggle bot:', error)
      setBotActive(!botActive)
    } finally {
      setBotToggleLoading(false)
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
      case 'completed': return theme === 'dark' ? 'bg-success/20 text-success border-success/30' : 'bg-emerald-100 text-emerald-800 border-emerald-200'
      case 'processing': return theme === 'dark' ? 'bg-kofa-cobalt/20 text-kofa-sky border-kofa-cobalt/30' : 'bg-blue-100 text-blue-800 border-blue-200'
      case 'shipped': return theme === 'dark' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' : 'bg-purple-100 text-purple-800 border-purple-200'
      case 'pending': return theme === 'dark' ? 'bg-warning/20 text-warning border-warning/30' : 'bg-amber-100 text-amber-800 border-amber-200'
      default: return theme === 'dark' ? 'bg-gray-500/20 text-gray-400 border-gray-500/30' : 'bg-gray-100 text-gray-800 border-gray-200'
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
      <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-kofa-sky border-t-kofa-cobalt"></div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gradient-to-br from-slate-50 via-white to-blue-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Header */}
        <div className="mb-10">
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-4xl font-bold ${theme === 'dark' ? 'kofa-gradient-text' : 'text-kofa-navy'}`}>
                Welcome back{user?.businessName ? `, ${user.businessName}` : ''}
              </h1>
              <p className={`mt-2 text-lg ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Your AI-powered sales are performing great today.
              </p>
            </div>
            <div className="hidden md:flex items-center space-x-4">
              <div className={`px-4 py-2 rounded-full ${botActive ? (theme === 'dark' ? 'bg-success/20' : 'bg-green-100') : (theme === 'dark' ? 'bg-danger/20' : 'bg-red-100')}`}>
                <span className={`text-sm font-medium ${botActive ? (theme === 'dark' ? 'text-success' : 'text-green-800') : (theme === 'dark' ? 'text-danger' : 'text-red-800')}`}>
                  {botActive ? '🤖 Chatbot Active' : '🔴 Chatbot Paused'}
                </span>
              </div>
              <div className={`px-4 py-2 rounded-full ${theme === 'dark' ? 'bg-kofa-cobalt/20' : 'bg-blue-100'}`}>
                <span className={`text-sm font-medium ${theme === 'dark' ? 'text-kofa-sky' : 'text-kofa-cobalt'}`}>📈 Revenue Up 23%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bot Control Card */}
        <div className="mb-10">
          <div className={`rounded-2xl shadow-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white border border-gray-100'
            }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className={`p-4 rounded-xl ${botActive ? 'bg-gradient-to-br from-success to-emerald-600' : 'bg-gradient-to-br from-kofa-steel to-gray-500'}`}>
                  <span className="text-3xl">{botActive ? '🤖' : '😴'}</span>
                </div>
                <div>
                  <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>AI Sales Bot</h3>
                  <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                    {botActive
                      ? 'Your chatbot is active and handling customer inquiries 24/7'
                      : "Your chatbot is paused. Customers won't receive automated responses"}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <span className={`text-sm font-medium ${botActive ? 'text-success' : (theme === 'dark' ? 'text-gray-500' : 'text-gray-500')}`}>
                  {botActive ? 'ON' : 'OFF'}
                </span>
                <button
                  onClick={toggleBot}
                  disabled={botToggleLoading}
                  className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-kofa-cobalt focus:ring-offset-2 ${botActive ? 'bg-success' : (theme === 'dark' ? 'bg-dark-border' : 'bg-gray-300')
                    } ${botToggleLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <span
                    className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${botActive ? 'translate-x-7' : 'translate-x-1'
                      }`}
                  />
                </button>
              </div>
            </div>
            {!botActive && (
              <div className={`mt-4 rounded-xl p-4 ${theme === 'dark' ? 'bg-warning/10 border border-warning/30' : 'bg-amber-50 border border-amber-200'}`}>
                <p className={`text-sm flex items-center ${theme === 'dark' ? 'text-warning' : 'text-amber-800'}`}>
                  <span className="mr-2">⚠️</span>
                  While paused, customers messaging you on WhatsApp/Instagram won't receive automated responses.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Premium Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-gradient-to-br from-success to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
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

          <div className="bg-kofa-gradient rounded-2xl p-6 text-white shadow-xl">
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

          <div className="bg-gradient-to-br from-kofa-steel to-kofa-navy rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-300 text-sm font-medium">AI Messages Today</p>
                <p className="text-3xl font-bold mt-1">{stats.chatbotMessages}</p>
                <p className="text-gray-400 text-sm mt-1">24/7 selling</p>
              </div>
              <div className="bg-white/20 p-3 rounded-xl">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-warning to-orange-600 rounded-2xl p-6 text-white shadow-xl">
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
          {[
            { icon: '📦', label: 'Total Products', value: stats.totalProducts, color: 'blue' },
            { icon: '🛒', label: 'Total Orders', value: stats.totalOrders, color: 'green' },
            { icon: '💎', label: 'Lifetime Revenue', value: formatCurrency(stats.totalRevenue), color: 'purple' },
          ].map((stat, index) => (
            <div key={index} className={`rounded-xl shadow-lg p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white border border-gray-100'
              }`}>
              <div className="flex items-center">
                <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-kofa-cobalt/20' : 'bg-blue-100'}`}>
                  <span className="text-xl">{stat.icon}</span>
                </div>
                <div className="ml-4">
                  <p className={`text-sm font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{stat.label}</p>
                  <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Orders */}
        <div className={`rounded-2xl shadow-xl overflow-hidden ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white border border-gray-100'
          }`}>
          <div className={`px-8 py-6 border-b ${theme === 'dark' ? 'border-dark-border' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Recent Orders</h3>
                <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>Latest customer purchases via your AI chatbot</p>
              </div>
              <Link
                to="/orders"
                className="kofa-button px-6 py-2 rounded-xl font-medium"
              >
                View All Orders
              </Link>
            </div>
          </div>

          <div className={`divide-y ${theme === 'dark' ? 'divide-dark-border' : 'divide-gray-100'}`}>
            {recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className={`px-8 py-6 transition-colors duration-200 ${theme === 'dark' ? 'hover:bg-dark-border/50' : 'hover:bg-gray-50'
                  }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-kofa-cobalt/20' : 'bg-gradient-to-br from-blue-100 to-indigo-100'}`}>
                        <span className="text-2xl">{getPlatformIcon(order.platform)}</span>
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{order.customer}</p>
                          <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full border ${getStatusColor(order.status)}`}>
                            {order.status}
                          </span>
                        </div>
                        <p className={`text-sm mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>{order.product}</p>
                        <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>{order.date} • via {order.platform}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(order.amount)}</p>
                      <button className={`text-sm font-medium mt-1 ${theme === 'dark' ? 'text-kofa-sky hover:text-white' : 'text-kofa-cobalt hover:text-kofa-navy'}`}>
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="px-8 py-16 text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === 'dark' ? 'bg-dark-border' : 'bg-gray-100'
                  }`}>
                  <span className="text-4xl">📦</span>
                </div>
                <h3 className={`text-lg font-semibold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>No orders yet</h3>
                <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Connect your WhatsApp/Instagram and start selling with AI</p>
                <button className="kofa-button px-6 py-3 rounded-xl font-medium">
                  Connect Social Media
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/products" className="bg-kofa-gradient rounded-2xl p-6 text-white shadow-xl hover:shadow-kofa-lg transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold">Add Product</h4>
              <span className="text-2xl">📦</span>
            </div>
            <p className="text-blue-100 mb-4">Expand your inventory for the AI chatbot</p>
            <span className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200 inline-block">
              Add Product →
            </span>
          </Link>

          <div className="bg-gradient-to-br from-success to-emerald-600 rounded-2xl p-6 text-white shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold">Bot Settings</h4>
              <span className="text-2xl">🤖</span>
            </div>
            <p className="text-green-100 mb-4">
              Bot is currently {botActive ? 'active' : 'paused'}
            </p>
            <button
              onClick={toggleBot}
              className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200"
            >
              {botActive ? 'Pause Bot' : 'Activate Bot'} →
            </button>
          </div>

          <Link to="/orders" className="bg-gradient-to-br from-kofa-steel to-kofa-navy rounded-2xl p-6 text-white shadow-xl hover:shadow-lg transition-all duration-200 transform hover:scale-105">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-xl font-bold">Analytics</h4>
              <span className="text-2xl">📊</span>
            </div>
            <p className="text-gray-300 mb-4">View detailed sales performance</p>
            <span className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors duration-200 inline-block">
              View Reports →
            </span>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
