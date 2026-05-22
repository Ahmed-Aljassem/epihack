/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Visualize report volume over time on the dashboard using the
same filtered report set shown elsewhere in the agency console.
*/

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  DASHBOARD_TREND_SERIES,
  buildTrendSeries,
} from "../../lib/dashboardAnalytics";

function TrendTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;

  const total = payload.reduce((sum, entry) => sum + Number(entry.value || 0), 0);

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      <div className="chart-tooltip-total">{total} total reports</div>
      <div className="chart-tooltip-list">
        {payload
          .filter((entry) => Number(entry.value) > 0)
          .map((entry) => (
            <div key={entry.dataKey} className="chart-tooltip-row">
              <span className="chart-tooltip-label">
                <span
                  className="chart-tooltip-swatch"
                  style={{ background: entry.color }}
                />
                {entry.name}
              </span>
              <span className="chart-tooltip-value">{entry.value}</span>
            </div>
          ))}
      </div>
    </div>
  );
}

export default function DashboardTrendChart({ reports, range = "All" }) {
  const data = useMemo(() => buildTrendSeries(reports, range), [reports, range]);

  return (
    <div className="card chart-card">
      <div className="chart-card-header">
        <div>
          <div className="map-card-title">Reports over time</div>
          <div className="map-card-subtitle">
            Trendline for the current filtered view, stacked by report category.
          </div>
        </div>
        <span className="preview-meta">{reports.length} tracked</span>
      </div>

      {reports.length === 0 ? (
        <div className="chart-empty">
          No reports match the current dashboard filters.
        </div>
      ) : (
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 8, right: 16, left: -14, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.22)" vertical={false} />
              <XAxis
                dataKey="label"
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#7b8190", fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#7b8190", fontSize: 12 }}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: "rgba(15, 23, 42, 0.12)" }} />
              {DASHBOARD_TREND_SERIES.map((series) => (
                <Area
                  key={series.key}
                  type="monotone"
                  dataKey={series.key}
                  name={series.label}
                  stackId="reports"
                  stroke={series.color}
                  fill={series.color}
                  fillOpacity={0.62}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
