import { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search, Plus, AlertTriangle, Edit2 } from "lucide-react";
import { useAlerts, useMutation } from "../hooks/useData";
import { alertsService } from "../services/dataSources";
import { useAuth } from "../context/AuthContext";
import { alertsService } from "../services/alertsService";

const SEVERITY_FILTERS = [
  { id: "", label: "All severities" },
  { id: "critical", label: "Critical" },
  { id: "high", label: "High" },
  { id: "medium", label: "Medium" },
  { id: "low", label: "Low" },
];

const STATUS_FILTERS = [
  { id: "open", label: "Open" },
  { id: "review", label: "In review" },
  { id: "resolved", label: "Resolved" },
  { id: "", label: "All" },
];

export default function AlertsPage() {
  const navigate = useNavigate();
  const { isAnalyst } = useAuth();
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("open");
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load alerts from service on mount and set up polling
  useEffect(() => {
    const loadAlerts = () => {
      try {
        const data = alertsService.getAll();
        setAlerts(data);
      } catch (error) {
        console.error("Error loading alerts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadAlerts();

    // Poll for updates every 500ms to catch changes from other tabs
    const interval = setInterval(loadAlerts, 500);
    return () => clearInterval(interval);
  }, []);

  const updateStatus = (id, newStatus) => {
    alertsService.updateStatus(id, newStatus);
    setAlerts(alertsService.getAll());
  };

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      if (severity && a.severity !== severity) return false;
      if (status && a.status !== status) return false;
      return true;
    });
  }, [alerts, severity, status]);

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Alerts</h1>
          <p className="console-subtitle">
            Auto-generated and analyst-created alerts across surveillance
            streams
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search alerts…"
            />
          </div>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/agency/alerts/new")}
          >
            <Plus size={14} strokeWidth={2.4} />
            New alert
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {SEVERITY_FILTERS.map((f) => (
          <button
            key={f.id || "all-sev"}
            className={`filter-chip ${severity === f.id ? "is-active" : ""}`}
            onClick={() => setSeverity(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto" }} />
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.id || "all-status"}
            className={`filter-chip ${status === f.id ? "is-active" : ""}`}
            onClick={() => setStatus(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 14 }}>
          Loading alerts…
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-card alert-card--${alert.severity}`}
            >
              <div className="alert-card-head">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="alert-card-tags">
                    {alert.severity === "critical" ||
                    alert.severity === "high" ? (
                      <AlertTriangle
                        size={14}
                        color={
                          alert.severity === "critical"
                            ? "var(--danger)"
                            : "var(--warn)"
                        }
                      />
                    ) : null}
                    <span className={`badge badge-${alert.severity}`}>
                      {alert.severity}
                    </span>
                    <span className={`badge badge-${alert.category}`}>
                      {alert.category}
                    </span>
                  </div>
                  <div className="alert-card-title">{alert.title}</div>
                  <div className="alert-card-copy">{alert.description}</div>
                  {alert.anomaly_score != null && (
                    <div
                      className="alert-card-meta"
                      style={{ color: "var(--accent)" }}
                    >
                      Anomaly score:{" "}
                      <strong>{alert.anomaly_score.toFixed(2)}σ</strong>
                    </div>
                  )}
                  <div className="alert-card-meta">
                    {format(new Date(alert.createdAt), "MMM d, yyyy · HH:mm")}
                  </div>
                </div>

                {alert.status === "open" && (
                  <div className="alert-card-actions">
                    <button
                      className="btn btn-ghost"
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        minHeight: 32,
                      }}
                      onClick={() => navigate(`/agency/alerts/${alert.id}`)}
                    >
                      <Edit2 size={12} />
                      Edit
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        minHeight: 32,
                      }}
                      onClick={() => updateStatus(alert.id, "review")}
                    >
                      Review
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{
                        fontSize: 12,
                        padding: "5px 12px",
                        minHeight: 32,
                      }}
                      onClick={() => updateStatus(alert.id, "resolved")}
                    >
                      Resolve
                    </button>
                  </div>
                )}

                {alert.status !== "open" && (
                  <button
                    className="btn btn-ghost"
                    style={{
                      fontSize: 12,
                      padding: "5px 12px",
                      minHeight: 32,
                    }}
                    onClick={() => navigate(`/agency/alerts/${alert.id}`)}
                  >
                    <Edit2 size={12} />
                    Edit
                  </button>
                )}

                {alert.status !== "open" && (
                  <span className="badge">
                    {alert.status.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          ))}
          {filteredAlerts.length === 0 && (
            <div
              className="card"
              style={{
                color: "var(--muted)",
                textAlign: "center",
                padding: 40,
              }}
            >
              No alerts match the current filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
