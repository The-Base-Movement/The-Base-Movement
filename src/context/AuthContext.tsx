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

interface AuthContextValue {
  session: Session | null
  user: User | null
  isLoading: boolean
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

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
        // SIGNED_IN re-fires on tab focus and revalidation, so dedupe on the
        // auth server's last_sign_in_at rather than trusting the event.
        void userActivityService.logLoginOnce(session.user.id, session.user.last_sign_in_at)
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
        const { deviceTrackingService } = await import('@/services/deviceTrackingService')
        await deviceTrackingService.logoutDevice()
      } catch (err) {
        console.warn('[auth-context] failed to log admin device logout:', err)
      }
      await userActivityService.logLogoutOnce(user.id)
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

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
