import { useContext } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ThemeContext } from '../../context/ThemeContext'

const LayoutRedesign = ({ children }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: '🏠', activeIcon: '🏠' },
        { path: '/products', label: 'Products', icon: '📦', activeIcon: '📦' },
        { path: '/orders', label: 'Orders', icon: '🛒', activeIcon: '🛒', badge: 5 },
        { path: '/insights', label: 'Insights', icon: '📊', activeIcon: '📊' },
        { path: '/settings', label: 'Settings', icon: '⚙️', activeIcon: '⚙️' },
    ]

    const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/')

    return (
        <div className={`min-h-screen font-['Manrope'] ${isDark ? 'bg-[#102217]' : 'bg-[#f6f8f7]'}`}>
            {/* Main Content */}
            <main className="pb-24">
                {children}
            </main>

            {/* Bottom Navigation Bar */}
            <nav className={`fixed bottom-0 left-0 right-0 z-50 max-w-md mx-auto ${isDark ? 'bg-[#1a2c22] border-gray-800' : 'bg-white border-gray-100'
                } border-t shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]`}>
                <div className="h-[88px] flex items-start justify-around px-2 pt-3 pb-8">
                    {navItems.map((item) => {
                        const active = isActive(item.path)
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className="flex flex-col items-center gap-1 w-16 group"
                            >
                                <div className="relative">
                                    <span className={`text-2xl transition-transform group-hover:scale-110 ${active ? '' : 'opacity-50 grayscale'
                                        }`}>
                                        {active ? item.activeIcon : item.icon}
                                    </span>
                                    {item.badge && (
                                        <span className={`absolute -top-1 -right-2 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ${isDark ? 'ring-[#1a2c22]' : 'ring-white'
                                            }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </div>
                                <span className={`text-[10px] font-medium ${active
                                        ? isDark ? 'text-white font-bold' : 'text-[#111814] font-bold'
                                        : isDark ? 'text-gray-500' : 'text-gray-400'
                                    }`}>
                                    {item.label}
                                </span>
                                {active && (
                                    <div className="w-1 h-1 rounded-full bg-[#2bee79] -mt-0.5"></div>
                                )}
                            </button>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}

export default LayoutRedesign
