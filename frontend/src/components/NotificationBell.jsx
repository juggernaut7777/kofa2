import { useState, useEffect, useRef } from 'react'
import { Bell, X, Check, CheckCheck, ShoppingCart, AlertTriangle, CreditCard, Info } from 'lucide-react'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'

const ICON_MAP = {
    sale: ShoppingCart,
    low_stock: AlertTriangle,
    credit_due: CreditCard,
    system: Info,
}

const COLOR_MAP = {
    sale: 'text-green-400',
    low_stock: 'text-orange-400',
    credit_due: 'text-red-400',
    system: 'text-blue-400',
}

const NotificationBell = ({ isDark = true }) => {
    const { user } = useAuth()
    const navigate = useNavigate()
    const [isOpen, setIsOpen] = useState(false)
    const [notifications, setNotifications] = useState([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const panelRef = useRef(null)

    // Poll for unread count every 30 seconds
    useEffect(() => {
        if (!user?.id) return
        fetchUnreadCount()
        const interval = setInterval(fetchUnreadCount, 30000)
        return () => clearInterval(interval)
    }, [user?.id])

    // Close panel on outside click
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        if (isOpen) document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [isOpen])

    const fetchUnreadCount = async () => {
        try {
            const data = await apiCall(`${API_ENDPOINTS.NOTIFICATIONS_UNREAD}?user_id=${user.id}`)
            setUnreadCount(data?.unread_count || 0)
        } catch (e) { /* silent */ }
    }

    const fetchNotifications = async () => {
        if (!user?.id) return
        setLoading(true)
        try {
            const data = await apiCall(`${API_ENDPOINTS.NOTIFICATIONS}?user_id=${user.id}&limit=30`)
            setNotifications(data?.notifications || [])
            setUnreadCount(data?.unread_count || 0)
        } catch (e) { console.error('Notifications error:', e) }
        finally { setLoading(false) }
    }

    const handleOpen = () => {
        setIsOpen(!isOpen)
        if (!isOpen) fetchNotifications()
    }

    const handleNotifClick = async (notif) => {
        if (!notif.is_read) {
            try {
                await apiCall(API_ENDPOINTS.NOTIFICATION_READ(notif.id), { method: 'PUT' })
                setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n))
                setUnreadCount(prev => Math.max(0, prev - 1))
            } catch (e) { /* silent */ }
        }
        if (notif.link) {
            setIsOpen(false)
            navigate(notif.link)
        }
    }

    const handleMarkAllRead = async () => {
        try {
            await apiCall(`${API_ENDPOINTS.NOTIFICATIONS_READ_ALL}?user_id=${user.id}`, { method: 'PUT' })
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
            setUnreadCount(0)
        } catch (e) { /* silent */ }
    }

    const timeAgo = (dateStr) => {
        const diff = Date.now() - new Date(dateStr).getTime()
        const mins = Math.floor(diff / 60000)
        if (mins < 1) return 'Just now'
        if (mins < 60) return `${mins}m ago`
        const hrs = Math.floor(mins / 60)
        if (hrs < 24) return `${hrs}h ago`
        const days = Math.floor(hrs / 24)
        return `${days}d ago`
    }

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell Button */}
            <button
                onClick={handleOpen}
                className={`relative p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}
            >
                <Bell size={22} className={isDark ? 'text-gray-400' : 'text-gray-600'} />
                {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold bg-red-500 text-white rounded-full px-1 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Notification Panel */}
            {isOpen && (
                <div className={`absolute right-0 top-12 w-80 max-h-[70vh] rounded-2xl shadow-2xl overflow-hidden z-50 border ${isDark ? 'bg-[#1A1A1F] border-white/10' : 'bg-white border-gray-200'}`}>
                    {/* Header */}
                    <div className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                        <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Notifications</h3>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <button onClick={handleMarkAllRead}
                                    className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg ${isDark ? 'text-blue-400 hover:bg-white/10' : 'text-blue-500 hover:bg-gray-100'}`}>
                                    <CheckCheck size={14} /> Read all
                                </button>
                            )}
                            <button onClick={() => setIsOpen(false)} className={`p-1 rounded-lg ${isDark ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Notification List */}
                    <div className="overflow-y-auto max-h-[55vh]">
                        {loading ? (
                            <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className={`text-center py-12 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>
                                <Bell size={32} className="mx-auto mb-2 opacity-50" />
                                <p className="text-sm">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => {
                                const Icon = ICON_MAP[n.type] || Info
                                const color = COLOR_MAP[n.type] || 'text-gray-400'
                                return (
                                    <button
                                        key={n.id}
                                        onClick={() => handleNotifClick(n)}
                                        className={`w-full text-left px-4 py-3 flex gap-3 transition-colors border-b ${isDark
                                            ? `border-white/5 ${!n.is_read ? 'bg-white/5' : ''} hover:bg-white/10`
                                            : `border-gray-50 ${!n.is_read ? 'bg-blue-50/50' : ''} hover:bg-gray-50`
                                            }`}
                                    >
                                        <div className={`mt-0.5 ${color}`}>
                                            <Icon size={18} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{n.title}</span>
                                                {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />}
                                            </div>
                                            <p className={`text-xs mt-0.5 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{n.message}</p>
                                            <p className={`text-[10px] mt-1 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>{timeAgo(n.created_at)}</p>
                                        </div>
                                    </button>
                                )
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}

export default NotificationBell
