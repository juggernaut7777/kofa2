import { useState } from 'react'
import { Store, X, Copy, ExternalLink, Check, Share2 } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { ThemeContext } from '../../context/ThemeContext'
import { useContext } from 'react'

/**
 * StorefrontButton Component
 * Floating button for vendors to access/share their public storefront.
 * Positioned opposite to the AI assistant (bottom-left).
 */
const StorefrontButton = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [copied, setCopied] = useState(false)
    const { user } = useAuth()
    const { isDark } = useContext(ThemeContext)

    // Generate store URL from business name
    const businessName = user?.businessName || user?.business_name || 'shop'
    const storeUrl = `${window.location.origin}/shop/${encodeURIComponent(businessName)}`

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(storeUrl)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (err) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea')
            textArea.value = storeUrl
            document.body.appendChild(textArea)
            textArea.select()
            document.execCommand('copy')
            document.body.removeChild(textArea)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        }
    }

    const handlePreview = () => {
        window.open(storeUrl, '_blank')
    }

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `${businessName} - Shop`,
                    text: `Check out my shop on KOFA!`,
                    url: storeUrl
                })
            } catch (err) {
                // User cancelled or share failed
            }
        } else {
            handleCopy()
        }
    }

    return (
        <>
            {/* Floating Button - Bottom Left */}
            <button
                onClick={() => setIsOpen(true)}
                className="fixed bottom-6 left-6 z-40 w-14 h-14 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg hover:shadow-xl hover:scale-105 transition-all flex items-center justify-center group"
                title="My Store"
            >
                <Store size={24} />
                {/* Pulse animation */}
                <span className="absolute inset-0 rounded-full bg-purple-500 animate-ping opacity-20"></span>
            </button>

            {/* Overlay Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Modal Content */}
                    <div className={`relative w-full max-w-md rounded-2xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-900 border border-white/10' : 'bg-white'
                        }`}>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
                                        <Store size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold">My Store</h2>
                                        <p className="text-sm text-white/80">Share with customers</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-4">
                            {/* Store URL */}
                            <div>
                                <label className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                    Your Store Link
                                </label>
                                <div className={`mt-2 flex items-center gap-2 p-3 rounded-xl ${isDark ? 'bg-white/5 border border-white/10' : 'bg-gray-100'
                                    }`}>
                                    <input
                                        type="text"
                                        value={storeUrl}
                                        readOnly
                                        className={`flex-1 bg-transparent text-sm truncate outline-none ${isDark ? 'text-white' : 'text-gray-800'
                                            }`}
                                    />
                                    <button
                                        onClick={handleCopy}
                                        className={`p-2 rounded-lg transition-colors ${copied
                                                ? 'bg-green-500 text-white'
                                                : isDark
                                                    ? 'bg-white/10 hover:bg-white/20 text-white'
                                                    : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                                            }`}
                                        title={copied ? 'Copied!' : 'Copy link'}
                                    >
                                        {copied ? <Check size={16} /> : <Copy size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Info Text */}
                            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                <p>📦 Products are synced from your <strong>Inventory</strong></p>
                                <p className="mt-1">💳 Customers order via WhatsApp - no setup needed!</p>
                            </div>

                            {/* Action Buttons */}
                            <div className="grid grid-cols-2 gap-3 pt-2">
                                <button
                                    onClick={handleShare}
                                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-colors ${isDark
                                            ? 'bg-white/10 hover:bg-white/20 text-white'
                                            : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                                        }`}
                                >
                                    <Share2 size={18} />
                                    Share
                                </button>
                                <button
                                    onClick={handlePreview}
                                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity"
                                >
                                    <ExternalLink size={18} />
                                    Preview Store
                                </button>
                            </div>
                        </div>

                        {/* Footer Tip */}
                        <div className={`px-6 py-4 border-t ${isDark ? 'border-white/10 bg-white/5' : 'border-gray-100 bg-gray-50'}`}>
                            <p className={`text-xs text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                💡 Add products in <strong>Inventory</strong> to show them in your store
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default StorefrontButton
