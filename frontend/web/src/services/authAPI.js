/**
 * Auth endpoints — uses a plain axios instance (no Bearer token interceptor)
 * so login/register/confirm work before the user has a token.
 */
import axios from "axios";

const base = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

export const authAPI = {
  login:    (email, password)       => base.post("/api/auth/login",    { email, password }),
  register: (data)                  => base.post("/api/auth/register", data),
  confirm:  (email, code)           => base.post("/api/auth/confirm",  { email, code }),
};
