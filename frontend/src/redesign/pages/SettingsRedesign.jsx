import { useState, useContext, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import {
    ChevronLeft, ChevronRight, Store, Lock, Bell, Globe,
    MessageSquare, Instagram, CreditCard, HelpCircle, FileText,
    LogOut, Moon, Sun, Bot, Zap, Send, Pause, Play,
    Users, UserPlus, Trash2, Crown, Shield, AlertCircle
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

    // Team Members state
    const [teamMembers, setTeamMembers] = useState([])
    const [teamLoading, setTeamLoading] = useState(false)
    const [inviteEmail, setInviteEmail] = useState('')
    const [inviteRole, setInviteRole] = useState('staff')
    const [inviteLoading, setInviteLoading] = useState(false)
    const [teamError, setTeamError] = useState('')
    const [usageSummary, setUsageSummary] = useState(null)

    useEffect(() => {
        loadBotSettings()
        loadUsageSummary()
    }, [])

    const loadUsageSummary = async () => {
        try {
            const data = await apiCall(API_ENDPOINTS.USAGE_STATS)
            setUsageSummary(data)
        } catch (e) { /* ignore */ }
    }

    const loadTeamMembers = async () => {
        setTeamLoading(true)
        try {
            const data = await apiCall(API_ENDPOINTS.TEAM_MEMBERS)
            setTeamMembers(data.members || [])
        } catch (e) { setTeamMembers([]) }
        finally { setTeamLoading(false) }
    }

    const handleInviteMember = async () => {
        if (!inviteEmail.trim()) return
        setInviteLoading(true)
        setTeamError('')
        try {
            const res = await apiCall(API_ENDPOINTS.TEAM_INVITE, {
                method: 'POST',
                body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole })
            })
            if (res.success) {
                setInviteEmail('')
                loadTeamMembers()
            } else {
                setTeamError(res.error || 'Failed to invite')
            }
        } catch (e) {
            const detail = e.message || 'Failed to invite member'
            setTeamError(detail)
        }
        setInviteLoading(false)
    }

    const handleRevokeMember = async (memberId) => {
        if (!confirm('Remove this team member?')) return
        try {
            await apiCall(API_ENDPOINTS.TEAM_REVOKE(memberId), { method: 'DELETE' })
            loadTeamMembers()
        } catch (e) { alert('Failed to remove member') }
    }

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
        { id: 'team', label: 'Team' },
        { id: 'integrations', label: 'Integrations' },
        { id: 'bot', label: 'Bot' },
        { id: 'support', label: 'Support' }
    ]

    const handleTabChange = (tabId) => {
        setActiveTab(tabId)
        if (tabId === 'team') loadTeamMembers()
    }

    const isPro = usageSummary?.tier === 'pro'

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

            {/* TEAM TAB */}
            {activeTab === 'team' && (
                <div className="px-4 pb-32">
                    {!isPro ? (
                        /* Upgrade Prompt for Free/Grow users */
                        <div className={`rounded-2xl p-6 text-center ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                            <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500`}>
                                <Crown size={32} className="text-white" />
                            </div>
                            <h3 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Team Members</h3>
                            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                Add up to 3 team members to help manage your business. Available on the <span className="font-bold text-[#0095FF]">Pro plan</span> (₦10,000/mo).
                            </p>
                            <button
                                onClick={() => alert('Payment integration coming soon! Contact support to upgrade.')}
                                className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#0095FF] to-[#0066CC] text-white font-semibold text-sm shadow-lg"
                            >
                                Upgrade to Pro
                            </button>
                        </div>
                    ) : (
                        /* Pro users — Team Management */
                        <>
                            {/* Invite Card */}
                            <div className={`rounded-2xl p-5 mb-4 ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-500 flex items-center justify-center">
                                        <UserPlus size={20} />
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Invite Team Member</p>
                                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {teamMembers.length}/3 slots used
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <input
                                        type="email"
                                        value={inviteEmail}
                                        onChange={(e) => setInviteEmail(e.target.value)}
                                        placeholder="team@example.com"
                                        className={`w-full px-4 py-3 rounded-xl text-sm ${isDark ? 'bg-white/5 text-white placeholder-gray-500 border-white/10' : 'bg-gray-50 text-gray-800 placeholder-gray-400 border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-[#0095FF]/50`}
                                    />

                                    {/* Role selector */}
                                    <div className="flex gap-2">
                                        {['staff', 'manager'].map(r => (
                                            <button key={r}
                                                onClick={() => setInviteRole(r)}
                                                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${inviteRole === r
                                                    ? 'bg-[#0095FF] text-white'
                                                    : isDark ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-gray-50 text-gray-600 border border-gray-200'
                                                    }`}
                                            >
                                                {r === 'staff' && <Shield size={14} className="inline mr-1" />}
                                                {r === 'manager' && <Crown size={14} className="inline mr-1" />}
                                                {r.charAt(0).toUpperCase() + r.slice(1)}
                                            </button>
                                        ))}
                                    </div>

                                    {teamError && (
                                        <div className="flex items-center gap-2 text-red-500 text-sm">
                                            <AlertCircle size={14} /> {teamError}
                                        </div>
                                    )}

                                    <button
                                        onClick={handleInviteMember}
                                        disabled={inviteLoading || !inviteEmail.trim() || teamMembers.length >= 3}
                                        className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors ${inviteLoading || !inviteEmail.trim() || teamMembers.length >= 3
                                            ? isDark ? 'bg-white/5 text-gray-600' : 'bg-gray-100 text-gray-400'
                                            : 'bg-[#0095FF] text-white'
                                            }`}
                                    >
                                        {inviteLoading ? 'Sending Invite...' : teamMembers.length >= 3 ? 'Team Full (3/3)' : 'Send Invite'}
                                    </button>
                                </div>
                            </div>

                            {/* Team Members List */}
                            <h3 className={`text-xs font-semibold uppercase tracking-wide mb-2 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>TEAM MEMBERS</h3>
                            <div className={`rounded-2xl overflow-hidden ${isDark ? 'bg-[#1A1A1F] border border-white/10' : 'bg-white shadow-sm'}`}>
                                {teamLoading ? (
                                    <div className={`p-8 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Loading...</div>
                                ) : teamMembers.length === 0 ? (
                                    <div className={`p-8 text-center`}>
                                        <Users size={32} className={`mx-auto mb-2 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                                        <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>No team members yet. Invite someone above!</p>
                                    </div>
                                ) : (
                                    teamMembers.map((member, idx) => (
                                        <div key={member.id}
                                            className={`flex items-center justify-between p-4 ${idx < teamMembers.length - 1 ? isDark ? 'border-b border-white/5' : 'border-b border-gray-50' : ''}`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${member.status === 'active'
                                                    ? 'bg-green-100 text-green-600'
                                                    : 'bg-amber-100 text-amber-600'
                                                    }`}>
                                                    {member.email.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>{member.email}</p>
                                                    <div className="flex items-center gap-2">
                                                        <span className={`text-xs px-2 py-0.5 rounded-full ${member.role === 'manager'
                                                            ? 'bg-purple-100 text-purple-600'
                                                            : isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'
                                                            }`}>
                                                            {member.role}
                                                        </span>
                                                        <span className={`text-xs ${member.status === 'active' ? 'text-green-500' : 'text-amber-500'}`}>
                                                            {member.status === 'active' ? '● Active' : '◌ Pending'}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleRevokeMember(member.id)}
                                                className="p-2 rounded-lg hover:bg-red-100 text-red-400 hover:text-red-600 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Role explanation */}
                            <div className={`mt-4 rounded-xl p-4 ${isDark ? 'bg-white/5' : 'bg-blue-50'}`}>
                                <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Role Permissions</p>
                                <div className={`text-xs space-y-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                    <p><Shield size={12} className="inline mr-1" /><strong>Staff:</strong> View products, orders & respond to customers</p>
                                    <p><Crown size={12} className="inline mr-1" /><strong>Manager:</strong> Everything + edit products, expenses & settings</p>
                                </div>
                            </div>
                        </>
                    )}
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
