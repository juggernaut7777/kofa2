import React, { useState, useRef, useEffect, useContext } from 'react'
import { useLocation } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../../config/api'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
    Send, X, MessageCircle, Package, AlertCircle,
    TrendingUp, ShoppingBag, Wallet, BarChart3, Users, Zap
} from 'lucide-react'

const QUICK_ACTIONS = [
    { icon: TrendingUp, label: "Today's sales", message: "Show me today's sales summary" },
    { icon: ShoppingBag, label: "Low stock", message: "Which products are running low on stock?" },
    { icon: Wallet, label: "Add expense", message: "I want to record a new expense" },
    { icon: BarChart3, label: "Profit report", message: "Give me a profit and loss summary" },
    { icon: Users, label: "Top customers", message: "Who are my top 5 customers by spending?" },
    { icon: Zap, label: "Restock advice", message: "What products should I restock based on sales trends?" },
]

const BusinessAI = () => {
    const { theme } = useContext(ThemeContext)
    const { user } = useAuth()
    const isDark = theme === 'dark'
    const location = useLocation()

    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [input, setInput] = useState('')
    const [loading, setLoading] = useState(false)
    const [connectionError, setConnectionError] = useState(false)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    // All hooks are above — conditional return is safe here
    const isShopPage = location.pathname.startsWith('/shop')
    const publicPages = ['/', '/login', '/signup', '/verify', '/privacy', '/terms']
    const isPublicPage = publicPages.includes(location.pathname) || isShopPage
    if (!user || isPublicPage) return null

    const activeUserId = user?.id || 'demo-user'
    const firstName = user?.first_name || user?.firstName || 'there'

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
                    user_id: activeUserId,
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
                content: "I couldn't connect to the AI service. Please check your internet connection and try again.",
                type: 'error'
            }])
        } finally {
            setLoading(false)
        }
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage()
        }
    }

    // ─── COLLAPSED BUTTON ───
    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: 76,
                    right: 16,
                    zIndex: 45,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '10px 16px',
                    borderRadius: 50,
                    border: 'none',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: 13,
                    fontFamily: "'Inter', system-ui, sans-serif",
                    background: 'linear-gradient(135deg, #0095FF, #0070DD)',
                    color: '#fff',
                    boxShadow: '0 4px 20px rgba(0,149,255,0.35)',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.transform = 'scale(1.05)'
                    e.currentTarget.style.boxShadow = '0 6px 28px rgba(0,149,255,0.45)'
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.transform = 'scale(1)'
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,149,255,0.35)'
                }}
            >
                <MessageCircle size={18} />
                <span>KOFA AI</span>
            </button>
        )
    }

    // ─── FULL SCREEN AI ───
    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 55,
            display: 'flex',
            flexDirection: 'column',
            background: isDark ? '#0F0F12' : '#fff',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            {/* Header */}
            <header style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '12px 16px',
                borderBottom: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            }}>
                <button
                    onClick={() => setIsOpen(false)}
                    style={{
                        background: 'none', border: 'none', padding: 8, borderRadius: 10,
                        cursor: 'pointer', color: isDark ? '#fff' : '#374151',
                    }}
                >
                    <X size={22} />
                </button>
                <div style={{ textAlign: 'center' }}>
                    <h1 style={{
                        fontWeight: 700, fontSize: 16, margin: 0,
                        color: isDark ? '#fff' : '#111',
                    }}>KOFA AI Assistant</h1>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        gap: 4, fontSize: 11, marginTop: 2,
                        color: connectionError ? '#ef4444' : '#22c55e',
                    }}>
                        <span style={{
                            width: 6, height: 6, borderRadius: 99,
                            background: connectionError ? '#ef4444' : '#22c55e',
                        }} />
                        {connectionError ? 'Reconnecting...' : 'Online'}
                    </div>
                </div>
                <div style={{ width: 38 }} />
            </header>

            {/* Messages */}
            <div style={{
                flex: 1, overflowY: 'auto', padding: 16,
                display: 'flex', flexDirection: 'column', gap: 14,
            }}>
                {/* Welcome + Quick Actions (show when no messages) */}
                {messages.length === 0 && (
                    <div style={{
                        display: 'flex', flexDirection: 'column',
                        alignItems: 'center', justifyContent: 'center',
                        flex: 1, gap: 24, padding: '32px 0',
                    }}>
                        {/* Avatar */}
                        <div style={{
                            width: 56, height: 56, borderRadius: 16,
                            background: 'linear-gradient(135deg, #0095FF, #0070DD)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Package size={28} color="#fff" />
                        </div>
                        <div style={{ textAlign: 'center' }}>
                            <h2 style={{
                                fontWeight: 700, fontSize: 20, margin: 0,
                                color: isDark ? '#fff' : '#111',
                            }}>Hey {firstName}!</h2>
                            <p style={{
                                fontSize: 14, color: isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af',
                                marginTop: 4,
                            }}>How can I help you today?</p>
                        </div>

                        {/* Quick Actions Grid */}
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(2, 1fr)',
                            gap: 10, width: '100%', maxWidth: 400,
                        }}>
                            {QUICK_ACTIONS.map((action, i) => {
                                const Icon = action.icon
                                return (
                                    <button
                                        key={i}
                                        onClick={() => sendMessage(action.message)}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: 10,
                                            padding: '12px 14px', borderRadius: 14, border: 'none',
                                            cursor: 'pointer', textAlign: 'left',
                                            fontSize: 13, fontWeight: 500, fontFamily: 'inherit',
                                            background: isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6',
                                            color: isDark ? 'rgba(255,255,255,0.7)' : '#374151',
                                            transition: 'background 0.15s, transform 0.1s',
                                        }}
                                        onMouseEnter={e => {
                                            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb'
                                            e.currentTarget.style.transform = 'scale(1.02)'
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f3f4f6'
                                            e.currentTarget.style.transform = 'scale(1)'
                                        }}
                                    >
                                        <Icon size={16} style={{ color: '#0095FF', flexShrink: 0 }} />
                                        {action.label}
                                    </button>
                                )
                            })}
                        </div>
                    </div>
                )}

                {/* Chat Messages */}
                {messages.map((msg, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}>
                        {msg.role === 'assistant' && (
                            <div style={{
                                width: 32, height: 32, borderRadius: 99, flexShrink: 0,
                                marginRight: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: msg.type === 'error' ? '#fef2f2' : '#e6f4ff',
                            }}>
                                {msg.type === 'error'
                                    ? <AlertCircle size={16} color="#ef4444" />
                                    : <Package size={16} color="#0095FF" />
                                }
                            </div>
                        )}

                        <div style={{ maxWidth: '80%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                            <div style={{
                                padding: '10px 14px', borderRadius: 18, fontSize: 14, lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                                ...(msg.role === 'user'
                                    ? {
                                        background: '#0095FF', color: '#fff',
                                        borderBottomRightRadius: 4,
                                    }
                                    : msg.type === 'error'
                                        ? {
                                            background: isDark ? 'rgba(239,68,68,0.15)' : '#fef2f2',
                                            border: `1px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'}`,
                                            color: isDark ? '#fca5a5' : '#dc2626',
                                            borderBottomLeftRadius: 4,
                                        }
                                        : {
                                            background: isDark ? '#1A1A1F' : '#f3f4f6',
                                            border: isDark ? '1px solid rgba(255,255,255,0.06)' : 'none',
                                            color: isDark ? '#fff' : '#111',
                                            borderBottomLeftRadius: 4,
                                        }
                                )
                            }}>
                                {msg.content}
                            </div>

                            {msg.suggestions?.length > 0 && (
                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                    {msg.suggestions.map((s, j) => (
                                        <button key={j} onClick={() => sendMessage(s)}
                                            style={{
                                                fontSize: 12, padding: '6px 12px', borderRadius: 99,
                                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb'}`,
                                                background: 'none', cursor: 'pointer',
                                                fontFamily: 'inherit',
                                                color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280',
                                                transition: 'background 0.15s',
                                            }}
                                            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : '#f9fafb'}
                                            onMouseLeave={e => e.currentTarget.style.background = 'none'}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {msg.role === 'user' && (
                            <div style={{
                                width: 32, height: 32, borderRadius: 99, flexShrink: 0,
                                marginLeft: 8,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: isDark ? 'rgba(255,255,255,0.08)' : '#e5e7eb',
                                fontSize: 11, fontWeight: 600,
                                color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280',
                            }}>
                                You
                            </div>
                        )}
                    </div>
                ))}

                {/* Loading Indicator */}
                {loading && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{
                            width: 32, height: 32, borderRadius: 99,
                            background: '#e6f4ff',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <Package size={16} color="#0095FF" />
                        </div>
                        <div style={{
                            padding: '12px 16px', borderRadius: 18,
                            background: isDark ? '#1A1A1F' : '#f3f4f6',
                            display: 'flex', gap: 4,
                        }}>
                            {[0, 1, 2].map(i => (
                                <span key={i} style={{
                                    width: 7, height: 7, borderRadius: 99,
                                    background: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af',
                                    animation: 'aiBounce 1.4s infinite',
                                    animationDelay: `${i * 0.16}s`,
                                }} />
                            ))}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div style={{
                padding: '12px 16px',
                paddingBottom: 'max(12px, env(safe-area-inset-bottom, 12px))',
                borderTop: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                background: isDark ? '#0F0F12' : '#fff',
            }}>
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                }}>
                    <div style={{
                        flex: 1, display: 'flex', alignItems: 'center',
                        padding: '10px 16px', borderRadius: 50,
                        background: isDark ? '#1A1A1F' : '#f3f4f6',
                        border: isDark ? '1px solid rgba(255,255,255,0.06)' : 'none',
                    }}>
                        <input
                            ref={inputRef}
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="Ask KOFA anything..."
                            style={{
                                flex: 1, background: 'none', border: 'none', outline: 'none',
                                fontSize: 14, fontFamily: 'inherit',
                                color: isDark ? '#fff' : '#111',
                            }}
                        />
                    </div>
                    <button
                        onClick={() => sendMessage()}
                        disabled={!input.trim() || loading}
                        style={{
                            width: 42, height: 42, borderRadius: 99, border: 'none',
                            cursor: input.trim() && !loading ? 'pointer' : 'default',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            background: input.trim() && !loading
                                ? 'linear-gradient(135deg, #0095FF, #0070DD)'
                                : isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb',
                            color: input.trim() && !loading ? '#fff' : (isDark ? 'rgba(255,255,255,0.2)' : '#9ca3af'),
                            transition: 'background 0.2s, transform 0.15s',
                        }}
                    >
                        <Send size={18} />
                    </button>
                </div>
            </div>

            {/* Animation Styles */}
            <style>{`
                @keyframes aiBounce {
                    0%, 80%, 100% { transform: translateY(0) }
                    40% { transform: translateY(-6px) }
                }
            `}</style>
        </div>
    )
}

export default BusinessAI
