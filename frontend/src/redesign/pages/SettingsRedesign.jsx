import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import {
    ChevronLeft, ChevronRight, Store, Lock, Bell, Globe,
    MessageSquare, Instagram, CreditCard, HelpCircle, FileText,
    LogOut, Moon, Sun, Bot, Zap, Send, Pause, Play
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
        style: 'friendly',
        autoReply: true
    })
    const [botLoading, setBotLoading] = useState(true)

    // Integrations state
    const [integrations, setIntegrations] = useState({
        whatsapp: { connected: false, status: 'disconnected' },
        instagram: { connected: false, status: 'disconnected' },
        paystack: { connected: false, status: 'disconnected' }
    })

    useEffect(() => {
        loadBotSettings()
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
                body: JSON.stringify({ pause: botSettings.enabled })
            })
            setBotSettings({ ...botSettings, enabled: !botSettings.enabled })
        } catch (e) { alert('Failed to update bot status') }
    }

    const handleBotStyleChange = async (style) => {
        try {
            await apiCall(API_ENDPOINTS.BOT_STYLE, {
                method: 'POST',
                body: JSON.stringify({ style })
            })
            setBotSettings({ ...botSettings, style })
        } catch (e) { alert('Failed to update bot style') }
    }

    const handleLogout = () => {
        if (confirm('Log out of your account?')) {
            logout()
            navigate('/login')
        }
    }

    const tabs = [
        { id: 'account', label: 'Account' },
        { id: 'integrations', label: 'Integrations' },
        { id: 'bot', label: 'Bot' },
        { id: 'support', label: 'Support' }
    ]

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
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)}
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
                        <SettingsItem icon={Lock} label="Password & Security" onClick={() => { }} />
                        <SettingsItem icon={Bell} label="Notifications" onClick={() => { }} />
                        <SettingsItem icon={Globe} label="Language" value="English" onClick={() => { }} />
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
                                <div className="w-10 h-10 rounded-lg bg-green-100 text-green-500 flex items-center justify-center">
                                    <MessageSquare size={18} />
                                </div>
                                <div>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>WhatsApp Business</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {integrations.whatsapp.connected ? 'Connected' : 'Not connected'}
                                    </p>
                                </div>
                            </div>
                            {integrations.whatsapp.connected ? (
                                <span className="flex items-center gap-1 text-sm text-green-500 font-medium">
                                    <span className="w-2 h-2 rounded-full bg-green-500"></span> Active
                                </span>
                            ) : (
                                <button className="text-[#0095FF] font-semibold text-sm border border-[#0095FF] px-3 py-1 rounded-lg">Connect</button>
                            )}
                        </div>

                        {/* Instagram */}
                        <div className={`flex items-center justify-between p-4 ${isDark ? 'border-b border-white/5' : 'border-b border-gray-50'}`}>
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-100 text-orange-500 flex items-center justify-center">
                                    <Instagram size={18} />
                                </div>
                                <div>
                                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Instagram Shop</p>
                                    <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                        {integrations.instagram.connected ? 'Connected' : 'Not connected'}
                                    </p>
                                </div>
                            </div>
                            <button className="text-[#0095FF] font-semibold text-sm border border-[#0095FF] px-3 py-1 rounded-lg">Connect</button>
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
                            <button className="text-[#0095FF] font-semibold text-sm border border-[#0095FF] px-3 py-1 rounded-lg">Connect</button>
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

                                {/* Test Bot Button */}
                                <button
                                    onClick={async () => {
                                        try {
                                            const res = await apiCall(API_ENDPOINTS.BUSINESS_AI, {
                                                method: 'POST',
                                                body: JSON.stringify({ user_id: 'test', message: 'Hello, test message' })
                                            })
                                            alert(`✅ Bot responded: "${res.response?.substring(0, 100) || 'Success!'}"`)
                                        } catch (e) {
                                            alert('❌ Bot test failed. Check backend connection.')
                                        }
                                    }}
                                    className={`w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 ${isDark ? 'bg-[#0095FF]/10 text-[#0095FF]' : 'bg-blue-50 text-[#0095FF]'}`}
                                >
                                    <Send size={16} /> Test Bot Connection
                                </button>
                            </div>

                            {/* Bot Style */}
                            <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>CONVERSATION STYLE</h3>
                            <div className={`rounded-2xl overflow-hidden mb-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                                {['friendly', 'professional', 'casual'].map(style => (
                                    <div key={style} onClick={() => handleBotStyleChange(style)}
                                        className={`flex items-center justify-between p-4 cursor-pointer ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${style !== 'casual' ? isDark ? 'border-b border-white/5' : 'border-b border-gray-50' : ''}`}>
                                        <span className={`font-medium capitalize ${isDark ? 'text-white' : 'text-gray-900'}`}>{style}</span>
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${botSettings.style === style ? 'border-[#0095FF] bg-[#0095FF]' : isDark ? 'border-gray-600' : 'border-gray-300'
                                            }`}>
                                            {botSettings.style === style && <div className="w-2 h-2 rounded-full bg-white"></div>}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Auto Reply */}
                            <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                                <div className="flex items-center justify-between p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center">
                                            <Zap size={18} />
                                        </div>
                                        <div>
                                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Auto-Reply</p>
                                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Instant responses to customers</p>
                                        </div>
                                    </div>
                                    <ToggleSwitch enabled={botSettings.autoReply} onChange={(val) => setBotSettings({ ...botSettings, autoReply: val })} />
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* SUPPORT TAB */}
            {activeTab === 'support' && (
                <div className="px-4 pb-32">
                    <div className={`rounded-2xl overflow-hidden mb-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                        <SettingsItem icon={HelpCircle} label="Help Center" onClick={() => { }} iconColor="blue" />
                        <SettingsItem icon={Send} label="Contact Support" onClick={() => { }} iconColor="green" />
                        <SettingsItem icon={FileText} label="Terms of Service" onClick={() => { }} iconColor="gray" />
                        <SettingsItem icon={FileText} label="Privacy Policy" onClick={() => { }} iconColor="gray" />
                    </div>

                    {/* App Version */}
                    <div className="text-center mt-8">
                        <p className={`text-xs ${isDark ? 'text-gray-600' : 'text-gray-300'}`}>KOFA Merchant v1.0.2</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default SettingsRedesign
