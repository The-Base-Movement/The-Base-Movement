/**
 * @file AuthContext.tsx
 * @description Provides the authentication context for the application, wraps Supabase authentication,
 * monitors session changes, logs user sign-in/out and password update activities,
 * and tracks device session properties.
 */

/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { userActivityService } from '@/services/userActivityService'
import { deviceTrackingService } from '@/services/deviceTrackingService'

/**
 * Authentication Context Values
 */
interface AuthContextValue {
  /** The current active user session, if any */
  session: Session | null
  /** The currently logged-in user object, if any */
  user: User | null
  /** Indicates whether the session is currently being loaded from Supabase */
  isLoading: boolean
  /**
   * Signs the user out, cleans up session storage, and logs the sign-out activity.
   */
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

/**
 * Provider component for the authentication context.
 * Sets up listeners for Supabase authentication state changes and logs relevant activities.
 *
 * @param props - Component props
 * @param props.children - The children components to be wrapped by the provider
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const hydrated = useRef(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)
      hydrated.current = true
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      setIsLoading(false)

      if (!hydrated.current) return

      if (event === 'SIGNED_IN' && session?.user) {
        userActivityService.logActivity(session.user.id, 'login', 'Signed in to account')
      }
      if (event === 'USER_UPDATED' && session?.user) {
        userActivityService.logActivity(session.user.id, 'password_change', 'Password updated')
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const signOut = async () => {
    if (user) {
      try {
        await deviceTrackingService.logoutDevice()
      } catch (err) {
        console.warn('[auth-context] failed to log admin device logout:', err)
      }
      await userActivityService.logActivity(user.id, 'logout', 'Signed out of account')
    }

    sessionStorage.removeItem('admin_device_captured')

    await supabase.auth.signOut({ scope: 'local' })
  }

  return (
    <AuthContext.Provider value={{ session, user, isLoading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

/**
 * Custom React hook to access the authentication context.
 * Must be used within an AuthProvider.
 *
 * @returns The authentication context value containing the current user, session status, and helper actions.
 * @throws Error if used outside of an AuthProvider.
 */
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
