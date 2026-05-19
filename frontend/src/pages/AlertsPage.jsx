import { useState } from "react";
import { useAlerts, useMutation } from "../hooks/useData";
import { alertsAPI } from "../services/api";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { AlertTriangle } from "lucide-react";

const SEVERITIES = ["", "critical", "high", "medium", "low"];
const STATUSES   = ["", "open", "investigating", "resolved", "false_positive"];

export default function AlertsPage() {
  const { isAnalyst } = useAuth();
  const [severity, setSeverity] = useState("");
  const [alertStatus, setAlertStatus] = useState("open");
  const { data: alerts, loading, refetch } = useAlerts(
    Object.fromEntries(
      Object.entries({ severity, alert_status: alertStatus }).filter(([, v]) => v)
    )
  );

  const { mutate: updateStatus } = useMutation(
    (id, s) => alertsAPI.updateStatus(id, s),
    { successMessage: "Alert status updated", onSuccess: refetch }
  );

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Signal Alerts</h1>
        <p className="page-subtitle">Auto-generated and analyst-created alerts from surveillance data</p>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
        <select className="select" style={{ width: "auto" }} value={severity} onChange={(e) => setSeverity(e.target.value)}>
          <option value="">All Severities</option>
          {SEVERITIES.slice(1).map((s) => (
            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <select className="select" style={{ width: "auto" }} value={alertStatus} onChange={(e) => setAlertStatus(e.target.value)}>
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>{s ? s.replace("_", " ") : "All Statuses"}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div style={{ color: "var(--muted)", fontSize: 14 }}>Loading alerts…</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {(alerts || []).map((alert) => (
            <div key={alert.id} className="card" style={{ borderLeft: `3px solid ${alert.severity === "critical" ? "var(--danger)" : alert.severity === "high" ? "var(--warn)" : "var(--border)"}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 6 }}>
                    <AlertTriangle size={14} color={alert.severity === "critical" ? "var(--danger)" : "var(--warn)"} />
                    <span className={`badge badge-${alert.severity}`}>{alert.severity}</span>
                    <span className={`badge badge-${alert.category}`}>{alert.category}</span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 4 }}>{alert.title}</div>
                  <div style={{ color: "var(--muted)", fontSize: 12, lineHeight: 1.6 }}>{alert.description}</div>
                  {alert.anomaly_score != null && (
                    <div style={{ marginTop: 8, fontSize: 11, color: "var(--accent)" }}>
                      Anomaly score: <strong>{alert.anomaly_score.toFixed(3)}σ</strong>
                    </div>
                  )}
                  <div style={{ marginTop: 6, fontSize: 11, color: "var(--muted)" }}>
                    {format(new Date(alert.created_at), "MMM d, yyyy HH:mm")}
                  </div>
                </div>

                {isAnalyst && alert.status === "open" && (
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }}
                      onClick={() => updateStatus(alert.id, "investigating")}>
                      Investigate
                    </button>
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: "5px 10px" }}
                      onClick={() => updateStatus(alert.id, "resolved")}>
                      Resolve
                    </button>
                    <button className="btn btn-danger" style={{ fontSize: 11, padding: "5px 10px" }}
                      onClick={() => updateStatus(alert.id, "false_positive")}>
                      False +
                    </button>
                  </div>
                )}

                {alert.status !== "open" && (
                  <span className="badge" style={{ background: "var(--surface-2)", color: "var(--muted)" }}>
                    {alert.status.replace("_", " ")}
                  </span>
                )}
              </div>
            </div>
          ))}
          {!alerts?.length && (
            <div className="card" style={{ color: "var(--muted)", textAlign: "center", padding: 40 }}>
              No alerts match the current filters.
            </div>
          )}
        </div>
      )}
    </div>
  );
}
