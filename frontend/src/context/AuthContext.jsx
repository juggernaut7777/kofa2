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

            if (password.length < 4) {
                return { success: false, error: 'Password must be at least 4 characters' }
            }

            // Try to verify backend is reachable
            try {
                await fetch(`${API_BASE_URL}${API_ENDPOINTS.HEALTH}`, { 
                    method: 'GET',
                    signal: AbortSignal.timeout(3000)
                })
            } catch (e) {
                console.warn('Backend health check failed, proceeding with local auth')
            }

            // Create user session
            const userData = {
                id: 'vendor-' + Date.now(),
                email: email,
                businessName: email.split('@')[0] + "'s Business",
                storeName: email.split('@')[0] + "'s Store",
                plan: 'free',
                productLimit: 50,
                createdAt: new Date().toISOString()
            }

            localStorage.setItem('kofa_user', JSON.stringify(userData))
            localStorage.setItem('kofa_last_activity', String(Date.now()))
            setUser(userData)
            setIsAuthenticated(true)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
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

            if (!userData.businessName || userData.businessName.length < 2) {
                return { success: false, error: 'Please enter your business name' }
            }

            // Create new vendor
            const newUser = {
                id: 'vendor-' + Date.now(),
                email: userData.email,
                phone: userData.phone || '',
                businessName: userData.businessName,
                storeName: userData.businessName,
                plan: 'free',
                productLimit: 50,
                createdAt: new Date().toISOString()
            }

            localStorage.setItem('kofa_user', JSON.stringify(newUser))
            localStorage.setItem('kofa_last_activity', String(Date.now()))
            setUser(newUser)
            setIsAuthenticated(true)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
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
