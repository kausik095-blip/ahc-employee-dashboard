import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authApi } from "../api/endpoints";
import { tokenStore } from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    if (!tokenStore.get()) {
      setLoading(false);
      return;
    }
    try {
      const me = await authApi.me();
      setEmployee(me);
    } catch {
      tokenStore.clear();
      setEmployee(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const login = async (identifier, password) => {
    const { access_token } = await authApi.login(identifier, password);
    tokenStore.set(access_token);
    const me = await authApi.me();
    setEmployee(me);
    return me;
  };

  const logout = () => {
    tokenStore.clear();
    setEmployee(null);
  };

  const value = useMemo(
    () => ({ employee, loading, login, logout, isAuthenticated: !!employee }),
    [employee, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
