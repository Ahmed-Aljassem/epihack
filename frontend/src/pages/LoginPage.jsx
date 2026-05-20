import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield, ArrowRight, ShieldCheck, Activity, Users,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      navigate("/agency/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Sign-in failed. Check your email and password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <aside className="auth-pane">
        <Link to="/" className="auth-pane-brand">
          <span className="auth-pane-brand-mark">
            <Shield size={16} strokeWidth={2.2} />
          </span>
          One Health · Arizona
        </Link>

        <div>
          <div className="auth-pane-eyebrow">Agency console</div>
          <h1 className="auth-pane-title">
            Welcome back. Today&apos;s signals are waiting.
          </h1>
          <p className="auth-pane-copy">
            Sign in to triage incoming mobile reports, coordinate with partner
            agencies, and send public alerts when the data calls for it.
          </p>

          <ul className="auth-pane-bullets">
            <li className="auth-pane-bullet">
              <span className="auth-pane-bullet-dot">
                <Activity size={10} strokeWidth={2.8} />
              </span>
              Live triage queue and cluster detection
            </li>
            <li className="auth-pane-bullet">
              <span className="auth-pane-bullet-dot">
                <Users size={10} strokeWidth={2.8} />
              </span>
              Shared workspace across health partners
            </li>
            <li className="auth-pane-bullet">
              <span className="auth-pane-bullet-dot">
                <ShieldCheck size={10} strokeWidth={2.8} />
              </span>
              Public alerts in SMS, email, and printable formats
            </li>
          </ul>
        </div>

        <div className="auth-pane-footer">
          © 2026 One Health Arizona · A University of Arizona project
        </div>
      </aside>

      <section className="auth-form-pane">
        <div className="auth-form">
          <h2 className="auth-form-title">Sign in</h2>
          <p className="auth-form-copy">
            Use the email tied to your agency or partner organization.
          </p>

          <form onSubmit={handleSubmit} className="auth-form-grid">
            <div className="field">
              <label className="label" htmlFor="email">Work email</label>
              <input
                id="email"
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@health.az.gov"
                autoComplete="email"
                autoFocus
              />
            </div>

            <div className="field">
              <label className="label" htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <div className="auth-row-actions">
              <span />
              <a className="auth-link" href="mailto:partners@onehealth.az.gov?subject=Password%20reset">
                Forgot password?
              </a>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "Signing in…" : (
                <>
                  Sign in
                  <ArrowRight size={16} strokeWidth={2.2} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            New to One Health AZ?{" "}
            <Link to="/register" className="auth-link">Request access</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
