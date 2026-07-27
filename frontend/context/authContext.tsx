'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { userSignupApi, userLoginApi, adminSignupApi, adminLoginApi } from '../services/api';
import { getApiUrl } from '../config/api';
import { useToast } from './toastContext';

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  profileImageUrl?: string;
  bio?: string;
  role: 'user' | 'admin';
  permissions?: string[];
  premiumAccess: boolean;
  freeCredits: number;
  usedCredits: number;
  createdAt?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  isAuthenticated: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  userSignup: (name: string, email: string, password: string) => Promise<void>;
  userLogin: (email: string, password: string) => Promise<void>;
  adminSignup: (name: string, email: string, password: string) => Promise<void>;
  adminLogin: (email: string, password: string) => Promise<void>;
  loginBypass: (role: 'user' | 'admin') => Promise<void>;
  logout: (expired?: boolean) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);
  const router = useRouter();
  const { showToast, clearToasts } = useToast();

  const syncAuthCookie = (tokenVal: string | null) => {
    if (typeof document === 'undefined') return;
    if (tokenVal) {
      const isHttps = typeof window !== 'undefined' && window.location.protocol === 'https:';
      document.cookie = `token=${tokenVal}; path=/; max-age=1500; SameSite=Lax${isHttps ? '; Secure' : ''}`;
    } else {
      document.cookie = 'token=; path=/; max-age=0; SameSite=Lax';
    }
  };

  useEffect(() => {
    const verifySession = async () => {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        syncAuthCookie(storedToken);
        try {
          setUser(JSON.parse(storedUser));
        } catch (_) {}
        setLoading(false);
      } else {
        setLoading(false);
      }

      if (!storedToken) return;

      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.user) {
            const verifiedUser: User = {
              id: data.user.id || data.user._id,
              name: data.user.name,
              email: data.user.email,
              profileImage: data.user.profileImageUrl || data.user.profileImage,
              profileImageUrl: data.user.profileImageUrl || data.user.profileImage,
              bio: data.user.bio || '',
              role: data.user.role,
              permissions: data.user.permissions || [],
              premiumAccess: data.user.premiumAccess,
              freeCredits: data.user.freeCredits,
              usedCredits: data.user.usedCredits,
              createdAt: data.user.createdAt,
            };
            setUser(verifiedUser);
            localStorage.setItem('user', JSON.stringify(verifiedUser));
          }
        } else if (res.status === 401 || res.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          syncAuthCookie(null);
          setToken(null);
          setUser(null);
        }
      } catch (err) {
        console.error('Session verification check error:', err);
      }
    };

    verifySession();
  }, []);

  useEffect(() => {
    const handleRefreshed = (e: Event) => {
      const customEvent = e as CustomEvent;
      const newToken = customEvent.detail;
      if (newToken) {
        setToken(newToken);
        syncAuthCookie(newToken);
      }
    };
    window.addEventListener('auth-token-refreshed', handleRefreshed);
    return () => {
      window.removeEventListener('auth-token-refreshed', handleRefreshed);
    };
  }, []);

  const loginWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
        credentials: 'include',
      });

      if (!res.ok) {
        let errorMsg = 'Google Auth failed';
        try {
          const errData = await res.json();
          errorMsg = errData.message || errorMsg;
        } catch (_) {
          const errText = await res.text();
          errorMsg = errText || 'Server returned invalid response';
        }
        throw new Error(errorMsg);
      }

      const data = await res.json();

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      syncAuthCookie(data.token);
      setToken(data.token);
      setUser(data.user);

      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const userSignup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const data = await userSignupApi(name, email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      syncAuthCookie(data.token);
      setToken(data.token);
      setUser(data.user);
      router.push('/dashboard');
    } catch (error: any) {
      console.error('User signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const userLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await userLoginApi(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      syncAuthCookie(data.token);
      setToken(data.token);
      setUser(data.user);
      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('User login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminSignup = async (name: string, email: string, password: string) => {
    setLoading(true);
    try {
      const data = await adminSignupApi(name, email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      syncAuthCookie(data.token);
      setToken(data.token);
      setUser(data.user);
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin signup error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const adminLogin = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await adminLoginApi(email, password);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      syncAuthCookie(data.token);
      setToken(data.token);
      setUser(data.user);
      router.push('/admin/dashboard');
    } catch (error: any) {
      console.error('Admin login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const loginBypass = async (role: 'user' | 'admin') => {
    setLoading(true);
    try {
      const mockUser = {
        email: role === 'admin' ? 'admin@21sttech.com' : 'user@21sttech.com',
        name: role === 'admin' ? 'Admin Operator' : 'Team Member',
        googleId: `mock_${role}_id_123`,
        picture: role === 'admin' 
          ? 'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120'
          : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=120'
      };

      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: `mock_${role}`, bypass: true, mockUser }),
        credentials: 'include',
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Mock Auth failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      syncAuthCookie(data.token);
      setToken(data.token);
      setUser(data.user);

      if (data.user.role === 'admin') {
        router.push('/admin/dashboard');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Bypass login error:', error);
    } finally {
      setLoading(false);
    }
  };

  const logout = async (expired: boolean = false) => {
    setIsLoggingOut(true);
    showToast(expired ? 'Session expired' : 'Logging out...', expired ? 'error' : 'loading');
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      await new Promise((resolve) => setTimeout(resolve, 400));
    } catch (err) {
      console.error('Backend logout call failed:', err);
    }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    syncAuthCookie(null);
    setToken(null);
    setUser(null);
    setIsLoggingOut(false);
    clearToasts();
    if (expired) {
      showToast('Session expired due to inactivity.', 'error');
      const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      router.push(isAdmin ? '/admin/login?expired=true' : '/login?expired=true');
    } else {
      showToast('Logged out successfully', 'success');
      const isAdmin = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin');
      router.push(isAdmin ? '/admin/login?logout=success' : '/login?logout=success');
    }
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = {
          id: data.user.id || data.user._id,
          name: data.user.name,
          email: data.user.email,
          profileImage: data.user.profileImageUrl || data.user.profileImage,
          profileImageUrl: data.user.profileImageUrl || data.user.profileImage,
          bio: data.user.bio || '',
          role: data.user.role,
          permissions: data.user.permissions || [],
          premiumAccess: data.user.premiumAccess,
          freeCredits: data.user.freeCredits,
          usedCredits: data.user.usedCredits,
          createdAt: data.user.createdAt,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, isAuthenticated: Boolean(user), loginWithGoogle, userSignup, userLogin, adminSignup, adminLogin, loginBypass, logout, refreshUser }}>
      {isLoggingOut && (
        <div className="fixed inset-0 z-[9999] bg-neutral-950/80 backdrop-blur-md flex flex-col items-center justify-center gap-4 transition-all duration-300 animate-in fade-in">
          <div className="relative flex items-center justify-center">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <RefreshCw className="w-5 h-5 text-indigo-400 animate-spin absolute" />
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <p className="text-xs font-bold text-white tracking-wide">Logging Out...</p>
          </div>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
