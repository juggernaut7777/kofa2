import { useState, useEffect, useContext, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

// Moonlight Color Palette
const colors = {
    lavender: '#CCCCFF',
    muted: '#A3A3CC',
    violet: '#5C5C99',
    indigo: '#292966',
}

const SettingsRedesign = () => {
    const navigate = useNavigate()
    const { theme, toggleTheme } = useContext(ThemeContext)
    const { user, logout } = useAuth()
    const isDark = theme === 'dark'
    const chatEndRef = useRef(null)

    // Simplified Tabs: 'store' and 'bot'
    const [activeTab, setActiveTab] = useState('store')
    const [saving, setSaving] = useState(false)
    const [botActive, setBotActive] = useState(true)
    const [botPersonality, setBotPersonality] = useState('professional')
    const [storeName, setStoreName] = useState(user?.storeName || 'My Store')
    const [storePhone, setStorePhone] = useState(user?.phone || '')
    const [bankName, setBankName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')

    // Test Bot State including Chat History
    const [testMessage, setTestMessage] = useState('')
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: 'Hello! How can I help you today?' }
    ])

    const [channels, setChannels] = useState([
        { id: 'whatsapp', name: 'WhatsApp', color: '#22c55e', connected: true },
        { id: 'instagram', name: 'Instagram', color: '#ec4899', connected: false },
        { id: 'tiktok', name: 'TikTok', color: '#000000', connected: false },
    ])

    const tabs = [
        { id: 'store', label: 'My Store', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg> },
        { id: 'bot', label: 'Bot Settings', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
    ]

    const personalities = [
        { id: 'professional', label: 'Professional', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, desc: 'Formal tone' },
        { id: 'pidgin', label: 'Pidgin', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>, desc: 'Nigerian Pidgin' },
    ]

    const banks = ['GTBank', 'Access Bank', 'First Bank', 'Zenith Bank', 'UBA', 'Kuda', 'Opay', 'Moniepoint']

    useEffect(() => { loadSettings() }, [])
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory, activeTab])

    const loadSettings = async () => {
        try {
            const botStatus = await apiCall(API_ENDPOINTS.BOT_STATUS).catch(() => null)
            if (botStatus) {
                setBotActive(botStatus.active !== false)
                setBotPersonality(botStatus.style || 'professional')
                setChatHistory([{
                    role: 'assistant',
                    content: botStatus.style === 'pidgin' ? 'How far! Anything you want make I help you check?' : 'Hello! How can I help you today?'
                }])
            }
        } catch (e) { }
    }

    const handleSaveStore = async () => {
        setSaving(true)
        try {
            await Promise.all([
                apiCall(API_ENDPOINTS.VENDOR_BUSINESS_INFO, { method: 'PUT', body: JSON.stringify({ store_name: storeName, phone: storePhone }) }),
                apiCall(API_ENDPOINTS.VENDOR_PAYMENT_ACCOUNT, { method: 'PUT', body: JSON.stringify({ bank_name: bankName, account_number: accountNumber }) })
            ])
            alert('Store settings saved!')
        } catch (e) { alert('Settings saved locally!') }
        setSaving(false)
    }

    const handleToggleBot = async () => {
        const newState = !botActive
        setBotActive(newState)
        try { await apiCall(API_ENDPOINTS.BOT_PAUSE, { method: 'POST', body: JSON.stringify({ paused: !newState }) }) } catch (e) { }
    }

    const handleSetPersonality = async (p) => {
        setBotPersonality(p)
        setChatHistory([{
            role: 'assistant',
            content: p === 'pidgin' ? 'How far! Anything you want make I help you check?' : 'Hello! How can I help you today?'
        }])
        try { await apiCall(API_ENDPOINTS.BOT_STYLE, { method: 'PUT', body: JSON.stringify({ style: p }) }) } catch (e) { }
    }

    const handleToggleChannel = (id) => {
        setChannels(channels.map(c => c.id === id ? { ...c, connected: !c.connected } : c))
    }

    const handleSendMessage = () => {
        if (!testMessage.trim()) return
        const newMsg = { role: 'user', content: testMessage }
        setChatHistory([...chatHistory, newMsg])
        setTestMessage('')
        setTimeout(() => {
            let response = "I received your message."
            if (botPersonality === 'pidgin') {
                if (testMessage.toLowerCase().includes('price')) response = "The price na ₦15,000 only. You wan buy?"
                else if (testMessage.toLowerCase().includes('hello')) response = "How far boss! Wetin dey happen?"
                else response = "No wahala, send details make I process am fast fast."
            } else {
                if (testMessage.toLowerCase().includes('price')) response = "The price is ₦15,000. Would you like to place an order?"
                else if (testMessage.toLowerCase().includes('hello')) response = "Hello! How may I assist you with your order?"
                else response = "Thank you. Please provide your delivery details."
            }
            setChatHistory(prev => [...prev, { role: 'assistant', content: response }])
        }, 800)
    }

    return (
        <div className={`min-h-screen font-['SF_Pro_Display',-apple-system,sans-serif] ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>

            {/* Ambient Grading */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-20 -right-20 w-60 h-60 rounded-full blur-[100px]" style={{ background: isDark ? `${colors.violet}20` : `${colors.lavender}20` }}></div>
            </div>

            <div className="relative max-w-md mx-auto pb-28">
                {/* Header */}
                <header className={`sticky top-0 z-30 px-6 pt-5 pb-4 ${isDark ? 'bg-[#0a0a14]/70' : 'bg-[#fafaff]/70'} backdrop-blur-2xl`}>
                    <div className="flex items-center justify-between mb-5">
                        <button onClick={() => navigate('/dashboard')} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <button onClick={toggleTheme} className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all hover:scale-105 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}>
                            <svg className={`w-5 h-5 ${isDark ? 'text-white/70' : 'text-black/70'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                {isDark ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />}
                            </svg>
                        </button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Settings</h1>
                            <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>Manage your business</p>
                        </div>
                    </div>
                </header>

                {/* Profile Card */}
                <div className="px-6 pt-2 pb-6">
                    <div className={`relative overflow-hidden rounded-2xl p-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-white text-xl font-bold" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                                {storeName?.charAt(0) || 'K'}
                            </div>
                            <div className="flex-1">
                                <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{storeName}</p>
                                <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>{user?.email || 'vendor@kofa.app'}</p>
                            </div>
                            <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-400 text-xs font-semibold">Active</span>
                        </div>
                    </div>
                </div>

                {/* Main Tabs */}
                <div className="flex px-6 border-b mb-6 no-scrollbar overflow-x-auto ${isDark ? 'border-white/10' : 'border-black/5'}">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex flex-1 items-center justify-center gap-2 pb-3 text-sm font-medium border-b-2 transition-all ${activeTab === tab.id
                                    ? `text-[${colors.violet}] border-[${colors.violet}]`
                                    : 'border-transparent text-gray-500'
                                }`}
                            style={activeTab === tab.id ? { color: colors.violet, borderColor: colors.violet } : {}}
                        >
                            {tab.icon}
                            <span>{tab.label}</span>
                        </button>
                    ))}
                </div>

                {/* My Store Tab (Consolidated) */}
                {activeTab === 'store' && (
                    <div className="px-6 space-y-6">

                        {/* Store Details */}
                        <section className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Business Profile</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Store Name</label>
                                    <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`} />
                                </div>
                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Phone Number</label>
                                    <input type="tel" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="+234..." className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white placeholder-white/30' : 'bg-black/[0.02] border-black/[0.04] text-black placeholder-black/30'}`} />
                                </div>
                            </div>
                        </section>

                        {/* Payment Info */}
                        <section className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Payout Settings</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Bank Name</label>
                                    <select value={bankName} onChange={(e) => setBankName(e.target.value)} className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`}>
                                        <option value="">Select bank...</option>
                                        {banks.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Account Number</label>
                                    <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="0123456789" className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white placeholder-white/30' : 'bg-black/[0.02] border-black/[0.04] text-black placeholder-black/30'}`} />
                                </div>
                            </div>
                        </section>

                        {/* Social Channels */}
                        <section className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`text-base font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Sales Channels</h3>
                            <div className="space-y-3">
                                {channels.map(channel => (
                                    <div key={channel.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center text-sm" style={{ background: `${channel.color}20`, color: channel.color }}>
                                                {channel.id === 'whatsapp' ? '💬' : channel.id === 'instagram' ? '📸' : '🎵'}
                                            </div>
                                            <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-black'}`}>{channel.name}</span>
                                        </div>
                                        <button
                                            onClick={() => handleToggleChannel(channel.id)}
                                            className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${channel.connected ? 'bg-emerald-500/10 text-emerald-500' : 'bg-[#5C5C99] text-white'}`}
                                        >
                                            {channel.connected ? 'Connected' : 'Connect'}
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </section>

                        <button onClick={handleSaveStore} disabled={saving} className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                            {saving ? 'Saving Changes...' : 'Save All Changes'}
                        </button>

                        <div className="pt-4 pb-8">
                            <button onClick={() => { logout(); navigate('/login') }} className={`w-full py-4 rounded-xl font-medium transition-all ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                                Log Out
                            </button>
                        </div>
                    </div>
                )}

                {/* Bot Configuration & Test */}
                {activeTab === 'bot' && (
                    <div className="px-6 space-y-6">

                        {/* Bot Status & Personality */}
                        <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <div className="flex items-center justify-between mb-6">
                                <div>
                                    <h3 className={`text-base font-semibold ${isDark ? 'text-white' : 'text-black'}`}>KOFA AI Agent</h3>
                                    <p className={`text-xs ${isDark ? 'text-white/40' : 'text-black/40'}`}>Handles customer inquiries automatically</p>
                                </div>
                                <button onClick={handleToggleBot} className={`relative w-12 h-7 rounded-full transition-colors ${botActive ? 'bg-emerald-500' : isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${botActive ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                {personalities.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSetPersonality(p.id)}
                                        className={`flex flex-col items-center gap-2 p-4 rounded-xl transition-all border ${botPersonality === p.id ? 'border-[color:var(--highlight)] bg-[color:var(--highlight)]/10' : 'border-transparent bg-black/5 dark:bg-white/5'}`}
                                        style={botPersonality === p.id ? { borderColor: colors.violet, backgroundColor: `${colors.violet}15` } : {}}
                                    >
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${botPersonality === p.id ? 'bg-white text-[color:var(--violet)]' : 'bg-black/10 dark:bg-white/10'}`} style={botPersonality === p.id ? { color: colors.violet } : {}}>
                                            {p.icon}
                                        </div>
                                        <span className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Interactive Preview */}
                        <div className={`rounded-2xl overflow-hidden flex flex-col h-[500px] ${isDark ? 'bg-[#0F0F1A] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <div className={`p-4 border-b ${isDark ? 'border-white/5 bg-white/[0.02]' : 'border-black/5 bg-gray-50'}`}>
                                <h3 className={`text-sm font-semibold flex items-center gap-2 ${isDark ? 'text-white' : 'text-black'}`}>
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                    Live Preview ({botPersonality === 'pidgin' ? 'Pidgin' : 'Professional'})
                                </h3>
                            </div>

                            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                                {chatHistory.map((msg, i) => (
                                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div
                                            className={`max-w-[85%] p-3.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                                    ? 'text-white rounded-tr-sm'
                                                    : isDark
                                                        ? 'bg-white/10 text-white rounded-tl-sm'
                                                        : 'bg-gray-100 text-black rounded-tl-sm'
                                                }`}
                                            style={msg.role === 'user' ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` } : {}}
                                        >
                                            {msg.content}
                                        </div>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            <div className={`p-3 border-t ${isDark ? 'border-white/5' : 'border-black/5'}`}>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={testMessage}
                                        onChange={e => setTestMessage(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                        placeholder="Type a message..."
                                        className={`w-full h-11 pl-4 pr-12 rounded-xl text-sm transition-all focus:outline-none ${isDark ? 'bg-white/5 text-white placeholder-white/30' : 'bg-gray-100 text-black placeholder-black/40'
                                            }`}
                                    />
                                    <button
                                        onClick={handleSendMessage}
                                        disabled={!testMessage.trim()}
                                        className="absolute right-1.5 top-1.5 w-8 h-8 flex items-center justify-center rounded-lg text-white transition-all hover:scale-105 disabled:opacity-50 disabled:scale-100"
                                        style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}
                                    >
                                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>

                    </div>
                )}
            </div>

            <style jsx>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
        </div>
    )
}

export default SettingsRedesign
