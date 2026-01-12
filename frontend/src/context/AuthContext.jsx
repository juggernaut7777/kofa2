import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'

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
                // Redirect to login
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

    const login = async (email, password) => {
        try {
            // TODO: Replace with real API call using credentials: 'include' for HTTP-Only cookies
            const mockUser = {
                id: 'user-' + Date.now(),
                email: email,
                businessName: 'My Business',
                plan: 'free',
                productLimit: 50,
                createdAt: new Date().toISOString()
            }

            localStorage.setItem('kofa_user', JSON.stringify(mockUser))
            localStorage.setItem('kofa_last_activity', String(Date.now()))
            setUser(mockUser)
            setIsAuthenticated(true)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    const signup = async (userData) => {
        try {
            const newUser = {
                id: 'user-' + Date.now(),
                email: userData.email,
                phone: userData.phone,
                businessName: userData.businessName,
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
