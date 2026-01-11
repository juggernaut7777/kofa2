import React, { useState, useRef, useEffect } from 'react';
import { API_BASE_URL, API_ENDPOINTS } from '../../config/api';
import './BusinessAI.css';

const BusinessAI = ({ userId = 'demo-user' }) => {
    const [messages, setMessages] = useState([
        { role: 'assistant', content: 'Hello! 👋 I\'m your KOFA Business AI. I can help you manage your inventory, check sales, and run your business! Try asking me:\n\n• "How many products do I have?"\n• "Add 10 bags of rice at 5000 naira"\n• "Show me low stock items"' }
    ]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMessage = input.trim();
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

            if (!response.ok) {
                throw new Error('Failed to get response');
            }

            const data = await response.json();

            let aiContent = data.response || 'Sorry, I couldn\'t process that request.';

            // Add action result if any
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
                content: '❌ Sorry, I couldn\'t connect to the server. Please try again.'
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

    const quickActions = [
        { label: '📦 Products', message: 'How many products do I have?' },
        { label: '📉 Low Stock', message: 'Show me low stock items' },
        { label: '💰 Sales Today', message: 'What are my sales today?' },
    ];

    return (
        <>
            {/* Floating Button */}
            <button
                className="ai-floating-btn"
                onClick={() => setIsOpen(!isOpen)}
                title="Business AI Assistant"
            >
                {isOpen ? '✕' : '🤖'}
            </button>

            {/* Chat Window */}
            {isOpen && (
                <div className="ai-chat-container">
                    <div className="ai-chat-header">
                        <span className="ai-header-icon">🤖</span>
                        <span className="ai-header-title">KOFA Business AI</span>
                        <span className="ai-header-badge">FREE</span>
                    </div>

                    <div className="ai-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`ai-message ${msg.role}`}>
                                <div className="ai-message-content">
                                    {msg.content.split('\n').map((line, i) => (
                                        <React.Fragment key={i}>
                                            {line}
                                            {i < msg.content.split('\n').length - 1 && <br />}
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="ai-message assistant">
                                <div className="ai-message-content ai-typing">
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                    <span className="dot"></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="ai-quick-actions">
                        {quickActions.map((action, idx) => (
                            <button
                                key={idx}
                                className="ai-quick-btn"
                                onClick={() => {
                                    setInput(action.message);
                                    setTimeout(() => sendMessage(), 100);
                                }}
                                disabled={loading}
                            >
                                {action.label}
                            </button>
                        ))}
                    </div>

                    <div className="ai-input-container">
                        <textarea
                            className="ai-input"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything about your business..."
                            rows={1}
                            disabled={loading}
                        />
                        <button
                            className="ai-send-btn"
                            onClick={sendMessage}
                            disabled={loading || !input.trim()}
                        >
                            {loading ? '...' : '→'}
                        </button>
                    </div>
                </div>
            )}
        </>
    );
};

export default BusinessAI;
