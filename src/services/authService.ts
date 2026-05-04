/**
 * Auth Service
 * Handles integration with Supabase Auth.
 */

import { supabase } from '@/lib/supabase'
import type { Session, User, AuthResponse } from '@supabase/supabase-js'

export interface AuthSession {
  session: Session | null;
  user: User | null;
}

class AuthService {
  private static instance: AuthService;
  private currentSession: Session | null = null;

  private constructor() {
    // Initialize session state
    supabase.auth.getSession().then(({ data: { session } }) => {
      this.currentSession = session;
    });

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      this.currentSession = session;
      if (session) {
        localStorage.setItem('supabase_session_active', 'true');
      } else {
        localStorage.removeItem('supabase_session_active');
      }
    });
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<AuthResponse['data']> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || 'Login failed');
    }

    this.currentSession = data.session;
    return data;
  }

  async signInWithGoogle(): Promise<void> {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/dashboard'
      }
    });

    if (error) {
      throw new Error(error.message || 'Google Sign-In failed');
    }
  }

  async signUp(email: string, password: string, name: string, image?: string): Promise<AuthResponse['data']> {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          avatar_url: image,
        },
      },
    });

    if (error) {
      throw new Error(error.message || 'Registration failed');
    }

    this.currentSession = data.session;
    return data;
  }

  async logout() {
    this.currentSession = null;
    await supabase.auth.signOut();
  }

  getToken(): string | null {
    return this.currentSession?.access_token || null;
  }

  isAuthenticated(): boolean {
    if (this.currentSession) return true;
    return localStorage.getItem('supabase_session_active') === 'true';
  }

  getUser() {
    return this.currentSession?.user || null;
  }

  async updatePassword(newPassword: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      throw new Error(error.message || 'Failed to update password');
    }
  }

  async updateProfile(updates: { full_name?: string; avatar_url?: string }): Promise<void> {
    const { error } = await supabase.auth.updateUser({
      data: updates
    });

    if (error) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }
}

export const authService = AuthService.getInstance();
