import { useState, useContext } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { ThemeContext } from '../context/ThemeContext'

// Moonlight Color Palette
const colors = {
    lavender: '#CCCCFF',
    violet: '#5C5C99',
    indigo: '#292966',
}

const Login = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const { theme } = useContext(ThemeContext)
    const isDark = theme === 'dark'

    const { login } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    const from = location.state?.from?.pathname || '/dashboard'

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        if (!email || !password) {
            setError('Please fill in all fields')
            setIsLoading(false)
            return
        }

        const result = await login(email, password)

        if (result.success) {
            navigate(from, { replace: true })
        } else {
            setError(result.error || 'Login failed. Please try again.')
        }

        setIsLoading(false)
    }

    return (
        <div className={`min-h-screen flex items-center justify-center px-4 font-['SF_Pro_Display',-apple-system,sans-serif] ${isDark ? 'bg-[#0a0a14]' : 'bg-[#fafaff]'}`}>

            {/* Ambient Gradient */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className={`absolute top-20 -left-20 w-80 h-80 rounded-full blur-[120px] ${isDark ? 'bg-[#5C5C99]/30' : 'bg-[#CCCCFF]/40'}`}></div>
                <div className={`absolute bottom-20 -right-20 w-60 h-60 rounded-full blur-[100px] ${isDark ? 'bg-[#292966]/40' : 'bg-[#CCCCFF]/30'}`}></div>
            </div>

            <div className="relative max-w-md w-full">
                {/* Logo */}
                <div className="text-center mb-8">
                    <Link to="/" className="inline-flex items-center justify-center">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}>
                                <span className="text-white font-black text-2xl tracking-tight">K</span>
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-lg bg-[#CCCCFF] flex items-center justify-center">
                                <span className="text-[#292966] text-xs font-bold">✓</span>
                            </div>
                        </div>
                    </Link>
                    <h1 className={`text-3xl font-bold mt-6 mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome back</h1>
                    <p className={`${isDark ? 'text-white/50' : 'text-gray-500'}`}>Sign in to manage your business</p>
                </div>

                {/* Login Form */}
                <div className={`rounded-3xl p-8 backdrop-blur-xl ${isDark ? 'bg-white/[0.03] border border-white/[0.06]' : 'bg-white/80 border border-black/[0.04] shadow-xl'}`}>
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-3 rounded-xl text-sm">
                                {error}
                            </div>
                        )}

                        <div>
                            <label htmlFor="email" className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                Email or Phone
                            </label>
                            <input
                                id="email"
                                type="text"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all focus:outline-none ${isDark
                                    ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-[#5C5C99]'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#5C5C99]'
                                    }`}
                                placeholder="you@example.com"
                            />
                        </div>

                        <div>
                            <label htmlFor="password" className={`block text-xs font-semibold uppercase tracking-wide mb-2 ${isDark ? 'text-white/40' : 'text-gray-500'}`}>
                                Password
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`w-full px-4 py-3.5 rounded-xl border-2 transition-all focus:outline-none ${isDark
                                    ? 'bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus:border-[#5C5C99]'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-[#5C5C99]'
                                    }`}
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <label className="flex items-center cursor-pointer">
                                <input type="checkbox" className={`w-4 h-4 rounded ${isDark ? 'accent-[#5C5C99]' : 'accent-[#5C5C99]'}`} />
                                <span className={`ml-2 text-sm ${isDark ? 'text-white/60' : 'text-gray-600'}`}>Remember me</span>
                            </label>
                            <a href="#" className="text-sm font-medium" style={{ color: colors.violet }}>
                                Forgot password?
                            </a>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 px-6 rounded-xl font-semibold text-white transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                            style={{ background: `linear-gradient(135deg, ${colors.violet}, ${colors.indigo})` }}
                        >
                            {isLoading ? (
                                <span className="flex items-center justify-center">
                                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    Signing in...
                                </span>
                            ) : (
                                'Sign In'
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className={`${isDark ? 'text-white/50' : 'text-gray-600'}`}>
                            Don't have an account?{' '}
                            <Link to="/signup" className="font-semibold hover:underline" style={{ color: colors.violet }}>
                                Start Free Trial
                            </Link>
                        </p>
                    </div>
                </div>

                {/* Back to home */}
                <div className="mt-8 text-center">
                    <Link to="/" className={`text-sm transition-colors ${isDark ? 'text-white/40 hover:text-white/70' : 'text-gray-500 hover:text-gray-700'}`}>
                        ← Back to home
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default Login
