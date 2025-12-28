/**
 * KOFA Auth Context - React Context for Authentication State
 * Manages user session and provides auth state throughout the app
 */
import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase, getSession, signIn, signUp, signOut, hasCompletedOnboarding, setOnboardingComplete } from '@/lib/auth';

// Account types
export type AccountType = 'sales' | 'logistics';

// Auth context type
interface AuthContextType {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    hasOnboarded: boolean;
    accountType: AccountType | null;
    businessData: any;
    signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    signUp: (email: string, password: string, businessName?: string) => Promise<{ success: boolean; error?: string }>;
    signOut: () => Promise<void>;
    completeOnboarding: (businessData?: any) => Promise<void>;
    updateAccountType: (type: AccountType) => Promise<void>;
}

// Create context with default values
const AuthContext = createContext<AuthContextType>({
    user: null,
    session: null,
    isLoading: true,
    isAuthenticated: false,
    hasOnboarded: false,
    accountType: null,
    businessData: null,
    signIn: async () => ({ success: false }),
    signUp: async () => ({ success: false }),
    signOut: async () => { },
    completeOnboarding: async () => { },
    updateAccountType: async () => { },
});

// Hook to use auth context
export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// Auth Provider component
interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [hasOnboarded, setHasOnboarded] = useState(false);
    const [accountType, setAccountType] = useState<AccountType | null>(null);
    const [businessData, setBusinessData] = useState<any>(null);

    // Initialize auth state on mount
    useEffect(() => {
        initializeAuth();

        // Listen for auth state changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, newSession) => {
                setSession(newSession);
                setUser(newSession?.user ?? null);

                if (event === 'SIGNED_IN' && newSession) {
                    const onboarded = await hasCompletedOnboarding();
                    setHasOnboarded(onboarded);

                    // Load account type and business data if onboarded
                    if (onboarded) {
                        // TODO: Load from AsyncStorage or backend
                        // For now, we'll set defaults
                    }
                }

                if (event === 'SIGNED_OUT') {
                    setHasOnboarded(false);
                    setAccountType(null);
                    setBusinessData(null);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    async function initializeAuth() {
        try {
            const currentSession = await getSession();
            setSession(currentSession);
            setUser(currentSession?.user ?? null);

            if (currentSession) {
                const onboarded = await hasCompletedOnboarding();
                setHasOnboarded(onboarded);
            }
        } catch (error) {
            console.error('Auth initialization error:', error);
        } finally {
            setIsLoading(false);
        }
    }

    // Sign in handler
    async function handleSignIn(email: string, password: string) {
        const result = await signIn(email, password);
        if (result.success && result.user) {
            setUser(result.user);
            setSession(result.session ?? null);
            const onboarded = await hasCompletedOnboarding();
            setHasOnboarded(onboarded);
        }
        return { success: result.success, error: result.error };
    }

    // Sign up handler
    async function handleSignUp(email: string, password: string, businessName?: string) {
        const result = await signUp(email, password, businessName);
        if (result.success && result.user) {
            setUser(result.user);
            setSession(result.session ?? null);
            setHasOnboarded(false); // New users haven't onboarded
        }
        return { success: result.success, error: result.error };
    }

    // Sign out handler
    async function handleSignOut() {
        await signOut();
        setUser(null);
        setSession(null);
        setHasOnboarded(false);
    }

    // Complete onboarding handler
    async function handleCompleteOnboarding(businessInfo?: any) {
        if (businessInfo) {
            setAccountType(businessInfo.accountType);
            setBusinessData(businessInfo);
            // TODO: Save to AsyncStorage or backend
        }
        await setOnboardingComplete();
        setHasOnboarded(true);
    }

    // Update account type handler
    async function handleUpdateAccountType(type: AccountType) {
        setAccountType(type);
        // TODO: Save to backend/AsyncStorage
    }

    const value: AuthContextType = {
        user,
        session,
        isLoading,
        isAuthenticated: !!user,
        hasOnboarded,
        accountType,
        businessData,
        signIn: handleSignIn,
        signUp: handleSignUp,
        signOut: handleSignOut,
        completeOnboarding: handleCompleteOnboarding,
        updateAccountType: handleUpdateAccountType,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export default AuthContext;
