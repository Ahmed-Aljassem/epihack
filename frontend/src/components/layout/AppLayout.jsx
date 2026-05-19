import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  LayoutDashboard, ClipboardList, BellAlert,
  FileText, LogOut, Activity, ChevronRight,
} from "lucide-react";
import "./AppLayout.css";

const NAV = [
  { to: "/dashboard",     icon: LayoutDashboard, label: "Dashboard" },
  { to: "/surveys",       icon: ClipboardList,   label: "Surveys" },
  { to: "/alerts",        icon: BellAlert,       label: "Alerts" },
  { to: "/my-responses",  icon: FileText,        label: "My Reports" },
];

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <Activity size={20} />
          <span>EpiRadar</span>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""}`
            }>
              <Icon size={17} />
              <span>{label}</span>
              <ChevronRight size={14} className="nav-chevron" />
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-pill">
            <div className="user-avatar">{user?.name?.[0]?.toUpperCase()}</div>
            <div className="user-info">
              <span className="user-name">{user?.name}</span>
              <span className="user-role">{user?.role?.replace("_", " ")}</span>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log out">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
}
