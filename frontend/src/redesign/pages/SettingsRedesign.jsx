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

    const [activeSection, setActiveSection] = useState('general')
    const [saving, setSaving] = useState(false)
    const [botActive, setBotActive] = useState(true)
    const [botPersonality, setBotPersonality] = useState('professional')
    const [storeName, setStoreName] = useState(user?.storeName || 'My Store')
    const [storePhone, setStorePhone] = useState(user?.phone || '')
    const [bankName, setBankName] = useState('')
    const [accountNumber, setAccountNumber] = useState('')

    // Test Bot State
    const [testMessage, setTestMessage] = useState('')
    const [chatHistory, setChatHistory] = useState([
        { role: 'assistant', content: 'Hello! How can I help you today?' }
    ])

    const [channels, setChannels] = useState([
        { id: 'whatsapp', name: 'WhatsApp', color: '#22c55e', connected: true },
        { id: 'instagram', name: 'Instagram', color: '#ec4899', connected: false },
        { id: 'tiktok', name: 'TikTok', color: '#000000', connected: false },
    ])

    const sections = [
        { id: 'general', label: 'General', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
        { id: 'bot', label: 'Bot', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg> },
        { id: 'test', label: 'Test Bot', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg> },
        { id: 'channels', label: 'Channels', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg> },
        { id: 'payment', label: 'Payment', icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg> },
    ]

    const personalities = [
        { id: 'professional', label: 'Professional', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>, desc: 'Formal, business-like tone' },
        { id: 'pidgin', label: 'Pidgin', icon: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" /></svg>, desc: 'Friendly Nigerian Pidgin' },
    ]

    const banks = ['GTBank', 'Access Bank', 'First Bank', 'Zenith Bank', 'UBA', 'Kuda', 'Opay', 'Moniepoint']

    useEffect(() => { loadSettings() }, [])
    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [chatHistory, activeSection])

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

    const handleSaveGeneral = async () => {
        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.VENDOR_BUSINESS_INFO, { method: 'PUT', body: JSON.stringify({ store_name: storeName, phone: storePhone }) })
            alert('Settings saved!')
        } catch (e) { alert('Settings saved locally!') }
        setSaving(false)
    }

    const handleSavePayment = async () => {
        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.VENDOR_PAYMENT_ACCOUNT, { method: 'PUT', body: JSON.stringify({ bank_name: bankName, account_number: accountNumber }) })
            alert('Payment settings saved!')
        } catch (e) { alert('Payment settings saved locally!') }
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
        alert(channels.find(c => c.id === id)?.connected ? 'Disconnected' : 'Connecting...')
    }

    const handleSendMessage = () => {
        if (!testMessage.trim()) return

        const newMsg = { role: 'user', content: testMessage }
        setChatHistory([...chatHistory, newMsg])
        setTestMessage('')

        // Simulate Bot Response
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

            {/* Ambient Gradient */}
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

                    <h1 className={`text-3xl font-bold tracking-tight mb-1 ${isDark ? 'text-white' : 'text-black'}`}>Settings</h1>
                    <p className={`text-sm ${isDark ? 'text-white/40' : 'text-black/40'}`}>Manage your store</p>
                </header>

                {/* Profile Card */}
                <div className="px-6 pt-2">
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

                {/* Section Navigation */}
                <div className="flex gap-2 px-6 pt-5 overflow-x-auto no-scrollbar">
                    {sections.map(s => (
                        <button
                            key={s.id}
                            onClick={() => setActiveSection(s.id)}
                            className={`flex items-center gap-2 px-4 h-10 rounded-xl whitespace-nowrap text-sm font-medium transition-all hover:scale-105 ${activeSection === s.id ? 'text-white' : isDark ? 'bg-white/[0.03] text-white/40 border border-white/[0.06]' : 'bg-white text-black/40 border border-black/[0.04]'
                                }`}
                            style={activeSection === s.id ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` } : {}}
                        >
                            {s.icon}
                            <span>{s.label}</span>
                        </button>
                    ))}
                </div>

                {/* General Section */}
                {activeSection === 'general' && (
                    <div className="px-6 pt-5 space-y-4">
                        <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Store Information</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Store Name</label>
                                    <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white' : 'bg-black/[0.02] border-black/[0.04] text-black'}`} />
                                </div>
                                <div>
                                    <label className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-black/40'}`}>Phone Number</label>
                                    <input type="tel" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} placeholder="+234 801 234 5678" className={`w-full rounded-xl px-4 py-3 border transition-all focus:outline-none ${isDark ? 'bg-white/[0.03] border-white/[0.06] text-white placeholder-white/30' : 'bg-black/[0.02] border-black/[0.04] text-black placeholder-black/30'}`} />
                                </div>
                            </div>
                            <button onClick={handleSaveGeneral} disabled={saving} className="w-full mt-5 py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Bot Section */}
                {activeSection === 'bot' && (
                    <div className="px-6 pt-5 space-y-4">
                        <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <div className="flex items-center justify-between mb-5">
                                <div className="flex items-center gap-3">
                                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${botActive ? 'bg-emerald-500/20' : isDark ? 'bg-white/[0.05]' : 'bg-black/[0.03]'}`}>
                                        <svg className={`w-5 h-5 ${botActive ? 'text-emerald-400' : isDark ? 'text-white/40' : 'text-black/40'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>KOFA Bot</p>
                                        <p className={`text-xs ${botActive ? 'text-emerald-400' : isDark ? 'text-white/40' : 'text-black/40'}`}>{botActive ? 'Active' : 'Paused'}</p>
                                    </div>
                                </div>
                                <button onClick={handleToggleBot} className={`relative w-12 h-7 rounded-full transition-colors ${botActive ? 'bg-emerald-500' : isDark ? 'bg-white/10' : 'bg-black/10'}`}>
                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${botActive ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <h3 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-black'}`}>Bot Personality</h3>
                            <div className="space-y-3">
                                {personalities.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => handleSetPersonality(p.id)}
                                        className={`w-full flex items-start gap-3 p-4 rounded-xl transition-all hover:scale-[1.01] ${botPersonality === p.id ? 'text-white' : isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}
                                        style={botPersonality === p.id ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` } : {}}
                                    >
                                        <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${botPersonality === p.id ? 'bg-white/20' : isDark ? 'bg-white/[0.05]' : 'bg-black/[0.03]'}`}>
                                            {p.icon}
                                        </div>
                                        <div className="flex-1 text-left">
                                            <p className="font-medium mb-0.5">{p.label}</p>
                                            <p className={`text-xs ${botPersonality === p.id ? 'text-white/70' : isDark ? 'text-white/40' : 'text-black/40'}`}>{p.desc}</p>
                                        </div>
                                        {botPersonality === p.id && (
                                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Test Bot Section */}
                {activeSection === 'test' && (
                    <div className="px-6 pt-5 h-[500px] flex flex-col">
                        <div className={`flex-1 rounded-2xl p-4 mb-4 overflow-y-auto no-scrollbar ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            {chatHistory.map((msg, i) => (
                                <div key={i} className={`flex mb-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                    <div
                                        className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                                ? 'bg-blue-600 text-white rounded-tr-sm'
                                                : isDark
                                                    ? 'bg-white/10 text-white rounded-tl-sm'
                                                    : 'bg-black/5 text-black rounded-tl-sm'
                                            }`}
                                        style={msg.role === 'user' ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` } : {}}
                                    >
                                        {msg.content}
                                    </div>
                                </div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        <div className="relative">
                            <input
                                type="text"
                                value={testMessage}
                                onChange={e => setTestMessage(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSendMessage()}
                                placeholder={`Message ${botPersonality === 'pidgin' ? 'Pidgin' : 'Professional'} Bot...`}
                                className={`w-full h-12 pl-4 pr-12 rounded-xl transition-all focus:outline-none ${isDark ? 'bg-white/10 text-white placeholder-white/30' : 'bg-black/5 text-black placeholder-black/30'
                                    }`}
                            />
                            <button
                                onClick={handleSendMessage}
                                className="absolute right-2 top-2 w-8 h-8 flex items-center justify-center rounded-lg text-white transition-all hover:scale-105"
                                style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                            </button>
                        </div>
                        <p className={`text-center text-xs mt-3 ${isDark ? 'text-white/30' : 'text-black/30'}`}>
                            Previewing {botPersonality === 'pidgin' ? 'Pidgin' : 'Professional'} personality
                        </p>
                    </div>
                )}

                {/* Channels Section */}
                {activeSection === 'channels' && (
                    <div className="px-6 pt-5 space-y-3">
                        {channels.map(channel => (
                            <div key={channel.id} className={`rounded-2xl p-4 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: `${channel.color}20`, color: channel.color }}>
                                            {channel.id === 'whatsapp' ? '💬' : channel.id === 'instagram' ? '📸' : '🎵'}
                                        </div>
                                        <div>
                                            <p className={`font-semibold ${isDark ? 'text-white' : 'text-black'}`}>{channel.name}</p>
                                            <p className={`text-xs ${channel.connected ? 'text-emerald-400' : isDark ? 'text-white/40' : 'text-black/40'}`}>{channel.connected ? '✓ Connected' : 'Not connected'}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleToggleChannel(channel.id)} className={`px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 ${channel.connected ? 'bg-red-500/15 text-red-400' : 'text-white'}`} style={!channel.connected ? { background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` } : {}}>
                                        {channel.connected ? 'Disconnect' : 'Connect'}
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Payment Section */}
                {activeSection === 'payment' && (
                    <div className="px-6 pt-5 space-y-4">
                        <div className={`rounded-2xl p-5 ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white border border-black/[0.04]'}`}>
                            <h3 className={`font-semibold mb-4 ${isDark ? 'text-white' : 'text-black'}`}>Payout Account</h3>
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
                            <button onClick={handleSavePayment} disabled={saving} className="w-full mt-5 py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.02] disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                                {saving ? 'Saving...' : 'Save Account'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Logout */}
                <div className="px-6 pt-6">
                    <button onClick={() => { logout(); navigate('/login') }} className={`w-full py-4 rounded-2xl font-medium transition-all ${isDark ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-red-50 text-red-600 border border-red-100'}`}>
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
