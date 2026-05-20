import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, ChevronRight } from "lucide-react";
import { REPORTS } from "../data/reports";

const FILTERS = [
  { id: "all",    label: "All categories" },
  { id: "people", label: "People" },
  { id: "animal", label: "Animal" },
  { id: "env",    label: "Environment" },
  { id: "vector", label: "Vector" },
];

const RANGES = ["24h", "7d", "30d", "All"];

const DOTS = [
  { id: "RPT-1024", top: "44%", left: "62%", color: "#34d399", size: "lg" },
  { id: "RPT-1023", top: "32%", left: "28%", color: "#a5b4fc", size: "lg" },
  { id: "RPT-1022", top: "60%", left: "44%", color: "#fdba74", size: "lg" },
  { id: "RPT-1021", top: "54%", left: "72%", color: "#86efac" },
  { id: "RPT-1020", top: "36%", left: "55%", color: "#a5b4fc" },
  { id: "RPT-1019", top: "68%", left: "30%", color: "#fdba74" },
  { id: "RPT-1018", top: "26%", left: "70%", color: "#fecaca" },
];

const LEGEND = [
  { label: "People", color: "#a5b4fc" },
  { label: "Animal", color: "#34d399" },
  { label: "Environment", color: "#86efac" },
  { label: "Vector", color: "#fdba74" },
  { label: "Cluster", color: "#fecaca" },
];

export default function MapPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [range, setRange] = useState("7d");

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Map</h1>
          <p className="console-subtitle">
            Geographic distribution of reports across Pima &amp; surrounding counties
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search places, ZIP, IDs…"
            />
          </div>
          <button className="btn btn-ghost">Export</button>
        </div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filter === f.id ? "is-active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span style={{ marginLeft: "auto" }} />
        <div className="range-tabs">
          {RANGES.map((r) => (
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

      <div className="console-grid-2" style={{ gridTemplateColumns: "1.7fr 1fr" }}>
        <div className="card map-card">
          <div className="map-page-canvas">
            {DOTS.map((d) => (
              <span
                key={d.id}
                className={`map-dot ${d.size === "lg" ? "map-dot--lg" : ""}`}
                style={{ top: d.top, left: d.left, background: d.color }}
                title={d.id}
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

        <div className="card queue-card">
          <div className="queue-header">
            <div className="map-card-title">Visible reports</div>
            <span className="preview-meta">{REPORTS.length} in view</span>
          </div>
          <table className="queue-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Summary</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {REPORTS.map((r) => (
                <tr key={r.id} onClick={() => navigate(`/agency/reports/${r.id}`)}>
                  <td>{r.id}</td>
                  <td>{r.summary}</td>
                  <td className="queue-chev"><ChevronRight size={16} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
