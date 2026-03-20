import { useLocation, useNavigate } from 'react-router-dom'
import { useContext, useState, useEffect } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
    Home, Package, ClipboardList, Wallet, Settings,
    Menu, X, Users, BarChart3, CreditCard,
    HelpCircle, LogOut, ChevronRight, Bell
} from 'lucide-react'

const LayoutRedesign = ({ children }) => {
    const location = useLocation()
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const { user, logout } = useAuth()
    const isDark = theme === 'dark'
    const [sidebarOpen, setSidebarOpen] = useState(false)
    const [pageTransition, setPageTransition] = useState(false)

    // Trigger page transition on route change
    useEffect(() => {
        setPageTransition(true)
        const t = setTimeout(() => setPageTransition(false), 300)
        return () => clearTimeout(t)
    }, [location.pathname])

    // Bottom nav — 5 primary pages
    const navItems = [
        { path: '/dashboard', label: 'Home', icon: Home },
        { path: '/products', label: 'Inventory', icon: Package },
        { path: '/orders', label: 'Orders', icon: ClipboardList },
        { path: '/expenses', label: 'Expenses', icon: Wallet },
        { path: '/customers', label: 'Customers', icon: Users },
    ]

    // Sidebar — secondary pages & actions
    const sidebarItems = [
        { path: '/insights', label: 'Analytics & Insights', icon: BarChart3 },
        { path: '/orders', label: 'Credit Sales', icon: CreditCard, state: { tab: 'credit' } },
        { path: '/products', label: 'Stock Adjustments', icon: Package, state: { tab: 'adjustments' } },
        { path: '/settings', label: 'Settings', icon: Settings },
        { path: '/settings', label: 'Help & Support', icon: HelpCircle, state: { tab: 'support' } },
    ]

    const isActive = (path) => location.pathname === path

    const handleNav = (path, state) => {
        setSidebarOpen(false)
        navigate(path, { state })
    }

    const firstName = user?.first_name || user?.firstName || 'Vendor'
    const initials = firstName.charAt(0).toUpperCase()

    return (
        <div style={{
            minHeight: '100vh',
            background: isDark ? '#0F0F12' : '#f8f9fa',
            fontFamily: "'Inter', 'system-ui', sans-serif",
            color: isDark ? '#fff' : '#111',
        }}>
            {/* ─── Top Header ─── */}
            <header style={{
                position: 'sticky',
                top: 0,
                zIndex: 50,
                height: 56,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0 16px',
                background: isDark ? 'rgba(15,15,18,0.92)' : 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(16px) saturate(180%)',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            }}>
                {/* Left: Hamburger */}
                <button
                    onClick={() => setSidebarOpen(true)}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: 8,
                        borderRadius: 10,
                        cursor: 'pointer',
                        color: isDark ? '#fff' : '#374151',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'background 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.04)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                >
                    <Menu size={22} />
                </button>

                {/* Center: Brand */}
                <h1 style={{
                    fontWeight: 800,
                    fontSize: 18,
                    letterSpacing: '-0.02em',
                    background: 'linear-gradient(135deg, #0095FF, #00C2FF)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                }}>KOFA</h1>

                {/* Right: Settings gear */}
                <button
                    onClick={() => navigate('/settings')}
                    style={{
                        background: 'none',
                        border: 'none',
                        padding: 8,
                        borderRadius: 10,
                        cursor: 'pointer',
                        color: isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af',
                        display: 'flex',
                        alignItems: 'center',
                        transition: 'color 0.15s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.color = isDark ? '#fff' : '#111'}
                    onMouseLeave={e => e.currentTarget.style.color = isDark ? 'rgba(255,255,255,0.5)' : '#9ca3af'}
                >
                    <Settings size={20} />
                </button>
            </header>

            {/* ─── Sidebar Overlay ─── */}
            {sidebarOpen && (
                <div
                    style={{
                        position: 'fixed',
                        inset: 0,
                        zIndex: 60,
                        background: 'rgba(0,0,0,0.5)',
                        backdropFilter: 'blur(4px)',
                        animation: 'fadeIn 0.2s ease',
                    }}
                    onClick={() => setSidebarOpen(false)}
                >
                    {/* Sidebar Panel */}
                    <div
                        style={{
                            position: 'absolute',
                            left: 0,
                            top: 0,
                            height: '100%',
                            width: 288,
                            background: isDark ? '#1A1A1F' : '#fff',
                            boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
                            animation: 'slideIn 0.25s ease',
                            display: 'flex',
                            flexDirection: 'column',
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* User Section */}
                        <div style={{
                            padding: '20px 20px 16px',
                            borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                        }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                    width: 40, height: 40,
                                    borderRadius: 12,
                                    background: 'linear-gradient(135deg, #0095FF, #00C2FF)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    color: '#fff',
                                    fontWeight: 800,
                                    fontSize: 16,
                                }}>
                                    {initials}
                                </div>
                                <div>
                                    <div style={{
                                        fontWeight: 700,
                                        fontSize: 14,
                                        color: isDark ? '#fff' : '#111',
                                    }}>{firstName}</div>
                                    <div style={{
                                        fontSize: 12,
                                        color: isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af',
                                    }}>
                                        {user?.email || 'vendor@kofa.app'}
                                    </div>
                                </div>
                            </div>
                            <button
                                onClick={() => setSidebarOpen(false)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    padding: 6,
                                    borderRadius: 8,
                                    cursor: 'pointer',
                                    color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af',
                                }}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Sidebar Links */}
                        <div style={{ padding: '12px 12px', flex: 1, overflowY: 'auto' }}>
                            {sidebarItems.map((item) => {
                                const Icon = item.icon
                                const active = isActive(item.path) && !item.state
                                return (
                                    <button
                                        key={item.label}
                                        onClick={() => handleNav(item.path, item.state)}
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: 12,
                                            padding: '12px 16px',
                                            borderRadius: 12,
                                            border: 'none',
                                            background: active
                                                ? (isDark ? 'rgba(0,149,255,0.1)' : 'rgba(0,149,255,0.06)')
                                                : 'none',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                            marginBottom: 2,
                                            color: active
                                                ? '#0095FF'
                                                : (isDark ? 'rgba(255,255,255,0.6)' : '#6b7280'),
                                            fontWeight: active ? 600 : 500,
                                            fontSize: 14,
                                            textAlign: 'left',
                                        }}
                                        onMouseEnter={e => {
                                            if (!active) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)'
                                        }}
                                        onMouseLeave={e => {
                                            if (!active) e.currentTarget.style.background = 'none'
                                        }}
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                        <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.3 }} />
                                    </button>
                                )
                            })}
                        </div>

                        {/* Bottom: Logout + Version */}
                        <div style={{
                            padding: '12px 12px 24px',
                            borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                        }}>
                            <button
                                onClick={() => { setSidebarOpen(false); logout?.() }}
                                style={{
                                    width: '100%',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 12,
                                    padding: '12px 16px',
                                    borderRadius: 12,
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    color: '#ef4444',
                                    fontWeight: 500,
                                    fontSize: 14,
                                    transition: 'background 0.15s',
                                }}
                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                onMouseLeave={e => e.currentTarget.style.background = 'none'}
                            >
                                <LogOut size={18} />
                                <span>Log Out</span>
                            </button>
                            <div style={{
                                textAlign: 'center',
                                fontSize: 11,
                                color: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.2)',
                                marginTop: 8,
                            }}>
                                KOFA v1.0.0
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Page Content ─── */}
            <main style={{
                paddingBottom: 80,
                padding: '16px 16px 80px',
                maxWidth: 960,
                margin: '0 auto',
                opacity: pageTransition ? 0 : 1,
                transform: pageTransition ? 'translateY(8px)' : 'translateY(0)',
                transition: 'opacity 0.25s ease, transform 0.25s ease',
            }}>
                {children}
            </main>

            {/* ─── Bottom Navigation ─── */}
            <nav style={{
                position: 'fixed',
                bottom: 0,
                left: 0,
                right: 0,
                zIndex: 40,
                background: isDark ? 'rgba(26,26,31,0.95)' : 'rgba(255,255,255,0.95)',
                backdropFilter: 'blur(16px) saturate(180%)',
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                paddingBottom: 'env(safe-area-inset-bottom, 0)',
            }}>
                <div style={{
                    maxWidth: 480,
                    margin: '0 auto',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    height: 60,
                }}>
                    {navItems.map((item) => {
                        const active = isActive(item.path)
                        const Icon = item.icon
                        return (
                            <button
                                key={item.path}
                                onClick={() => navigate(item.path)}
                                style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    gap: 3,
                                    padding: '8px 12px',
                                    border: 'none',
                                    background: 'none',
                                    cursor: 'pointer',
                                    transition: 'color 0.2s, transform 0.15s',
                                    color: active
                                        ? '#0095FF'
                                        : (isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'),
                                    transform: active ? 'scale(1)' : 'scale(1)',
                                }}
                            >
                                <div style={{
                                    position: 'relative',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Icon
                                        size={22}
                                        strokeWidth={active ? 2.5 : 1.5}
                                    />
                                    {/* Active dot */}
                                    {active && (
                                        <div style={{
                                            position: 'absolute',
                                            top: -4,
                                            right: -4,
                                            width: 5,
                                            height: 5,
                                            borderRadius: 99,
                                            background: '#0095FF',
                                        }} />
                                    )}
                                </div>
                                <span style={{
                                    fontSize: 10,
                                    fontWeight: active ? 700 : 500,
                                    letterSpacing: '0.01em',
                                }}>{item.label}</span>
                            </button>
                        )
                    })}
                </div>
            </nav>

            {/* ─── Animations ─── */}
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
                
                @keyframes slideIn {
                    from { transform: translateX(-100%); }
                    to { transform: translateX(0); }
                }
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    )
}

export default LayoutRedesign
