/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Show the category mix of the currently filtered reports on
the dashboard as compact stat tiles with share-of-impact fill bars.
*/

import { useMemo } from "react";
import { buildCategoryBreakdown } from "../../lib/dashboardAnalytics";

export default function DashboardCategoryChart({ reports }) {
  const data = useMemo(() => buildCategoryBreakdown(reports), [reports]);
  const totalImpact = useMemo(
    () => data.reduce((sum, item) => sum + item.impact, 0),
    [data],
  );
  const totalReports = reports.length;

  return (
    <div className="card chart-card category-tiles-card">
      <div className="chart-card-header">
        <div>
          <div className="map-card-title">Signal impact by category</div>
          <div className="map-card-subtitle">
            Synthesized demo impact based on affected counts, severity markers,
            and exposure parameters in the current scope.
          </div>
        </div>
        <span className="preview-meta">Demo impact index</span>
      </div>

      {reports.length === 0 ? (
        <div className="chart-empty">
          Synthesized category impact appears here once reports are in scope.
        </div>
      ) : (
        <>
          <div className="category-tiles">
            {data.map((item) => (
              <div
                key={item.key}
                className="category-tile"
                style={{ "--tile-color": item.color }}
              >
                <div className="category-tile-head">
                  <span className="category-tile-dot" />
                  <span className="category-tile-label">{item.label}</span>
                  <span className="category-tile-share">{item.share}%</span>
                </div>
                <div className="category-tile-impact">{item.impact}</div>
                <div className="category-tile-meta">
                  {item.count} report{item.count === 1 ? "" : "s"} · impact index
                </div>
                <div className="category-tile-bar">
                  <div
                    className="category-tile-bar-fill"
                    style={{ width: `${Math.max(item.share, 2)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
          <div className="category-tiles-footer">
            <span>
              <strong>{totalImpact}</strong> total impact across{" "}
              <strong>{totalReports}</strong> report{totalReports === 1 ? "" : "s"}
            </span>
            <span className="category-tiles-footer-hint">
              Share = each category&rsquo;s slice of total demo impact in the current scope.
            </span>
          </div>
        </>
      )}
    </div>
  );
}
