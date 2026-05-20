import { Outlet, NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, FileText, Map, Mail,
  BookOpen, Settings, Users, LogOut,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const NAV_GROUPS = [
  {
    label: "Triage",
    items: [
      { to: "/agency/dashboard", icon: LayoutDashboard, label: "Dashboard" },
      { to: "/agency/reports", icon: FileText, label: "Reports" },
      { to: "/agency/map", icon: Map, label: "Map" },
      { to: "/agency/alerts", icon: Mail, label: "Alerts" },
    ],
  },
  {
    label: "Library",
    items: [
      { to: "/agency/resources", icon: BookOpen, label: "Resources" },
      { to: "/agency/routing", icon: Settings, label: "Routing rules" },
      { to: "/agency/team", icon: Users, label: "Team" },
    ],
  },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const initials = (user?.name || "U")
    .split(" ")
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <span className="sidebar-brand-icon">OH</span>
          <span className="sidebar-brand-title">One Health · AZ</span>
        </div>

        {NAV_GROUPS.map((group) => (
          <div className="sidebar-group" key={group.label}>
            <div className="sidebar-group-label">{group.label}</div>
            {group.items.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
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

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
