'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export interface User {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  role: 'user' | 'admin';
  premiumAccess: boolean;
  freeCredits: number;
  usedCredits: number;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  loginWithGoogle: (credential: string) => Promise<void>;
  loginBypass: (role: 'user' | 'admin') => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const router = useRouter();

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:5000';

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const loginWithGoogle = async (credential: string) => {
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Google Auth failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      if (data.user.role === 'admin') {
        router.push('/admin/users');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Google login error:', error);
      if (error instanceof TypeError || (error.message && error.message.includes('Failed to fetch'))) {
        alert('Network Connection Error:\n\nUnable to connect to the backend server. Please verify that your backend API is running on http://localhost:5000 and that MongoDB is active.');
      } else {
        alert(error instanceof Error ? error.message : 'Login failed');
      }
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

      const res = await fetch(`${BACKEND_URL}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: `mock_${role}`, bypass: true, mockUser }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Mock Auth failed');

      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);

      if (data.user.role === 'admin') {
        router.push('/admin/users');
      } else {
        router.push('/dashboard');
      }
    } catch (error: any) {
      console.error('Bypass login error:', error);
      if (error instanceof TypeError || (error.message && error.message.includes('Failed to fetch'))) {
        alert('Network Connection Error:\n\nUnable to connect to the backend server. Please verify that your backend API is running on http://localhost:5000.');
      } else {
        alert('Mock Login failed: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    router.push('/login');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        const updatedUser = {
          id: data.user._id,
          name: data.user.name,
          email: data.user.email,
          profileImage: data.user.profileImage,
          role: data.user.role,
          premiumAccess: data.user.premiumAccess,
          freeCredits: data.user.freeCredits,
          usedCredits: data.user.usedCredits,
        };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, loginWithGoogle, loginBypass, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
