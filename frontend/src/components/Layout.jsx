import { Link, useLocation } from 'react-router-dom'

const Layout = ({ children }) => {
  const location = useLocation()
  
  const navItems = [
    { path: '/', label: 'Dashboard', icon: '📊' },
    { path: '/products', label: 'Products', icon: '📦' },
    { path: '/orders', label: 'Orders', icon: '🛒' },
    { path: '/subscription', label: 'Plans', icon: '💎' },
    { path: '/support', label: 'Support', icon: '🆘' },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile-first Header */}
      <header className="bg-white shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">KOFA</h1>
              <span className="ml-2 text-xs text-gray-500 hidden sm:inline">Commerce Engine</span>
            </div>
            <div className="text-sm text-gray-600 hidden sm:block">
              AI-Powered Vendor Platform
            </div>
          </div>
        </div>
      </header>

      {/* Bottom Navigation (Mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 sm:hidden z-50">
        <div className="grid grid-cols-5 gap-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center py-2 px-1 ${
                location.pathname === item.path
                  ? 'text-blue-600'
                  : 'text-gray-600'
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
        <aside className="w-64 bg-white shadow-sm min-h-screen fixed left-0 top-16">
          <nav className="p-4 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                  location.pathname === item.path
                    ? 'bg-blue-50 text-blue-600 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
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

