import { NavLink, Link } from "react-router-dom";
import { Shield } from "lucide-react";

const NAV_LINKS = [
  { to: "/", label: "Today", end: true },
  { to: "/#nearby", label: "Nearby", hash: true },
  { to: "/#resources", label: "Resources", hash: true },
  { to: "/#about", label: "About", hash: true },
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
          {NAV_LINKS.map((link) =>
            link.hash ? (
              <a key={link.label} className="public-nav-link" href={link.to.replace("/", "")}>
                {link.label}
              </a>
            ) : (
              <NavLink
                key={link.label}
                to={link.to}
                end={link.end}
                className={({ isActive }) =>
                  `public-nav-link ${isActive ? "is-active" : ""}`
                }
              >
                {link.label}
              </NavLink>
            )
          )}
        </nav>
      )}

      <div className="public-nav-actions">
        {minimal ? (
          rightSlot
        ) : (
          <>
            <Link className="public-nav-link" to="/login">Sign in</Link>
            <Link className="btn btn-primary" to="/report">Report a concern</Link>
          </>
        )}
      </div>
    </header>
  );
}
