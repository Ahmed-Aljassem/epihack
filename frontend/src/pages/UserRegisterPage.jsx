import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";

export default function UserRegisterPage() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    passwordConfirm: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.passwordConfirm) {
      setError("Passwords don't match");
      return;
    }

    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      // TODO: Call user registration API endpoint
      // For now, just navigate to login
      navigate("/user/login");
    } catch (err) {
      setError("Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="public-shell">
      <PublicHeader />

      <main className="public-layout">
        <section className="auth-page-container">
          <div className="auth-page-header">
            <Link to="/" className="btn btn-ghost-inline">
              <ArrowLeft size={16} strokeWidth={2.2} />
              Back
            </Link>
          </div>

          <div className="auth-page-content">
            <h1>Create your account</h1>
            <p className="auth-page-subtitle">
              Track your reports and stay updated on community health signals.
            </p>

            <form onSubmit={handleSubmit} className="auth-form-group">
              {error && <div className="form-error">{error}</div>}

              <div className="form-field">
                <label htmlFor="name" className="form-label">
                  Full name
                </label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Doe"
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  className="form-input"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <div className="form-field">
                <label htmlFor="passwordConfirm" className="form-label">
                  Confirm password
                </label>
                <input
                  id="passwordConfirm"
                  type="password"
                  name="passwordConfirm"
                  className="form-input"
                  value={formData.passwordConfirm}
                  onChange={handleChange}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? "Creating account..." : "Create account"}
              </button>
            </form>

            <div className="auth-page-footer">
              <p>
                Already have an account?{" "}
                <Link to="/user/login" className="link">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
