/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Show the category mix of the currently filtered reports on
the dashboard with an easy-to-read horizontal comparison chart.
*/

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { buildCategoryBreakdown } from "../../lib/dashboardAnalytics";

function CategoryTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{item.label}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Reports</span>
        <span className="chart-tooltip-value">{item.count}</span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Impact index</span>
        <span className="chart-tooltip-value">{item.impact}</span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Share</span>
        <span className="chart-tooltip-value">{item.share}%</span>
      </div>
    </div>
  );
}

export default function DashboardCategoryChart({ reports }) {
  const data = useMemo(() => buildCategoryBreakdown(reports), [reports]);

  return (
    <div className="card chart-card">
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
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 12, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.2)" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#7b8190", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="label"
                width={96}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#4c5566", fontSize: 12 }}
              />
              <Tooltip content={<CategoryTooltip />} cursor={{ fill: "rgba(15, 23, 42, 0.04)" }} />
              <Bar dataKey="impact" radius={[0, 10, 10, 0]} barSize={26}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
                <LabelList dataKey="impact" position="right" fill="#4c5566" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
