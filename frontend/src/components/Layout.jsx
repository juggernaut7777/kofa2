import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useContext } from 'react'
import { ThemeContext } from '../context/ThemeContext'

const Layout = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useContext(ThemeContext)

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/orders', label: 'Orders', icon: '🛒' },
    { path: '/expenses', label: 'Expenses', icon: '💸' },
    { path: '/subscription', label: 'Plans', icon: '💎' },
    { path: '/support', label: 'Support', icon: '🆘' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className={`min-h-screen transition-colors duration-300 ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
      {/* Mobile-first Header */}
      <header className={`sticky top-0 z-50 transition-colors duration-300 ${theme === 'dark'
          ? 'bg-dark-card/90 backdrop-blur-xl border-b border-dark-border'
          : 'bg-white/90 backdrop-blur-xl shadow-sm'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
                <div className="bg-kofa-gradient p-2 rounded-lg shadow-kofa">
                  <span className="text-white font-bold text-lg">KOFA</span>
                </div>
                <span className={`ml-3 text-sm font-medium hidden sm:block ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  Commerce Engine
                </span>
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {/* Theme Toggle */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${theme === 'dark'
                    ? 'bg-dark-border hover:bg-kofa-navy/30 text-yellow-400'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                  }`}
                title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {/* Bot Status */}
              <div className={`hidden sm:flex items-center space-x-2 px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-success/20' : 'bg-green-100'
                }`}>
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-success' : 'text-green-800'}`}>
                  🤖 Active
                </span>
              </div>

              {user && (
                <div className="hidden sm:flex items-center space-x-3">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}`}>
                    {user.businessName || user.email}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${theme === 'dark'
                      ? 'bg-kofa-cobalt/20 text-kofa-sky'
                      : 'bg-blue-100 text-blue-700'
                    }`}>
                    {user.plan?.toUpperCase() || 'FREE'}
                  </span>
                </div>
              )}
              <button
                onClick={handleLogout}
                className={`text-sm font-medium hidden sm:block ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-700'
                  }`}
              >
                Logout
              </button>
              <Link
                to="/subscription"
                className="kofa-button px-4 py-2 rounded-lg text-sm font-medium"
              >
                Upgrade
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation (Mobile) */}
      <nav className={`fixed bottom-0 left-0 right-0 sm:hidden z-50 ${theme === 'dark'
          ? 'bg-dark-card border-t border-dark-border'
          : 'bg-white border-t border-gray-200'
        }`}>
        <div className="grid grid-cols-5 gap-1">
          {navItems.slice(0, 5).map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 px-1 ${location.pathname === item.path
                  ? 'text-kofa-cobalt'
                  : theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
            >
              <span className="text-xl mb-1">{item.icon}</span>
              <span className="text-xs">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Sidebar Navigation (Desktop) */}
      <div className="hidden sm:flex">
        <aside className={`w-64 min-h-screen fixed left-0 top-16 transition-colors duration-300 ${theme === 'dark'
            ? 'bg-dark-card border-r border-dark-border'
            : 'bg-white shadow-sm'
          }`}>
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${location.pathname === item.path
                    ? theme === 'dark'
                      ? 'bg-kofa-cobalt/20 text-kofa-sky font-medium'
                      : 'bg-blue-50 text-kofa-cobalt font-medium'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:bg-dark-border hover:text-white'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* User Info & Logout */}
          <div className="absolute bottom-4 left-4 right-4">
            <div className={`border-t pt-4 ${theme === 'dark' ? 'border-dark-border' : 'border-gray-200'}`}>
              {user && (
                <div className="mb-3 px-4">
                  <p className={`text-sm font-medium truncate ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {user.businessName || 'My Business'}
                  </p>
                  <p className={`text-xs truncate ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
                    {user.email}
                  </p>
                </div>
              )}
              <button
                onClick={handleLogout}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${theme === 'dark'
                    ? 'text-gray-400 hover:bg-danger/20 hover:text-danger'
                    : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                  }`}
              >
                <span className="text-xl">🚪</span>
                <span>Logout</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 ml-64 pb-20 sm:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Content Area */}
      <main className="sm:hidden pb-20">
        {children}
      </main>
    </div>
  )
}

export default Layout
