import { useState, useEffect, useContext } from 'react'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'

const SettingsRedesign = () => {
    const { theme } = useContext(ThemeContext)
    const { user } = useAuth()
    const isDark = theme === 'dark'

    const [botActive, setBotActive] = useState(true)
    const [botPersonality, setBotPersonality] = useState('friendly')
    const [storeName, setStoreName] = useState('Lagos Trends')
    const [storePhone, setStorePhone] = useState('801 234 5678')
    const [bankName, setBankName] = useState('Guaranty Trust Bank')
    const [accountNumber, setAccountNumber] = useState('0123456789')
    const [accountName, setAccountName] = useState('LAGOS TRENDS LTD')
    const [saving, setSaving] = useState(false)

    const [channels, setChannels] = useState({
        whatsapp: { connected: true, status: 'Connected' },
        instagram: { connected: false, status: 'Not connected' }
    })

    const [testMessages, setTestMessages] = useState([
        { type: 'bot', text: 'Hello! Welcome to Lagos Trends. How can I help you today? 👋' },
        { type: 'user', text: 'Do you have the Nike Air Max in size 42?' },
        { type: 'bot', text: 'Let me check that for you immediately! 👟' },
    ])
    const [testInput, setTestInput] = useState('')
    const [botTyping, setBotTyping] = useState(false)

    const personalities = [
        { id: 'friendly', label: 'Friendly', icon: '😊' },
        { id: 'professional', label: 'Professional', icon: '👔' },
        { id: 'urgent', label: 'Urgent', icon: '⚡' },
    ]

    const banks = [
        'Guaranty Trust Bank',
        'Zenith Bank',
        'Access Bank',
        'First Bank of Nigeria',
        'United Bank for Africa',
        'Stanbic IBTC',
        'Fidelity Bank',
        'Union Bank',
    ]

    const handleSaveBusinessInfo = async () => {
        setSaving(true)
        try {
            await apiCall(API_ENDPOINTS.UPDATE_VENDOR, {
                method: 'PUT',
                body: JSON.stringify({ store_name: storeName, phone: storePhone })
            })
        } catch (error) {
            console.log('Saved locally')
        } finally {
            setSaving(false)
        }
    }

    const handleTestMessage = () => {
        if (!testInput.trim()) return

        setTestMessages(prev => [...prev, { type: 'user', text: testInput }])
        setTestInput('')
        setBotTyping(true)

        // Simulate bot response
        setTimeout(() => {
            setBotTyping(false)
            setTestMessages(prev => [...prev, {
                type: 'bot',
                text: `I found the Nike Air Max in size 42! It's ₦45,000. Would you like to order? 🛒`
            }])
        }, 1500)
    }

    const handleClearChat = () => {
        setTestMessages([
            { type: 'bot', text: 'Hello! Welcome to Lagos Trends. How can I help you today? 👋' }
        ])
    }

    const handleConnect = (platform) => {
        // Would trigger OAuth flow in real implementation
        setChannels(prev => ({
            ...prev,
            [platform]: { connected: true, status: 'Connected' }
        }))
    }

    const handleDisconnect = (platform) => {
        setChannels(prev => ({
            ...prev,
            [platform]: { connected: false, status: 'Not connected' }
        }))
    }

    return (
        <div className={`min-h-screen font-['Manrope'] ${isDark ? 'bg-[#102217] text-white' : 'bg-[#f6f8f7] text-[#111814]'}`}>
            <div className="max-w-md mx-auto pb-24">

                {/* Header */}
                <header className={`sticky top-0 z-20 flex items-center p-4 pb-2 justify-between border-b ${isDark ? 'bg-[#102217] border-white/5' : 'bg-white border-gray-100'
                    }`}>
                    <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10">
                        <span className="text-xl">←</span>
                    </button>
                    <h2 className="text-lg font-bold flex-1 text-center pr-10">Settings</h2>
                </header>

                <div className="flex-1 flex flex-col gap-6 p-4">

                    {/* Bot Settings Section */}
                    <section className={`flex flex-col gap-3 rounded-xl p-4 shadow-sm border ${isDark ? 'bg-[#1c3024] border-white/5' : 'bg-white border-gray-100'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#2bee79]/10 text-[#2bee79]">
                                <span className="text-xl">🤖</span>
                            </div>
                            <h3 className="text-lg font-bold">Bot Settings</h3>
                        </div>

                        {/* Active Status Toggle */}
                        <div className={`flex items-center gap-4 py-2 justify-between border-b border-dashed pb-4 ${isDark ? 'border-white/10' : 'border-gray-200'
                            }`}>
                            <div className="flex flex-col">
                                <p className="text-base font-semibold">Active Status</p>
                                <p className={`text-xs ${isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>Enable auto-responses</p>
                            </div>
                            <button
                                onClick={() => setBotActive(!botActive)}
                                className={`relative w-[51px] h-[31px] rounded-full p-0.5 transition-colors ${botActive ? 'bg-[#2bee79]' : isDark ? 'bg-[#2a3e32]' : 'bg-[#f0f4f2]'
                                    }`}
                            >
                                <div className={`h-full w-[27px] rounded-full bg-white shadow-sm transition-transform ${botActive ? 'translate-x-5' : 'translate-x-0'
                                    }`}></div>
                            </button>
                        </div>

                        {/* Personality Selector */}
                        <div className="flex flex-col gap-2 pt-2">
                            <p className="text-sm font-medium">Bot Personality</p>
                            <div className="flex gap-2 flex-wrap">
                                {personalities.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setBotPersonality(p.id)}
                                        className={`flex h-9 items-center justify-center gap-2 rounded-lg px-4 transition-all ${botPersonality === p.id
                                                ? 'bg-[#2bee79] text-[#111814] font-bold shadow-sm'
                                                : isDark ? 'bg-[#2a3e32] hover:bg-white/10' : 'bg-[#f0f4f2] hover:bg-gray-200'
                                            }`}
                                    >
                                        <span>{p.icon}</span>
                                        <span className="text-sm">{p.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </section>

                    {/* Business Info Section */}
                    <section className={`flex flex-col gap-4 rounded-xl p-4 shadow-sm border ${isDark ? 'bg-[#1c3024] border-white/5' : 'bg-white border-gray-100'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#2bee79]/10 text-[#2bee79]">
                                <span className="text-xl">🏪</span>
                            </div>
                            <h3 className="text-lg font-bold">Business Info</h3>
                        </div>

                        {/* Logo Upload */}
                        <div className="flex justify-center py-2">
                            <div className="relative group cursor-pointer">
                                <div className={`w-24 h-24 rounded-full flex items-center justify-center overflow-hidden border-2 border-transparent group-hover:border-[#2bee79] transition-all ${isDark ? 'bg-[#2a3e32]' : 'bg-[#f0f4f2]'
                                    }`}>
                                    <span className="text-4xl">🏪</span>
                                </div>
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                    <span className="text-white text-2xl">📷</span>
                                </div>
                                <div className={`absolute bottom-0 right-0 bg-[#2bee79] rounded-full p-1.5 shadow-md border-2 ${isDark ? 'border-[#1c3024]' : 'border-white'}`}>
                                    <span className="text-xs">✏️</span>
                                </div>
                            </div>
                        </div>

                        {/* Inputs */}
                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className={`text-xs font-semibold uppercase tracking-wide ml-1 ${isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>
                                    Store Name
                                </label>
                                <input
                                    type="text"
                                    value={storeName}
                                    onChange={(e) => setStoreName(e.target.value)}
                                    placeholder="Enter store name"
                                    className={`w-full h-12 rounded-lg border-none px-4 focus:ring-2 focus:ring-[#2bee79] focus:outline-none transition-all ${isDark ? 'bg-[#2a3e32] text-white placeholder-[#637588]' : 'bg-[#f0f4f2] text-[#111814] placeholder-[#637588]'
                                        }`}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={`text-xs font-semibold uppercase tracking-wide ml-1 ${isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>
                                    Support Phone
                                </label>
                                <div className="relative">
                                    <div className={`absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 border-r pr-3 ${isDark ? 'border-white/10' : 'border-gray-300'
                                        }`}>
                                        <span className="text-lg">🇳🇬</span>
                                        <span className={`text-sm font-medium ${isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>+234</span>
                                    </div>
                                    <input
                                        type="tel"
                                        value={storePhone}
                                        onChange={(e) => setStorePhone(e.target.value)}
                                        placeholder="800 000 0000"
                                        className={`w-full h-12 rounded-lg border-none pl-28 pr-4 focus:ring-2 focus:ring-[#2bee79] focus:outline-none transition-all ${isDark ? 'bg-[#2a3e32] text-white placeholder-[#637588]' : 'bg-[#f0f4f2] text-[#111814] placeholder-[#637588]'
                                            }`}
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleSaveBusinessInfo}
                                disabled={saving}
                                className="w-full h-12 bg-[#2bee79] hover:bg-[#2bee79]/90 text-[#111814] font-bold rounded-lg mt-2 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                <span>{saving ? 'Saving...' : 'Save Changes'}</span>
                                {!saving && <span>✓</span>}
                            </button>
                        </div>
                    </section>

                    {/* Payment Account Section */}
                    <section className={`flex flex-col gap-4 rounded-xl p-4 shadow-sm border ${isDark ? 'bg-[#1c3024] border-white/5' : 'bg-white border-gray-100'
                        }`}>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-[#2bee79]/10 text-[#2bee79]">
                                <span className="text-xl">💳</span>
                            </div>
                            <h3 className="text-lg font-bold">Payment Account</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-1.5">
                                <label className={`text-xs font-semibold uppercase tracking-wide ml-1 ${isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>
                                    Bank Name
                                </label>
                                <div className="relative">
                                    <select
                                        value={bankName}
                                        onChange={(e) => setBankName(e.target.value)}
                                        className={`w-full h-12 appearance-none rounded-lg border-none px-4 focus:ring-2 focus:ring-[#2bee79] focus:outline-none transition-all ${isDark ? 'bg-[#2a3e32] text-white' : 'bg-[#f0f4f2] text-[#111814]'
                                            }`}
                                    >
                                        {banks.map(b => <option key={b} value={b}>{b}</option>)}
                                    </select>
                                    <div className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 ${isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>
                                        ▼
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={`text-xs font-semibold uppercase tracking-wide ml-1 ${isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>
                                    Account Number
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={accountNumber}
                                        onChange={(e) => setAccountNumber(e.target.value)}
                                        className={`w-full h-12 rounded-lg border-none px-4 font-mono tracking-wider focus:ring-2 focus:ring-[#2bee79] focus:outline-none transition-all ${isDark ? 'bg-[#2a3e32] text-white' : 'bg-[#f0f4f2] text-[#111814]'
                                            }`}
                                    />
                                    <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2bee79]">
                                        ✓
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className={`text-xs font-semibold uppercase tracking-wide ml-1 ${isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>
                                    Account Name
                                </label>
                                <input
                                    type="text"
                                    value={accountName}
                                    disabled
                                    className={`w-full h-12 rounded-lg border border-dashed px-4 opacity-70 cursor-not-allowed ${isDark ? 'border-white/20 bg-transparent text-[#a0b0a8]' : 'border-gray-300 bg-transparent text-[#637588]'
                                        }`}
                                />
                            </div>
                        </div>
                    </section>

                    {/* Social Connections Section */}
                    <section className={`flex flex-col gap-0 rounded-xl overflow-hidden shadow-sm border ${isDark ? 'bg-[#1c3024] border-white/5' : 'bg-white border-gray-100'
                        }`}>
                        <div className="flex items-center gap-3 p-4 pb-2">
                            <div className="p-2 rounded-lg bg-[#2bee79]/10 text-[#2bee79]">
                                <span className="text-xl">🔗</span>
                            </div>
                            <h3 className="text-lg font-bold">Channels</h3>
                        </div>

                        <div className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
                            {/* WhatsApp */}
                            <div className={`flex items-center justify-between p-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-[#25D366]/10 flex items-center justify-center text-[#25D366]">
                                        💬
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">WhatsApp</p>
                                        <p className={`text-xs flex items-center gap-1 ${channels.whatsapp.connected ? 'text-[#2bee79]' : isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>
                                            {channels.whatsapp.connected && <span className="w-1.5 h-1.5 rounded-full bg-[#2bee79]"></span>}
                                            {channels.whatsapp.status}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => channels.whatsapp.connected ? handleDisconnect('whatsapp') : handleConnect('whatsapp')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${channels.whatsapp.connected
                                            ? 'text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100'
                                            : isDark ? 'bg-[#2a3e32] hover:bg-white/10' : 'bg-[#f0f4f2] hover:bg-gray-200'
                                        }`}
                                >
                                    {channels.whatsapp.connected ? 'Disconnect' : 'Connect'}
                                </button>
                            </div>

                            {/* Instagram */}
                            <div className={`flex items-center justify-between p-4 ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'}`}>
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-pink-500/10 flex items-center justify-center text-pink-600">
                                        📸
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm">Instagram</p>
                                        <p className={`text-xs ${channels.instagram.connected ? 'text-[#2bee79]' : isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>
                                            {channels.instagram.status}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => channels.instagram.connected ? handleDisconnect('instagram') : handleConnect('instagram')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${channels.instagram.connected
                                            ? 'text-red-500 bg-red-50 dark:bg-red-500/10 hover:bg-red-100'
                                            : isDark ? 'bg-[#2a3e32] hover:bg-white/10' : 'bg-[#f0f4f2] hover:bg-gray-200'
                                        }`}
                                >
                                    {channels.instagram.connected ? 'Disconnect' : 'Connect'}
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Test Bot Section */}
                    <section className={`flex flex-col gap-4 rounded-xl p-4 shadow-sm border relative overflow-hidden ${isDark ? 'bg-[#1c3024] border-white/5' : 'bg-white border-gray-100'
                        }`}>
                        <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none text-6xl">💬</div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-[#2bee79]/10 text-[#2bee79]">
                                    <span className="text-xl">🧪</span>
                                </div>
                                <h3 className="text-lg font-bold">Test Bot</h3>
                            </div>
                            <button onClick={handleClearChat} className={`text-xs hover:text-red-500 transition-colors ${isDark ? 'text-[#a0b0a8]' : 'text-[#637588]'}`}>
                                Clear Chat
                            </button>
                        </div>

                        {/* Chat Area */}
                        <div className={`rounded-lg p-4 h-64 overflow-y-auto flex flex-col gap-3 border ${isDark ? 'bg-[#0c1a12] border-white/5' : 'bg-[#f0f4f2] border-gray-100'
                            }`}>
                            {testMessages.map((msg, idx) => (
                                <div key={idx} className={`flex items-end gap-2 max-w-[85%] ${msg.type === 'user' ? 'self-end flex-row-reverse' : 'self-start'}`}>
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.type === 'bot' ? 'bg-[#2bee79] text-black text-[10px]' : isDark ? 'bg-gray-600' : 'bg-gray-300'
                                        }`}>
                                        {msg.type === 'bot' ? '🤖' : '👤'}
                                    </div>
                                    <div className={`p-3 rounded-2xl shadow-sm text-sm ${msg.type === 'bot'
                                            ? `${isDark ? 'bg-[#1c3024]' : 'bg-white'} ${msg.type === 'bot' ? 'rounded-bl-none' : 'rounded-br-none'}`
                                            : 'bg-[#2bee79] text-[#111814] rounded-br-none'
                                        }`}>
                                        <p>{msg.text}</p>
                                    </div>
                                </div>
                            ))}

                            {botTyping && (
                                <div className="flex items-end gap-2 self-start">
                                    <div className={`px-3 py-2 rounded-2xl rounded-bl-none shadow-sm flex gap-1 items-center ml-8 ${isDark ? 'bg-[#1c3024]' : 'bg-white'
                                        }`}>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Chat Input */}
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={testInput}
                                onChange={(e) => setTestInput(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleTestMessage()}
                                placeholder="Type a message..."
                                className={`flex-1 h-10 rounded-full border-none px-4 text-sm focus:ring-1 focus:ring-[#2bee79] focus:outline-none ${isDark ? 'bg-[#2a3e32] text-white placeholder-[#637588]' : 'bg-[#f0f4f2] text-[#111814] placeholder-[#637588]'
                                    }`}
                            />
                            <button
                                onClick={handleTestMessage}
                                className="w-10 h-10 rounded-full bg-[#2bee79] flex items-center justify-center shadow-sm hover:opacity-90 transition-colors shrink-0"
                            >
                                <span className="text-[#111814]">➤</span>
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    )
}

export default SettingsRedesign
