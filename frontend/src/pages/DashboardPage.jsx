import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight } from "lucide-react";

const STATS = [
  { label: "New today",       value: 12,  delta: "+3 vs avg",  tone: "up" },
  { label: "Open · in review", value: 27, delta: "—" },
  { label: "Awaiting routing", value: 8,  delta: "—" },
  { label: "Routed · week",    value: 46, delta: "+18", tone: "up" },
  { label: "Resolved · 30d",   value: 310, delta: "—" },
];

const MAP_DOTS = [
  { top: "32%",  left: "55%", color: "#fecaca", size: "lg" },
  { top: "44%",  left: "32%", color: "#bfdbfe", size: "lg" },
  { top: "60%",  left: "22%", color: "#c7d2fe", size: "lg" },
  { top: "52%",  left: "58%", color: "#bbf7d0", size: "" },
  { top: "44%",  left: "68%", color: "#fed7aa", size: "lg" },
];

const LEGEND = [
  { label: "People · 4",  color: "#a5b4fc" },
  { label: "Animal · 5",  color: "#34d399" },
  { label: "Env · 2",     color: "#86efac" },
  { label: "Vector · 1",  color: "#fdba74" },
  { label: "cluster · NW Pima · 3 animal · 2mi", color: "#cbd5e1" },
];

const QUEUE = [
  { id: "RPT-1024", category: "Animal", summary: "Coyote, unsteady in pasture", location: "85719 · Pima",  status: "New",      submitted: "2:14 PM",  tone: "new" },
  { id: "RPT-1023", category: "People", summary: "Fever cluster · 3 households",  location: "85735",          status: "In review", submitted: "1:48 PM" },
  { id: "RPT-1022", category: "Vector", summary: "Mosquito activity ↑",          location: "85705",          status: "Routed",    submitted: "12:31 PM" },
];

const QUEUE_TABS = [
  { id: "new",     label: "New · 12",       active: true },
  { id: "review",  label: "In review · 27" },
  { id: "routed",  label: "Routed · 46" },
  { id: "resolved", label: "Resolved" },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [range, setRange] = useState("All");
  const [tab, setTab] = useState("new");

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Dashboard</h1>
          <p className="console-subtitle">
            Pima &amp; surrounding counties · last 24h
          </p>
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
          <button className="btn btn-ghost">Export</button>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/agency/alerts/new")}
          >
            <Plus size={14} strokeWidth={2.4} />
            New alert
          </button>
        </div>
      </div>

      <div className="stat-row">
        {STATS.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-delta ${s.tone === "up" ? "stat-delta--up" : ""}`}>
              {s.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="console-grid-2">
        <div className="card map-card">
          <div className="map-card-header">
            <div className="map-card-title">Reports map</div>
            <div className="range-tabs">
              {["All", "7d", "30d"].map((r) => (
                <button
                  key={r}
                  className={`range-tab ${range === r ? "is-active" : ""}`}
                  onClick={() => setRange(r)}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="map-canvas">
            {MAP_DOTS.map((d, i) => (
              <span
                key={i}
                className={`map-dot ${d.size === "lg" ? "map-dot--lg" : ""}`}
                style={{ top: d.top, left: d.left, background: d.color }}
              />
            ))}
          </div>
          <div className="map-legend">
            {LEGEND.map((l) => (
              <span key={l.label} className="map-legend-item">
                <span className="map-legend-dot" style={{ background: l.color }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>

        <div className="card cluster-card">
          <div className="cluster-eyebrow">Cluster detected</div>
          <div className="cluster-title">3 animal reports · NW Pima</div>
          <p className="cluster-copy">
            Animal reports clustering this week alongside rising mosquito
            activity. Consider reaching out to AZGF for joint surveillance.
          </p>
          <div className="cluster-actions">
            <button className="btn btn-ghost">View cluster</button>
            <button
              className="btn btn-primary"
              onClick={() => navigate("/agency/alerts/new")}
            >
              Draft alert
            </button>
          </div>
        </div>
      </div>

      <div className="card queue-card">
        <div className="queue-header">
          <div className="map-card-title">Triage queue</div>
          <div className="queue-tabs">
            {QUEUE_TABS.map((t) => (
              <button
                key={t.id}
                className={`queue-tab ${tab === t.id ? "is-active" : ""}`}
                onClick={() => setTab(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

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
            {QUEUE.map((row) => (
              <tr key={row.id} onClick={() => navigate(`/agency/reports/${row.id}`)}>
                <td>{row.id}</td>
                <td>{row.category}</td>
                <td>{row.summary}</td>
                <td>{row.location}</td>
                <td>
                  <span
                    className={`queue-status ${row.tone === "new" ? "queue-status--new" : ""}`}
                  >
                    {row.status}
                  </span>
                </td>
                <td className="queue-time">{row.submitted}</td>
                <td className="queue-chev"><ChevronRight size={16} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
