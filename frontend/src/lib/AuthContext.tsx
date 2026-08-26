"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as api from "./api";

interface AuthState {
  accessToken: string | null;
  me: api.Me | null;
  loading: boolean;
  signup: (email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  rerollHandle: () => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [me, setMe] = useState<api.Me | null>(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async (token: string) => {
    const profile = await api.getMe(token);
    setMe(profile);
  }, []);

  // On first load, try the refresh cookie to resume a session silently.
  useEffect(() => {
    (async () => {
      try {
        const { accessToken: token } = await api.refresh();
        setAccessToken(token);
        await loadMe(token);
      } catch {
        setAccessToken(null);
        setMe(null);
      } finally {
        setLoading(false);
      }
    })();
  }, [loadMe]);

  const signup: AuthState["signup"] = async (email, password) => {
    const { accessToken: token } = await api.signup(email, password);
    setAccessToken(token);
    await loadMe(token);
  };

  const login: AuthState["login"] = async (email, password) => {
    const { accessToken: token } = await api.login(email, password);
    setAccessToken(token);
    await loadMe(token);
  };

  const logout: AuthState["logout"] = async () => {
    await api.logout();
    setAccessToken(null);
    setMe(null);
  };

  const rerollHandle: AuthState["rerollHandle"] = async () => {
    if (!accessToken) return;
    const { handle, handleRerollsRemaining } = await api.rerollHandle(accessToken);
    setMe((prev) => (prev ? { ...prev, handle, handleRerollsRemaining } : prev));
  };

  const deleteAccount: AuthState["deleteAccount"] = async () => {
    if (!accessToken) return;
    await api.deleteAccount(accessToken);
    setAccessToken(null);
    setMe(null);
  };

  return (
    <AuthContext.Provider
      value={{ accessToken, me, loading, signup, login, logout, rerollHandle, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
