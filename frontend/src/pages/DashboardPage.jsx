import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus, ChevronRight, RefreshCw } from "lucide-react";
import ReportFilters from "../components/console/ReportFilters";
import { CATEGORY_COLORS } from "../data/reports";
import { useReports } from "../hooks/useReports";
import { useTickingAgo } from "../hooks/useTickingAgo";
import { detectClusters } from "../lib/clusters";
import {
  DEFAULT_REPORT_FILTERS,
  countReportsByCategory,
  hasActiveReportFilters,
  omitReportFilters,
} from "../lib/reportFilters";
import ReportsMap from "../components/console/ReportsMap";
import {
  MAP_VIEW_MODES,
  getMapModeDescription,
} from "../components/console/mapViewModes";
import { filterClient } from "../services/mocks/reports.mock";

const LEGEND_DEFS = [
  { key: "people", label: "People",      color: CATEGORY_COLORS.people },
  { key: "animal", label: "Animal",      color: CATEGORY_COLORS.animal },
  { key: "env",    label: "Env",         color: CATEGORY_COLORS.env    },
  { key: "vector", label: "Vector",      color: CATEGORY_COLORS.vector },
];

const QUEUE_TABS = [
  { id: "new",      label: "New" },
  { id: "review",   label: "In review" },
  { id: "routed",   label: "Routed" },
  { id: "resolved", label: "Resolved" },
];

