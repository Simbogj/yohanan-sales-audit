import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Restore session from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('yohanan_token');
    const storedUser = localStorage.getItem('yohanan_user');
    if (storedToken && storedUser) {
      try {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.clear();
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await authService.login(username, password);
    localStorage.setItem('yohanan_token', data.token);
    localStorage.setItem('yohanan_user', JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('yohanan_token');
    localStorage.removeItem('yohanan_user');
    setToken(null);
    setUser(null);
  }, []);

  const isOwner = user?.role === 'OWNER';
  const isWaiter = user?.role === 'WAITER';

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, isOwner, isWaiter }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
