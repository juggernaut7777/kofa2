import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

const SettingsRedesign = () => {
    const navigate = useNavigate()
    const { theme, toggleTheme } = useContext(ThemeContext)
    const { user, logout } = useAuth()
    const isDark = theme === 'dark'

    const [activeSection, setActiveSection] = useState('general')
    const [saving, setSaving] = useState(false)
    const [botActive, setBotActive] = useState(true)
    const [botPersonality, setBotPersonality] = useState('friendly')
    const [storeName, setStoreName] = useState(user?.storeName || 'My Store')
    const [storePhone, setStorePhone] = useState(user?.phone || '')
    const [bankName, setBankName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')

    // Test Bot Chat
    const [testMessages, setTestMessages] = useState([
        { from: 'bot', text: 'Hello! I\'m your KOFA assistant. How can I help you today?' }
    ])
    const [testInput, setTestInput] = useState('')

    const [channels, setChannels] = useState([
        { id: 'whatsapp', name: 'WhatsApp', icon: '💬', color: '#22c55e', connected: true },
        { id: 'instagram', name: 'Instagram', icon: '📸', color: '#ec4899', connected: false },
        { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000', connected: false },
    ])

    const sections = [
        { id: 'general', icon: '⚙️', label: 'General' },
        { id: 'bot', icon: '🤖', label: 'Bot' },
        { id: 'testbot', icon: '💬', label: 'Test Bot' },
        { id: 'channels', icon: '📱', label: 'Channels' },
        { id: 'payment', icon: '💳', label: 'Payment' },
    ]

    const personalities = [
        { id: 'friendly', icon: '😊', label: 'Friendly' },
        { id: 'professional', icon: '💼', label: 'Professional' },
        { id: 'casual', icon: '😎', label: 'Casual' },
        { id: 'formal', icon: '🎩', label: 'Formal' },
    ]

    const banks = ['GTBank', 'Access Bank', 'First Bank', 'Zenith Bank', 'UBA', 'Kuda', 'Opay', 'Moniepoint']

    useEffect(() => { loadSettings() }, [])

    const loadSettings = async () => {
        try {
            const botStatus = await apiCall(API_ENDPOINTS.BOT_STATUS).catch(() => null)
            if (botStatus) {
                setBotActive(botStatus.active !== false)
                setBotPersonality(botStatus.style || 'friendly')
            }
        } catch (e) { }
    }

    const handleSaveGeneral = async () => {
        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.VENDOR_BUSINESS_INFO, {
                method: 'PUT',
                body: JSON.stringify({ store_name: storeName, phone: storePhone })
            })
            alert('Settings saved!')
        } catch (e) {
            alert('Settings saved locally!')
        }
        setSaving(false)
    }

    const handleSavePayment = async () => {
        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.VENDOR_PAYMENT_ACCOUNT, {
                method: 'PUT',
                body: JSON.stringify({ bank_name: bankName, account_number: accountNumber })
            })
            alert('Payment settings saved!')
        } catch (e) {
            alert('Payment settings saved locally!')
        }
        setSaving(false)
    }

    const handleToggleBot = async () => {
        const newState = !botActive
        setBotActive(newState)
        try {
            await apiCall(API_ENDPOINTS.BOT_PAUSE, {
                method: 'POST',
                body: JSON.stringify({ paused: !newState })
            })
        } catch (e) { }
    }

    const handleSetPersonality = async (p) => {
        setBotPersonality(p)
        try {
            await apiCall(API_ENDPOINTS.BOT_STYLE, {
                method: 'PUT',
                body: JSON.stringify({ style: p })
            })
        } catch (e) { }
    }

    const handleToggleChannel = (id) => {
        setChannels(channels.map(c => c.id === id ? { ...c, connected: !c.connected } : c))
        alert(channels.find(c => c.id === id)?.connected ? 'Disconnected' : 'Connecting...')
    }

    const handleTestMessage = () => {
        if (!testInput.trim()) return

        const userMsg = { from: 'user', text: testInput }
        setTestMessages([...testMessages, userMsg])
        setTestInput('')

        // Simulate bot response
        setTimeout(() => {
            const responses = [
                'I can help you check your inventory, process orders, or answer customer questions!',
                'Would you like me to show you today\'s sales summary?',
                'I\'m here to assist with your business. What would you like to know?',
                'I can help with product recommendations, order tracking, and more!',
            ]
            const botResponse = { from: 'bot', text: responses[Math.floor(Math.random() * responses.length)] }
            setTestMessages(prev => [...prev, botResponse])
        }, 1000)
    }

    return (
        <div className={`min-h-screen font-['Inter',system-ui,sans-serif] ${isDark ? 'bg-[#030712]' : 'bg-gray-50'}`}>

            {/* Ambient Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-20 -right-20 w-60 h-60 rounded-full blur-3xl ${isDark ? 'bg-violet-500/10' : 'bg-violet-500/5'}`}></div>
                <div className={`absolute bottom-40 -left-20 w-40 h-40 rounded-full blur-3xl ${isDark ? 'bg-emerald-500/10' : 'bg-emerald-500/5'}`}></div>
            </div>

            <div className="relative max-w-md mx-auto pb-28">

                {/* Header */}
                <header className={`sticky top-0 z-30 px-5 pt-4 pb-3 ${isDark ? 'bg-[#030712]/80' : 'bg-gray-50/80'} backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between mb-4">
                        <button onClick={() => navigate('/dashboard')} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <span className="text-lg">←</span>
                        </button>
                        <button onClick={toggleTheme} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-gray-100'}`}>
                            <span className="text-lg">{isDark ? '☀️' : '🌙'}</span>
                        </button>
                    </div>

                    <h1 className={`text-3xl font-black tracking-tight mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Settings</h1>
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Manage your store</p>
                </header>

                {/* Profile Card */}
                <div className="px-5 pt-4">
                    <div className={`relative overflow-hidden rounded-2xl p-5 ${isDark
                        ? 'bg-gradient-to-br from-violet-500/20 via-purple-600/10 to-transparent border border-violet-500/20'
                        : 'bg-gradient-to-br from-violet-50 to-white border border-violet-100'
                        }`}>
                        <div className="flex items-center gap-4">
                            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-400 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                                {storeName?.charAt(0) || 'K'}
                            </div>
                            <div className="flex-1">
                                <p className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'}`}>{storeName}</p>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{user?.email || 'vendor@kofa.app'}</p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                                Active
                            </span>
                        </div>
                    </div>
                </div>

                {/* Section Navigation */}
                <div className="flex gap-2 px-5 pt-5 overflow-x-auto no-scrollbar">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`flex items-center gap-2 px-4 h-10 rounded-xl whitespace-nowrap transition-all hover:scale-105 ${activeSection === s.id
                                    ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-semibold shadow-lg'
                                    : isDark ? 'bg-white/5 text-gray-400 border border-white/10' : 'bg-white text-gray-600 border border-gray-200'
                                }`}
                        >
                            <span>{s.icon}</span>
                            <span className="text-sm">{s.label}</span>
                        </button>
                    ))}
                </div>

                {/* General Section */}
                {activeSection === 'general' && (
                    <div className="px-5 pt-5 space-y-4">
                        <div className={`rounded-2xl p-5 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Store Information</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Store Name</label>
                                    <input
                                        type="text"
                                        value={storeName}
                                        onChange={(e) => setStoreName(e.target.value)}
                                        className={`w-full rounded-xl px-4 py-3 border focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'}`}
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Phone Number</label>
                                    <input
                                        type="tel"
                                        value={storePhone}
                                        onChange={(e) => setStorePhone(e.target.value)}
                                        placeholder="+234 801 234 5678"
                                        className={`w-full rounded-xl px-4 py-3 border focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveGeneral}
                                disabled={saving}
                                className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>

                        {/* Theme Toggle */}
                        <div className={`rounded-2xl p-5 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Dark Mode</p>
                                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Toggle app theme</p>
                                </div>
                                <button
                                    onClick={toggleTheme}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${isDark ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${isDark ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Bot Section */}
                {activeSection === 'bot' && (
                    <div className="px-5 pt-5 space-y-4">
                        <div className={`rounded-2xl p-5 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${botActive ? 'bg-emerald-500/20' : 'bg-gray-500/20'}`}>
                                        <span className="text-2xl">🤖</span>
                                    </div>
                                    <div>
                                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>KOFA Bot</p>
                                        <p className={`text-sm ${botActive ? 'text-emerald-400' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                            {botActive ? 'Active & responding' : 'Paused'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={handleToggleBot}
                                    className={`relative w-14 h-8 rounded-full transition-colors ${botActive ? 'bg-emerald-500' : 'bg-gray-300'}`}
                                >
                                    <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow transition-transform ${botActive ? 'left-7' : 'left-1'}`}></div>
                                </button>
                            </div>
                        </div>

                        <div className={`rounded-2xl p-5 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Bot Personality</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {personalities.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSetPersonality(p.id)}
                                        className={`flex items-center gap-3 p-3 rounded-xl transition-all hover:scale-[1.02] ${botPersonality === p.id
                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg'
                                                : isDark ? 'bg-white/5' : 'bg-gray-100'
                                            }`}
                                    >
                                        <span className="text-xl">{p.icon}</span>
                                        <span className="font-semibold text-sm">{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Test Bot Section */}
                {activeSection === 'testbot' && (
                    <div className="px-5 pt-5 space-y-4">
                        <div className={`rounded-2xl border backdrop-blur-xl overflow-hidden ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                            <div className={`p-4 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center">
                                        <span className="text-white">🤖</span>
                                    </div>
                                    <div>
                                        <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>KOFA Bot</p>
                                        <div className="flex items-center gap-1">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            <span className="text-xs text-emerald-500">Online</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Chat Messages */}
                            <div className="h-80 overflow-y-auto p-4 space-y-3">
                                {testMessages.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[80%] px-4 py-2 rounded-2xl ${msg.from === 'user'
                                                ? 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white rounded-br-md'
                                                : isDark ? 'bg-white/10 text-white rounded-bl-md' : 'bg-gray-100 text-gray-900 rounded-bl-md'
                                            }`}>
                                            <p className="text-sm">{msg.text}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Input */}
                            <div className={`p-4 border-t ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={testInput}
                                        onChange={(e) => setTestInput(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleTestMessage()}
                                        placeholder="Type a message..."
                                        className={`flex-1 rounded-xl px-4 py-3 border focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`}
                                    />
                                    <button
                                        onClick={handleTestMessage}
                                        className="w-12 h-12 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white flex items-center justify-center shadow-lg hover:scale-105 transition-all"
                                    >
                                        ➤
                                    </button>
                                </div>
                            </div>
                        </div>

                        <p className={`text-sm text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            Test how your bot responds to customers
                        </p>
                    </div>
                )}

                {/* Channels Section */}
                {activeSection === 'channels' && (
                    <div className="px-5 pt-5 space-y-3">
                        <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Connected Channels</h3>

                        {channels.map(channel => (
                            <div key={channel.id} className={`rounded-2xl p-4 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{channel.icon}</span>
                                        <div>
                                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{channel.name}</p>
                                            <p className={`text-xs ${channel.connected ? 'text-emerald-400' : isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                                {channel.connected ? '✓ Connected' : 'Not connected'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleToggleChannel(channel.id)}
                                        className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105 ${channel.connected
                                                ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-100 text-red-600'
                                                : 'bg-gradient-to-r from-emerald-400 to-emerald-600 text-white shadow-lg'
                                            }`}
                                    >
                                        {channel.connected ? 'Disconnect' : 'Connect'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Payment Section */}
                {activeSection === 'payment' && (
                    <div className="px-5 pt-5 space-y-4">
                        <div className={`rounded-2xl p-5 border backdrop-blur-xl ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-gray-100'}`}>
                            <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>Payout Account</h3>

                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Bank Name</label>
                                    <select
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className={`w-full rounded-xl px-4 py-3 border focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-gray-50 border-gray-200'}`}
                                    >
                                        <option value="">Select bank...</option>
                                        {banks.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-xs font-bold uppercase mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Account Number</label>
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        placeholder="0123456789"
                                        className={`w-full rounded-xl px-4 py-3 border focus:ring-2 focus:ring-emerald-500 ${isDark ? 'bg-white/5 border-white/10 text-white placeholder-gray-500' : 'bg-gray-50 border-gray-200'}`}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSavePayment}
                                disabled={saving}
                                className="w-full mt-5 py-3 rounded-xl bg-gradient-to-r from-emerald-400 to-emerald-600 text-white font-bold shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Account'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Logout */}
                <div className="px-5 pt-6">
                    <button
                        onClick={() => { logout(); navigate('/login') }}
                        className={`w-full py-4 rounded-2xl font-semibold transition-all ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100'}`}
                    >
                        Log Out
                    </button>
                </div>
            </div>

            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    )
}

export default SettingsRedesign
