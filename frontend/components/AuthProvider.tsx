"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { getToken, setToken, clearToken } from "@/lib/auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  loginUrl: string;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  loginUrl: `${API_URL}/auth/google`,
  logout: () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Google just redirected back with ?token=..., persist it and clean the URL.
    const url = new URL(window.location.href);
    const tokenFromUrl = url.searchParams.get("token");
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
      url.searchParams.delete("token");
      url.searchParams.delete("authError");
      window.history.replaceState({}, "", url.pathname + url.search);
    }

    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("unauthorized"))))
      .then((data) => setUser(data.user))
      .catch(() => {
        clearToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  function logout() {
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, loginUrl: `${API_URL}/auth/google`, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
