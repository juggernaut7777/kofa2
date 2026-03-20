import { useState, useContext } from 'react'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import { Link2, ExternalLink, Copy, Check, Share2 } from 'lucide-react'

const StorefrontLinkCard = () => {
    const { theme } = useContext(ThemeContext)
    const { user } = useAuth()
    const isDark = theme === 'dark'
    const [copied, setCopied] = useState(false)

    const businessName = user?.businessName || user?.business_name || 'shop'
    const storeUrl = `${window.location.origin}/store/${encodeURIComponent(businessName)}`
    const apiStoreUrl = `https://kofa-backend-eu-2bb681b4e51a.herokuapp.com/store/${encodeURIComponent(businessName)}`

    const handleCopy = () => {
        navigator.clipboard.writeText(apiStoreUrl).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    const handleShare = () => {
        if (navigator.share) {
            navigator.share({
                title: `${businessName} — Shop on KOFA`,
                text: `Check out my store on KOFA! 🛍️`,
                url: apiStoreUrl,
            }).catch(() => {})
        } else {
            handleCopy()
        }
    }

    const handleWhatsAppShare = () => {
        const msg = encodeURIComponent(`🛍️ Check out my store!\n${apiStoreUrl}`)
        window.open(`https://wa.me/?text=${msg}`, '_blank')
    }

    return (
        <div style={{
            borderRadius: 16,
            overflow: 'hidden',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            background: isDark ? '#16161D' : '#fff',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            <div style={{ padding: '16px 18px' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12,
                }}>
                    <div style={{
                        width: 32, height: 32, borderRadius: 10,
                        background: 'linear-gradient(135deg, #0095FF, #0070DD)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <Link2 size={16} color="#fff" />
                    </div>
                    <div>
                        <h3 style={{
                            fontSize: 14, fontWeight: 700, margin: 0,
                            color: isDark ? '#fff' : '#111',
                        }}>Your Storefront</h3>
                        <p style={{
                            fontSize: 11, margin: 0,
                            color: isDark ? 'rgba(255,255,255,0.35)' : '#9ca3af',
                        }}>Share this link with your customers</p>
                    </div>
                </div>

                {/* URL bar */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 12px', borderRadius: 10,
                    background: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                    border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
                    marginBottom: 12,
                }}>
                    <span style={{
                        fontSize: 12, fontWeight: 500, flex: 1,
                        color: isDark ? 'rgba(255,255,255,0.6)' : '#374151',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    }}>
                        {apiStoreUrl.replace('https://', '')}
                    </span>
                    <button
                        onClick={handleCopy}
                        style={{
                            background: 'none', border: 'none', cursor: 'pointer',
                            padding: 4, display: 'flex',
                            color: copied ? '#22c55e' : '#0095FF',
                        }}
                    >
                        {copied ? <Check size={16} /> : <Copy size={16} />}
                    </button>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', gap: 8 }}>
                    <button
                        onClick={handleCopy}
                        style={{
                            flex: 1, padding: '9px 12px', borderRadius: 10,
                            border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: 12, fontFamily: 'inherit',
                            background: copied ? '#22c55e' : 'linear-gradient(135deg, #0095FF, #0070DD)',
                            color: '#fff', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                    >
                        {copied ? <><Check size={14} /> Copied!</> : <><Copy size={14} /> Copy Link</>}
                    </button>
                    <button
                        onClick={handleWhatsAppShare}
                        style={{
                            flex: 1, padding: '9px 12px', borderRadius: 10,
                            border: 'none', cursor: 'pointer',
                            fontWeight: 600, fontSize: 12, fontFamily: 'inherit',
                            background: '#25D366', color: '#fff', transition: 'all 0.2s',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                        }}
                    >
                        <Share2 size={14} /> Share
                    </button>
                    <a
                        href={apiStoreUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            padding: '9px 14px', borderRadius: 10,
                            border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                            background: 'none', cursor: 'pointer', textDecoration: 'none',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280',
                        }}
                    >
                        <ExternalLink size={14} />
                    </a>
                </div>
            </div>
        </div>
    )
}

export default StorefrontLinkCard
