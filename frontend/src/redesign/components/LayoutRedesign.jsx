import { useLocation, useNavigate } from 'react-router-dom'
import { useContext, useState } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { Home, Package, ClipboardList, Wallet, Settings, Menu, X, FileText, CreditCard, HelpCircle, BarChart3, Users } from 'lucide-react'

const LayoutRedesign = ({ children }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const navItems = [
        { path: '/dashboard', label: 'Home', icon: Home },
        { path: '/products', label: 'Inventory', icon: Package },
        { path: '/orders', label: 'Orders', icon: ClipboardList },
        { path: '/customers', label: 'Customers', icon: Users },
        { path: '/settings', label: 'Settings', icon: Settings },
    ]

    const sidebarItems = [
        { path: '/expenses', label: 'Expenses', icon: Wallet },
        { path: '/expenses', label: 'Reports & Analytics', icon: BarChart3, state: { tab: 'reports' } },
        { path: '/orders', label: 'Credit Sales', icon: CreditCard, state: { tab: 'credit' } },
        { path: '/products', label: 'Stock Adjustments', icon: Package, state: { tab: 'adjustments' } },
        { path: '/settings', label: 'Help & Support', icon: HelpCircle },
    ]

    const isActive = (path) => location.pathname === path

    const handleSidebarNav = (item) => {
        setSidebarOpen(false)
        navigate(item.path, { state: item.state })
    }

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0F0F12]' : 'bg-white'} font-sans`}>
            {/* Top Header with Hamburger */}
            <header className={`sticky top-0 z-50 border-b ${isDark
                ? 'bg-[#0F0F12]/95 backdrop-blur border-white/10'
                : 'bg-white/95 backdrop-blur border-gray-100'
                }`}>
                <div className="max-w-6xl mx-auto px-4 lg:px-8 h-14 flex items-center justify-between">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className={`p-2 rounded-lg transition-colors ${isDark
                            ? 'hover:bg-white/10 text-white'
                            : 'hover:bg-gray-100 text-gray-700'
                            }`}
                    >
                        <Menu size={24} />
                    </button>
                    <h1 className="font-bold text-lg text-main">KOFA</h1>
                    <div className="w-10" /> {/* Spacer for centering */}
                </div>
            </header>

            {/* Sidebar Overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                >
                    {/* Sidebar Panel */}
                    <div
                        className={`absolute left-0 top-0 h-full w-72 ${isDark
                            ? 'bg-[#1A1A1F]'
                            : 'bg-white'
                            } shadow-2xl animate-slideIn`}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Sidebar Header */}
                        <div className={`h-14 flex items-center justify-between px-4 border-b ${isDark
                            ? 'border-white/10'
                            : 'border-gray-100'
                            }`}>
                            <span className="font-bold text-lg text-main">Menu</span>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                className={`p-2 rounded-lg ${isDark
                                    ? 'hover:bg-white/10 text-white'
                                    : 'hover:bg-gray-100 text-gray-700'
                                    }`}
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Sidebar Items */}
                        <div className="p-4 space-y-2">
                            {sidebarItems.map((item) => {
                                const Icon = item.icon
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => handleSidebarNav(item)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isDark
                                            ? 'hover:bg-white/10 text-gray-300 hover:text-white'
                                            : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        <Icon size={20} />
                                        <span className="font-medium">{item.label}</span>
                                    </button>
                                )
                            })}
                        </div>

                        {/* App Version */}
                        <div className={`absolute bottom-8 left-4 right-4 text-center text-xs ${isDark
                            ? 'text-gray-600'
                            : 'text-gray-400'
                            }`}>
                            KOFA v1.0.0
                        </div>
                    </div>
                </div>
            )}

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

            <style>{`
                @keyframes slideIn {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                .animate-slideIn {
                    animation: slideIn 0.2s ease-out;
                }
            `}</style>
        </div>
    )
}

export default LayoutRedesign
