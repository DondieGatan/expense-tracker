import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken } from '../api/client';
import { User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (fullName: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await api.get('/auth/me');
        setUser(data.user);
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    try {
      const data = await api.post('/auth/login', { email, password });
      await setToken(data.accessToken);
      setUser(data.user);
    } catch (e: any) {
      setError(e.message || 'Login failed.');
      throw e;
    }
  }, []);

  const register = useCallback(async (fullName: string, email: string, password: string) => {
    setError(null);
    try {
      const data = await api.post('/auth/register', { fullName, email, password });
      await setToken(data.accessToken);
      setUser(data.user);
    } catch (e: any) {
      setError(e.message || 'Registration failed.');
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
