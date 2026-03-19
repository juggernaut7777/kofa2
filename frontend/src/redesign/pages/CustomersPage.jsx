import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
    ChevronLeft, Search, Users, MessageSquare, ShoppingBag, Instagram,
    Phone, Tag, Star, TrendingUp, Edit2, Trash2, X, ChevronRight
} from 'lucide-react'

const CustomersPage = () => {
    const navigate = useNavigate()
    const { theme } = useContext(ThemeContext)
    const { user } = useAuth()
    const isDark = theme === 'dark'

    const [customers, setCustomers] = useState([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')
    const [channelFilter, setChannelFilter] = useState('all')
    const [sortBy, setSortBy] = useState('recent')
    const [stats, setStats] = useState(null)
    const [selectedCustomer, setSelectedCustomer] = useState(null)
    const [showDetail, setShowDetail] = useState(false)
    const [showEditModal, setShowEditModal] = useState(false)
    const [editForm, setEditForm] = useState({ name: '', phone: '', tags: [], notes: '' })

    useEffect(() => { loadCustomers(); loadStats() }, [])

    const loadCustomers = async () => {
        setLoading(true)
        try {
            const params = new URLSearchParams()
            if (user?.id) params.append('user_id', user.id)
            if (search) params.append('search', search)
            if (channelFilter !== 'all') params.append('channel', channelFilter)
            params.append('sort', sortBy)
            const data = await apiCall(`${API_ENDPOINTS.CUSTOMERS_LIST}?${params}`)
            setCustomers(data.customers || [])
        } catch (e) { setCustomers([]) }
        finally { setLoading(false) }
    }

    const loadStats = async () => {
        try {
            const params = user?.id ? `?user_id=${user.id}` : ''
            const data = await apiCall(`${API_ENDPOINTS.CUSTOMERS_STATS}${params}`)
            setStats(data)
        } catch (e) { /* ignore */ }
    }

    const loadCustomerDetail = async (id) => {
        try {
            const data = await apiCall(`/customers/${id}`)
            setSelectedCustomer(data)
            setShowDetail(true)
        } catch (e) { alert('Failed to load customer') }
    }

    const handleSaveCustomer = async () => {
        if (!selectedCustomer) return
        try {
            await apiCall(`/customers/${selectedCustomer.id}`, {
                method: 'PUT',
                body: JSON.stringify({
                    name: editForm.name,
                    phone: editForm.phone,
                    tags: editForm.tags,
                    notes: editForm.notes,
                })
            })
            setShowEditModal(false)
            loadCustomers()
            loadCustomerDetail(selectedCustomer.id)
        } catch (e) { alert('Failed to update') }
    }

    const handleDeleteCustomer = async (id) => {
        if (!confirm('Delete this customer? This cannot be undone.')) return
        try {
            await apiCall(`/customers/${id}`, { method: 'DELETE' })
            setShowDetail(false)
            setSelectedCustomer(null)
            loadCustomers()
            loadStats()
        } catch (e) { alert('Failed to delete') }
    }

    useEffect(() => { loadCustomers() }, [search, channelFilter, sortBy])

    const formatCurrency = (n) => `₦${parseFloat(n || 0).toLocaleString('en-NG', { minimumFractionDigits: 0 })}`
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Never'

    const channelIcon = (ch) => {
        if (ch === 'whatsapp') return <MessageSquare size={14} className="text-green-500" />
        if (ch === 'instagram') return <Instagram size={14} className="text-pink-500" />
        if (ch === 'web') return <ShoppingBag size={14} className="text-blue-500" />
        return <Phone size={14} className="text-gray-400" />
    }

    const channelLabel = (ch) => {
        const map = { whatsapp: 'WhatsApp', instagram: 'Instagram', web: 'Storefront', walkin: 'Walk-in' }
        return map[ch] || ch
    }

    const channels = [
        { id: 'all', label: 'All' },
        { id: 'walkin', label: 'Walk-in' },
        { id: 'whatsapp', label: 'WhatsApp' },
        { id: 'instagram', label: 'Instagram' },
        { id: 'web', label: 'Web' },
    ]

    const TAG_OPTIONS = ['vip', 'wholesale', 'new', 'regular', 'dormant']

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0F0F12]' : 'bg-white'}`}>
            {/* Header */}
            <header className={`px-4 pt-4 pb-2 flex items-center justify-between ${isDark ? 'text-white' : ''}`}>
                <button onClick={() => navigate('/dashboard')} className={`p-2 -ml-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-semibold">Customers</h1>
                <div className="w-10"></div>
            </header>

            {/* Stats Summary */}
            {stats && (
                <div className="px-4 py-3">
                    <div className="grid grid-cols-3 gap-3">
                        <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-gray-50'}`}>
                            <Users size={18} className="mx-auto mb-1 text-[#0095FF]" />
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stats.total_customers}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Total</p>
                        </div>
                        <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-gray-50'}`}>
                            <TrendingUp size={18} className="mx-auto mb-1 text-green-500" />
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(stats.total_revenue_from_crm)}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Revenue</p>
                        </div>
                        <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-gray-50'}`}>
                            <Star size={18} className="mx-auto mb-1 text-yellow-500" />
                            <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {stats.top_spenders?.[0]?.name?.split(' ')[0] || '—'}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Top Buyer</p>
                        </div>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="px-4 pb-3">
                <div className={`flex items-center gap-2 px-3 py-2.5 rounded-xl ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <Search size={18} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                    <input
                        type="text"
                        placeholder="Search by name or phone..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                    />
                    {search && <button onClick={() => setSearch('')}><X size={16} className="text-gray-400" /></button>}
                </div>
            </div>

            {/* Channel Filters */}
            <div className="px-4 pb-3 flex gap-2 overflow-x-auto scrollbar-hide">
                {channels.map(ch => (
                    <button
                        key={ch.id}
                        onClick={() => setChannelFilter(ch.id)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${channelFilter === ch.id ? 'bg-[#0095FF] text-white' : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                    >
                        {ch.label}
                    </button>
                ))}
                <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className={`ml-auto px-2 py-1 rounded-lg text-xs ${isDark ? 'bg-white/10 text-gray-300 border-none' : 'bg-gray-100 text-gray-600'}`}
                >
                    <option value="recent">Recent</option>
                    <option value="spent">Top Spenders</option>
                    <option value="orders">Most Orders</option>
                    <option value="name">A-Z</option>
                </select>
            </div>

            {/* Customer List */}
            <div className="px-4 pb-32">
                {loading ? (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
                ) : customers.length === 0 ? (
                    <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Users size={48} className="mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No customers yet</p>
                        <p className="text-sm mt-1">Customers will appear here automatically when they make purchases</p>
                    </div>
                ) : (
                    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white border border-gray-100 shadow-sm'}`}>
                        {customers.map((c, i) => (
                            <button
                                key={c.id}
                                onClick={() => loadCustomerDetail(c.id)}
                                className={`w-full flex items-center justify-between p-4 text-left ${i < customers.length - 1 ? isDark ? 'border-b border-white/5' : 'border-b border-gray-50' : ''} ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} transition-colors`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    {/* Avatar */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${isDark ? 'bg-[#0095FF]/20 text-[#0095FF]' : 'bg-[#0095FF]/10 text-[#0095FF]'}`}>
                                        {(c.name || '?')[0].toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{c.name || 'Unknown'}</p>
                                            {channelIcon(c.channel)}
                                        </div>
                                        <p className={`text-xs truncate ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {c.phone || 'No phone'} · {c.total_orders} orders
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                    <div className="text-right">
                                        <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(c.total_spent)}</p>
                                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(c.last_order_date)}</p>
                                    </div>
                                    <ChevronRight size={16} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Customer Detail Drawer */}
            {showDetail && selectedCustomer && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center" onClick={() => setShowDetail(false)}>
                    <div className={`rounded-t-2xl sm:rounded-2xl w-full max-w-md max-h-[85vh] overflow-y-auto ${isDark ? 'bg-[#1A1A1F]' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                        <div className="p-5">
                            {/* Customer Header */}
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold ${isDark ? 'bg-[#0095FF]/20 text-[#0095FF]' : 'bg-[#0095FF]/10 text-[#0095FF]'}`}>
                                        {(selectedCustomer.name || '?')[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className={`text-lg font-bold ${isDark ? 'text-white' : ''}`}>{selectedCustomer.name}</h2>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            {channelIcon(selectedCustomer.channel)}
                                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{channelLabel(selectedCustomer.channel)}</span>
                                        </div>
                                    </div>
                                </div>
                                <button onClick={() => setShowDetail(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                                    <X size={20} />
                                </button>
                            </div>

                            {/* Contact Info */}
                            <div className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                {selectedCustomer.phone && <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>📱 {selectedCustomer.phone}</p>}
                                {selectedCustomer.email && <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>✉️ {selectedCustomer.email}</p>}
                                <p className={`text-sm mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Customer since {formatDate(selectedCustomer.created_at)}</p>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{selectedCustomer.total_orders}</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Orders</p>
                                </div>
                                <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatCurrency(selectedCustomer.total_spent)}</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Spent</p>
                                </div>
                                <div className={`p-3 rounded-xl text-center ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                    <p className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{formatDate(selectedCustomer.last_order_date)}</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Last Order</p>
                                </div>
                            </div>

                            {/* Tags */}
                            <div className="mb-4">
                                <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Tags</p>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedCustomer.tags || []).map(tag => (
                                        <span key={tag} className={`px-2 py-1 rounded-full text-xs font-medium ${tag === 'vip' ? 'bg-yellow-100 text-yellow-700' : tag === 'wholesale' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                            {tag}
                                        </span>
                                    ))}
                                    {(!selectedCustomer.tags || selectedCustomer.tags.length === 0) && (
                                        <span className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-400'}`}>No tags</span>
                                    )}
                                </div>
                            </div>

                            {/* Notes */}
                            {selectedCustomer.notes && (
                                <div className="mb-4">
                                    <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Notes</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{selectedCustomer.notes}</p>
                                </div>
                            )}

                            {/* Order History */}
                            {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                                <div className="mb-4">
                                    <p className={`text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Recent Orders</p>
                                    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                                        {selectedCustomer.orders.slice(0, 5).map((o, i) => (
                                            <div key={o.id} className={`flex items-center justify-between p-3 ${i < Math.min(selectedCustomer.orders.length, 5) - 1 ? isDark ? 'border-b border-white/5' : 'border-b border-gray-100' : ''}`}>
                                                <div>
                                                    <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{formatCurrency(o.total_amount)}</p>
                                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{formatDate(o.created_at)}</p>
                                                </div>
                                                <span className={`px-2 py-0.5 rounded-full text-xs ${o.status === 'paid' ? 'bg-green-100 text-green-700' : o.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                                    {o.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button
                                    onClick={() => {
                                        setEditForm({
                                            name: selectedCustomer.name || '',
                                            phone: selectedCustomer.phone || '',
                                            tags: selectedCustomer.tags || [],
                                            notes: selectedCustomer.notes || '',
                                        })
                                        setShowEditModal(true)
                                    }}
                                    className="flex-1 py-3 bg-[#0095FF] text-white rounded-xl font-semibold flex items-center justify-center gap-2"
                                >
                                    <Edit2 size={16} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDeleteCustomer(selectedCustomer.id)}
                                    className="py-3 px-4 bg-red-500/10 text-red-500 rounded-xl font-semibold"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-end sm:items-center justify-center">
                    <div className={`rounded-t-2xl sm:rounded-2xl w-full max-w-md p-6 ${isDark ? 'bg-[#1A1A1F]' : 'bg-white'}`}>
                        <h2 className={`text-xl font-bold mb-5 ${isDark ? 'text-white' : ''}`}>Edit Customer</h2>
                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Name</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Phone</label>
                                <input type="tel" value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })}
                                    className={`w-full px-4 py-2.5 rounded-xl outline-none ${isDark ? 'bg-white/10 text-white border border-white/10' : 'bg-gray-100 border border-gray-100'}`} />
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Tags</label>
                                <div className="flex flex-wrap gap-2">
                                    {TAG_OPTIONS.map(tag => (
                                        <button key={tag}
                                            onClick={() => setEditForm({
                                                ...editForm,
                                                tags: editForm.tags.includes(tag)
                                                    ? editForm.tags.filter(t => t !== tag)
                                                    : [...editForm.tags, tag]
                                            })}
                                            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${editForm.tags.includes(tag) ? 'bg-[#0095FF] text-white' : isDark ? 'bg-white/10 text-gray-300' : 'bg-gray-100 text-gray-600'}`}
                                        >
                                            {tag}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Notes</label>
                                <textarea rows={3} value={editForm.notes} onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                    placeholder="Private notes about this customer..."
                                    className={`w-full px-4 py-2.5 rounded-xl outline-none resize-none ${isDark ? 'bg-white/10 text-white border border-white/10 placeholder-gray-600' : 'bg-gray-100 border border-gray-100'}`} />
                            </div>
                        </div>
                        <div className="flex gap-3 mt-5">
                            <button onClick={() => setShowEditModal(false)} className={`flex-1 py-3 rounded-xl font-semibold ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-700'}`}>Cancel</button>
                            <button onClick={handleSaveCustomer} className="flex-1 py-3 bg-[#0095FF] text-white rounded-xl font-semibold">Save</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default CustomersPage
