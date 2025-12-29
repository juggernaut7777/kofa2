import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)

    // Check for existing session on mount
    useEffect(() => {
        const storedUser = localStorage.getItem('kofa_user')
        if (storedUser) {
            try {
                const userData = JSON.parse(storedUser)
                setUser(userData)
                setIsAuthenticated(true)
            } catch (e) {
                localStorage.removeItem('kofa_user')
            }
        }
        setIsLoading(false)
    }, [])

    const login = async (email, password) => {
        // For now, mock authentication
        // TODO: Connect to backend /users/login endpoint when ready
        try {
            // Simulate API call
            const mockUser = {
                id: 'user-' + Date.now(),
                email: email,
                businessName: 'My Business',
                plan: 'free',
                productLimit: 50,
                createdAt: new Date().toISOString()
            }

            localStorage.setItem('kofa_user', JSON.stringify(mockUser))
            setUser(mockUser)
            setIsAuthenticated(true)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    const signup = async (userData) => {
        // For now, mock registration
        // TODO: Connect to backend /users endpoint when ready
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
            setUser(newUser)
            setIsAuthenticated(true)
            return { success: true }
        } catch (error) {
            return { success: false, error: error.message }
        }
    }

    const logout = () => {
        localStorage.removeItem('kofa_user')
        setUser(null)
        setIsAuthenticated(false)
    }

    const value = {
        user,
        isAuthenticated,
        isLoading,
        login,
        signup,
        logout
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
