// Shop Carajás - Authentication & User Context (2FA & Session Security)
import React, { createContext, useContext, useEffect, useState } from 'react';
import { apiRequest, getAuthToken, setAuthToken } from '../services/api';
import { Courier, ServiceProvider, Store, User, UserRole } from '../worker/types';

export interface LoginResult {
  twoFactorRequired?: boolean;
  tempToken?: string;
  message?: string;
}

interface AuthContextType {
  user: User | null;
  store: Store | null;
  provider: ServiceProvider | null;
  courier: Courier | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
  login: (email: string, password: string) => Promise<LoginResult | void>;
  login2FA: (tempToken: string, code: string) => Promise<void>;
  register: (data: { name: string; email: string; password: string; phone?: string; role?: UserRole }) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [store, setStore] = useState<Store | null>(null);
  const [provider, setProvider] = useState<ServiceProvider | null>(null);
  const [courier, setCourier] = useState<Courier | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');

  const refreshUser = async () => {
    try {
      const token = getAuthToken();
      if (!token) {
        setUser(null);
        setStore(null);
        setProvider(null);
        setCourier(null);
        setIsLoading(false);
        return;
      }

      const res = await apiRequest<{ user: User | null; store?: Store | null; provider?: ServiceProvider | null; courier?: Courier | null }>('/api/auth/me');
      setUser(res.user || null);
      setStore(res.store || null);
      setProvider(res.provider || null);
      setCourier(res.courier || null);
    } catch (e) {
      console.warn('Auth token invalid or expired:', e);
      setAuthToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (email: string, password: string): Promise<LoginResult | void> => {
    const res = await apiRequest<{
      success: boolean;
      token?: string;
      user?: User;
      two_factor_required?: boolean;
      temp_token?: string;
      message?: string;
    }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });

    if (res.two_factor_required && res.temp_token) {
      return {
        twoFactorRequired: true,
        tempToken: res.temp_token,
        message: res.message
      };
    }

    if (res.token) {
      setAuthToken(res.token);
      await refreshUser();
      setIsAuthModalOpen(false);
    }
  };

  const login2FA = async (tempToken: string, code: string): Promise<void> => {
    const res = await apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/login-2fa', {
      method: 'POST',
      body: JSON.stringify({ temp_token: tempToken, code })
    });
    setAuthToken(res.token);
    await refreshUser();
    setIsAuthModalOpen(false);
  };

  const register = async (data: { name: string; email: string; password: string; phone?: string; role?: UserRole }) => {
    const res = await apiRequest<{ success: boolean; token: string; user: User }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    setAuthToken(res.token);
    await refreshUser();
    setIsAuthModalOpen(false);
  };

  const logout = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.error(e);
    }
    setAuthToken(null);
    setUser(null);
    setStore(null);
    setProvider(null);
    setCourier(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModalMode(mode);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setIsAuthModalOpen(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        store,
        provider,
        courier,
        isLoading,
        isAuthModalOpen,
        authModalMode,
        openAuthModal,
        closeAuthModal,
        login,
        login2FA,
        register,
        logout,
        refreshUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
