import { useState, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { ThemeContext } from '../../context/ThemeContext'
import { useAuth } from '../../context/AuthContext'
import {
    Package, Link2, MessageCircle, CheckCircle, ArrowRight, X,
    Camera, Upload, Smartphone
} from 'lucide-react'

const STEPS = [
    {
        id: 'product',
        icon: Package,
        title: 'Add Your First Product',
        description: 'Start by adding at least one product to your inventory. You can snap a photo and KOFA AI will fill in the details!',
        cta: 'Add Product',
        tip: '📸 Pro tip: Use "Snap to Add" on the Products page — take a photo and AI fills in name, price & category.',
    },
    {
        id: 'storefront',
        icon: Link2,
        title: 'Share Your Storefront',
        description: 'Your store is live! Copy your link and share it on WhatsApp status, Instagram bio, or anywhere your customers are.',
        cta: 'Copy Store Link',
        tip: '🔗 Every time someone visits your store, they see your products and can order via WhatsApp.',
    },
    {
        id: 'whatsapp',
        icon: MessageCircle,
        title: 'Connect WhatsApp (Optional)',
        description: 'Get automatic order notifications and let KOFA AI reply to customer messages on your behalf.',
        cta: 'Set Up Later',
        tip: '💬 You can always set this up in Settings → Integrations.',
    },
]

const OnboardingWizard = ({ onDismiss, hasProducts = false }) => {
    const { theme } = useContext(ThemeContext)
    const { user } = useAuth()
    const navigate = useNavigate()
    const isDark = theme === 'dark'

    // If they already have products, start at step 2
    const [currentStep, setCurrentStep] = useState(hasProducts ? 1 : 0)
    const [completedSteps, setCompletedSteps] = useState(hasProducts ? [0] : [])
    const [dismissed, setDismissed] = useState(false)
    const [copied, setCopied] = useState(false)

    if (dismissed) return null

    const businessName = user?.businessName || user?.business_name || 'shop'
    const storeUrl = `${window.location.origin}/store/${encodeURIComponent(businessName)}`

    const handleStepAction = (stepId) => {
        switch (stepId) {
            case 'product':
                navigate('/products', { state: { action: 'add' } })
                break
            case 'storefront':
                navigator.clipboard.writeText(storeUrl).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                })
                setCompletedSteps(prev => [...new Set([...prev, currentStep])])
                break
            case 'whatsapp':
                // Just mark as done (optional step)
                setCompletedSteps(prev => [...new Set([...prev, currentStep])])
                break
        }
    }

    const handleNext = () => {
        setCompletedSteps(prev => [...new Set([...prev, currentStep])])
        if (currentStep < STEPS.length - 1) {
            setCurrentStep(currentStep + 1)
        } else {
            handleDismiss()
        }
    }

    const handleDismiss = () => {
        setDismissed(true)
        // Remember they've seen onboarding
        try { localStorage.setItem('kofa_onboarding_done', 'true') } catch {}
        if (onDismiss) onDismiss()
    }

    const step = STEPS[currentStep]
    const StepIcon = step.icon
    const progress = ((completedSteps.length) / STEPS.length) * 100

    return (
        <div style={{
            borderRadius: 20,
            overflow: 'hidden',
            border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
            background: isDark
                ? 'linear-gradient(135deg, #0F0F14 0%, #131320 100%)'
                : 'linear-gradient(135deg, #fff 0%, #f0f4ff 100%)',
            fontFamily: "'Inter', system-ui, sans-serif",
            position: 'relative',
        }}>
            {/* Dismiss button */}
            <button
                onClick={handleDismiss}
                style={{
                    position: 'absolute', top: 14, right: 14, zIndex: 2,
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af',
                    padding: 4,
                }}
            >
                <X size={18} />
            </button>

            {/* Progress bar */}
            <div style={{
                height: 3,
                background: isDark ? 'rgba(255,255,255,0.04)' : '#e5e7eb',
            }}>
                <div style={{
                    height: '100%',
                    width: `${progress}%`,
                    background: 'linear-gradient(90deg, #0095FF, #00D4FF)',
                    transition: 'width 0.4s ease',
                    borderRadius: 99,
                }} />
            </div>

            <div style={{ padding: '24px 24px 20px' }}>
                {/* Header */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    marginBottom: 20,
                }}>
                    <span style={{
                        fontSize: 12, fontWeight: 600,
                        color: '#0095FF',
                    }}>
                        🚀 GET STARTED
                    </span>
                    <span style={{
                        fontSize: 11,
                        color: isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af',
                    }}>
                        Step {currentStep + 1} of {STEPS.length}
                    </span>
                </div>

                {/* Step indicators */}
                <div style={{
                    display: 'flex', gap: 12, marginBottom: 24,
                }}>
                    {STEPS.map((s, i) => {
                        const Icon = s.icon
                        const isActive = i === currentStep
                        const isDone = completedSteps.includes(i)

                        return (
                            <button
                                key={s.id}
                                onClick={() => setCurrentStep(i)}
                                style={{
                                    flex: 1,
                                    display: 'flex', alignItems: 'center', gap: 8,
                                    padding: '10px 12px', borderRadius: 12,
                                    border: `1px solid ${isActive
                                        ? '#0095FF'
                                        : isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                                    background: isActive
                                        ? (isDark ? 'rgba(0,149,255,0.08)' : 'rgba(0,149,255,0.05)')
                                        : 'transparent',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    fontFamily: 'inherit',
                                }}
                            >
                                {isDone ? (
                                    <CheckCircle size={18} color="#22c55e" />
                                ) : (
                                    <Icon size={18} style={{
                                        color: isActive ? '#0095FF' : (isDark ? 'rgba(255,255,255,0.3)' : '#9ca3af'),
                                    }} />
                                )}
                                <span style={{
                                    fontSize: 12, fontWeight: 600,
                                    color: isActive
                                        ? (isDark ? '#fff' : '#111')
                                        : isDone
                                            ? '#22c55e'
                                            : (isDark ? 'rgba(255,255,255,0.4)' : '#9ca3af'),
                                    display: 'none',
                                }}>
                                    {s.title.split(' ').slice(0, 2).join(' ')}
                                </span>
                            </button>
                        )
                    })}
                </div>

                {/* Current Step Content */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                    <div style={{
                        width: 48, height: 48, borderRadius: 14, flexShrink: 0,
                        background: 'linear-gradient(135deg, #0095FF, #0070DD)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 4px 16px rgba(0,149,255,0.25)',
                    }}>
                        <StepIcon size={24} color="#fff" />
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{
                            fontSize: 17, fontWeight: 700, margin: '0 0 4px',
                            color: isDark ? '#fff' : '#111',
                        }}>
                            {step.title}
                        </h3>
                        <p style={{
                            fontSize: 13, lineHeight: 1.5, margin: '0 0 12px',
                            color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280',
                        }}>
                            {step.description}
                        </p>

                        {/* Storefront URL preview (only on step 2) */}
                        {step.id === 'storefront' && (
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '10px 14px', borderRadius: 10, marginBottom: 12,
                                background: isDark ? 'rgba(255,255,255,0.04)' : '#f3f4f6',
                                border: `1px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e5e7eb'}`,
                            }}>
                                <Link2 size={14} style={{ color: '#0095FF', flexShrink: 0 }} />
                                <span style={{
                                    fontSize: 12, fontWeight: 500,
                                    color: isDark ? 'rgba(255,255,255,0.6)' : '#374151',
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                                }}>
                                    {storeUrl}
                                </span>
                            </div>
                        )}

                        {/* Tip */}
                        <div style={{
                            padding: '8px 12px', borderRadius: 8, marginBottom: 14,
                            background: isDark ? 'rgba(0,149,255,0.06)' : '#eff6ff',
                            fontSize: 12, lineHeight: 1.4,
                            color: isDark ? 'rgba(255,255,255,0.5)' : '#3b82f6',
                        }}>
                            {step.tip}
                        </div>

                        {/* Action buttons */}
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                onClick={() => handleStepAction(step.id)}
                                style={{
                                    padding: '10px 20px', borderRadius: 10, border: 'none',
                                    cursor: 'pointer', fontWeight: 600, fontSize: 13,
                                    fontFamily: 'inherit',
                                    background: step.id === 'storefront' && copied
                                        ? '#22c55e'
                                        : 'linear-gradient(135deg, #0095FF, #0070DD)',
                                    color: '#fff',
                                    transition: 'all 0.2s',
                                }}
                            >
                                {step.id === 'storefront' && copied ? '✅ Copied!' : step.cta}
                            </button>

                            {currentStep < STEPS.length - 1 ? (
                                <button
                                    onClick={handleNext}
                                    style={{
                                        padding: '10px 16px', borderRadius: 10,
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                                        background: 'none', cursor: 'pointer',
                                        fontWeight: 500, fontSize: 13, fontFamily: 'inherit',
                                        color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280',
                                        display: 'flex', alignItems: 'center', gap: 4,
                                    }}
                                >
                                    Skip <ArrowRight size={14} />
                                </button>
                            ) : (
                                <button
                                    onClick={handleDismiss}
                                    style={{
                                        padding: '10px 16px', borderRadius: 10,
                                        border: `1px solid ${isDark ? 'rgba(255,255,255,0.1)' : '#e5e7eb'}`,
                                        background: 'none', cursor: 'pointer',
                                        fontWeight: 500, fontSize: 13, fontFamily: 'inherit',
                                        color: isDark ? 'rgba(255,255,255,0.5)' : '#6b7280',
                                    }}
                                >
                                    Done ✨
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default OnboardingWizard
