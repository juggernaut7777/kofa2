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
    { path: '/settings', label: 'Settings', icon: '⚙️' },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
      {/* Header */}
      <header className={`sticky top-0 z-50 ${theme === 'dark'
          ? 'bg-dark-card/95 backdrop-blur-sm border-b border-dark-border'
          : 'bg-white/95 backdrop-blur-sm shadow-sm'
        }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/dashboard" className="flex items-center">
              <div className="bg-kofa-cobalt px-3 py-1.5 rounded-lg">
                <span className="text-white font-bold">KOFA</span>
              </div>
            </Link>

            <div className="flex items-center space-x-3">
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg ${theme === 'dark' ? 'bg-dark-border text-kofa-sky' : 'bg-gray-100 text-kofa-steel'
                  }`}
              >
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {user && (
                <div className="hidden sm:flex items-center space-x-2">
                  <span className={`text-sm ${theme === 'dark' ? 'text-gray-300' : 'text-kofa-steel'}`}>
                    {user.businessName || user.email}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${theme === 'dark' ? 'bg-kofa-cobalt/30 text-kofa-sky' : 'bg-blue-100 text-kofa-cobalt'
                    }`}>
                    {user.plan?.toUpperCase() || 'FREE'}
                  </span>
                </div>
              )}

              <Link to="/subscription" className="hidden sm:block bg-kofa-cobalt text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-kofa-navy">
                Upgrade
              </Link>

              <button
                onClick={handleLogout}
                className={`hidden sm:block text-sm ${theme === 'dark' ? 'text-gray-400 hover:text-white' : 'text-kofa-steel hover:text-kofa-navy'}`}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Nav */}
      <nav className={`fixed bottom-0 left-0 right-0 sm:hidden z-50 ${theme === 'dark' ? 'bg-dark-card border-t border-dark-border' : 'bg-white border-t'
        }`}>
        <div className="grid grid-cols-5">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 ${location.pathname === item.path
                  ? 'text-kofa-cobalt'
                  : theme === 'dark' ? 'text-gray-400' : 'text-kofa-steel'
                }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="text-xs mt-1">{item.label}</span>
            </Link>
          ))}
        </div>
      </nav>

      {/* Desktop Sidebar + Content */}
      <div className="hidden sm:flex">
        <aside className={`w-56 min-h-screen fixed left-0 top-16 ${theme === 'dark' ? 'bg-dark-card border-r border-dark-border' : 'bg-white shadow-sm'
          }`}>
          <nav className="p-4 space-y-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg ${location.pathname === item.path
                    ? theme === 'dark'
                      ? 'bg-kofa-cobalt/20 text-kofa-sky'
                      : 'bg-blue-50 text-kofa-cobalt'
                    : theme === 'dark'
                      ? 'text-gray-400 hover:bg-dark-border hover:text-white'
                      : 'text-kofa-steel hover:bg-gray-50 hover:text-kofa-navy'
                  }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Subscription CTA */}
          <div className="absolute bottom-20 left-4 right-4">
            <Link
              to="/subscription"
              className={`block p-4 rounded-xl text-center ${theme === 'dark' ? 'bg-kofa-cobalt/20 border border-kofa-cobalt/30' : 'bg-blue-50 border border-blue-100'
                }`}
            >
              <span className="text-2xl">💎</span>
              <p className={`text-sm font-medium mt-2 ${theme === 'dark' ? 'text-kofa-sky' : 'text-kofa-cobalt'}`}>
                Upgrade Plan
              </p>
            </Link>
          </div>

          <div className="absolute bottom-4 left-4 right-4">
            <button
              onClick={handleLogout}
              className={`w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg ${theme === 'dark' ? 'text-gray-400 hover:bg-dark-border' : 'text-kofa-steel hover:bg-gray-50'
                }`}
            >
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </aside>

        <main className="flex-1 ml-56 pb-8">{children}</main>
      </div>

      {/* Mobile Content */}
      <main className="sm:hidden pb-20">{children}</main>
    </div>
  )
}

export default Layout
