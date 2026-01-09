import { useState, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'

// Moonlight Color Palette
const colors = {
    lavender: '#CCCCFF',
    violet: '#5C5C99',
    indigo: '#292966',
}

const Signup = () => {
    const [formData, setFormData] = useState({
        businessName: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: ''
    })
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const { signup } = useAuth()
    const navigate = useNavigate()

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        })
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        // Validation
        if (!formData.businessName || !formData.email || !formData.phone || !formData.password) {
            setError('Please fill in all required fields')
            setIsLoading(false)
            return
        }

        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            setIsLoading(false)
            return
        }

        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            setIsLoading(false)
            return
        }

        const result = await signup(formData)

        if (result.success) {
            navigate('/dashboard', { replace: true })
        } else {
            setError(result.error || 'Registration failed. Please try again.')
        }

        setIsLoading(false)
    }

    return (
        <div className={`min-h-screen flex items-center justify-center px-4 py-12 font-['SF_Pro_Display',-apple-system,sans-serif] ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>

            {/* Ambient Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-10 -right-20 w-80 h-80 rounded-full blur-[120px] ${isDark ? 'bg-[#5C5C99]/30' : 'bg-[#CCCCFF]/40'}`}></div>
                <div className={`absolute bottom-40 -left-20 w-60 h-60 rounded-full blur-[100px] ${isDark ? 'bg-[#292966]/40' : 'bg-[#CCCCFF]/30'}`}></div>
            </div>

            <div className="relative max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-6">
                    <Link to="/" className="inline-flex items-center justify-center">
                        <div className="relative">
                            <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                                <span className="text-white font-black text-xl tracking-tight">K</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-lg bg-[#CCCCFF] flex items-center justify-center">
                                <span className="text-[#292966] text-[10px] font-bold">✓</span>
                            </div>
                        </div>
                    </Link>
                    <h1 className={`text-2xl font-bold mt-5 mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>Start Your Free Trial</h1>
                    <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-500'}`}>Create your account in 2 minutes</p>
                </div>

                {/* Features Badge */}
                <div className={`rounded-2xl p-4 mb-5 ${isDark ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200'}`}>
                    <div className="flex items-center justify-center gap-4 text-xs font-medium">
                        <span className="flex items-center gap-1 text-emerald-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            50 Free Products
                        </span>
                        <span className="flex items-center gap-1 text-emerald-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            AI Chatbot
                        </span>
                        <span className="flex items-center gap-1 text-emerald-500">
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                            No Card
                        </span>
                    </div>
                </div>

                {/* Signup Form */}
                <div className={`rounded-3xl p-6 backdrop-blur-xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/80 border border-black/[0.04] shadow-xl'}`}>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="businessName" className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                Business Name *
                            </label>
                            <input
                                id="businessName"
                                name="businessName"
                                type="text"
                                value={formData.businessName}
                                onChange={handleChange}
                                className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${isDark
                                    ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-[#5C5C99]'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#5C5C99]'
                                    }`}
                                placeholder="Sarah's Fashion Hub"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="email" className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                    Email *
                                </label>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${isDark
                                        ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-[#5C5C99]'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#5C5C99]'
                                        }`}
                                    placeholder="you@example.com"
                                />
                            </div>
                            <div>
                                <label htmlFor="phone" className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                    Phone *
                                </label>
                                <input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${isDark
                                        ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-[#5C5C99]'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#5C5C99]'
                                        }`}
                                    placeholder="08012345678"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label htmlFor="password" className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                    Password *
                                </label>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${isDark
                                        ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-[#5C5C99]'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#5C5C99]'
                                        }`}
                                    placeholder="••••••••"
                                />
                            </div>
                            <div>
                                <label htmlFor="confirmPassword" className={`block text-xs font-semibold uppercase tracking-wide mb-1.5 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                    Confirm *
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={handleChange}
                                    className={`w-full px-4 py-3 rounded-xl border-2 transition-all focus:outline-none ${isDark
                                        ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-[#5C5C99]'
                                        : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#5C5C99]'
                                        }`}
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="flex items-start gap-2">
                            <input type="checkbox" className="w-4 h-4 mt-0.5 rounded accent-[#5C5C99]" required />
                            <span className={`text-xs ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                                I agree to the{' '}
                                <a href="#" className="underline" style={{ color: colors.violet }}>Terms</a>
                                {' '}and{' '}
                                <a href="#" className="underline" style={{ color: colors.violet }}>Privacy Policy</a>
                            </span>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                            style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Creating account...
                                </span>
                            ) : (
                                'Create Free Account'
                            )}
                        </button>
                    </form>

                    <div className="mt-5 text-center">
                        <p className={`text-sm ${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                            Already have an account?{' '}
                            <Link to="/login" className="font-semibold hover:underline" style={{ color: colors.violet }}>
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to home */}
                <div className="mt-6 text-center">
                    <Link to="/" className={`text-sm transition-colors ${isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'}`}>
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Signup
