import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronRight, X, Download } from "lucide-react";
import { REPORTS, CATEGORY_COLORS } from "../data/reports";
import { detectClusters } from "../lib/clusters";
import { exportReportsCSV } from "../lib/csv";
import ReportsMap from "../components/console/ReportsMap";

const FILTERS = [
  { id: "all",    label: "All categories" },
  { id: "people", label: "People" },
  { id: "animal", label: "Animal" },
  { id: "env",    label: "Environment" },
  { id: "vector", label: "Vector" },
];

const RANGE_HOURS = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30, All: Infinity };
const RANGES = ["24h", "7d", "30d", "All"];

const LEGEND = [
  { key: "people", label: "People",      color: CATEGORY_COLORS.people },
  { key: "animal", label: "Animal",      color: CATEGORY_COLORS.animal },
  { key: "env",    label: "Environment", color: CATEGORY_COLORS.env    },
  { key: "vector", label: "Vector",      color: CATEGORY_COLORS.vector },
];

export default function MapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [filter, setFilter] = useState("all");
  const [range, setRange] = useState("7d");
  const [q, setQ] = useState("");

  const clusterId = searchParams.get("cluster");
  const activeCluster = useMemo(() => {
    if (!clusterId) return null;
    return detectClusters(REPORTS).find((c) => c.id === clusterId) || null;
  }, [clusterId]);

  const visibleReports = useMemo(() => {
    // Cluster mode: show only its members, ignore other filters.
    if (activeCluster) {
      const ids = new Set(activeCluster.memberIds);
      return REPORTS.filter((r) => ids.has(r.id));
    }

    const now = Date.now();
    const cutoff = RANGE_HOURS[range] === Infinity
      ? -Infinity
      : now - RANGE_HOURS[range] * 60 * 60 * 1000;
    const term = q.trim().toLowerCase();

    return REPORTS.filter((r) => {
      if (filter !== "all" && r.categorySlug !== filter) return false;
      const ts = new Date(r.submittedAt).getTime();
      if (ts < cutoff) return false;
      if (term) {
        const hay = `${r.id} ${r.category} ${r.summary} ${r.location.coords}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [filter, range, q, activeCluster]);

  const mapView = activeCluster
    ? {
        longitude: activeCluster.centroid.longitude,
        latitude: activeCluster.centroid.latitude,
        zoom: 7.5,
      }
    : undefined;

  const clearCluster = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("cluster");
    setSearchParams(next, { replace: true });
  };

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Map</h1>
          <p className="console-subtitle">
            Geographic distribution of reports across Arizona
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search places, ZIP, IDs…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <button
            className="btn btn-ghost"
            onClick={() => exportReportsCSV(visibleReports, "map-reports")}
            disabled={visibleReports.length === 0}
          >
            <Download size={14} strokeWidth={2.2} />
            Export
          </button>
        </div>
      </div>

      {activeCluster && (
        <div className="cluster-banner">
          <div>
            <span className="cluster-banner-eyebrow">Cluster view</span>
            <span className="cluster-banner-title">
              {activeCluster.count} {activeCluster.category.toLowerCase()} reports
              within ~{activeCluster.radiusMi} mi
            </span>
          </div>
          <button
            type="button"
            className="cluster-banner-clear"
            onClick={clearCluster}
            aria-label="Clear cluster filter"
          >
            <X size={14} strokeWidth={2.2} />
            Clear cluster
          </button>
        </div>
      )}

      {!activeCluster && (
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
      )}

      <div className="console-grid-2" style={{ gridTemplateColumns: "1.7fr 1fr" }}>
        <div className="card map-card">
          <ReportsMap
            key={activeCluster?.id || "default"}
            reports={visibleReports}
            height={520}
            initialView={mapView}
            onSelectReport={(id) => {
              void id;
            }}
          />
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
            <span className="preview-meta">{visibleReports.length} in view</span>
          </div>
          <div style={{ maxHeight: 520, overflow: "auto" }}>
            <table className="queue-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visibleReports.map((r) => (
                  <tr key={r.id} onClick={() => navigate(`/agency/reports/${r.id}`)}>
                    <td>{r.id}</td>
                    <td>
                      <span className={`badge badge-${r.categorySlug}`}>{r.category}</span>
                    </td>
                    <td>
                      <span className={`queue-status ${r.status === "New" ? "queue-status--new" : ""}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="queue-chev"><ChevronRight size={16} /></td>
                  </tr>
                ))}
                {visibleReports.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 24, color: "var(--muted)", textAlign: "center" }}>
                      No reports match the current filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
