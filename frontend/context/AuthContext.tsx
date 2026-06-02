"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '@/lib/api';

interface User {
  id: number;
  name: string;
  email: string;
  email_verified_at?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  initialize: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const initialize = async () => {
    setIsLoading(true);
    const token = localStorage.getItem('auth_token');
    if (token) {
      try {
        const response = await api.get('/me');
        setUser(response.data.user);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Session restoration failed:', error);
        localStorage.removeItem('auth_token');
        setUser(null);
        setIsAuthenticated(false);
      }
    } else {
      setUser(null);
      setIsAuthenticated(false);
    }
    setIsLoading(false);
  };

  const login = async (token: string) => {
    localStorage.setItem('auth_token', token);
    try {
      const response = await api.get('/me');
      setUser(response.data.user);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('User fetch failed after login:', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('auth_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  useEffect(() => {
    initialize();
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, isLoading, login, logout, initialize }}>
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
