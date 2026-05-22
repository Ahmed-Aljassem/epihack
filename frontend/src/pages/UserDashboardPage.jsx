import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import PublicHeader from "../components/public/PublicHeader";

export default function UserDashboardPage() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user_session");
    navigate("/");
  };

  return (
    <div className="public-shell">
      <PublicHeader />

      <nav className="user-dashboard-nav">
        <div className="user-dashboard-nav-content">
          <h1 className="user-dashboard-title">Your Dashboard</h1>
          <button onClick={handleLogout} className="btn btn-quiet">
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </nav>

      <main className="public-layout">
        <div className="user-dashboard-container">
          <div className="user-dashboard-content">
            {/* Dashboard content coming soon */}
            <p>Your dashboard content will appear here</p>
          </div>
        </div>
      </main>
    </div>
  );
}
