import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi, User } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Try to restore session on mount
    const token = localStorage.getItem('authToken');
    if (token) {
      authApi
        .me()
        .then((res) => setUser(res.data.user))
        .catch(() => {
          localStorage.removeItem('authToken');
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    const { token } = res.data;
    localStorage.setItem('authToken', token);
    const meRes = await authApi.me();
    setUser(meRes.data.user);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch {
      // Ignore errors
    }
    localStorage.removeItem('authToken');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'ADMIN',
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
