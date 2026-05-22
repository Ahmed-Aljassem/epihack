import { Link } from "react-router-dom";
import { Shield } from "lucide-react";

const NAV_LINKS = [
  { to: "#situation", label: "Situation" },
  { to: "#about",    label: "About" },
  { to: "#how",      label: "How it works" },
  { to: "#partners", label: "Partners" },
];

export default function PublicHeader({ minimal = false, rightSlot = null }) {
  return (
    <header className="public-header">
      <Link to="/" className="public-brand" aria-label="One Health home">
        <span className="public-brand-mark">
          <Shield size={16} strokeWidth={2.2} />
        </span>
        <span>One Health</span>
      </Link>

      {!minimal && (
        <nav className="public-nav-links" aria-label="Public navigation">
          {NAV_LINKS.map((link) => (
            <a key={link.label} className="public-nav-link" href={link.to}>
              {link.label}
            </a>
          ))}
        </nav>
      )}

      <div className="public-nav-actions">
        {minimal ? (
          rightSlot
        ) : (
          <>
            <Link className="public-nav-link" to="/register">Request access</Link>
            <Link className="btn btn-primary" to="/login">Sign in</Link>
          </>
        )}
      </div>
    </header>
  );
}
