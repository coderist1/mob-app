// context/AuthContext.js
// Global auth state — wraps the whole app so any screen can read/write the
// current user without prop-drilling or AsyncStorage for this demo.

import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  /** Call this after a successful login (demo only — no real backend). */
  const login = (userData) => setUser(userData);

  /** Call this after a successful registration. */
  const register = (userData) => setUser(userData);

  /** Wipe the session and go back to login. */
  const logout = () => setUser(null);

  /** Merge partial updates into the current user object (e.g. from ProfileScreen). */
  const updateUser = (partial) =>
    setUser((prev) => (prev ? { ...prev, ...partial } : prev));

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

/** Convenience hook — throws if used outside <AuthProvider>. */
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}