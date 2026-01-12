import React, { useState, useRef, useEffect, useContext } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import { ThemeContext } from '../../context/ThemeContext';
import { Send, X, Bot, Sparkles, User, ChevronDown, Minimize2, Maximize2 } from 'lucide-react';
import { Button } from '../ui/Button';

const BusinessAI = ({ userId = 'demo-user' }) => {
    const { theme } = useContext(ThemeContext);
    const isDark = theme === 'dark';

    const [messages, setMessages] = useState([
        {
            role: 'assistant',
            content: 'Hello! 👋 I\'m your KOFA Business AI.\n\nI can help you manage inventory, record sales, or analyze your business performance.',
            suggestions: ['How many products do I have?', 'Record a sale showing 2 Shoes', 'Show me low stock items']
        }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        if (isOpen && !isMinimized) {
            scrollToBottom();
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    }, [messages, isOpen, isMinimized]);

    const sendMessage = async (text = input) => {
        if (!text.trim() || loading) return;

        const userMessage = text.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
        setLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}${API_ENDPOINTS.BUSINESS_AI}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: userId,
                    message: userMessage
                })
            });

            if (!response.ok) throw new Error('Failed to get response');

            const data = await response.json();
            let aiContent = data.response || 'Sorry, I couldn\'t process that request.';

            if (data.action_taken) {
                aiContent += `\n\n✅ Action: ${data.action_taken}`;
                if (data.action_result) {
                    aiContent += `\n${JSON.stringify(data.action_result, null, 2)}`;
                }
            }

            setMessages(prev => [...prev, { role: 'assistant', content: aiContent }]);
        } catch (error) {
            console.error('AI Error:', error);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: '❌ Sorry, I couldn\'t connect to the server. Please check your internet connection.'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    };

    return (
        <>
            {/* Floating Toggle Button - TOP RIGHT with BETA badge */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed top-20 lg:top-6 right-4 lg:right-6 h-12 px-4 rounded-full bg-gradient-to-r from-brand-primary to-purple-600 text-white shadow-lg shadow-brand-glow hover:scale-105 transition-all flex items-center gap-2 z-40 group"
                >
                    <Sparkles size={18} className="group-hover:animate-pulse" />
                    <span className="text-sm font-medium hidden sm:inline">AI Assistant</span>
                    <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded uppercase">Beta</span>
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div
                    className={`
                        fixed top-16 lg:top-14 right-4 lg:right-6 z-50 flex flex-col transition-all duration-300 ease-in-out
                        ${isMinimized ? 'w-72 h-14' : 'w-[90vw] sm:w-[400px] h-[500px] max-h-[70vh]'}
                        bg-app/95 backdrop-blur-xl border border-border-subtle rounded-2xl shadow-2xl overflow-hidden
                    `}
                >
                    {/* Header */}
                    <div
                        className="h-14 bg-surface-2/80 backdrop-blur-md flex items-center justify-between px-4 cursor-pointer border-b border-border-subtle"
                        onClick={() => setIsMinimized(!isMinimized)}
                    >
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-brand-primary to-purple-600 flex items-center justify-center">
                                <Bot size={18} className="text-white" />
                            </div>
                            <div>
                                <h3 className="font-bold text-sm text-main">Business AI</h3>
                                <div className="flex items-center gap-1.5">
                                    <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] text-muted">Online</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized); }}
                                className="p-1.5 rounded-lg hover:bg-surface-3 text-muted transition-colors"
                            >
                                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
                                className="p-1.5 rounded-lg hover:bg-red-500/10 text-muted hover:text-red-500 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Messages Area */}
                    {!isMinimized && (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-1/50 scrollbar-thin scrollbar-thumb-surface-3">
                                {messages.map((msg, idx) => (
                                    <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                        <div className={`
                                            h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0
                                            ${msg.role === 'user' ? 'bg-surface-3' : 'bg-gradient-to-br from-brand-primary to-purple-600'}
                                        `}>
                                            {msg.role === 'user' ? <User size={14} className="text-main" /> : <Bot size={14} className="text-white" />}
                                        </div>

                                        <div className="max-w-[80%] space-y-2">
                                            <div className={`
                                                p-3 rounded-2xl text-sm leading-relaxed shadow-sm
                                                ${msg.role === 'user'
                                                    ? 'bg-surface-3 text-main rounded-tr-none'
                                                    : 'bg-surface-2 border border-border-subtle text-main rounded-tl-none'
                                                }
                                            `}>
                                                {msg.content.split('\n').map((line, i) => (
                                                    <p key={i} className="min-h-[1rem]">{line}</p>
                                                ))}
                                            </div>

                                            {/* Quick Suggestions for Assistant's Welcome Message */}
                                            {msg.suggestions && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {msg.suggestions.map((s, i) => (
                                                        <button
                                                            key={i}
                                                            onClick={() => sendMessage(s)}
                                                            className="text-xs px-3 py-1.5 rounded-full bg-brand-primary/10 text-brand-primary border border-brand-primary/20 hover:bg-brand-primary/20 transition-colors text-left"
                                                        >
                                                            {s}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}

                                {loading && (
                                    <div className="flex gap-3">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-brand-primary to-purple-600 flex items-center justify-center flex-shrink-0">
                                            <Bot size={14} className="text-white" />
                                        </div>
                                        <div className="bg-surface-2 border border-border-subtle p-3 rounded-2xl rounded-tl-none flex items-center gap-1.5">
                                            <span className="h-1.5 w-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <span className="h-1.5 w-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <span className="h-1.5 w-1.5 bg-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                )}
                                <div ref={messagesEndRef} />
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-app/95 border-t border-border-subtle backdrop-blur-sm">
                                <div className="relative flex items-end gap-2 bg-surface-2 rounded-xl border border-border-subtle p-2 focus-within:border-brand-primary focus-within:ring-1 focus-within:ring-brand-primary transition-all">
                                    <textarea
                                        ref={inputRef}
                                        value={input}
                                        onChange={(e) => setInput(e.target.value)}
                                        onKeyPress={handleKeyPress}
                                        placeholder="Type a message..."
                                        rows={1}
                                        className="flex-1 bg-transparent border-none text-sm text-main placeholder-muted focus:ring-0 px-2 py-1.5 max-h-32 resize-none"
                                        style={{ minHeight: '44px' }}
                                    />
                                    <button
                                        onClick={() => sendMessage()}
                                        disabled={!input.trim() || loading}
                                        className={`
                                            p-2 rounded-lg mb-0.5 transition-all
                                            ${input.trim() && !loading
                                                ? 'bg-brand-primary text-white shadow-lg shadow-brand-glow hover:scale-105'
                                                : 'bg-surface-3 text-muted cursor-not-allowed'
                                            }
                                        `}
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                                <div className="text-center mt-2">
                                    <p className="text-[10px] text-muted">Powered by Groq AI • Free Tier</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            )}
        </>
    );
};

export default BusinessAI;