const STATUS_FILTER_TO_LABEL = {
  new: "New",
  review: "In review",
  routed: "Routed",
  resolved: "Resolved",
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState(DEFAULT_REPORT_FILTERS);
  const [mapMode, setMapMode] = useState("both");
  const [tab, setTab] = useState("new");

  const {
    reports,
    allReports,
    counts,
    scopedCounts,
    allCounts,
    lastUpdatedAt,
    refresh,
    loading,
  } = useReports({ filters });
  const ago = useTickingAgo(lastUpdatedAt, { compact: true });
  const hasFilters = hasActiveReportFilters(filters, { includeStatus: false });

  const updateFilter = (patch) => {
    setFilters((current) => ({ ...current, ...patch }));
  };

  const mapReports = reports;
  const categoryCounts = useMemo(() => {
    const scopedReports = filterClient(
      allReports,
      omitReportFilters(filters, ["category"]),
    );
    return countReportsByCategory(scopedReports);
  }, [allReports, filters]);

  const legendCounts = useMemo(() => {
    const acc = { people: 0, animal: 0, env: 0, vector: 0 };
    mapReports.forEach((r) => {
      if (acc[r.categorySlug] !== undefined) acc[r.categorySlug] += 1;
    });
    return acc;
  }, [mapReports]);

  // Stats — derived from live data.
  const stats = useMemo(() => buildStats(reports, counts), [reports, counts]);

  // Clusters — first one (largest) drives the dashboard card.
  const clusters = useMemo(() => detectClusters(reports), [reports]);
  const topCluster = clusters[0];

  // Queue — first 6 reports matching the selected status tab.
  const queue = useMemo(() => {
    const targetLabel = STATUS_FILTER_TO_LABEL[tab];
    return reports
      .filter((r) => r.status === targetLabel)
      .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
      .slice(0, 6);
  }, [reports, tab]);

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Dashboard</h1>
          <p className="console-subtitle">
            Arizona surveillance · {hasFilters
              ? `${reports.length} in view of ${allCounts.total} total`
              : `${allCounts.total} reports tracked`}
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              placeholder="Search reports, ZIPs, counties, IDs…"
              value={filters.q}
              onChange={(event) => updateFilter({ q: event.target.value })}
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
            <span className="last-updated-pill">{ago}</span>
          </button>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/agency/alerts/new")}
          >
            <Plus size={14} strokeWidth={2.4} />
            New alert
          </button>
        </div>
      </div>

      <ReportFilters
        filters={filters}
        onChange={updateFilter}
        optionReports={allReports}
        categoryCounts={categoryCounts}
        resultCount={reports.length}
        showRange={false}
        showStatus={false}
        onClear={() => setFilters(DEFAULT_REPORT_FILTERS)}
      />

      <div className="stat-row">
        {stats.map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            <div className={`stat-delta ${s.tone === "up" ? "stat-delta--up" : ""}`}>
              {s.delta || "—"}
            </div>
          </div>
        ))}
      </div>

      <div className="console-grid-2">
        <div className="card map-card">
          <div className="map-card-header">
            <div>
              <div className="map-card-title">Reports map</div>
              <div className="map-card-subtitle">
                Switch between exact report locations and overall density.
              </div>
            </div>
            <div className="map-card-controls">
              <div className="range-tabs" aria-label="Dashboard map date range">
                {["All", "7d", "30d"].map((r) => (
                  <button
                    key={r}
                    className={`range-tab ${filters.range === r ? "is-active" : ""}`}
                    onClick={() => updateFilter({ range: r })}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <div className="range-tabs" aria-label="Dashboard map view mode">
                {MAP_VIEW_MODES.map((mode) => (
                  <button
                    key={mode.id}
                    className={`range-tab ${mapMode === mode.id ? "is-active" : ""}`}
                    onClick={() => setMapMode(mode.id)}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <ReportsMap reports={mapReports} height={280} viewMode={mapMode} />
          <div className="map-mode-note">{getMapModeDescription(mapMode)}</div>
          <div className="map-legend">
            {LEGEND_DEFS.map((l) => {
              const count = legendCounts[l.key] || 0;
              return (
                <span key={l.label} className="map-legend-item">
                  <span className="map-legend-dot" style={{ background: l.color }} />
                  {l.label} · {count}
                </span>
              );
            })}
          </div>
        </div>

        <div className="card cluster-card">
          {topCluster ? (
            <>
              <div className="cluster-eyebrow">
                {clusters.length} cluster{clusters.length === 1 ? "" : "s"} detected
              </div>
              <div className="cluster-title">
                {topCluster.count} {topCluster.category.toLowerCase()} reports clustering
              </div>
              <p className="cluster-copy">
                {topCluster.count} reports within ~{topCluster.radiusMi} mi over the
                last {topCluster.windowDays} days. ZIP coverage {topCluster.zipSummary}
                {topCluster.zipCount > 3 ? ` + ${topCluster.zipCount - 3} more` : ""}.
              </p>
              <div className="cluster-actions">
                <button
                  className="btn btn-ghost"
                  onClick={() => navigate(`/agency/map?cluster=${topCluster.id}`)}
                >
                  View cluster
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() =>
                    navigate(`/agency/alerts/new?cluster=${topCluster.id}`)
                  }
                >
                  Draft alert
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="cluster-eyebrow">All clear</div>
              <div className="cluster-title">No clusters in the last 7 days</div>
              <p className="cluster-copy">
                Reports are spread out across categories and locations. Surveillance
                continues — the system will flag clusters automatically.
              </p>
            </>
          )}
        </div>
      </div>

      <div className="card queue-card">
        <div className="queue-header">
          <div className="map-card-title">Triage queue</div>
          <div className="queue-tabs">
            {QUEUE_TABS.map((t) => {
              const n = scopedCounts[t.id] ?? 0;
              return (
                <button
                  key={t.id}
                  className={`queue-tab ${tab === t.id ? "is-active" : ""}`}
                  onClick={() => setTab(t.id)}
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
              <th>ZIP</th>
              <th>Status</th>
              <th>Submitted</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {queue.map((r) => (
              <tr key={r.id} onClick={() => navigate(`/agency/reports/${r.id}`)}>
                <td>{r.id}</td>
                <td>
                  <span className={`badge badge-${r.categorySlug}`}>{r.category}</span>
                </td>
                <td>{r.summary}</td>
                <td className="queue-time">{r.location.zip}</td>
                <td>
                  <span className={`queue-status ${r.status === "New" ? "queue-status--new" : ""}`}>
                    {r.status}
                  </span>
                </td>
                <td className="queue-time">{r.submittedShort}</td>
                <td className="queue-chev"><ChevronRight size={16} /></td>
              </tr>
            ))}
            {queue.length === 0 && (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--muted)" }}>
                  No reports in this stage.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buildStats(allReports, counts) {
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  const newToday = allReports.filter(
    (r) => now - new Date(r.submittedAt).getTime() <= dayMs
  ).length;
  const newYesterday = allReports.filter((r) => {
    const ago = now - new Date(r.submittedAt).getTime();
    return ago > dayMs && ago <= 2 * dayMs;
  }).length;
  const delta = newToday - newYesterday;

  const routedThisWeek = allReports.filter(
    (r) => r.status === "Routed" && now - new Date(r.submittedAt).getTime() <= 7 * dayMs
  ).length;

  return [
    {
      label: "New today",
      value: newToday,
      delta: delta > 0 ? `+${delta} vs yesterday` : delta < 0 ? `${delta} vs yesterday` : "Same as yesterday",
      tone: delta > 0 ? "up" : undefined,
    },
    {
      label: "Open · in review",
      value: counts.review,
      delta: `${counts.review} active`,
    },
    {
      label: "Awaiting routing",
      value: counts.new,
      delta: counts.new > 0 ? "Needs triage" : "Caught up",
    },
    {
      label: "Routed · 7d",
      value: routedThisWeek,
      delta: routedThisWeek > 0 ? `+${routedThisWeek} this week` : "—",
      tone: routedThisWeek > 0 ? "up" : undefined,
    },
    {
      label: "Resolved",
      value: counts.resolved,
      delta: `${Math.round((counts.resolved / Math.max(counts.total, 1)) * 100)}% of total`,
    },
  ];
}
