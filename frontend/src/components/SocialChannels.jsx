import { useState, useEffect, useContext } from 'react'
import { apiCall } from '../config/api'
import { ThemeContext } from '../context/ThemeContext'

const SocialChannels = () => {
    const { theme } = useContext(ThemeContext)
    const [channels, setChannels] = useState({
        whatsapp: { connected: false, phone: null, status: 'disconnected' },
        instagram: { connected: false, username: null, status: 'disconnected' },
        tiktok: { connected: false, username: null, status: 'disconnected' }
    })
    const [loading, setLoading] = useState(true)
    const isDark = theme === 'dark'

    useEffect(() => {
        loadChannelStatus()
    }, [])

    const loadChannelStatus = async () => {
        try {
            setLoading(true)
            // Try to get WhatsApp connection status
            const whatsappStatus = await apiCall('/whatsapp/connection_status/default')
            setChannels(prev => ({
                ...prev,
                whatsapp: {
                    connected: whatsappStatus?.connected || false,
                    phone: whatsappStatus?.phone_number,
                    status: whatsappStatus?.connected ? 'connected' : 'disconnected'
                }
            }))
        } catch (error) {
            console.log('Using demo channel status')
            // Demo data
            setChannels({
                whatsapp: { connected: true, phone: '+234 803 XXX XXXX', status: 'connected' },
                instagram: { connected: false, username: null, status: 'disconnected' },
                tiktok: { connected: false, username: null, status: 'disconnected' }
            })
        } finally {
            setLoading(false)
        }
    }

    const handleConnect = async (platform) => {
        if (platform === 'whatsapp') {
            // Redirect to WhatsApp Business setup
            alert('WhatsApp Business API connection requires Meta Business verification. Contact support for setup.')
        } else if (platform === 'instagram') {
            alert('Instagram DM integration coming soon! We\'re working on Meta API approval.')
        } else if (platform === 'tiktok') {
            alert('TikTok integration coming soon!')
        }
    }

    const handleDisconnect = async (platform) => {
        if (confirm(`Disconnect ${platform}? You'll stop receiving messages from this channel.`)) {
            setChannels(prev => ({
                ...prev,
                [platform]: { connected: false, phone: null, username: null, status: 'disconnected' }
            }))
        }
    }

    const channelList = [
        {
            id: 'whatsapp',
            name: 'WhatsApp Business',
            icon: '💬',
            color: '#25D366',
            description: 'Receive orders via WhatsApp messages'
        },
        {
            id: 'instagram',
            name: 'Instagram DM',
            icon: '📸',
            color: '#E4405F',
            description: 'Handle orders from Instagram DMs'
        },
        {
            id: 'tiktok',
            name: 'TikTok',
            icon: '🎵',
            color: '#000000',
            description: 'Process orders from TikTok messages'
        }
    ]

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-kofa-yellow border-t-transparent rounded-full"></div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        Sales Channels
                    </h3>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        Connect your social media to receive orders
                    </p>
                </div>
            </div>

            {channelList.map((channel) => {
                const status = channels[channel.id]
                const isConnected = status?.connected

                return (
                    <div
                        key={channel.id}
                        className={`p-4 rounded-xl border ${isDark ? 'bg-gray-800/50 border-gray-700' : 'bg-white border-gray-200'
                            }`}
                    >
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                                    style={{ backgroundColor: `${channel.color}20` }}
                                >
                                    {channel.icon}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                            {channel.name}
                                        </span>
                                        <span className={`text-xs px-2 py-0.5 rounded-full ${isConnected
                                                ? 'bg-green-500/20 text-green-500'
                                                : 'bg-gray-500/20 text-gray-400'
                                            }`}>
                                            {isConnected ? '● Connected' : '○ Not Connected'}
                                        </span>
                                    </div>
                                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                        {isConnected && status?.phone
                                            ? status.phone
                                            : isConnected && status?.username
                                                ? `@${status.username}`
                                                : channel.description
                                        }
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => isConnected ? handleDisconnect(channel.id) : handleConnect(channel.id)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isConnected
                                        ? isDark
                                            ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                                            : 'bg-red-50 text-red-600 hover:bg-red-100'
                                        : 'bg-kofa-cobalt text-white hover:bg-kofa-navy'
                                    }`}
                            >
                                {isConnected ? 'Disconnect' : 'Connect'}
                            </button>
                        </div>
                    </div>
                )
            })}

            {/* Help text */}
            <div className={`p-4 rounded-xl ${isDark ? 'bg-kofa-cobalt/20' : 'bg-blue-50'}`}>
                <p className={`text-sm ${isDark ? 'text-kofa-sky' : 'text-kofa-cobalt'}`}>
                    💡 <strong>Tip:</strong> WhatsApp is the most popular channel in Nigeria. Connect it first for best results!
                </p>
            </div>
        </div>
    )
}

export default SocialChannels
