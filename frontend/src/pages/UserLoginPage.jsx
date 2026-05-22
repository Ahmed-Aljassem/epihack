import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";

const DEMO_EMAIL = "user@gmail.com";
const DEMO_PASSWORD = "password123";

export default function UserLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 300));

    if (email === DEMO_EMAIL && password === DEMO_PASSWORD) {
      // Store user session
      localStorage.setItem(
        "user_session",
        JSON.stringify({
          id: "user-community-1",
          email,
          name: "Community Member",
          type: "community",
        }),
      );
      navigate("/user/dashboard");
    } else {
      setError("Invalid email or password. Try user@gmail.com / password123");
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
            <h1>Sign in to your account</h1>
            <p className="auth-page-subtitle">
              Track your reports and stay updated on community health signals.
            </p>

            <form onSubmit={handleSubmit} className="auth-form-group">
              {error && <div className="form-error">{error}</div>}

              <div className="form-field">
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  required
                  autoFocus
                />
              </div>

              <div className="form-field">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary btn-full"
                disabled={loading}
              >
                {loading ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <div className="auth-page-footer">
              <p>
                Don't have an account?{" "}
                <Link to="/user/register" className="link">
                  Create one
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
