import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import {
    ChevronLeft, ChevronRight, Store, Lock, Bell, Globe,
    MessageSquare, Instagram, CreditCard, HelpCircle, FileText,
    LogOut, Moon, Sun, Bot, Send, Pause, Play
} from 'lucide-react'

const SettingsRedesign = () => {
    const navigate = useNavigate()
    const { user, logout } = useAuth()
    const { theme, toggleTheme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    // Tab state: 'account', 'integrations', 'bot', 'support'
    const [activeTab, setActiveTab] = useState('account')

    // Profile state
    const [profile, setProfile] = useState({
        storeName: user?.storeName || user?.businessName || 'My Store',
        email: user?.email || '',
        phone: user?.phone || ''
    })

    // Bot settings state
    const [botSettings, setBotSettings] = useState({
        enabled: true,
        style: 'professional',
        autoReply: true
    })
    const [botLoading, setBotLoading] = useState(true)

    // Customer bot test chat state
    const [testChatOpen, setTestChatOpen] = useState(false)
    const [testMessages, setTestMessages] = useState([])
    const [testInput, setTestInput] = useState('')
    const [testLoading, setTestLoading] = useState(false)

    // Integrations state
    const [integrations, setIntegrations] = useState({
        whatsapp: { connected: false, status: 'disconnected' },
        instagram: { connected: false, status: 'disconnected' },
        paystack: { connected: false, status: 'disconnected' }
    })
    const [connectModal, setConnectModal] = useState(null) // 'whatsapp' | 'instagram' | null
    const [connectForm, setConnectForm] = useState({})
    const [connectLoading, setConnectLoading] = useState(false)
    const [connectError, setConnectError] = useState('')

    useEffect(() => {
        loadBotSettings()
        loadBotConnections()
    }, [])

    const loadBotSettings = async () => {
        setBotLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.BOT_STATUS)
            if (data) {
                setBotSettings({
                    enabled: data.is_active !== false,
                    style: data.style || 'friendly',
                    autoReply: data.auto_reply !== false
                })
            }
        } catch (e) { /* use defaults */ }
        finally { setBotLoading(false) }
    }

    const handleToggleBot = async () => {
        try {
            await apiCall(API_ENDPOINTS.BOT_PAUSE, {
                method: 'POST',
                body: JSON.stringify({ paused: botSettings.enabled })
            })
            setBotSettings({ ...botSettings, enabled: !botSettings.enabled })
        } catch (e) { alert('Failed to update bot status') }
    }

    const handleLogout = () => {
        if (confirm('Log out of your account?')) {
            logout()
            navigate('/login')
        }
    }

    const sendTestMessage = async () => {
        if (!testInput.trim() || testLoading) return

        const userMessage = testInput.trim()
        setTestMessages(prev => [...prev, { role: 'user', content: userMessage }])
        setTestInput('')
        setTestLoading(true)

        try {
            const res = await apiCall('/customer-bot/test', {
                method: 'POST',
                body: JSON.stringify({
                    message: userMessage,
                    style: 'corporate',  // Always use professional/corporate style
                    user_id: user?.id  // Pass user ID for context-aware responses
                })
            })
            setTestMessages(prev => [...prev, { role: 'bot', content: res.response }])
        } catch (e) {
            setTestMessages(prev => [...prev, { role: 'bot', content: 'Error: Could not get response. Please check your connection.' }])
        }
        setTestLoading(false)
    }

    const tabs = [
        { id: 'account', label: 'Account' },
        { id: 'integrations', label: 'Integrations' },
        { id: 'bot', label: 'Bot' },
        { id: 'support', label: 'Support' }
    ]

    const loadBotConnections = async () => {
        try {
            const res = await apiCall(`${API_ENDPOINTS.BOT_CONNECTIONS}?user_id=${user?.id || 'default'}`)
            const data = await res.json()
            if (data.status === 'success') {
                setIntegrations(prev => ({
                    ...prev,
                    whatsapp: { connected: data.whatsapp?.connected || false, phone_id: data.whatsapp?.phone_id || '', business_id: data.whatsapp?.business_id || '' },
                    instagram: { connected: data.instagram?.connected || false, page_id: data.instagram?.page_id || '' }
                }))
            }
        } catch (e) { /* ignore */ }
    }

    const handleConnectPlatform = async (platform) => {
        setConnectLoading(true)
        setConnectError('')
        try {
            const endpoint = platform === 'whatsapp' ? API_ENDPOINTS.CONNECT_WHATSAPP : API_ENDPOINTS.CONNECT_INSTAGRAM
            const res = await apiCall(`${endpoint}?user_id=${user?.id || 'default'}`, {
                method: 'PUT',
                body: JSON.stringify(connectForm)
            })
            const data = await res.json()
            if (data.status === 'success') {
                setConnectModal(null)
                setConnectForm({})
                loadBotConnections()
            } else {
                setConnectError(data.detail || 'Connection failed')
            }
        } catch (e) {
            setConnectError('Network error')
        } finally {
            setConnectLoading(false)
        }
    }

    const handleDisconnectPlatform = async (platform) => {
        if (!confirm(`Disconnect ${platform}? Your bot will stop responding on this platform.`)) return
        try {
            await apiCall(`${API_ENDPOINTS.DISCONNECT_BOT(platform)}?user_id=${user?.id || 'default'}`, { method: 'DELETE' })
            loadBotConnections()
        } catch (e) { /* ignore */ }
    }

    const handleTabChange = (tabId) => {
        setActiveTab(tabId)
        if (tabId === 'integrations') loadBotConnections()
    }

    const isPro = false // Pro tier coming soon

    const ToggleSwitch = ({ enabled, onChange }) => (
        <button onClick={() => onChange(!enabled)}
            className={`w-12 h-7 rounded-full transition-colors ${enabled ? 'bg-[#0095FF]' : isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
            <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    )

    const SettingsItem = ({ icon: Icon, label, value, onClick, iconColor = 'blue' }) => (
        <div onClick={onClick} className={`flex items-center justify-between p-4 cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
            <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconColor === 'blue' ? 'bg-blue-100 text-blue-500' :
                    iconColor === 'green' ? 'bg-green-100 text-green-500' :
                        iconColor === 'orange' ? 'bg-orange-100 text-orange-500' :
                            iconColor === 'purple' ? 'bg-purple-100 text-purple-500' :
                                'bg-gray-100 text-gray-500'
                    }`}>
                    <Icon size={18} />
                </div>
                <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                {value && <span className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{value}</span>}
                <ChevronRight size={18} className={isDark ? 'text-gray-600' : 'text-gray-300'} />
            </div>
        </div>
    )

    return (
        <div className={`min-h-screen ${isDark ? 'bg-[#0F0F12]' : 'bg-gray-50'}`}>
            {/* Header */}
            <header className={`px-4 pt-4 pb-2 flex items-center justify-center relative ${isDark ? 'text-white' : ''}`}>
                <button onClick={() => navigate('/dashboard')} className={`absolute left-2 p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <ChevronLeft size={24} />
                </button>
                <h1 className="text-lg font-semibold">Settings</h1>
            </header>

            {/* Top Tabs */}
            <div className="px-4 py-4">
                <div className="flex gap-2 overflow-x-auto scrollbar-hide">
                    {tabs.map(tab => (
                        <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${activeTab === tab.id ? 'bg-[#0095FF] text-white' : isDark ? 'bg-white/10 text-gray-300' : 'bg-white text-gray-600 border border-gray-200'
                                }`}>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ACCOUNT TAB */}
            {activeTab === 'account' && (
                <div className="px-4 pb-32">
                    {/* Profile Card */}
                    <div className={`rounded-2xl p-4 mb-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                        <div className="flex items-center gap-4">
                            <div className={`w-14 h-14 rounded-full flex items-center justify-center ${isDark ? 'bg-white/10' : 'bg-gray-100'}`}>
                                <Store size={24} className={isDark ? 'text-gray-400' : 'text-gray-500'} />
                            </div>
                            <div>
                                <h2 className={`font-semibold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{profile.storeName}</h2>
                                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{profile.email}</p>
                            </div>
                        </div>
                    </div>

                    {/* Appearance */}
                    <div className={`rounded-2xl overflow-hidden mb-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-purple-500/20 text-purple-400' : 'bg-purple-100 text-purple-500'}`}>
                                    {isDark ? <Moon size={18} /> : <Sun size={18} />}
                                </div>
                                <div>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Dark Mode</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{isDark ? 'On' : 'Off'}</p>
                                </div>
                            </div>
                            <ToggleSwitch enabled={isDark} onChange={toggleTheme} />
                        </div>
                    </div>

                    {/* Account Items */}
                    <div className={`rounded-2xl overflow-hidden mb-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                        <SettingsItem icon={Lock} label="Password & Security" value="Coming Soon" onClick={() => alert('Password & Security settings coming soon!')} />
                        <SettingsItem icon={Bell} label="Notifications" value="Coming Soon" onClick={() => alert('Push notifications coming soon!')} />
                        <SettingsItem icon={Globe} label="Language" value="English" onClick={() => alert('Additional languages coming soon!')} />
                    </div>

                    {/* Logout */}
                    <button onClick={handleLogout} className={`w-full py-3 text-center text-red-500 font-semibold rounded-xl ${isDark ? 'bg-red-500/10' : 'bg-white border border-gray-200'}`}>
                        Log Out
                    </button>
                </div>
            )}


            {/* INTEGRATIONS TAB */}
            {activeTab === 'integrations' && (
                <div className="px-4 pb-32">
                    <p className={`text-sm mb-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Connect your accounts to enable auto-responses and sync inventory.</p>

                    <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                        {/* WhatsApp */}
                        <div className={`flex items-center justify-between p-4 ${isDark ? 'border-b border-white/5' : 'border-b border-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${integrations.whatsapp.connected ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
                                    <MessageSquare size={18} />
                                </div>
                                <div>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>WhatsApp Business</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {integrations.whatsapp.connected ? `Connected — Phone ID: ...${(integrations.whatsapp.phone_id || '').slice(-4)}` : 'Not connected — requires Meta Business API'}
                                    </p>
                                </div>
                            </div>
                            {integrations.whatsapp.connected ? (
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-sm text-green-500 font-medium">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
                                    </span>
                                    <button onClick={() => handleDisconnectPlatform('whatsapp')} className="text-red-400 text-xs underline ml-2">Disconnect</button>
                                </div>
                            ) : (
                                <button onClick={() => { setConnectModal('whatsapp'); setConnectForm({ phone_id: '', access_token: '', business_id: '' }); setConnectError('') }}
                                    className="text-[#0095FF] font-semibold text-sm border border-[#0095FF] px-3 py-1 rounded-lg hover:bg-[#0095FF] hover:text-white transition-all">Setup</button>
                            )}
                        </div>

                        {/* Instagram */}
                        <div className={`flex items-center justify-between p-4 ${isDark ? 'border-b border-white/5' : 'border-b border-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${integrations.instagram.connected ? 'bg-orange-100 text-orange-500' : 'bg-gray-100 text-gray-400'}`}>
                                    <Instagram size={18} />
                                </div>
                                <div>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Instagram Shop</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {integrations.instagram.connected ? `Connected — Page: ...${(integrations.instagram.page_id || '').slice(-4)}` : 'Not connected — requires Instagram Graph API'}
                                    </p>
                                </div>
                            </div>
                            {integrations.instagram.connected ? (
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1 text-sm text-green-500 font-medium">
                                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span> Active
                                    </span>
                                    <button onClick={() => handleDisconnectPlatform('instagram')} className="text-red-400 text-xs underline ml-2">Disconnect</button>
                                </div>
                            ) : (
                                <button onClick={() => { setConnectModal('instagram'); setConnectForm({ access_token: '', page_id: '' }); setConnectError('') }}
                                    className="text-[#0095FF] font-semibold text-sm border border-[#0095FF] px-3 py-1 rounded-lg hover:bg-[#0095FF] hover:text-white transition-all">Setup</button>
                            )}
                        </div>

                        {/* Paystack */}
                        <div className="flex items-center justify-between p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center">
                                    <CreditCard size={18} />
                                </div>
                                <div>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Paystack Payments</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {integrations.paystack.connected ? 'Payouts enabled' : 'Not connected'}
                                    </p>
                                </div>
                            </div>
                            <button className="text-[#0095FF] font-semibold text-sm border border-[#0095FF] px-3 py-1 rounded-lg hover:bg-[#0095FF] hover:text-white transition-all">Connect</button>
                        </div>
                    </div>

                    {/* How to get API keys info box */}
                    <div className={`mt-4 rounded-2xl p-5 ${isDark ? 'bg-blue-500/10 border border-blue-500/20' : 'bg-blue-50'}`}>
                        <p className={`text-sm font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>📋 How to get your API keys</p>
                        <div className={`text-xs space-y-2 ${isDark ? 'text-blue-200/70' : 'text-blue-600'}`}>
                            <p><strong>WhatsApp Business API:</strong> Go to <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline">developers.facebook.com</a> → Create App → Add WhatsApp → Get Phone Number ID & Access Token from the API Setup page.</p>
                            <p><strong>Instagram API:</strong> Same Facebook Developer Portal → Add Instagram Graph API → Generate a Page Token for your business Instagram account.</p>
                            <p className={`${isDark ? 'text-yellow-300/80' : 'text-orange-600'}`}>💡 You need a CAC-registered business to verify your Meta Business account for production access.</p>
                        </div>
                    </div>
                </div>
            )}

            {/* WHATSAPP SETUP MODAL */}
            {connectModal === 'whatsapp' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setConnectModal(null)}>
                    <div className={`w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-xl'}`} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-lg bg-green-100 text-green-500 flex items-center justify-center">
                                <MessageSquare size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Connect WhatsApp Business</h3>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Meta Cloud API credentials</p>
                            </div>
                        </div>

                        {connectError && <p className="text-red-500 text-sm mb-3 bg-red-100/20 p-2 rounded-lg">{connectError}</p>}

                        <div className="space-y-4">
                            <div>
                                <label className={`text-sm font-medium block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Phone Number ID *</label>
                                <input value={connectForm.phone_id || ''} onChange={e => setConnectForm({ ...connectForm, phone_id: e.target.value })}
                                    placeholder="e.g. 123456789012345"
                                    className={`w-full px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                            </div>
                            <div>
                                <label className={`text-sm font-medium block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Permanent Access Token *</label>
                                <input value={connectForm.access_token || ''} onChange={e => setConnectForm({ ...connectForm, access_token: e.target.value })}
                                    type="password" placeholder="EAAx..."
                                    className={`w-full px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                            </div>
                            <div>
                                <label className={`text-sm font-medium block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Business ID (optional)</label>
                                <input value={connectForm.business_id || ''} onChange={e => setConnectForm({ ...connectForm, business_id: e.target.value })}
                                    placeholder="e.g. 987654321"
                                    className={`w-full px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setConnectModal(null)}
                                className={`flex-1 py-3 rounded-xl font-semibold text-sm ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
                            <button onClick={() => handleConnectPlatform('whatsapp')} disabled={connectLoading || !connectForm.phone_id || !connectForm.access_token}
                                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-green-500 text-white disabled:opacity-40 hover:bg-green-600 transition-all">
                                {connectLoading ? 'Connecting...' : 'Connect WhatsApp'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* INSTAGRAM SETUP MODAL */}
            {connectModal === 'instagram' && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setConnectModal(null)}>
                    <div className={`w-full max-w-md rounded-2xl p-6 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-xl'}`} onClick={e => e.stopPropagation()}>
                        <div className="flex items-center gap-3 mb-5">
                            <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center">
                                <Instagram size={20} />
                            </div>
                            <div>
                                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>Connect Instagram</h3>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Instagram Graph API credentials</p>
                            </div>
                        </div>

                        {connectError && <p className="text-red-500 text-sm mb-3 bg-red-100/20 p-2 rounded-lg">{connectError}</p>}

                        <div className="space-y-4">
                            <div>
                                <label className={`text-sm font-medium block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Access Token *</label>
                                <input value={connectForm.access_token || ''} onChange={e => setConnectForm({ ...connectForm, access_token: e.target.value })}
                                    type="password" placeholder="EAAx..."
                                    className={`w-full px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                            </div>
                            <div>
                                <label className={`text-sm font-medium block mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Instagram Page ID (optional)</label>
                                <input value={connectForm.page_id || ''} onChange={e => setConnectForm({ ...connectForm, page_id: e.target.value })}
                                    placeholder="e.g. 17841400..."
                                    className={`w-full px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-white/5 border border-white/10 text-white placeholder-gray-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder-gray-400'}`} />
                            </div>
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button onClick={() => setConnectModal(null)}
                                className={`flex-1 py-3 rounded-xl font-semibold text-sm ${isDark ? 'bg-white/10 text-white' : 'bg-gray-100 text-gray-600'}`}>Cancel</button>
                            <button onClick={() => handleConnectPlatform('instagram')} disabled={connectLoading || !connectForm.access_token}
                                className="flex-1 py-3 rounded-xl font-semibold text-sm bg-gradient-to-r from-orange-500 to-pink-500 text-white disabled:opacity-40 hover:from-orange-600 hover:to-pink-600 transition-all">
                                {connectLoading ? 'Connecting...' : 'Connect Instagram'}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* BOT TAB */}
            {activeTab === 'bot' && (
                <div className="px-4 pb-32">
                    {botLoading ? (
                        <div className={`text-center py-12 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
                    ) : (
                        <>
                            {/* Bot Status Card */}
                            <div className={`rounded-2xl p-5 mb-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${botSettings.enabled ? 'bg-green-100 text-green-500' : 'bg-gray-100 text-gray-400'}`}>
                                            <Bot size={24} />
                                        </div>
                                        <div>
                                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>KOFA AI Bot</p>
                                            <p className={`text-sm ${botSettings.enabled ? 'text-green-500' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {botSettings.enabled ? 'Active & Responding' : 'Paused'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={handleToggleBot}
                                        className={`px-4 py-2 rounded-xl font-semibold text-sm flex items-center gap-2 ${botSettings.enabled ? 'bg-red-100 text-red-500' : 'bg-green-100 text-green-500'
                                            }`}>
                                        {botSettings.enabled ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Resume</>}
                                    </button>
                                </div>

                                {/* Test Customer Bot Button */}
                                <button
                                    onClick={() => { setTestChatOpen(!testChatOpen); setTestMessages([]) }}
                                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${isDark ? 'bg-[#0095FF]/10 text-[#0095FF]' : 'bg-blue-50 text-[#0095FF]'}`}
                                >
                                    <MessageSquare size={16} /> {testChatOpen ? 'Close Test Chat' : 'Test Customer Bot'}
                                </button>

                                {/* Customer Bot Test Chat Interface */}
                                {testChatOpen && (
                                    <div className={`mt-4 rounded-xl overflow-hidden border ${isDark ? 'bg-[#0F0F12] border-white/10' : 'bg-gray-50 border-gray-200'}`}>
                                        <div className={`p-3 ${isDark ? 'bg-[#1A1A1F] border-b border-white/10' : 'bg-white border-b border-gray-200'}`}>
                                            <p className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                                Bot responds in <span className="font-bold text-[#0095FF]">PROFESSIONAL</span> mode
                                            </p>
                                        </div>

                                        {/* Chat Messages */}
                                        <div className="h-64 overflow-y-auto p-4 space-y-3">
                                            {testMessages.length === 0 && (
                                                <p className={`text-center text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                    Type a message to test your customer bot...
                                                </p>
                                            )}
                                            {testMessages.map((msg, i) => (
                                                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                                    <div className={`max-w-[80%] p-3 rounded-xl text-sm ${msg.role === 'user'
                                                        ? 'bg-[#0095FF] text-white'
                                                        : isDark ? 'bg-white/10 text-white' : 'bg-white text-gray-800'
                                                        }`}>
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            ))}
                                            {testLoading && (
                                                <div className="flex justify-start">
                                                    <div className={`p-3 rounded-xl ${isDark ? 'bg-white/10' : 'bg-white'}`}>
                                                        <div className="flex gap-1">
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                                                            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Chat Input */}
                                        <div className={`p-3 flex gap-2 ${isDark ? 'bg-[#1A1A1F] border-t border-white/10' : 'bg-white border-t border-gray-200'}`}>
                                            <input
                                                type="text"
                                                value={testInput}
                                                onChange={(e) => setTestInput(e.target.value)}
                                                onKeyDown={(e) => e.key === 'Enter' && sendTestMessage()}
                                                placeholder="Type a customer message..."
                                                className={`flex-1 px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-white/5 text-white placeholder-gray-500 border-white/10' : 'bg-gray-100 text-gray-800 placeholder-gray-400'} border focus:outline-none focus:ring-2 focus:ring-[#0095FF]/50`}
                                            />
                                            <button
                                                onClick={sendTestMessage}
                                                disabled={testLoading || !testInput.trim()}
                                                className={`px-4 py-2 rounded-lg font-semibold text-sm ${testLoading || !testInput.trim() ? 'bg-gray-300 text-gray-500' : 'bg-[#0095FF] text-white'}`}
                                            >
                                                <Send size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Bot Mode Info */}
                            <div className={`rounded-2xl p-4 ${isDark ? 'bg-white/5' : 'bg-blue-50'}`}>
                                <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Bot Mode</p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    Both the Customer Bot and Business AI Assistant respond in <strong className="text-[#0095FF]">Professional</strong> mode. Use the Pause/Resume button above to control whether the customer bot auto-replies.
                                </p>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* SUPPORT TAB */}
            {activeTab === 'support' && (
                <div className="px-4 pb-32">
                    <div className={`rounded-2xl overflow-hidden mb-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                        <SettingsItem icon={HelpCircle} label="Help Center" onClick={() => alert('Need help? Send us a message via Contact Support below or email hello@kofa.ng')} iconColor="blue" />
                        <SettingsItem icon={Send} label="Contact Support" onClick={() => window.open('https://wa.me/2349138857498?text=Hi%2C%20I%20need%20help%20with%20KOFA', '_blank')} iconColor="green" />
                        <SettingsItem icon={FileText} label="Terms of Service" onClick={() => navigate('/terms')} iconColor="gray" />
                        <SettingsItem icon={FileText} label="Privacy Policy" onClick={() => navigate('/privacy')} iconColor="gray" />
                    </div>

                    {/* App Version */}
                    <div className="text-center mt-8">
                        <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>KOFA Merchant v1.0.3</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SettingsRedesign
