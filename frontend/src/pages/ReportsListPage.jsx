import { useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronRight, RefreshCw, Download } from "lucide-react";
import {
  useReports,
  filtersFromSearchParams,
  filtersToSearchParams,
} from "../hooks/useReports";
import { useTickingAgo } from "../hooks/useTickingAgo";
import { exportReportsCSV } from "../lib/csv";

const CATEGORY_CHIPS = [
  { id: "all",    label: "All" },
  { id: "people", label: "People" },
  { id: "animal", label: "Animal" },
  { id: "env",    label: "Environment" },
  { id: "vector", label: "Vector" },
];

const STATUS_TABS = [
  { id: "",         label: "All" },
  { id: "new",      label: "New" },
  { id: "review",   label: "In review" },
  { id: "routed",   label: "Routed" },
  { id: "resolved", label: "Resolved" },
];

export default function ReportsListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = filtersFromSearchParams(searchParams);

  const { reports, counts, lastUpdatedAt, refresh, loading, error } = useReports({ filters });

  const updateFilter = (patch) => {
    const next = { ...filters, ...patch };
    setSearchParams(filtersToSearchParams(next), { replace: true });
  };

  const lastUpdatedLabel = useTickingAgo(lastUpdatedAt);

  const statusCounts = useMemo(() => ({
    "":         counts.total,
    new:        counts.new,
    review:     counts.review,
    routed:     counts.routed,
    resolved:   counts.resolved,
  }), [counts]);

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Reports</h1>
          <p className="console-subtitle">
            All mobile-app submissions across triage stages · {counts.total} total
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search reports, places, IDs…"
              value={filters.q}
              onChange={(e) => updateFilter({ q: e.target.value })}
            />
          </div>
          <button
            className="btn btn-ghost"
            onClick={refresh}
            title="Refresh"
            disabled={loading}
          >
            <RefreshCw
              size={14}
              strokeWidth={2.2}
              className={loading ? "refresh-spin" : ""}
            />
            <span className="last-updated-pill">{lastUpdatedLabel}</span>
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => exportReportsCSV(reports, "reports")}
            disabled={reports.length === 0}
            title="Download current view as CSV"
          >
            <Download size={14} strokeWidth={2.2} />
            Export
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {CATEGORY_CHIPS.map((c) => (
          <button
            key={c.id}
            className={`filter-chip ${filters.category === c.id ? "is-active" : ""}`}
            onClick={() => updateFilter({ category: c.id })}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="card queue-card">
        <div className="queue-header">
          <div className="map-card-title">Triage queue</div>
          <div className="queue-tabs">
            {STATUS_TABS.map((t) => {
              const n = statusCounts[t.id] ?? 0;
              return (
                <button
                  key={t.id || "all"}
                  className={`queue-tab ${filters.status === t.id ? "is-active" : ""}`}
                  onClick={() => updateFilter({ status: t.id })}
                >
                  {t.label} · {n}
                </button>
              );
            })}
          </div>
        </div>

        <table className="queue-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Category</th>
              <th>Summary</th>
              <th>Coords</th>
              <th>Status</th>
              <th>Submitted</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r.id} onClick={() => navigate(`/agency/reports/${r.id}`)}>
                <td>{r.id}</td>
                <td>
                  <span className={`badge badge-${r.categorySlug}`}>{r.category}</span>
                </td>
                <td>{r.summary}</td>
                <td className="queue-time">{r.location.coords}</td>
                <td>
                  <span className={`queue-status ${r.status === "New" ? "queue-status--new" : ""}`}>
                    {r.status}
                  </span>
                </td>
                <td className="queue-time">{r.submittedShort}</td>
                <td className="queue-chev"><ChevronRight size={16} /></td>
              </tr>
            ))}
            {reports.length === 0 && !loading && !error && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--muted)" }}>
                  No reports match these filters.
                </td>
              </tr>
            )}
            {loading && reports.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 24 }}>
                  <div className="skeleton-block" style={{ height: 56 }} />
                </td>
              </tr>
            )}
            {error && reports.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 32, textAlign: "center", color: "var(--danger)" }}>
                  Couldn't load reports. Try refreshing.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// Renders "Updated 12s ago" with a 1s rerender tick so the label stays fresh.
