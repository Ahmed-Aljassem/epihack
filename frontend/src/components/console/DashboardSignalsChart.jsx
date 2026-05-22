/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Highlight the most common synthesized symptoms and field
signals in the current report scope so dashboard users can spot patterns fast.
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
import { buildSignalBreakdown } from "../../lib/dashboardAnalytics";

function SignalsTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;

  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{item.label}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Reports mentioning</span>
        <span className="chart-tooltip-value">{item.count}</span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Share of view</span>
        <span className="chart-tooltip-value">{item.share}%</span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Strongest in</span>
        <span className="chart-tooltip-value">{item.categoryLabel}</span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Impact index</span>
        <span className="chart-tooltip-value">{item.impact}</span>
      </div>
    </div>
  );
}

export default function DashboardSignalsChart({ reports }) {
  const data = useMemo(() => {
    return buildSignalBreakdown(reports).map((item) => ({
      ...item,
      shortLabel: truncateLabel(item.label),
    }));
  }, [reports]);

  return (
    <div className="card chart-card">
      <div className="chart-card-header">
        <div>
          <div className="map-card-title">Top symptoms and signals</div>
          <div className="map-card-subtitle">
            Synthesized human symptoms, animal signs, and environmental or
            vector-linked field signals in the current filtered view.
          </div>
        </div>
        <span className="preview-meta">Top 8 patterns</span>
      </div>

      {reports.length === 0 ? (
        <div className="chart-empty">
          Symptom and field-signal patterns appear here once reports are in scope.
        </div>
      ) : (
        <div className="chart-shell">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 4, right: 24, left: 24, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" horizontal={false} />
              <XAxis
                type="number"
                allowDecimals={false}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#7b8190", fontSize: 12 }}
              />
              <YAxis
                type="category"
                dataKey="shortLabel"
                width={150}
                tickLine={false}
                axisLine={false}
                tick={{ fill: "#4c5566", fontSize: 12 }}
              />
              <Tooltip content={<SignalsTooltip />} cursor={{ fill: "rgba(15, 23, 42, 0.04)" }} />
              <Bar dataKey="count" radius={[0, 10, 10, 0]} barSize={24}>
                {data.map((entry) => (
                  <Cell key={entry.key} fill={entry.color} />
                ))}
                <LabelList dataKey="count" position="right" fill="#4c5566" fontSize={12} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function truncateLabel(value, max = 26) {
  return value.length > max ? `${value.slice(0, max - 1)}…` : value;
}
