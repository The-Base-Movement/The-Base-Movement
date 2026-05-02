/**
 * Auth Service
 * Handles integration with Neon Auth (Better Auth).
 */

const AUTH_URL = import.meta.env.VITE_NEON_AUTH_URL;

export interface AuthSession {
  session: {
    id: string;
    userId: string;
    token: string;
    expiresAt: string;
    ipAddress: string;
    userAgent: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string;
  };
}

class AuthService {
  private static instance: AuthService;
  private session: AuthSession | null = null;

  private constructor() {
    // Try to restore session from localStorage if available
    const saved = localStorage.getItem('neon_auth_session');
    if (saved) {
      try {
        this.session = JSON.parse(saved);
      } catch (e) {
        console.error('Failed to parse saved session', e);
      }
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  async login(email: string, password: string): Promise<AuthSession> {
    const response = await fetch(`${AUTH_URL}/sign-in/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();
    this.session = data;
    localStorage.setItem('neon_auth_session', JSON.stringify(data));
    return data;
  }

  async signUp(email: string, password: string, name: string, image?: string): Promise<AuthSession> {
    const response = await fetch(`${AUTH_URL}/sign-up/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password, name, image }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Registration failed');
    }

    const data = await response.json();
    this.session = data;
    localStorage.setItem('neon_auth_session', JSON.stringify(data));
    return data;
  }

  logout() {
    this.session = null;
    localStorage.removeItem('neon_auth_session');
    // Also hit the sign-out endpoint to clear cookies
    fetch(`${AUTH_URL}/sign-out`, { method: 'POST' }).catch(console.error);
  }

  getToken(): string | null {
    // Better Auth returns sessionToken in the session object.
    // The Neon Data API requires this JWT as the Bearer token.
    return this.session?.session.token || null;
  }

  isAuthenticated(): boolean {
    return !!this.session;
  }

  getUser() {
    return this.session?.user || null;
  }
}

export const authService = AuthService.getInstance();
