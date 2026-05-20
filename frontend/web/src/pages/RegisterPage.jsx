import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity } from "lucide-react";

const ROLES = [
  { value: "citizen",        label: "Citizen",         desc: "Community observer" },
  { value: "health_worker",  label: "Health Worker",   desc: "Clinic / hospital staff" },
  { value: "veterinarian",   label: "Veterinarian",    desc: "Animal health professional" },
  { value: "epidemiologist", label: "Epidemiologist",  desc: "Research / public health analyst" },
];

export default function RegisterPage() {
  const { register, confirm, pendingConfirmation } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]     = useState({ name: "", email: "", password: "", role: "citizen" });
  const [code, setCode]     = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // ── Step 1: create account ───────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await register(form);
      // AuthContext sets pendingConfirmation → confirmation form renders automatically
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: verify email ─────────────────────────────────────
  const handleConfirm = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await confirm(pendingConfirmation, code);
      navigate("/login");   // sign in after confirming
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Confirmation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--bg)", padding: "20px" }}>
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--accent)", fontSize: 20, fontWeight: 700, marginBottom: 6 }}>
            <Activity size={22} /> EpiRadar
          </div>
          <p style={{ color: "var(--muted)", fontSize: 13 }}>Create your surveillance account</p>
        </div>

        <div className="card">
          {pendingConfirmation ? (
            // ── Confirmation step ──────────────────────────────
            <>
              <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Check your email</h1>
              <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 20 }}>
                We sent a verification code to <strong>{pendingConfirmation}</strong>.
              </p>
              <form onSubmit={handleConfirm} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="field">
                  <label className="label" htmlFor="code">Verification code</label>
                  <input
                    id="code" className="input" value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required placeholder="123456" autoFocus
                    style={{ letterSpacing: "0.2em", fontSize: 18, textAlign: "center" }}
                  />
                </div>
                {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
                <button type="submit" className="btn btn-primary" disabled={loading}
                  style={{ justifyContent: "center", padding: "10px", marginTop: 4 }}>
                  {loading ? "Verifying…" : "Verify Email"}
                </button>
              </form>
            </>
          ) : (
            // ── Registration step ──────────────────────────────
            <>
              <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 20 }}>Register</h1>
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div className="field">
                  <label className="label">Full Name</label>
                  <input className="input" value={form.name} onChange={set("name")} required placeholder="Dr. Jane Smith" />
                </div>
                <div className="field">
                  <label className="label">Email</label>
                  <input type="email" className="input" value={form.email} onChange={set("email")} required placeholder="jane@who.int" />
                </div>
                <div className="field">
                  <label className="label">Password</label>
                  <input type="password" className="input" value={form.password} onChange={set("password")} required minLength={8} placeholder="Min 8 characters" />
                </div>
                <div className="field">
                  <label className="label">Role</label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                    {ROLES.map((r) => (
                      <button key={r.value} type="button"
                        onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                        style={{
                          background: form.role === r.value ? "var(--accent-dim)" : "var(--surface-2)",
                          border: `1px solid ${form.role === r.value ? "var(--accent)" : "var(--border)"}`,
                          borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                        }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: form.role === r.value ? "var(--accent)" : "var(--text)" }}>{r.label}</div>
                        <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{r.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>
                {error && <div style={{ color: "var(--danger)", fontSize: 12 }}>{error}</div>}
                <button type="submit" className="btn btn-primary" disabled={loading}
                  style={{ justifyContent: "center", padding: "10px", marginTop: 4 }}>
                  {loading ? "Creating account…" : "Create Account"}
                </button>
              </form>
            </>
          )}
          <p style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
            Already registered? <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
