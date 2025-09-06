import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { api } from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  mfaEnabled: boolean;
  encryptionSalt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string, mfaCode?: string) => Promise<any>;
  signup: (name: string, email: string, password: string) => Promise<any>;
  verifyMFA: (token: string, mfaCode: string) => Promise<any>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await api.get('/auth/me');
      setUser(response.data.user);
    } catch (error) {
      // User not authenticated
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string, mfaCode?: string) => {
    const response = await api.post('/auth/login', { email, password, mfaCode });
    
    if (response.data.requiresMFA) {
      return response.data;
    }
    
    setUser(response.data.user);
    return response.data;
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await api.post('/auth/signup', { name, email, password });
    return response.data;
  };

  const verifyMFA = async (token: string, mfaCode: string) => {
    const response = await api.post('/auth/verify-mfa', { token, mfaCode });
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const refreshToken = async (): Promise<boolean> => {
    try {
      const response = await api.post('/auth/refresh');
      setUser(response.data.user);
      return true;
    } catch (error) {
      setUser(null);
      return false;
    }
  };

  const value = {
    user,
    isLoading,
    login,
    signup,
    verifyMFA,
    logout,
    refreshToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}