import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

const LayoutRedesign = () => {
    const location = useLocation()
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const navItems = [
        { path: '/dashboard', icon: '🏠', iconActive: '🏠', label: 'Home' },
        { path: '/products', icon: '📦', iconActive: '📦', label: 'Products' },
        { path: '/orders', icon: '🧾', iconActive: '🧾', label: 'Orders' },
        { path: '/insights', icon: '📊', iconActive: '📊', label: 'Insights' },
        { path: '/settings', icon: '⚙️', iconActive: '⚙️', label: 'Settings' },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <div className={`min-h-screen font-['Inter',system-ui,sans-serif] ${isDark ? 'bg-[#030712] text-white' : 'bg-gray-50 text-gray-900'}`}>
            <Outlet />

            {/* Premium Bottom Navigation */}
            <nav className={`fixed bottom-0 left-0 right-0 z-50 ${isDark ? 'bg-[#030712]/80' : 'bg-white/80'} backdrop-blur-2xl border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-around h-20 px-2">
                        {navItems.map((item) => {
                            const active = isActive(item.path)
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className={`flex flex-col items-center gap-1 py-2 px-4 rounded-2xl transition-all duration-300 ${active
                                            ? 'scale-105'
                                            : 'hover:scale-105 active:scale-95'
                                        }`}
                                >
                                    <div className={`relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 ${active
                                            ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-500/30'
                                            : isDark ? 'bg-transparent hover:bg-white/5' : 'bg-transparent hover:bg-gray-100'
                                        }`}>
                                        <span className={`text-xl transition-transform duration-300 ${active ? 'scale-110' : ''}`}>
                                            {active ? item.iconActive : item.icon}
                                        </span>
                                        {active && (
                                            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-white border-2 border-emerald-500"></span>
                                        )}
                                    </div>
                                    <span className={`text-[10px] font-semibold transition-all ${active
                                            ? 'text-emerald-500'
                                            : isDark ? 'text-gray-500' : 'text-gray-400'
                                        }`}>
                                        {item.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Home Indicator Bar */}
                    <div className="flex justify-center pb-2">
                        <div className={`w-32 h-1 rounded-full ${isDark ? 'bg-white/20' : 'bg-gray-200'}`}></div>
                    </div>
                </div>
            </nav>
        </div>
    )
}

export default LayoutRedesign
