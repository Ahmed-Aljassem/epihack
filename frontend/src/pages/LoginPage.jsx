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
      navigate("/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)" }}>
      <div style={{ width: "100%", maxWidth: 380, padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--accent)", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            <Activity size={22} /> EpiRadar
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Participatory epidemic surveillance</p>
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
