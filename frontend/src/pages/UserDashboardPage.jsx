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

      <main className="public-layout">
        <div className="user-dashboard-container">
          <div className="user-dashboard-header">
            <h1>Your Dashboard</h1>
            <button onClick={handleLogout} className="btn btn-secondary">
              <LogOut size={16} />
              Sign out
            </button>
          </div>

          <div className="user-dashboard-content">
            {/* Dashboard content coming soon */}
            <p>Your dashboard content will appear here</p>
          </div>
        </div>
      </main>
    </div>
  );
}
