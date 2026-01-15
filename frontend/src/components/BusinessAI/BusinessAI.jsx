import React, { useState, useRef, useEffect, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import { Send, X, MessageCircle, Mic, Plus, Package, AlertCircle } from 'lucide-react'

const BusinessAI = ({ userId = 'demo-user' }) => {
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'
    const location = useLocation()

    // Hide on public shop pages
    const isShopPage = location.pathname.startsWith('/shop')
    if (isShopPage) return null

    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: "Hi! I'm your KOFA Assistant. How can I help you today?",
            type: 'text',
            suggestions: ["Show today's sales", "Low stock items", "Add expense"]
        }
    ])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [connectionError, setConnectionError] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        if (isOpen) {
            scrollToBottom()
            setTimeout(() => inputRef.current?.focus(), 100)
        }
    }, [messages, isOpen])

    const sendMessage = async (text = input) => {
        if (!text.trim() || loading) return

        const userMessage = text.trim()
        setInput('')
        setConnectionError(false)
        setMessages(prev => [...prev, { role: 'user', content: userMessage, type: 'text' }])
        setLoading(true)

        try {
            const data = await apiCall(API_ENDPOINTS.BUSINESS_AI, {
                method: 'POST',
                body: JSON.stringify({
                    user_id: userId,
                    message: userMessage
                })
            })

            let aiContent = data.response || "I'm here to help!"
            if (data.action_taken) aiContent += `\n\n✅ ${data.action_taken}`

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: aiContent,
                type: 'text',
                suggestions: data.suggestions || []
            }])
        } catch (error) {
            console.error('AI Error:', error)
            setConnectionError(true)
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: "I couldn't connect to the backend. Please check that the Heroku server is running.",
                type: 'error'
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // Small button in top right - MESSAGE ICON
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                className={`fixed top-4 right-4 z-40 flex items-center gap-2 px-3 py-2 rounded-lg font-medium text-sm transition-all ${isDark
                    ? 'bg-[#1A1A1F] border border-white/10 text-white hover:bg-[#252530]'
                    : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 shadow-sm'
                    }`}
            >
                <MessageCircle size={18} className="text-[#0095FF]" />
                <span>Ask KOFA AI</span>
            </button>
        )
    }

    // Full page AI
    return (
        <div className={`fixed inset-0 z-50 flex flex-col ${isDark ? 'bg-[#0F0F12]' : 'bg-white'}`}>
            {/* Header */}
            <header className={`flex items-center justify-between px-4 py-3 border-b ${isDark ? 'border-white/10' : 'border-gray-100'}`}>
                <button onClick={() => setIsOpen(false)} className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                    <X size={24} className={isDark ? 'text-white' : 'text-gray-700'} />
                </button>
                <div className="text-center">
                    <h1 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>KOFA AI Assistant</h1>
                    <div className={`flex items-center justify-center gap-1 text-xs ${connectionError ? 'text-red-500' : 'text-green-500'}`}>
                        <span className={`w-2 h-2 rounded-full ${connectionError ? 'bg-red-500' : 'bg-green-500'}`}></span>
                        {connectionError ? 'Reconnecting...' : 'Online'}
                    </div>
                </div>
                <div className="w-10"></div>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div className="text-center">
                    <span className={`text-xs px-3 py-1 rounded-full ${isDark ? 'bg-white/10 text-gray-400' : 'bg-gray-100 text-gray-500'}`}>Today</span>
                </div>

                {messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'assistant' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${msg.type === 'error' ? 'bg-red-100' : 'bg-[#E6F4FF]'}`}>
                                {msg.type === 'error' ? <AlertCircle size={16} className="text-red-500" /> : <Package size={16} className="text-[#0095FF]" />}
                            </div>
                        )}

                        <div className="max-w-[80%] space-y-2">
                            <div className={`p-3 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'bg-[#0095FF] text-white rounded-br-sm'
                                : msg.type === 'error'
                                    ? isDark ? 'bg-red-500/20 border border-red-500/30 text-red-400 rounded-bl-sm' : 'bg-red-50 border border-red-200 text-red-600 rounded-bl-sm'
                                    : isDark ? 'bg-[#1A1A1F] border border-white/10 text-white rounded-bl-sm' : 'bg-gray-100 text-gray-900 rounded-bl-sm'
                                }`}>
                                {msg.content}
                            </div>

                            {msg.suggestions?.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {msg.suggestions.map((s, j) => (
                                        <button key={j} onClick={() => sendMessage(s)}
                                            className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${isDark ? 'border-white/20 text-gray-300 hover:bg-white/10' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                                                }`}>
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ml-2 flex-shrink-0 ${isDark ? 'bg-white/10' : 'bg-gray-200'}`}>
                                <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-500'}`}>You</span>
                            </div>
                        )}
                    </div>
                ))}

                {loading && (
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#E6F4FF] flex items-center justify-center">
                            <Package size={16} className="text-[#0095FF]" />
                        </div>
                        <div className={`p-3 rounded-2xl ${isDark ? 'bg-[#1A1A1F]' : 'bg-gray-100'}`}>
                            <div className="flex gap-1">
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                            </div>
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className={`p-4 border-t ${isDark ? 'border-white/10 bg-[#0F0F12]' : 'border-gray-100 bg-white'}`}>
                <div className="flex items-center gap-2">
                    <button className={`p-2 rounded-lg ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-100'}`}>
                        <Plus size={22} className="text-[#0095FF]" />
                    </button>
                    <div className={`flex-1 flex items-center px-4 py-2 rounded-full ${isDark ? 'bg-[#1A1A1F]' : 'bg-gray-100'}`}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask KOFA anything..."
                            className={`flex-1 bg-transparent outline-none text-sm ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                        />
                        <button className={`p-1 rounded-full ${isDark ? 'hover:bg-white/10' : 'hover:bg-gray-200'}`}>
                            <Mic size={18} className={isDark ? 'text-gray-500' : 'text-gray-400'} />
                        </button>
                    </div>
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        className="w-10 h-10 bg-[#0095FF] text-white rounded-full flex items-center justify-center disabled:opacity-50">
                        <Send size={18} />
                    </button>
                </div>
            </div>
        </div>
    )
}

export default BusinessAI
