import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../Services/api';

const AuthContext = createContext(null);

const TOKEN_KEY = 'bakery_token';
const USER_KEY  = 'bakery_user';

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(() => {
    try { return JSON.parse(localStorage.getItem(USER_KEY)); } catch { return null; }
  });
  const [token, setToken]     = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  // Sync token into axios default header whenever it changes
  useEffect(() => {
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete api.defaults.headers.common['Authorization'];
    }
  }, [token]);

  const saveSession = useCallback((token, user) => {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    setToken(token);
    setUser(user);
  }, []);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/auth/login', { email, password });
      saveSession(data.token, data.user);
      return { ok: true };
    } catch (err) {
      const msg = err.response?.data || 'שגיאה בהתחברות';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  const register = useCallback(async (email, password, name) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.post('/api/auth/register', { email, password, name });
      saveSession(data.token, data.user);
      return { ok: true };
    } catch (err) {
      const msg = err.response?.data || 'שגיאה בהרשמה';
      setError(msg);
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    setLoading(true);
    try {
      const { data: updated } = await api.put('/api/auth/me', data);
      const newUser = { ...user, ...updated };
      localStorage.setItem(USER_KEY, JSON.stringify(newUser));
      setUser(newUser);
      return { ok: true };
    } catch (err) {
      const msg = err.response?.data || 'שגיאה בעדכון הפרופיל';
      return { ok: false, error: msg };
    } finally {
      setLoading(false);
    }
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, updateProfile, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
