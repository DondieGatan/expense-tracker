import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import {
  api, setTokens, getRefreshToken, registerSessionExpiredHandler, registerRetryStatusHandler, ApiError,
} from '../api/client';
import { User } from '../api/types';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  error: string | null;
  retryStatus: string | null;
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
  const [retryStatus, setRetryStatus] = useState<string | null>(null);
  const refreshTokenRef = useRef<string | null>(null);

  useEffect(() => {
    registerSessionExpiredHandler(() => {
      refreshTokenRef.current = null;
      setUser(null);
    });
    registerRetryStatusHandler(setRetryStatus);

    (async () => {
      refreshTokenRef.current = await getRefreshToken();
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
      await setTokens(data.accessToken, data.refreshToken);
      refreshTokenRef.current = data.refreshToken;
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
      await setTokens(data.accessToken, data.refreshToken);
      refreshTokenRef.current = data.refreshToken;
      setUser(data.user);
    } catch (e: any) {
      setError(e.message || 'Registration failed.');
      throw e;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout', refreshTokenRef.current ? { refreshToken: refreshTokenRef.current } : undefined);
    } catch (e) {
      // Best-effort server-side revocation — an unreachable API or an
      // already-expired token shouldn't block logging out locally.
      if (!(e instanceof ApiError)) throw e;
    }
    refreshTokenRef.current = null;
    await setTokens(null, null);
    setUser(null);
  }, []);

  const clearError = useCallback(() => setError(null), []);

  return (
    <AuthContext.Provider value={{ user, loading, error, retryStatus, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
