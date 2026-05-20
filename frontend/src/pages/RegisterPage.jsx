import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield, ArrowRight, Stethoscope, PawPrint, BarChart3, BookOpenCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";

const ROLES = [
  { value: "health_worker",  label: "Health worker",       desc: "Clinic / hospital staff",          icon: Stethoscope },
  { value: "veterinarian",   label: "Veterinarian",        desc: "Animal health professional",       icon: PawPrint },
  { value: "epidemiologist", label: "Epidemiologist",      desc: "Disease investigation & analysis", icon: BarChart3 },
  { value: "analyst",        label: "Public-health analyst", desc: "Surveillance & response",        icon: BookOpenCheck },
];

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "health_worker",
    agency: "",
    title: "",
    phone: "",
    license: "",
    county: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      // Send the full payload; backend currently keys on name/email/password/role
      // and will ignore unknown fields. Extra context is captured for future
      // approval / vetting workflows.
      await register(form);
      navigate("/agency/dashboard");
    } catch (err) {
      setError(err.response?.data?.detail || "Couldn't create account. Try again.");
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
          <div className="auth-pane-eyebrow">Request access</div>
          <h1 className="auth-pane-title">
            Join the public-health partners helping Arizona respond earlier.
          </h1>
          <p className="auth-pane-copy">
            The console is open to verified health workers, veterinarians,
            epidemiologists, and surveillance analysts across the state.
            Community reporting happens in the mobile app — this workspace is
            where the response comes together.
          </p>

          <ul className="auth-pane-bullets">
            <li className="auth-pane-bullet">
              <span className="auth-pane-bullet-dot">·</span>
              Triage live reports from your county
            </li>
            <li className="auth-pane-bullet">
              <span className="auth-pane-bullet-dot">·</span>
              Coordinate with partner agencies in one place
            </li>
            <li className="auth-pane-bullet">
              <span className="auth-pane-bullet-dot">·</span>
              Draft and send public alerts when patterns emerge
            </li>
          </ul>
        </div>

        <div className="auth-pane-footer">
          We'll verify credentials before granting full console access.
        </div>
      </aside>

      <section className="auth-form-pane">
        <div className="auth-form auth-form--wide">
          <h2 className="auth-form-title">Create your account</h2>
          <p className="auth-form-copy">
            Tell us a bit about your role so we can route you to the right
            queues and surface relevant alerts.
          </p>

          <form onSubmit={handleSubmit} className="auth-form-grid">
            <div className="auth-form-grid auth-form-grid--two">
              <div className="field">
                <label className="label" htmlFor="name">Full name</label>
                <input
                  id="name"
                  className="input"
                  value={form.name}
                  onChange={set("name")}
                  required
                  placeholder="Dr. Jane Smith"
                  autoComplete="name"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="title">Job title</label>
                <input
                  id="title"
                  className="input"
                  value={form.title}
                  onChange={set("title")}
                  placeholder="Epidemiologist, Pima Co."
                  autoComplete="organization-title"
                />
              </div>
            </div>

            <div className="auth-form-grid auth-form-grid--two">
              <div className="field">
                <label className="label" htmlFor="email">Work email</label>
                <input
                  id="email"
                  type="email"
                  className="input"
                  value={form.email}
                  onChange={set("email")}
                  required
                  placeholder="jane@health.az.gov"
                  autoComplete="email"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="phone">Work phone</label>
                <input
                  id="phone"
                  type="tel"
                  className="input"
                  value={form.phone}
                  onChange={set("phone")}
                  placeholder="(520) 555-0142"
                  autoComplete="tel"
                />
              </div>
            </div>

            <div className="auth-form-grid auth-form-grid--two">
              <div className="field">
                <label className="label" htmlFor="agency">Agency or organization</label>
                <input
                  id="agency"
                  className="input"
                  value={form.agency}
                  onChange={set("agency")}
                  required
                  placeholder="Pima County Health Dept."
                  autoComplete="organization"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="county">County served</label>
                <input
                  id="county"
                  className="input"
                  value={form.county}
                  onChange={set("county")}
                  placeholder="Pima"
                />
              </div>
            </div>

            <div className="auth-form-grid auth-form-grid--two">
              <div className="field">
                <label className="label" htmlFor="license">License or credential ID</label>
                <input
                  id="license"
                  className="input"
                  value={form.license}
                  onChange={set("license")}
                  placeholder="e.g. AZMD-12345"
                />
              </div>
              <div className="field">
                <label className="label" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  className="input"
                  value={form.password}
                  onChange={set("password")}
                  required
                  minLength={8}
                  placeholder="Minimum 8 characters"
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div className="field">
              <label className="label">Role</label>
              <div className="auth-role-grid">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  const active = form.role === r.value;
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, role: r.value }))}
                      className={`auth-role ${active ? "is-active" : ""}`}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon size={16} strokeWidth={1.8} color={active ? "var(--accent)" : "var(--muted)"} />
                        <div>
                          <div className="auth-role-label">{r.label}</div>
                          <div className="auth-role-desc">{r.desc}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
              {loading ? "Creating account…" : (
                <>
                  Create account
                  <ArrowRight size={16} strokeWidth={2.2} />
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            Already have an account?{" "}
            <Link to="/login" className="auth-link">Sign in</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
