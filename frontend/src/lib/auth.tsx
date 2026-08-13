"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { api, clearToken, getToken, setToken } from "./api";

interface AuthState {
  username: string | null;
  roles: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  ready: boolean;
  login: (username: string, password: string) => Promise<string>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const USERNAME_KEY = "airline.username";
const ROLES_KEY = "airline.roles";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [username, setUsername] = useState<string | null>(null);
  const [roles, setRoles] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Hydrate auth state from localStorage on first client render.
    const token = getToken();
    const storedUser =
      typeof window !== "undefined"
        ? window.localStorage.getItem(USERNAME_KEY)
        : null;
    const storedRoles =
      typeof window !== "undefined"
        ? window.localStorage.getItem(ROLES_KEY)
        : null;
    if (token && storedUser) {
      setUsername(storedUser);
      setRoles(storedRoles);
    }
    setReady(true);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      username,
      roles,
      isAdmin: (roles ?? "").split(",").some((r) => r.trim() === "ADMIN"),
      isAuthenticated: Boolean(username),
      ready,
      async login(user: string, password: string) {
        const res = await api.login(user, password);
        setToken(res.token);
        window.localStorage.setItem(USERNAME_KEY, res.username);
        window.localStorage.setItem(ROLES_KEY, res.roles ?? "");
        setUsername(res.username);
        setRoles(res.roles ?? "");
        return res.roles ?? "";
      },
      logout() {
        clearToken();
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(USERNAME_KEY);
          window.localStorage.removeItem(ROLES_KEY);
        }
        setUsername(null);
        setRoles(null);
      },
    }),
    [username, roles, ready],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}
