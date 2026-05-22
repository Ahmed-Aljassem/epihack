import { Link } from "react-router-dom";
import { BRAND, BRAND_LOGO_SRC } from "../../config/brand";

const NAV_LINKS = [
  { to: "#situation", label: "Situation" },
  { to: "#about",    label: "About" },
  { to: "#how",      label: "How it works" },
  { to: "#partners", label: "Partners" },
];

export default function PublicHeader({ minimal = false, rightSlot = null }) {
  return (
    <header className="public-header">
      <div className="public-header-inner">
        <Link to="/" className="public-brand" aria-label="Detect home">
          <span className="public-brand-mark">
            <img
              src={BRAND_LOGO_SRC}
              alt={BRAND.logoAlt}
              className="public-brand-logo"
            />
          </span>
          <span className="public-brand-lockup">
            <strong>{BRAND.appName}</strong>
            <span className="public-brand-region">{BRAND.regionAbbr}</span>
          </span>
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
      </div>
    </header>
  );
}
