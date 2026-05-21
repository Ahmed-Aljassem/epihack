import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Search, Plus, AlertTriangle } from "lucide-react";
import { useAlerts, useMutation } from "../hooks/useData";
import { alertsService } from "../services/dataSources";
import { useAuth } from "../context/AuthContext";

const MOCK_ALERTS = [
  {
    id: "alert-24",
    title: "Mosquito activity rising — drain standing water",
    description:
      "Mosquito activity is up across NW Pima. Standing-water reports trending +28% week-over-week.",
    severity: "high",
    category: "vector",
    status: "open",
    anomaly_score: 2.84,
    created_at: "2026-05-19T14:48:00Z",
  },
  {
    id: "alert-23",
    title: "Fever cluster · 3 households · 85735",
    description:
      "Linked reports from 3 households within 24 hours. Awaiting routing decision.",
    severity: "medium",
    category: "people",
    status: "investigating",
    anomaly_score: 1.91,
    created_at: "2026-05-19T13:12:00Z",
  },
  {
    id: "alert-22",
    title: "Unsteady coyote · pasture · 85719",
    description:
      "Single-source animal report routed to AZGF rabies surveillance.",
    severity: "high",
    category: "animal",
    status: "open",
    anomaly_score: 2.41,
    created_at: "2026-05-19T12:14:00Z",
  },
  {
    id: "alert-21",
    title: "Heat advisory · Pima, Pinal, Santa Cruz",
    description:
      "NWS heat advisory in effect through Friday. Reissue cooling-center reminder.",
    severity: "medium",
    category: "env",
    status: "open",
    anomaly_score: null,
    created_at: "2026-05-19T08:00:00Z",
  },
  {
    id: "alert-20",
    title: "Resolved: water sampling · Marana",
    description:
      "ADEQ sampling cleared the standing-water concern reported on Friday.",
    severity: "low",
    category: "env",
    status: "resolved",
    anomaly_score: null,
    created_at: "2026-05-17T09:30:00Z",
  },
];

const SEVERITY_FILTERS = [
  { id: "",         label: "All severities" },
  { id: "critical", label: "Critical" },
  { id: "high",     label: "High" },
  { id: "medium",   label: "Medium" },
  { id: "low",      label: "Low" },
];

const STATUS_FILTERS = [
  { id: "open",          label: "Open" },
  { id: "investigating", label: "In review" },
  { id: "resolved",      label: "Resolved" },
  { id: "false_positive", label: "False +" },
  { id: "",              label: "All" },
];

export default function AlertsPage() {
  const navigate = useNavigate();
  const { isAnalyst } = useAuth();
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("open");

  const { data, loading, refetch } = useAlerts(
    Object.fromEntries(
      Object.entries({ severity, alert_status: status }).filter(([, v]) => v)
    )
  );

  const { mutate: updateStatus } = useMutation(
    (id, s) => alertsService.updateStatus(id, s),
    { successMessage: "Alert status updated", onSuccess: refetch }
  );

  const alerts = useMemo(() => {
    const live = Array.isArray(data) ? data : [];
    if (live.length > 0) return live;
    return MOCK_ALERTS.filter((a) => {
      if (severity && a.severity !== severity) return false;
      if (status && a.status !== status) return false;
      return true;
    });
  }, [data, severity, status]);

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Alerts</h1>
          <p className="console-subtitle">
            Auto-generated and analyst-created alerts across surveillance streams
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
          <button className="btn btn-primary" onClick={() => navigate("/agency/alerts/new")}>
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
        <div style={{ color: "var(--muted)", fontSize: 14 }}>Loading alerts…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={`alert-card alert-card--${alert.severity}`}
            >
              <div className="alert-card-head">
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="alert-card-tags">
                    {alert.severity === "critical" || alert.severity === "high" ? (
                      <AlertTriangle
                        size={14}
                        color={alert.severity === "critical" ? "var(--danger)" : "var(--warn)"}
                      />
                    ) : null}
                    <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                    <span className={`badge badge-${alert.category}`}>{alert.category}</span>
                  </div>
                  <div className="alert-card-title">{alert.title}</div>
                  <div className="alert-card-copy">{alert.description}</div>
                  {alert.anomaly_score != null && (
                    <div className="alert-card-meta" style={{ color: "var(--accent)" }}>
                      Anomaly score: <strong>{alert.anomaly_score.toFixed(2)}σ</strong>
                    </div>
                  )}
                  <div className="alert-card-meta">
                    {format(new Date(alert.created_at), "MMM d, yyyy · HH:mm")}
                  </div>
                </div>

                {isAnalyst && alert.status === "open" && (
                  <div className="alert-card-actions">
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: "5px 12px", minHeight: 32 }}
                      onClick={() => updateStatus(alert.id, "investigating")}
                    >
                      Investigate
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: 12, padding: "5px 12px", minHeight: 32 }}
                      onClick={() => updateStatus(alert.id, "resolved")}
                    >
                      Resolve
                    </button>
                  </div>
                )}

                {alert.status !== "open" && (
                  <span className="badge">{alert.status.replace("_", " ")}</span>
                )}
              </div>
            </div>
          ))}
          {alerts.length === 0 && (
            <div className="card" style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>
              No alerts match the current filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
