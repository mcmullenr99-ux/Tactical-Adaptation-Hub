import React, { createContext, useContext, useEffect } from "react";
import { useGetMe, type AuthUser } from "@workspace/api-client-react";

interface AuthContextType {
  user: AuthUser | null | undefined;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: true,
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: user, isLoading, error } = useGetMe({
    query: {
      retry: false,
      refetchOnWindowFocus: false,
    }
  });

  return (
    <AuthContext.Provider value={{
      user: error ? null : user,
      isLoading,
      isAuthenticated: !!user && !error,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
