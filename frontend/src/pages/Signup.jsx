import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Package, Eye, EyeOff } from 'lucide-react'

const Signup = () => {
    const [formData, setFormData] = useState({
        firstName: '',
        businessName: '',
        email: '',
        phone: '',
        password: ''
    })
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState('')
    const [isLoading, setIsLoading] = useState(false)

    const { signup } = useAuth()
    const navigate = useNavigate()

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError('')
        setIsLoading(true)

        if (!formData.firstName || !formData.businessName || !formData.email || !formData.password) {
            setError('Please fill in all required fields')
            setIsLoading(false)
            return
        }

        const result = await signup(formData)

        if (result.success) {
            navigate('/dashboard', { replace: true })
        } else {
            setError(result.error || 'Signup failed. Please try again.')
        }

        setIsLoading(false)
    }

    return (
        <div className="min-h-screen bg-white flex flex-col">
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
                {/* Logo */}
                <div className="mb-8 text-center">
                    <div className="w-16 h-16 bg-[#0095FF] rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Package size={32} className="text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">Create Account</h1>
                    <p className="text-gray-400 mt-1">Start your 14-day free trial</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            First Name
                        </label>
                        <input
                            type="text"
                            value={formData.firstName}
                            onChange={(e) => handleChange('firstName', e.target.value)}
                            className="stitch-input"
                            placeholder="Your first name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            Business Name
                        </label>
                        <input
                            type="text"
                            value={formData.businessName}
                            onChange={(e) => handleChange('businessName', e.target.value)}
                            className="stitch-input"
                            placeholder="Your Store Name"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            Email Address
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => handleChange('email', e.target.value)}
                            className="stitch-input"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            Phone Number (Optional)
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => handleChange('phone', e.target.value)}
                            className="stitch-input"
                            placeholder="+234 800 000 0000"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={formData.password}
                                onChange={(e) => handleChange('password', e.target.value)}
                                className="stitch-input pr-12"
                                placeholder="Min. 8 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="btn-primary w-full mt-6"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                                Creating account...
                            </span>
                        ) : (
                            'Start Free Trial'
                        )}
                    </button>

                    <p className="text-center text-xs text-gray-400 mt-4">
                        By signing up, you agree to our{' '}
                        <a href="#" className="text-[#0095FF]">Terms</a> and{' '}
                        <a href="#" className="text-[#0095FF]">Privacy Policy</a>
                    </p>
                </form>

                <p className="mt-8 text-gray-500">
                    Already have an account?{' '}
                    <Link to="/login" className="text-[#0095FF] font-medium">
                        Sign In
                    </Link>
                </p>

                <Link to="/" className="mt-6 text-gray-400 text-sm hover:text-gray-600">
                    ← Back to home
                </Link>
            </div>
        </div>
    )
}

export default Signup
