import { useState, useEffect, useRef } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { apiCall, API_ENDPOINTS } from '../config/api'
import { useAuth } from '../context/AuthContext'

const Verify = () => {
    const navigate = useNavigate()
    const location = useLocation()
    const { login } = useAuth()

    const [email, setEmail] = useState('')
    const [code, setCode] = useState(['', '', '', '', '', ''])
    const [loading, setLoading] = useState(false)
    const [resending, setResending] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState('')

    const inputRefs = [
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null),
        useRef(null)
    ]

    useEffect(() => {
        // Get email from location state (passed from Signup)
        const emailFromState = location.state?.email
        if (!emailFromState) {
            // No email provided, redirect to signup
            navigate('/signup')
            return
        }
        setEmail(emailFromState)

        // Focus first input
        inputRefs[0].current?.focus()
    }, [location, navigate])

    const handleCodeChange = (index, value) => {
        // Only allow numbers
        if (value && !/^\d$/.test(value)) return

        const newCode = [...code]
        newCode[index] = value
        setCode(newCode)
        setError('')

        // Auto-focus next input
        if (value && index < 5) {
            inputRefs[index + 1].current?.focus()
        }
    }

    const handleKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !code[index] && index > 0) {
            // Move to previous input on backspace if current is empty
            inputRefs[index - 1].current?.focus()
        }
    }

    const handlePaste = (e) => {
        e.preventDefault()
        const pastedData = e.clipboardData.getData('text').trim()

        // Check if it's a 6-digit code
        if (/^\d{6}$/.test(pastedData)) {
            const newCode = pastedData.split('')
            setCode(newCode)
            setError('')
            // Focus last input
            inputRefs[5].current?.focus()
        }
    }

    const handleVerify = async () => {
        const verificationCode = code.join('')

        if (verificationCode.length !== 6) {
            setError('Please enter the complete 6-digit code')
            return
        }

        setLoading(true)
        setError('')
        setSuccess('')

        try {
            const response = await apiCall(API_ENDPOINTS.VERIFY_EMAIL, {
                method: 'POST',
                body: JSON.stringify({
                    email: email,
                    code: verificationCode
                })
            })

            if (response.success) {
                setSuccess('✅ Email verified! Redirecting to dashboard...')

                // Log the user in
                login({
                    id: response.user_id,
                    email: response.email,
                    firstName: response.first_name,
                    businessName: response.business_name
                })

                // Redirect to dashboard
                setTimeout(() => {
                    navigate('/dashboard')
                }, 1500)
            } else {
                setError(response.message || 'Verification failed')
            }
        } catch (err) {
            setError(err.message || 'Invalid verification code. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const handleResend = async () => {
        setResending(true)
        setError('')
        setSuccess('')

        try {
            const response = await apiCall(`${API_ENDPOINTS.RESEND_CODE}?email=${encodeURIComponent(email)}`, {
                method: 'POST'
            })

            if (response.success) {
                setSuccess('✉️ New verification code sent! Check your email.')
                setCode(['', '', '', '', '', ''])
                inputRefs[0].current?.focus()
            } else {
                setError(response.message || 'Failed to resend code')
            }
        } catch (err) {
            setError('Failed to resend code. Please try again.')
        } finally {
            setResending(false)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500 rounded-full mb-4">
                        <span className="text-3xl">✉️</span>
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        Verify Your Email
                    </h1>
                    <p className="text-gray-600">
                        We sent a 6-digit code to<br />
                        <span className="font-semibold text-gray-900">{email}</span>
                    </p>
                </div>

                {/* Verification Form */}
                <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
                    {/* Code Inputs */}
                    <div className="flex gap-2 justify-center mb-6">
                        {code.map((digit, index) => (
                            <input
                                key={index}
                                ref={inputRefs[index]}
                                type="text"
                                inputMode="numeric"
                                maxLength={1}
                                value={digit}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                onPaste={index === 0 ? handlePaste : undefined}
                                className="w-12 h-14 text-center text-2xl font-bold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none transition-colors"
                            />
                        ))}
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm text-center">
                            {error}
                        </div>
                    )}

                    {/* Success Message */}
                    {success && (
                        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm text-center">
                            {success}
                        </div>
                    )}

                    {/* Verify Button */}
                    <button
                        onClick={handleVerify}
                        disabled={loading || code.join('').length !== 6}
                        className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-4 rounded-xl font-semibold text-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-300 disabled:to-gray-400 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl"
                    >
                        {loading ? 'Verifying...' : 'Verify Email'}
                    </button>

                    {/* Resend Button */}
                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-600 mb-2">
                            Didn't receive the code?
                        </p>
                        <button
                            onClick={handleResend}
                            disabled={resending}
                            className="text-blue-500 font-medium hover:text-blue-600 disabled:text-gray-400"
                        >
                            {resending ? 'Sending...' : 'Resend Code'}
                        </button>
                    </div>
                </div>

                {/* Tips */}
                <div className="bg-blue-50 rounded-xl p-4 text-sm text-gray-700">
                    <p className="font-semibold mb-2">💡 Tips:</p>
                    <ul className="space-y-1 text-gray-600">
                        <li>• Check your spam folder if you don't see the email</li>
                        <li>• The code expires in 15 minutes</li>
                        <li>• Make sure to enter all 6 digits</li>
                    </ul>
                </div>
            </div>
        </div>
    )
}

export default Verify
