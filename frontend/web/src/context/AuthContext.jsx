import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/authAPI";
import { tokens, parseJwt } from "../auth/tokens";

const AuthContext = createContext(null);

function buildUser(payload) {
  const groups = payload["cognito:groups"] ?? [];
  return {
    sub:    payload.sub,
    email:  payload.email,
    name:   payload.name ?? payload.email,
    role:   payload["custom:role"] ?? groups[0] ?? "citizen",
    groups,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser]                         = useState(null);
  const [loading, setLoading]                   = useState(true);
  const [pendingConfirmation, setPendingConfirmation] = useState(null);

  // Restore session from localStorage on page load
  useEffect(() => {
    const token = tokens.get();
    if (token) {
      try { setUser(buildUser(parseJwt(token))); }
      catch { tokens.clear(); }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await authAPI.login(email, password);
    tokens.set(data.id_token);
    const u = buildUser(parseJwt(data.id_token));
    setUser(u);
    return u;
  }, []);

  const register = useCallback(async ({ name, email, password, role }) => {
    const { data } = await authAPI.register({ name, email, password, role });
    if (data.needs_confirmation) {
      setPendingConfirmation(email);
      return { needsConfirmation: true };
    }
    return { needsConfirmation: false };
  }, []);

  /**
   * Confirm email, then redirect to login.
   * (We don't have the password here so we can't auto-sign-in.)
   */
  const confirm = useCallback(async (email, code) => {
    await authAPI.confirm(email, code);
    setPendingConfirmation(null);
    return { confirmed: true };
  }, []);

  const logout = useCallback(() => {
    tokens.clear();
    setUser(null);
  }, []);

  const isAdmin   = user?.groups?.includes("admin") ?? false;
  const isAnalyst = user?.groups?.some((g) => ["admin", "epidemiologist"].includes(g)) ?? false;

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, confirm, logout,
               isAdmin, isAnalyst, pendingConfirmation }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
