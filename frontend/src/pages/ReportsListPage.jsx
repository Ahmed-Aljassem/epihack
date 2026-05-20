import { useNavigate } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { REPORTS } from "../data/reports";

export default function ReportsListPage() {
  const navigate = useNavigate();
  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Reports</h1>
          <p className="console-subtitle">All submissions across triage stages</p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search reports, places, IDs…"
            />
          </div>
        </div>
      </div>

      <div className="card queue-card">
        <table className="queue-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Summary</th>
              <th>Location</th>
              <th>Status</th>
              <th>Submitted</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {REPORTS.map((r) => (
              <tr key={r.id} onClick={() => navigate(`/agency/reports/${r.id}`)}>
                <td>{r.id}</td>
                <td>{r.category}</td>
                <td>{r.summary}</td>
                <td>{r.location.zip} · {r.location.county}</td>
                <td>
                  <span className={`queue-status ${r.status === "New" ? "queue-status--new" : ""}`}>
                    {r.status}
                  </span>
                </td>
                <td className="queue-time">{r.submittedShort}</td>
                <td className="queue-chev"><ChevronRight size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
