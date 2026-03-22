import React, { createContext, useContext, useEffect, useState } from "react";
import { FUNCTIONS_BASE } from "@/lib/apiFetch";

export interface AuthUser {
  id: string;
  email: string;
  username?: string;
  full_name?: string;
  role?: string;
  status?: string;
  bio?: string;
  discordTag?: string;
  nationality?: string;
  totpEnabled?: boolean;
  createdAt?: string;
  created_at?: string;
  on_duty_status?: string;
  avatar_url?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: AuthUser | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: { username: string; email: string; password: string }) => Promise<void>;
  refetch: () => Promise<void>;
  setToken: (token: string | null) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: true,
  isAuthenticated: false,
  token: null,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  refetch: async () => {},
  setToken: () => {},
});

function storeToken(token: string | null) {
  try {
    if (token) {
      sessionStorage.setItem("tag_auth_token", token);
      localStorage.setItem("tag_auth_token", token);
    } else {
      sessionStorage.removeItem("tag_auth_token");
      localStorage.removeItem("tag_auth_token");
    }
  } catch {}
}

function loadToken(): string | null {
  try {
    return sessionStorage.getItem("tag_auth_token") ?? localStorage.getItem("tag_auth_token");
  } catch {
    return null;
  }
}

async function callFunction(functionName: string, path: string, options?: RequestInit, token?: string | null): Promise<Response> {
  const url = `${FUNCTIONS_BASE}/${functionName}${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(url, { ...options, headers });
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setTokenState] = useState<string | null>(loadToken);

  const setToken = (t: string | null) => {
    storeToken(t);
    setTokenState(t);
  };

  const fetchMe = async (authToken?: string | null) => {
    const t = authToken ?? token;
    if (!t) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await callFunction("authMe", "", { method: "GET" }, t);
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      } else {
        setUser(null);
        setToken(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMe();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await callFunction("authLogin", "", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw { data };
    }
    const data = await res.json();
    const newToken: string = data.token;
    setToken(newToken);
    await fetchMe(newToken);
  };

  const logout = async () => {
    setToken(null);
    setUser(null);
  };

  const register = async (registerData: { username: string; email: string; password: string }) => {
    const res = await callFunction("authRegister", "", {
      method: "POST",
      body: JSON.stringify(registerData),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      throw { data: json };
    }
    const data = await res.json();
    const newToken: string = data.token;
    setToken(newToken);
    await fetchMe(newToken);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isLoading,
      isAuthenticated: !!user,
      token,
      login,
      logout,
      register,
      refetch: () => fetchMe(),
      setToken,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
