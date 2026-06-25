/**
 * Auth Service
 * Handles integration with Supabase Auth.
 */

import { supabase } from '@/lib/supabase'
import type { Session, User, AuthResponse } from '@supabase/supabase-js'
import { deviceTrackingService } from './deviceTrackingService'

export interface AuthSession {
  session: Session | null
  user: User | null
}

class AuthService {
  private static instance: AuthService
  private currentSession: Session | null = null
  // Guards against recording the same sign-in twice (SIGNED_IN can fire more than
  // once for one login, e.g. across tabs); keyed by the session access token.
  private lastLoggedToken: string | null = null

  private constructor() {
    // Initialize session state
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentSession = session
    })

    // Listen for auth changes
    supabase.auth.onAuthStateChange((event, session) => {
      this.currentSession = session
      if (event === 'SIGNED_IN' && session?.access_token) {
        this.recordSession(session.access_token)
      }
    })
  }

  // Fire-and-forget: record where/how the member signed in. Never blocks or throws
  // into the auth flow — a failed log must not affect login.
  private recordSession(accessToken: string): void {
    if (this.lastLoggedToken === accessToken) return
    this.lastLoggedToken = accessToken
    supabase.functions.invoke('log-member-session').catch((err) => {
      console.warn('[auth] failed to record session:', err)
    })
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService()
    }
    return AuthService.instance
  }

  async login(identifier: string, password: string): Promise<AuthResponse['data']> {
    const trimmedIdentifier = identifier.trim()
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedIdentifier)
    const isPhone = /^\+?[0-9]+$/.test(trimmedIdentifier.replace(/\s+/g, ''))

    if (isPhone) {
      let formattedPhone = trimmedIdentifier.replace(/\s+/g, '')
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+233' + formattedPhone.substring(1)
      } else if (!formattedPhone.startsWith('+')) {
        formattedPhone = '+' + formattedPhone
      }

      // ponytail: skip client-side dummy email attempt — it always 400s for
      // admin-promoted members and leaks errors to console. The edge function
      // handles both dummy-email and real-email resolution server-side.
      const { data: fnData, error: fnError } = await supabase.functions.invoke('phone-login', {
        body: { identifier: trimmedIdentifier, phone: formattedPhone, password },
      })

      if (fnError || !fnData?.access_token) {
        throw new Error('Invalid login credentials')
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: fnData.access_token,
        refresh_token: fnData.refresh_token,
      })
      if (sessionError) {
        throw new Error(sessionError.message || 'Login failed')
      }

      this.currentSession = sessionData.session
      return sessionData
    }

    if (!isEmail) {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('phone-login', {
        body: { identifier: trimmedIdentifier, password },
      })

      if (fnError || !fnData?.access_token) {
        throw new Error('Invalid login credentials')
      }

      const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
        access_token: fnData.access_token,
        refresh_token: fnData.refresh_token,
      })
      if (sessionError) {
        throw new Error(sessionError.message || 'Login failed')
      }

      this.currentSession = sessionData.session
      return sessionData
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: trimmedIdentifier,
      password,
    })

    if (error) {
      const { data: fnData, error: fnError } = await supabase.functions.invoke('phone-login', {
        body: { identifier: trimmedIdentifier, password },
      })

      if (!fnError && fnData?.access_token) {
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: fnData.access_token,
          refresh_token: fnData.refresh_token,
        })
        if (sessionError) {
          throw new Error(sessionError.message || 'Login failed')
        }

        this.currentSession = sessionData.session
        return sessionData
      }

      throw new Error(error.message || 'Login failed')
    }

    this.currentSession = data.session
    return data
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: (typeof window !== 'undefined' ? window.location.origin : '') + '/dashboard',
      },
    })

    if (error) {
      throw new Error(error.message || 'Google Sign-In failed')
    }
  }

  async signUp(
    email: string,
    password: string,
    name: string,
    image?: string
  ): Promise<AuthResponse['data']> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          avatar_url: image,
        },
      },
    })

    if (error) {
      throw new Error(error.message || 'Registration failed')
    }

    this.currentSession = data.session
    return data
  }

  async logout() {
    // Mark this member's active session(s) as ended before signing out (while the
    // JWT is still valid for the RLS update). Best-effort — never blocks logout.
    const uid = this.currentSession?.user?.id
    if (uid) {
      try {
        await deviceTrackingService.logoutDevice()
      } catch (err) {
        console.warn('[auth] failed to log admin device logout:', err)
      }
      try {
        await supabase
          .from('member_sessions')
          .update({ is_current: false })
          .eq('member_id', uid)
          .eq('is_current', true)
      } catch (err) {
        console.warn('[auth] failed to end session record:', err)
      }
    }

    sessionStorage.removeItem('admin_device_captured')
    sessionStorage.removeItem('admin_gate_verified')
    sessionStorage.removeItem('admin_gate_passed')

    this.lastLoggedToken = null
    this.currentSession = null
    await supabase.auth.signOut({ scope: 'local' })
  }

  getToken(): string | null {
    return this.currentSession?.access_token || null
  }

  isAuthenticated(): boolean {
    return this.currentSession !== null
  }

  getUser() {
    return this.currentSession?.user || null
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    })

    if (error) {
      throw new Error(error.message || 'Failed to update password')
    }
  }

  async updateProfile(updates: {
    full_name?: string
    avatar_url?: string
    phone?: string
  }): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      data: updates,
    })

    if (error) {
      throw new Error(error.message || 'Failed to update profile')
    }
  }

  async listMfaFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) throw error
    return data
  }

  async challengeAndVerifyMfa(factorId: string, code: string) {
    const challenge = await supabase.auth.mfa.challenge({ factorId })
    if (challenge.error) throw challenge.error
    const verify = await supabase.auth.mfa.verify({
      factorId,
      challengeId: challenge.data.id,
      code,
    })
    if (verify.error) throw verify.error
    return verify.data
  }

  async listAllMfaFactors() {
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) return []
    return data?.all ?? []
  }

  async enrollMfa(friendlyName: string, issuer: string) {
    const existing = await supabase.auth.mfa.listFactors()
    if (!existing.error) {
      await Promise.all(
        (existing.data?.all ?? [])
          .filter((f) => f.factor_type === 'totp' && f.status === 'unverified')
          .map((f) => supabase.auth.mfa.unenroll({ factorId: f.id }))
      )
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: 'totp',
      friendlyName,
      issuer,
    })
    if (error) throw error
    return data
  }

  async unenrollMfa(factorId: string) {
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    if (error) throw error
  }
}

export const authService = AuthService.getInstance()
