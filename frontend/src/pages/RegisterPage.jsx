import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Activity } from "lucide-react";

const ROLES = [
  { value: "citizen",       label: "Citizen",          desc: "Community observer" },
  { value: "health_worker", label: "Health Worker",    desc: "Clinic / hospital staff" },
  { value: "veterinarian",  label: "Veterinarian",     desc: "Animal health professional" },
  { value: "epidemiologist",label: "Epidemiologist",   desc: "Research / public health analyst" },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "citizen" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await register(form);
      navigate("/agency/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
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
            Create a website account for the agency-side workflow.
          </p>
        </div>

        <div className="card">
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
                  <button
                    key={r.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                    style={{
                      background: form.role === r.value ? "var(--accent-dim)" : "var(--surface-2)",
                      border: `1px solid ${form.role === r.value ? "var(--accent)" : "var(--border)"}`,
                      borderRadius: 8, padding: "10px 12px", cursor: "pointer", textAlign: "left",
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 600, color: form.role === r.value ? "var(--accent)" : "var(--text)" }}>
                      {r.label}
                    </div>
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
          <p style={{ marginTop: 16, textAlign: "center", fontSize: 12, color: "var(--muted)" }}>
            Already registered? <Link to="/login" style={{ color: "var(--accent)" }}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
