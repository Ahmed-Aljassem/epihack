import { useEffect, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, Map, Mail,
  User, Settings, LogOut, Menu, X,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { BRAND, BRAND_LOGO_SRC } from "../../config/brand";

const NAV_GROUPS = [
  {
    label: "Triage",
    items: [
      { to: "/agency/map",       icon: Map,             label: "Map" },
      { to: "/agency/dashboard", icon: LayoutDashboard, label: "Analytics", end: true },
      { to: "/agency/alerts",    icon: Mail,            label: "Alerts" },
      { to: "/agency/reports",   icon: FileText,        label: "Reports" },
    ],
  },
  {
    label: "Account",
    items: [
      { to: "/agency/profile",  icon: User,     label: "Profile" },
      { to: "/agency/settings", icon: Settings, label: "Settings" },
    ],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [navOpen, setNavOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Global shortcuts: '/' focuses the active page's search box; Esc blurs.
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target?.tagName;
      const inField = tag === "INPUT" || tag === "TEXTAREA" || e.target?.isContentEditable;

      if (e.key === "/" && !inField) {
        const input = document.querySelector(".search-input");
        if (input) {
          e.preventDefault();
          input.focus();
        }
      } else if (e.key === "Escape") {
        if (document.activeElement?.classList?.contains("search-input")) {
          document.activeElement.blur();
        }
        setNavOpen(false);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const initials = (user?.name || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`app-shell ${navOpen ? "is-nav-open" : ""}`}>
      <button
        type="button"
        className="nav-toggle"
        onClick={() => setNavOpen((v) => !v)}
        aria-label={navOpen ? "Close menu" : "Open menu"}
      >
        {navOpen ? <X size={18} /> : <Menu size={18} />}
      </button>

      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">
            <img
              src={BRAND_LOGO_SRC}
              alt={BRAND.logoAlt}
              className="sidebar-brand-logo"
            />
          </span>
          <span className="sidebar-brand-title">
            <strong>{BRAND.appNameWithRegion}</strong>
            <small>{BRAND.lockup}</small>
          </span>
        </div>

        {NAV_GROUPS.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <div className="sidebar-group-label">{group.label}</div>
            {group.items.map(({ to, icon: Icon, label, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                onClick={() => setNavOpen(false)}
                className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
              >
                <Icon size={16} strokeWidth={1.8} />
                <span>{label}</span>
              </NavLink>
            ))}
          </div>
        ))}

        <div className="sidebar-spacer" />

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar">{initials}</div>
            <div className="user-info">
              <span className="user-name">{user?.name || "L. Romero"}</span>
              <span className="user-role">{user?.role ? user.role.replace("_", " ") : "Pima Co. · Epi"}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} aria-label="Sign out">
            <LogOut size={14} />
          </button>
        </div>
      </aside>

      {navOpen && (
        <div className="nav-backdrop" onClick={() => setNavOpen(false)} aria-hidden="true" />
      )}

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
