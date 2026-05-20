import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await login(email, password);
      navigate("/agency/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell agency-theme">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="auth-brand-mark">
            <Activity size={24} /> One Health AZ
          </div>
          <p className="auth-brand-copy">
            Sign in to the agency console for triage, surveys, and alerts.
          </p>
        </div>

        <div className="card">
          <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Sign In</h1>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div className="field">
              <label className="label" htmlFor="email">Email</label>
              <input id="email" type="email" className="input" value={email}
                onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com" />
            </div>
            <div className="field">
              <label className="label" htmlFor="password">Password</label>
              <input id="password" type="password" className="input" value={password}
                onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••" />
            </div>
            {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
            <button type="submit" className="btn btn-primary" disabled={loading}
              style={{ justifyContent: "center", padding: "10px", marginTop: 4 }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>
          <p style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
            No account? <Link to="/register" style={{ color: "var(--accent)" }}>Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
