import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { authService } from '../services/authService';
import { registerLogoutCallback } from '../services/api';

const AuthContext = createContext(null);

/**
 * Decode a JWT and return the payload (without verifying signature).
 * Returns null if the token is malformed.
 */
function decodeToken(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

/**
 * Check if a JWT token is expired (or expiring within the buffer ms).
 * Returns true if expired / invalid.
 */
function isTokenExpired(token, bufferMs = 0) {
  const decoded = decodeToken(token);
  if (!decoded || !decoded.exp) return true;
  return decoded.exp * 1000 <= Date.now() + bufferMs;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const logoutTimerRef = useRef(null);

  const logout = useCallback(() => {
    if (logoutTimerRef.current) {
      clearTimeout(logoutTimerRef.current);
      logoutTimerRef.current = null;
    }
    localStorage.removeItem('yohanan_token');
    localStorage.removeItem('yohanan_user');
    setToken(null);
    setUser(null);
  }, []);

  // Register logout with the axios interceptor so 401 responses
  // trigger a proper React-state logout (not just a raw localStorage clear)
  useEffect(() => {
    registerLogoutCallback(logout);
  }, [logout]);

  /**
   * Schedule an automatic logout when the token expires.
   */
  const scheduleAutoLogout = useCallback(
    (tok) => {
      if (logoutTimerRef.current) {
        clearTimeout(logoutTimerRef.current);
        logoutTimerRef.current = null;
      }
      const decoded = decodeToken(tok);
      if (!decoded?.exp) return;
      const msUntilExpiry = decoded.exp * 1000 - Date.now();
      if (msUntilExpiry <= 0) {
        logout();
        return;
      }
      // Auto-logout 5 seconds before the token actually expires
      const delay = Math.max(0, msUntilExpiry - 5000);
      logoutTimerRef.current = setTimeout(() => {
        logout();
      }, delay);
    },
    [logout]
  );

  // Restore session from localStorage on mount — but ONLY if token is still valid
  useEffect(() => {
    const storedToken = localStorage.getItem('yohanan_token');
    const storedUser = localStorage.getItem('yohanan_user');

    if (storedToken && storedUser) {
      if (isTokenExpired(storedToken)) {
        // Token has expired — clear storage and show login
        localStorage.removeItem('yohanan_token');
        localStorage.removeItem('yohanan_user');
      } else {
        try {
          const parsedUser = JSON.parse(storedUser);
          setToken(storedToken);
          setUser(parsedUser);
          scheduleAutoLogout(storedToken);
        } catch {
          localStorage.removeItem('yohanan_token');
          localStorage.removeItem('yohanan_user');
        }
      }
    }
    setLoading(false);

    // Cleanup timer on unmount
    return () => {
      if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    };
  }, [scheduleAutoLogout]);

  const login = useCallback(
    async (username, password) => {
      const data = await authService.login(username, password);
      localStorage.setItem('yohanan_token', data.token);
      localStorage.setItem('yohanan_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      scheduleAutoLogout(data.token);
      return data.user;
    },
    [scheduleAutoLogout]
  );

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
