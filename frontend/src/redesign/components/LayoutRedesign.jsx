import { useLocation, useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { Home, Package, ClipboardList, Wallet, Settings } from 'lucide-react'

const LayoutRedesign = ({ children }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: Home },
        { path: '/products', label: 'Inventory', icon: Package },
        { path: '/orders', label: 'Orders', icon: ClipboardList },
        { path: '/expenses', label: 'Expenses', icon: Wallet },
        { path: '/settings', label: 'Settings', icon: Settings },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0F0F12]' : 'bg-white'} font-sans`}>
            {/* Page Content with bottom padding for nav */}
            <main className="pb-20 px-4 pt-4 max-w-6xl mx-auto lg:px-8">
                {children}
            </main>

            {/* Bottom Navigation */}
            <nav className={`fixed bottom-0 left-0 right-0 z-40 border-t ${isDark
                    ? 'bg-[#1A1A1F] border-white/10'
                    : 'bg-white border-gray-100'
                }`} style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}>
                <div className="max-w-md mx-auto flex items-center justify-around h-16">
                    {navItems.map((item) => {
                        const active = isActive(item.path)
                        const Icon = item.icon
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                className={`flex flex-col items-center gap-1 py-2 px-3 transition-colors ${active
                                        ? 'text-[#0095FF]'
                                        : isDark ? 'text-gray-500' : 'text-gray-400'
                                    }`}
                            >
                                <Icon
                                    size={22}
                                    strokeWidth={active ? 2.5 : 1.5}
                                />
                                <span className="text-[10px] font-medium">{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}

export default LayoutRedesign
