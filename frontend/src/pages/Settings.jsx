import { useState, useEffect, useContext } from 'react'
import { apiCall, API_ENDPOINTS, API_BASE_URL } from '../config/api'
import { useAuth } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'

const Settings = () => {
    const { user } = useAuth()
    const { theme } = useContext(ThemeContext)

    // Bot Settings
    const [botActive, setBotActive] = useState(true)
    const [botStyle, setBotStyle] = useState('professional') // professional or pidgin
    const [botToggleLoading, setBotToggleLoading] = useState(false)

    // Payment/Account Details
    const [accountDetails, setAccountDetails] = useState({
        bankName: '',
        accountNumber: '',
        accountName: ''
    })

    // Social Connections
    const [connections, setConnections] = useState({
        whatsapp: { connected: false, phone: '' },
        instagram: { connected: false, username: '' },
        tiktok: { connected: false, username: '' }
    })

    const [saving, setSaving] = useState(false)
    const [activeSection, setActiveSection] = useState('bot')

    // Test Bot Chat
    const [testMessages, setTestMessages] = useState([
        { role: 'bot', text: 'Hello! I am your KOFA AI Sales Bot. Ask me about any products or say something a customer might ask.' }
    ])
    const [testInput, setTestInput] = useState('')
    const [testLoading, setTestLoading] = useState(false)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const response = await apiCall(API_ENDPOINTS.BOT_STATUS)
            setBotActive(!response.is_paused)
            setBotStyle(response.style || 'professional')
        } catch (error) {
            console.error('Failed to load settings:', error)
        }

        // Load account details from backend API
        try {
            const paymentData = await apiCall(API_ENDPOINTS.VENDOR_PAYMENT_ACCOUNT)
            if (paymentData && paymentData.payment_account) {
                const account = paymentData.payment_account
                setAccountDetails({
                    bankName: account.bank_name || '',
                    accountNumber: account.account_number || '',
                    accountName: account.account_name || ''
                })
            }
        } catch (error) {
            console.error('Failed to load payment account:', error)
            // Fallback to localStorage
            const savedAccount = localStorage.getItem('kofa_account_details')
            if (savedAccount) {
                setAccountDetails(JSON.parse(savedAccount))
            }
        }

        const savedConnections = localStorage.getItem('kofa_connections')
        if (savedConnections) {
            setConnections(JSON.parse(savedConnections))
        }
    }

    const toggleBot = async () => {
        setBotToggleLoading(true)
        try {
            await apiCall(API_ENDPOINTS.BOT_PAUSE, {
                method: 'POST',
                body: JSON.stringify({ paused: botActive })
            })
            setBotActive(!botActive)
        } catch (error) {
            console.error('Failed to toggle bot:', error)
            setBotActive(!botActive)
        } finally {
            setBotToggleLoading(false)
        }
    }

    const saveBotStyle = async (style) => {
        setBotStyle(style)
        try {
            await fetch(`${API_BASE_URL}/bot/style`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ style })
            })
        } catch (error) {
            console.error('Failed to save bot style:', error)
        }
    }

    const saveAccountDetails = async () => {
        setSaving(true)
        try {
            // Save to backend API so bot can access bank details
            await apiCall(API_ENDPOINTS.VENDOR_PAYMENT_ACCOUNT, {
                method: 'PUT',
                body: JSON.stringify({
                    bank_name: accountDetails.bankName,
                    account_number: accountDetails.accountNumber,
                    account_name: accountDetails.accountName
                })
            })

            // Also save to localStorage for quick loading
            localStorage.setItem('kofa_account_details', JSON.stringify(accountDetails))
            alert('Bank details saved! Bot will now show these details to customers.')
        } catch (error) {
            console.error('Failed to save account details:', error)
            alert('Failed to save. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    const connectSocial = (platform) => {
        // In production, this would open OAuth flow
        const updated = {
            ...connections,
            [platform]: {
                connected: true,
                phone: platform === 'whatsapp' ? '+234...' : '',
                username: platform !== 'whatsapp' ? '@yourhandle' : ''
            }
        }
        setConnections(updated)
        localStorage.setItem('kofa_connections', JSON.stringify(updated))
    }

    const disconnectSocial = (platform) => {
        const updated = {
            ...connections,
            [platform]: { connected: false, phone: '', username: '' }
        }
        setConnections(updated)
        localStorage.setItem('kofa_connections', JSON.stringify(updated))
    }

    const sendTestMessage = async () => {
        if (!testInput.trim()) return

        const userMessage = testInput.trim()
        setTestMessages(prev => [...prev, { role: 'user', text: userMessage }])
        setTestInput('')
        setTestLoading(true)

        try {
            // Call the message endpoint
            const response = await fetch(`${API_BASE_URL}/message`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message_text: userMessage,
                    user_id: '+234test'
                })
            })

            if (response.ok) {
                const data = await response.json()
                const botResponse = data.reply || data.response || data.message || 'Sorry, I could not process that request.'
                setTestMessages(prev => [...prev, { role: 'bot', text: botResponse }])
            } else {
                setTestMessages(prev => [...prev, { role: 'bot', text: '⚠️ Error: Could not reach the bot. Check if Heroku is deployed.' }])
            }
        } catch {
            setTestMessages(prev => [...prev, { role: 'bot', text: '⚠️ Connection failed. Make sure the backend is running.' }])
        } finally {
            setTestLoading(false)
        }
    }

    const sections = [
        { id: 'bot', label: 'AI Bot', icon: '🤖' },
        { id: 'payment', label: 'Payment', icon: '💳' },
        { id: 'connections', label: 'Channels', icon: '📱' },
        { id: 'support', label: 'Support', icon: '🆘' }
    ]

    return (
        <div className={`min-h-screen ${theme === 'dark' ? 'bg-dark-bg' : 'bg-slate-50'}`}>
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className={`text-3xl font-bold ${theme === 'dark' ? 'text-white' : 'text-kofa-navy'}`}>
                        Settings
                    </h1>
                    <p className={`mt-2 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                        Configure your AI bot, payment details, and social channels
                    </p>
                </div>

                {/* Section Tabs */}
                <div className={`flex space-x-1 p-1 rounded-xl mb-8 ${theme === 'dark' ? 'bg-dark-card' : 'bg-gray-100'}`}>
                    {sections.map((section) => (
                        <button
                            key={section.id}
                            onClick={() => setActiveSection(section.id)}
                            className={`flex-1 py-3 px-4 rounded-lg text-sm font-medium transition-all ${activeSection === section.id
                                ? theme === 'dark'
                                    ? 'bg-kofa-cobalt text-white'
                                    : 'bg-white text-kofa-navy shadow-sm'
                                : theme === 'dark'
                                    ? 'text-gray-400 hover:text-white'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <span className="mr-2">{section.icon}</span>
                            {section.label}
                        </button>
                    ))}
                </div>

                {/* Bot Settings */}
                {activeSection === 'bot' && (
                    <div className="space-y-6">
                        {/* Bot Status */}
                        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <div className={`p-4 rounded-xl ${botActive ? 'bg-success/20' : 'bg-gray-500/20'}`}>
                                        <span className="text-3xl">{botActive ? '🤖' : '😴'}</span>
                                    </div>
                                    <div>
                                        <h3 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                            AI Sales Bot
                                        </h3>
                                        <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
                                            {botActive ? 'Actively responding to customers' : 'Paused - customers will not receive auto-replies'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={toggleBot}
                                    disabled={botToggleLoading}
                                    className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors ${botActive ? 'bg-success' : theme === 'dark' ? 'bg-dark-border' : 'bg-gray-300'
                                        } ${botToggleLoading ? 'opacity-50' : ''}`}
                                >
                                    <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${botActive ? 'translate-x-7' : 'translate-x-1'
                                        }`} />
                                </button>
                            </div>
                        </div>

                        {/* Bot Style */}
                        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
                            <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Response Style
                            </h3>
                            <p className={`mb-4 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Choose how your AI bot communicates with customers
                            </p>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    onClick={() => saveBotStyle('professional')}
                                    className={`p-4 rounded-xl border-2 transition-all ${botStyle === 'professional'
                                        ? 'border-kofa-cobalt bg-kofa-cobalt/10'
                                        : theme === 'dark' ? 'border-dark-border hover:border-kofa-cobalt/50' : 'border-gray-200 hover:border-kofa-cobalt/50'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">👔</div>
                                    <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Professional</div>
                                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Formal business English
                                    </div>
                                </button>
                                <button
                                    onClick={() => saveBotStyle('pidgin')}
                                    className={`p-4 rounded-xl border-2 transition-all ${botStyle === 'pidgin'
                                        ? 'border-kofa-cobalt bg-kofa-cobalt/10'
                                        : theme === 'dark' ? 'border-dark-border hover:border-kofa-cobalt/50' : 'border-gray-200 hover:border-kofa-cobalt/50'
                                        }`}
                                >
                                    <div className="text-3xl mb-2">🇳🇬</div>
                                    <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Pidgin</div>
                                    <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                        Nigerian Pidgin English
                                    </div>
                                </button>
                            </div>
                        </div>

                        {/* Sample Response */}
                        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
                            <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Sample Response
                            </h3>
                            <div className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gray-50'}`}>
                                <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
                                    {botStyle === 'professional'
                                        ? '"Hello! Thank you for your interest. Yes, we have this item in stock. The price is ₦25,000. Would you like me to create a payment link for you?"'
                                        : '"Hey! How far? Yes o, we get am for stock. Na ₦25,000. You wan make I send payment link?"'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Test Bot Chat */}
                        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
                            <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                🧪 Test Your Bot
                            </h3>
                            <p className={`mb-4 text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Simulate customer messages to see how your AI bot responds
                            </p>

                            {/* Chat Window */}
                            <div className={`h-64 overflow-y-auto mb-4 p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gray-50'}`}>
                                {testMessages.map((msg, idx) => (
                                    <div key={idx} className={`mb-3 ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                                        <div className={`inline-block max-w-[80%] px-4 py-2 rounded-2xl ${msg.role === 'user'
                                            ? 'bg-kofa-cobalt text-white'
                                            : theme === 'dark' ? 'bg-dark-border text-white' : 'bg-gray-200 text-gray-900'
                                            }`}>
                                            {msg.text}
                                        </div>
                                    </div>
                                ))}
                                {testLoading && (
                                    <div className="text-left mb-3">
                                        <div className={`inline-block px-4 py-2 rounded-2xl ${theme === 'dark' ? 'bg-dark-border' : 'bg-gray-200'}`}>
                                            <span className="animate-pulse">Typing...</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Input */}
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={testInput}
                                    onChange={(e) => setTestInput(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && sendTestMessage()}
                                    placeholder="Type a customer message... (e.g., 'Do you have sneakers?')"
                                    className={`flex-1 px-4 py-3 rounded-xl border ${theme === 'dark' ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500' : 'bg-white border-gray-300 text-gray-900'}`}
                                />
                                <button
                                    onClick={sendTestMessage}
                                    disabled={testLoading || !testInput.trim()}
                                    className="px-6 py-3 bg-kofa-cobalt text-white rounded-xl font-medium hover:bg-kofa-navy disabled:opacity-50"
                                >
                                    Send
                                </button>
                            </div>

                            {/* Quick test messages */}
                            <div className="flex flex-wrap gap-2 mt-4">
                                {['Do you have sneakers?', 'What shoes do you sell?', 'How much is the red one?', 'I want to buy'].map((msg) => (
                                    <button
                                        key={msg}
                                        onClick={() => { setTestInput(msg); }}
                                        className={`text-xs px-3 py-1 rounded-full ${theme === 'dark' ? 'bg-dark-border text-gray-300 hover:bg-kofa-cobalt/30' : 'bg-gray-100 text-gray-600 hover:bg-kofa-cobalt/20'}`}
                                    >
                                        {msg}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Payment/Account */}
                {activeSection === 'payment' && (
                    <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
                        <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                            Payment Account Details
                        </h3>
                        <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                            These details will be sent to customers when they want to pay
                        </p>

                        <div className="space-y-4">
                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Bank Name
                                </label>
                                <input
                                    type="text"
                                    value={accountDetails.bankName}
                                    onChange={(e) => setAccountDetails({ ...accountDetails, bankName: e.target.value })}
                                    placeholder="e.g., GTBank, Access Bank"
                                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                        ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    value={accountDetails.accountNumber}
                                    onChange={(e) => setAccountDetails({ ...accountDetails, accountNumber: e.target.value })}
                                    placeholder="0123456789"
                                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                        ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                />
                            </div>

                            <div>
                                <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                                    Account Name
                                </label>
                                <input
                                    type="text"
                                    value={accountDetails.accountName}
                                    onChange={(e) => setAccountDetails({ ...accountDetails, accountName: e.target.value })}
                                    placeholder="Your business name"
                                    className={`w-full px-4 py-3 rounded-xl border ${theme === 'dark'
                                        ? 'bg-dark-bg border-dark-border text-white placeholder-gray-500'
                                        : 'bg-white border-gray-300 text-gray-900'
                                        }`}
                                />
                            </div>

                            <button
                                onClick={saveAccountDetails}
                                disabled={saving}
                                className="w-full bg-kofa-cobalt text-white py-3 px-6 rounded-xl hover:bg-kofa-navy transition-colors font-semibold disabled:opacity-50"
                            >
                                {saving ? 'Saving...' : 'Save Account Details'}
                            </button>
                        </div>
                    </div>
                )}

                {/* Social Connections */}
                {activeSection === 'connections' && (
                    <div className="space-y-4">
                        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
                            <h3 className={`text-lg font-bold mb-2 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Sales Channels
                            </h3>
                            <p className={`mb-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                Connect your social media accounts to receive and respond to customer messages
                            </p>

                            <div className="space-y-4">
                                {/* WhatsApp */}
                                <div className={`flex items-center justify-between p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gray-50'}`}>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
                                            <span className="text-2xl">💬</span>
                                        </div>
                                        <div>
                                            <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>WhatsApp Business</div>
                                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {connections.whatsapp.connected ? connections.whatsapp.phone : 'Not connected'}
                                            </div>
                                        </div>
                                    </div>
                                    {connections.whatsapp.connected ? (
                                        <button
                                            onClick={() => disconnectSocial('whatsapp')}
                                            className="px-4 py-2 text-danger border border-danger/30 rounded-lg hover:bg-danger/10"
                                        >
                                            Disconnect
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => connectSocial('whatsapp')}
                                            className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                                        >
                                            Connect
                                        </button>
                                    )}
                                </div>

                                {/* Instagram */}
                                <div className={`flex items-center justify-between p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gray-50'}`}>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                                            <span className="text-2xl">📷</span>
                                        </div>
                                        <div>
                                            <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Instagram</div>
                                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {connections.instagram.connected ? connections.instagram.username : 'Not connected'}
                                            </div>
                                        </div>
                                    </div>
                                    {connections.instagram.connected ? (
                                        <button
                                            onClick={() => disconnectSocial('instagram')}
                                            className="px-4 py-2 text-danger border border-danger/30 rounded-lg hover:bg-danger/10"
                                        >
                                            Disconnect
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => connectSocial('instagram')}
                                            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:opacity-90"
                                        >
                                            Connect
                                        </button>
                                    )}
                                </div>

                                {/* TikTok */}
                                <div className={`flex items-center justify-between p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-bg' : 'bg-gray-50'}`}>
                                    <div className="flex items-center space-x-4">
                                        <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center">
                                            <span className="text-2xl">🎵</span>
                                        </div>
                                        <div>
                                            <div className={`font-semibold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>TikTok</div>
                                            <div className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                                {connections.tiktok.connected ? connections.tiktok.username : 'Not connected'}
                                            </div>
                                        </div>
                                    </div>
                                    {connections.tiktok.connected ? (
                                        <button
                                            onClick={() => disconnectSocial('tiktok')}
                                            className="px-4 py-2 text-danger border border-danger/30 rounded-lg hover:bg-danger/10"
                                        >
                                            Disconnect
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => connectSocial('tiktok')}
                                            className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                                        >
                                            Connect
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Support */}
                {activeSection === 'support' && (
                    <div className="space-y-6">
                        {/* Quick Help */}
                        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
                            <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Quick Help
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <a href="#" className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-bg hover:bg-dark-border' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                                    <div className="text-2xl mb-2">📖</div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Getting Started Guide</div>
                                </a>
                                <a href="#" className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-bg hover:bg-dark-border' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                                    <div className="text-2xl mb-2">🎥</div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Video Tutorials</div>
                                </a>
                                <a href="#" className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-bg hover:bg-dark-border' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                                    <div className="text-2xl mb-2">❓</div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>FAQ</div>
                                </a>
                                <a href="#" className={`p-4 rounded-xl ${theme === 'dark' ? 'bg-dark-bg hover:bg-dark-border' : 'bg-gray-50 hover:bg-gray-100'} transition-colors`}>
                                    <div className="text-2xl mb-2">💬</div>
                                    <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Live Chat</div>
                                </a>
                            </div>
                        </div>

                        {/* Contact */}
                        <div className={`rounded-xl p-6 ${theme === 'dark' ? 'bg-dark-card border border-dark-border' : 'bg-white shadow-sm'}`}>
                            <h3 className={`text-lg font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                Contact Support
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <span className="text-2xl">📧</span>
                                    <div>
                                        <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>Email</div>
                                        <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>support@kofa.ng</div>
                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-2xl">📱</span>
                                    <div>
                                        <div className={`font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>WhatsApp</div>
                                        <div className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>+234 800 KOFA</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Settings
