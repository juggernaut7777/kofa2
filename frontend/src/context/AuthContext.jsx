import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { API_BASE_URL, API_ENDPOINTS, apiCall } from '../config/api'

const AuthContext = createContext(null)

// Session timeout: 15 minutes of inactivity
const SESSION_TIMEOUT_MS = 15 * 60 * 1000

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const timeoutRef = useRef(null)
    const lastActivityRef = useRef(Date.now())

    // Reset inactivity timer on user activity
    const resetTimer = useCallback(() => {
        lastActivityRef.current = Date.now()

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }

        // Only set timeout if user is authenticated
        if (isAuthenticated) {
            timeoutRef.current = setTimeout(() => {
                console.log('[Security] Session timeout - logging out due to inactivity')
                logout()
                window.location.href = '/login?reason=timeout'
            }, SESSION_TIMEOUT_MS)
        }
    }, [isAuthenticated])

    // Setup activity listeners
    useEffect(() => {
        if (!isAuthenticated) return

        const activityEvents = ['mousedown', 'mousemove', 'keydown', 'scroll', 'touchstart', 'click']

        const handleActivity = () => {
            resetTimer()
        }

        activityEvents.forEach(event => {
            window.addEventListener(event, handleActivity, { passive: true })
        })

        // Start the initial timer
        resetTimer()

        return () => {
            activityEvents.forEach(event => {
                window.removeEventListener(event, handleActivity)
            })
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current)
            }
        }
    }, [isAuthenticated, resetTimer])

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('kofa_user')
        const lastActivity = localStorage.getItem('kofa_last_activity')

        if (storedUser) {
            try {
                // Check if session has expired while away
                if (lastActivity) {
                    const timeSinceActivity = Date.now() - parseInt(lastActivity, 10)
                    if (timeSinceActivity > SESSION_TIMEOUT_MS) {
                        console.log('[Security] Session expired while away')
                        localStorage.removeItem('kofa_user')
                        localStorage.removeItem('kofa_last_activity')
                        setIsLoading(false)
                        return
                    }
                }

                const userData = JSON.parse(storedUser)
                setUser(userData)
                setIsAuthenticated(true)
            } catch (e) {
                localStorage.removeItem('kofa_user')
                localStorage.removeItem('kofa_last_activity')
            }
        }
        setIsLoading(false)
    }, [])

    // Persist last activity time
    useEffect(() => {
        if (isAuthenticated) {
            const interval = setInterval(() => {
                localStorage.setItem('kofa_last_activity', String(lastActivityRef.current))
            }, 10000) // Update every 10 seconds
            return () => clearInterval(interval)
        }
    }, [isAuthenticated])

    // Validate email format
    const isValidEmail = (email) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const login = async (email, password) => {
        try {
            // Basic validation
            if (!email || !password) {
                return { success: false, error: 'Please enter email and password' }
            }

            if (!isValidEmail(email)) {
                return { success: false, error: 'Please enter a valid email address' }
            }

            // Call backend login API
            const response = await apiCall(API_ENDPOINTS.AUTH_LOGIN, {
                method: 'POST',
                body: JSON.stringify({
                    email: email.toLowerCase().trim(),
                    password
                })
            })

            if (response.success) {
                const userData = {
                    id: response.user_id,
                    email: response.email,
                    firstName: response.first_name,
                    businessName: response.business_name,
                    plan: 'free',
                    productLimit: 50,
                    createdAt: new Date().toISOString()
                }

                localStorage.setItem('kofa_user', JSON.stringify(userData))
                localStorage.setItem('kofa_last_activity', String(Date.now()))
                setUser(userData)
                setIsAuthenticated(true)
                return { success: true }
            } else {
                return { success: false, error: response.message || 'Login failed' }
            }
        } catch (error) {
            console.error('Login error:', error)
            return { success: false, error: error.message || 'Login failed. Please check your credentials.' }
        }
    }

    const signup = async (userData) => {
        try {
            // Validation
            if (!userData.email || !userData.password) {
                return { success: false, error: 'Email and password are required' }
            }

            if (!isValidEmail(userData.email)) {
                return { success: false, error: 'Please enter a valid email address' }
            }

            if (userData.password.length < 6) {
                return { success: false, error: 'Password must be at least 6 characters' }
            }

            if (!userData.firstName || userData.firstName.length < 1) {
                return { success: false, error: 'Please enter your first name' }
            }

            if (!userData.businessName || userData.businessName.length < 2) {
                return { success: false, error: 'Please enter your business name' }
            }

            // Call backend register API
            const response = await apiCall(API_ENDPOINTS.AUTH_REGISTER, {
                method: 'POST',
                body: JSON.stringify({
                    email: userData.email.toLowerCase().trim(),
                    password: userData.password,
                    first_name: userData.firstName,
                    business_name: userData.businessName,
                    phone: userData.phone || null
                })
            })

            if (response.success) {
                const newUser = {
                    id: response.user_id,
                    email: response.email,
                    firstName: response.first_name,
                    businessName: response.business_name,
                    plan: 'free',
                    productLimit: 50,
                    createdAt: new Date().toISOString()
                }

                localStorage.setItem('kofa_user', JSON.stringify(newUser))
                localStorage.setItem('kofa_last_activity', String(Date.now()))
                setUser(newUser)
                setIsAuthenticated(true)
                return { success: true }
            } else {
                return { success: false, error: response.message || 'Registration failed' }
            }
        } catch (error) {
            console.error('Signup error:', error)
            return { success: false, error: error.message || 'Registration failed. Please try again.' }
        }
    }

    const logout = useCallback(() => {
        localStorage.removeItem('kofa_user')
        localStorage.removeItem('kofa_last_activity')
        setUser(null)
        setIsAuthenticated(false)

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current)
        }
    }, [])

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout,
        // Expose session info for UI
        sessionTimeoutMinutes: SESSION_TIMEOUT_MS / 60000
    }

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export default AuthContext
