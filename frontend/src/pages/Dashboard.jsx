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
    todayRevenue: 0,
    messagesHandled: 0,
    conversionRate: 0
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
      // Demo data
      setStats({
        totalProducts: 47,
        totalOrders: 283,
        totalRevenue: 1245000,
        todayRevenue: 85000,
        messagesHandled: 156,
        conversionRate: 68
      })
      setRecentOrders([
        { id: 'ORD-001', customer: 'Sarah Johnson', product: 'Designer Handbag', amount: 45000, status: 'completed', date: '2024-01-15', platform: 'WhatsApp' },
        { id: 'ORD-002', customer: 'Mike Chen', product: 'Wireless Headphones', amount: 25000, status: 'processing', date: '2024-01-15', platform: 'Instagram' },
        { id: 'ORD-003', customer: 'Grace Adebayo', product: 'Smart Watch', amount: 35000, status: 'completed', date: '2024-01-14', platform: 'WhatsApp' },
      ])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN' }).format(amount)
  }

  const getStatusBadge = (status) => {
    const styles = {
      completed: theme === 'dark' ? 'bg-success/20 text-success' : 'bg-green-100 text-green-800',
      processing: theme === 'dark' ? 'bg-kofa-cobalt/20 text-kofa-sky' : 'bg-blue-100 text-kofa-cobalt',
      pending: theme === 'dark' ? 'bg-warning/20 text-warning' : 'bg-amber-100 text-amber-800'
    }
    return styles[status] || (theme === 'dark' ? 'bg-gray-500/20 text-gray-400' : 'bg-gray-100 text-gray-800')
  }

  if (loading) {
    return (
      <div className={`min-h-screen flex justify-center items-center ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-kofa-sky border-t-kofa-cobalt"></div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
            Welcome back{user?.businessName ? `, ${user.businessName}` : ''}
          </h1>
          <p className={`mt-1 ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>
            Here's your business performance overview
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className={`rounded-xl p-5 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>Today's Revenue</p>
                <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                  {formatCurrency(stats.todayRevenue)}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-success/20' : 'bg-green-100'}`}>
                <span className="text-xl">💰</span>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-5 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>Total Orders</p>
                <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                  {stats.totalOrders}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-kofa-cobalt/20' : 'bg-blue-100'}`}>
                <span className="text-xl">🛒</span>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-5 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>AI Messages</p>
                <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                  {stats.messagesHandled}
                </p>
              </div>
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-kofa-cobalt/20' : 'bg-blue-100'}`}>
                <span className="text-xl">🤖</span>
              </div>
            </div>
          </div>

          <div className={`rounded-xl p-5 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>Conversion</p>
                <p className={`text-2xl font-bold mt-1 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                  {stats.conversionRate}%
                </p>
              </div>
              <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-success/20' : 'bg-green-100'}`}>
                <span className="text-xl">📈</span>
              </div>
            </div>
          </div>
        </div>

        {/* Analytics Summary */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Revenue Card */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
            <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>Revenue Overview</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>Total Revenue</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>{formatCurrency(stats.totalRevenue)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>This Month</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>{formatCurrency(245000)}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>Today</span>
                <span className="font-semibold text-success">{formatCurrency(stats.todayRevenue)}</span>
              </div>
            </div>
          </div>

          {/* Products Card */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
            <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>Inventory</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>Total Products</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>{stats.totalProducts}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>In Stock</span>
                <span className="font-semibold text-success">44</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>Low Stock</span>
                <span className="font-semibold text-warning">3</span>
              </div>
            </div>
            <Link to="/products" className="block mt-4 text-kofa-cobalt hover:underline text-sm font-medium">
              Manage Products →
            </Link>
          </div>

          {/* Bot Performance */}
          <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
            <h3 className={`font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>AI Bot Performance</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>Messages Today</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>{stats.messagesHandled}</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>Response Rate</span>
                <span className="font-semibold text-success">98%</span>
              </div>
              <div className="flex justify-between">
                <span className={theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}>Avg Response</span>
                <span className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>2.3s</span>
              </div>
            </div>
            <Link to="/settings" className="block mt-4 text-kofa-cobalt hover:underline text-sm font-medium">
              Bot Settings →
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className={`rounded-xl overflow-hidden ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
          <div className={`px-6 py-4 border-b ${theme === 'dark' ? 'border-dark-border' : 'border-gray-100'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>Recent Orders</h3>
              <Link to="/orders" className="text-kofa-cobalt hover:underline text-sm font-medium">
                View All →
              </Link>
            </div>
          </div>

          <div className={`divide-y ${theme === 'dark' ? 'divide-dark-border' : 'divide-gray-100'}`}>
            {recentOrders.length > 0 ? recentOrders.map((order) => (
              <div key={order.id} className={`px-6 py-4 ${theme === 'dark' ? 'hover:bg-dark-border/30' : 'hover:bg-gray-50'}`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-kofa-cobalt/20' : 'bg-blue-100'}`}>
                      <span>{order.platform === 'WhatsApp' ? '💬' : '📷'}</span>
                    </div>
                    <div>
                      <p className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>{order.customer}</p>
                      <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>{order.product}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>{formatCurrency(order.amount)}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadge(order.status)}`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              </div>
            )) : (
              <div className="px-6 py-12 text-center">
                <span className="text-4xl">🛒</span>
                <p className={`mt-4 ${theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'}`}>No orders yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
