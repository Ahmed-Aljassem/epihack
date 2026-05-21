import { useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, ChevronRight, X, Download } from "lucide-react";
import ReportFilters from "../components/console/ReportFilters";
import { CATEGORY_COLORS } from "../data/reports";
import { detectClusters } from "../lib/clusters";
import { exportReportsCSV } from "../lib/csv";
import {
  DEFAULT_REPORT_FILTERS,
  countReportsByCategory,
  omitReportFilters,
} from "../lib/reportFilters";
import ReportsMap from "../components/console/ReportsMap";
import {
  MAP_VIEW_MODES,
  getMapModeDescription,
} from "../components/console/mapViewModes";
import {
  useReports,
  filtersFromSearchParams,
  filtersToSearchParams,
} from "../hooks/useReports";
import { filterClient } from "../services/mocks/reports.mock";

const LEGEND = [
  { key: "people", label: "People",      color: CATEGORY_COLORS.people },
  { key: "animal", label: "Animal",      color: CATEGORY_COLORS.animal },
  { key: "env",    label: "Environment", color: CATEGORY_COLORS.env    },
  { key: "vector", label: "Vector",      color: CATEGORY_COLORS.vector },
];
const MAP_DEFAULT_FILTERS = { ...DEFAULT_REPORT_FILTERS, range: "7d" };

export default function MapPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [mapMode, setMapMode] = useState("both");
  const filters = filtersFromSearchParams(searchParams, MAP_DEFAULT_FILTERS);
  const clusterId = searchParams.get("cluster");
  const { allReports, loading, error } = useReports();

  const activeCluster = useMemo(() => {
    if (!clusterId) return null;
    return detectClusters(allReports).find((c) => c.id === clusterId) || null;
  }, [allReports, clusterId]);

  const visibleReports = useMemo(() => {
    const activeFilters = activeCluster
      ? { ids: activeCluster.memberIds }
      : filters;
    return filterClient(allReports, activeFilters);
  }, [activeCluster, allReports, filters]);

  const categoryCounts = useMemo(() => {
    const scopedReports = filterClient(
      allReports,
      omitReportFilters(filters, ["category"]),
    );
    return countReportsByCategory(scopedReports);
  }, [allReports, filters]);

  const datasetCounts = useMemo(() => {
    return visibleReports.reduce((acc, report) => {
      acc[report.categorySlug] = (acc[report.categorySlug] || 0) + 1;
      return acc;
    }, { people: 0, animal: 0, env: 0, vector: 0 });
  }, [visibleReports]);

  const mapView = activeCluster
    ? {
        longitude: activeCluster.centroid.longitude,
        latitude: activeCluster.centroid.latitude,
        zoom: 7.5,
      }
    : undefined;

  const updateFilter = (patch) => {
    const nextFilters = { ...filters, ...patch };
    const nextSearchParams = new URLSearchParams(searchParams);

    ["category", "range", "status", "county", "zip", "q"].forEach((key) => {
      nextSearchParams.delete(key);
    });

    const filterParams = filtersToSearchParams(nextFilters);
    filterParams.forEach((value, key) => {
      nextSearchParams.set(key, value);
    });

    setSearchParams(nextSearchParams, { replace: true });
  };

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
              placeholder={activeCluster ? "Cluster view is locked to its detected reports" : "Search places, ZIPs, counties, IDs…"}
              value={filters.q}
              onChange={(e) => updateFilter({ q: e.target.value })}
              disabled={Boolean(activeCluster)}
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
        <ReportFilters
          filters={filters}
          onChange={updateFilter}
          optionReports={allReports}
          categoryCounts={categoryCounts}
          resultCount={visibleReports.length}
          showStatus
          onClear={() => updateFilter(MAP_DEFAULT_FILTERS)}
        />
      )}

      <div className="console-grid-2" style={{ gridTemplateColumns: "1.7fr 1fr" }}>
        <div className="card map-card">
          <div className="map-card-header">
            <div>
              <div className="map-card-title">Spatial view</div>
              <div className="map-card-subtitle">
                Switch between exact report locations and overall density.
              </div>
            </div>
            <div className="range-tabs" aria-label="Map view mode">
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
          <ReportsMap
            key={activeCluster?.id || "default"}
            reports={visibleReports}
            height={520}
            initialView={mapView}
            viewMode={mapMode}
            onSelectReport={(id) => {
              void id;
            }}
          />
          <div className="map-mode-note">{getMapModeDescription(mapMode)}</div>
          <div className="map-legend">
            {LEGEND.map((meta) => (
              <span key={meta.key} className="map-legend-item">
                <span
                  className="map-legend-dot"
                  style={{ background: meta.color }}
                />
                {meta.label} · {datasetCounts[meta.key] || 0}
              </span>
            ))}
          </div>
        </div>

        <div className="card queue-card map-panel">
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
                      {loading
                        ? "Loading reports…"
                        : error
                          ? "Couldn't load reports for the map."
                          : "No reports match the current filters."}
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
