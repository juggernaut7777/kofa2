import { useLocation, useNavigate } from 'react-router-dom'
import { useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'

// Moonlight Color Palette
const colors = {
    lavender: '#CCCCFF',
    muted: '#A3A3CC',
    violet: '#5C5C99',
    indigo: '#292966',
}

const LayoutRedesign = ({ children }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const navItems = [
        {
            path: '/dashboard', label: 'Home', icon: (active) => (
                <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            )
        },
        {
            path: '/products', label: 'Products', icon: (active) => (
                <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            )
        },
        {
            path: '/orders', label: 'Orders', icon: (active) => (
                <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            )
        },
        {
            path: '/insights', label: 'Insights', icon: (active) => (
                <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
            )
        },
        {
            path: '/settings', label: 'Settings', icon: (active) => (
                <svg className="w-6 h-6" fill={active ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={active ? 0 : 1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        },
    ]

    const isActive = (path) => location.pathname === path

    return (
        <div className={`min-h-screen font-['SF_Pro_Display',-apple-system,BlinkMacSystemFont,sans-serif] ${isDark ? 'bg-[#0a0a14] text-white' : 'bg-[#fafaff] text-black'}`}>
            {children}

            {/* Premium Bottom Navigation */}
            <nav className={`fixed bottom-0 left-0 right-0 z-50 ${isDark ? 'bg-[#0a0a14]/80 border-white/[0.06]' : 'bg-[#fafaff]/80 border-black/[0.04]'} backdrop-blur-2xl border-t`}>
                <div className="max-w-md mx-auto">
                    <div className="flex items-center justify-around h-20 px-2">
                        {navItems.map((item) => {
                            const active = isActive(item.path)
                            return (
                                <button
                                    key={item.path}
                                    onClick={() => navigate(item.path)}
                                    className="flex flex-col items-center gap-1 py-2 px-4 transition-all duration-300"
                                >
                                    <div
                                        className={`flex items-center justify-center w-10 h-10 rounded-2xl transition-all duration-300 ${active ? 'scale-105' : 'hover:scale-105 active:scale-95'}`}
                                        style={{
                                            background: active ? `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` : 'transparent',
                                            color: active ? 'white' : isDark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.4)',
                                            boxShadow: active ? `0 4px 12px ${colors.indigo}60` : 'none'
                                        }}
                                    >
                                        {item.icon(active)}
                                    </div>
                                    <span
                                        className="text-[10px] font-semibold transition-all"
                                        style={{ color: active ? colors.violet : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}
                                    >
                                        {item.label}
                                    </span>
                                </button>
                            )
                        })}
                    </div>

                    {/* Home Indicator Bar */}
                    <div className="flex justify-center pb-2">
                        <div className={`w-32 h-1 rounded-full ${isDark ? 'bg-white/10' : 'bg-black/10'}`}></div>
                    </div>
                </div>
            </nav>
        </div>
    )
}

export default LayoutRedesign
