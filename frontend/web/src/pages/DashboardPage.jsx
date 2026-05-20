import { useDashboardStats, useTrend } from "../hooks/useData";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { Activity, AlertTriangle, ClipboardList, Users } from "lucide-react";
import { format } from "date-fns";

function StatCard({ label, value, className = "" }) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div className={`stat-value ${className}`}>{value ?? "—"}</div>
    </div>
  );
}

function CategoryBadge({ category }) {
  return <span className={`badge badge-${category}`}>{category}</span>;
}

function SeverityBadge({ severity }) {
  return <span className={`badge badge-${severity}`}>{severity}</span>;
}

export default function DashboardPage() {
  const { data: stats, loading: statsLoading } = useDashboardStats();
  const { data: trend } = useTrend(14);

  if (statsLoading) return <div className="loading-screen">Loading dashboard…</div>;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Surveillance Dashboard</h1>
        <p className="page-subtitle">
          Real-time aggregation across human, animal, and environmental signal streams
        </p>
      </div>

      {/* Stat Row */}
      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Active Surveys"       value={stats?.active_surveys}            className="stat-accent" />
        <StatCard label="Responses Today"      value={stats?.total_responses_today}     className="stat-accent" />
        <StatCard label="All-time Responses"   value={stats?.total_responses_all_time} />
        <StatCard label="Open Alerts"          value={stats?.open_alerts}               className="stat-warn" />
        <StatCard label="Critical Alerts"      value={stats?.critical_alerts}           className="stat-danger" />
      </div>

      {/* Trend Chart */}
      {trend && trend.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 14, marginBottom: 16, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Response Volume — 14 Day Trend
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={trend}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted)", fontSize: 11 }}
                tickFormatter={(v) => format(new Date(v), "MMM d")}
              />
              <YAxis tick={{ fill: "var(--muted)", fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
                labelFormatter={(v) => format(new Date(v), "MMM d, yyyy")}
              />
              <Line
                type="monotone" dataKey="count"
                stroke="var(--accent)" strokeWidth={2}
                dot={{ fill: "var(--accent)", r: 3 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category Breakdown + Recent Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 16 }}>

        {/* Category breakdown */}
        <div className="card">
          <h2 style={{ fontSize: 13, marginBottom: 14, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            By Domain
          </h2>
          {Object.entries(stats?.responses_by_category || {}).map(([cat, count]) => (
            <div key={cat} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--border)" }}>
              <CategoryBadge category={cat} />
              <span style={{ fontWeight: 700, fontSize: 14 }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Recent alerts table */}
        <div className="card">
          <h2 style={{ fontSize: 13, marginBottom: 14, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
            Recent Alerts
          </h2>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
            <thead>
              <tr style={{ color: "var(--muted)" }}>
                <th style={{ textAlign: "left", paddingBottom: 8 }}>Title</th>
                <th>Category</th>
                <th>Severity</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody>
              {(stats?.recent_alerts || []).map((a) => (
                <tr key={a.id} style={{ borderTop: "1px solid var(--border)" }}>
                  <td style={{ padding: "10px 0", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {a.title}
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <CategoryBadge category={a.category} />
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <SeverityBadge severity={a.severity} />
                  </td>
                  <td style={{ textAlign: "center", fontWeight: 700, color: "var(--accent)" }}>
                    {a.anomaly_score?.toFixed(2) ?? "—"}
                  </td>
                </tr>
              ))}
              {!stats?.recent_alerts?.length && (
                <tr><td colSpan={4} style={{ color: "var(--muted)", padding: "12px 0" }}>No alerts yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
