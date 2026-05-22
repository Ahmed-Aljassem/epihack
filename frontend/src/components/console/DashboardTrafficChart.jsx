/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Show how many people are visiting the public-facing One Health
site over the selected window, plus a breakdown of top pages and traffic sources.
Demo data only — generated deterministically in `lib/dashboardAnalytics`.
*/

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { ArrowDownRight, ArrowUpRight, ExternalLink } from "lucide-react";
import {
  TRAFFIC_SOURCES,
  TRAFFIC_TOP_PAGES,
  buildTrafficSeries,
} from "../../lib/dashboardAnalytics";

const RANGES = [
  { id: 7,  label: "7d"  },
  { id: 30, label: "30d" },
  { id: 90, label: "90d" },
];

function compactNumber(value) {
  if (value >= 10_000) return `${(value / 1000).toFixed(1)}k`;
  if (value >= 1_000)  return `${(value / 1000).toFixed(1)}k`;
  return String(value);
}

function TrafficTooltip({ active, label, payload }) {
  if (!active || !payload?.length) return null;
  const bucket = payload[0].payload;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-title">{label}</div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Visitors</span>
        <span className="chart-tooltip-value">{bucket.visitors}</span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Sessions</span>
        <span className="chart-tooltip-value">{bucket.sessions}</span>
      </div>
      <div className="chart-tooltip-row">
        <span className="chart-tooltip-label">Pageviews</span>
        <span className="chart-tooltip-value">{bucket.pageviews}</span>
      </div>
    </div>
  );
}

export default function DashboardTrafficChart() {
  const [days, setDays] = useState(30);
  const { buckets, totals } = useMemo(() => buildTrafficSeries(days), [days]);

  const deltaUp = totals.deltaPct >= 0;

  return (
    <div className="card chart-card traffic-card">
      <div className="chart-card-header">
        <div>
          <div className="map-card-title">Website traffic</div>
          <div className="map-card-subtitle">
            Public-facing pages (landing, report submission, user accounts).
            Demo data while real analytics are wired up.
          </div>
        </div>
        <div className="range-tabs" aria-label="Traffic window">
          {RANGES.map((r) => (
            <button
              key={r.id}
              className={`range-tab ${days === r.id ? "is-active" : ""}`}
              onClick={() => setDays(r.id)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="traffic-stat-row">
        <div className="traffic-stat">
          <div className="traffic-stat-label">Unique visitors</div>
          <div className="traffic-stat-value">{compactNumber(totals.visitors)}</div>
          <div className={`traffic-stat-delta ${deltaUp ? "is-up" : "is-down"}`}>
            {deltaUp
              ? <ArrowUpRight size={12} strokeWidth={2.4} />
              : <ArrowDownRight size={12} strokeWidth={2.4} />}
            {Math.abs(totals.deltaPct)}% vs prior period
          </div>
        </div>
        <div className="traffic-stat">
          <div className="traffic-stat-label">Sessions</div>
          <div className="traffic-stat-value">{compactNumber(totals.sessions)}</div>
          <div className="traffic-stat-sub">
            ~{(totals.sessions / Math.max(totals.visitors, 1)).toFixed(2)} per visitor
          </div>
        </div>
        <div className="traffic-stat">
          <div className="traffic-stat-label">Pageviews</div>
          <div className="traffic-stat-value">{compactNumber(totals.pageviews)}</div>
          <div className="traffic-stat-sub">
            ~{(totals.pageviews / Math.max(totals.sessions, 1)).toFixed(1)} per session
          </div>
        </div>
        <div className="traffic-stat">
          <div className="traffic-stat-label">Avg / day</div>
          <div className="traffic-stat-value">{totals.avgDaily}</div>
          <div className="traffic-stat-sub">
            over the last {days} days
          </div>
        </div>
      </div>

      <div className="traffic-chart-shell">
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={buckets} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
            <defs>
              <linearGradient id="trafficFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%"  stopColor="#5b6cff" stopOpacity={0.32} />
                <stop offset="100%" stopColor="#5b6cff" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(148, 163, 184, 0.18)" vertical={false} />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#7b8190", fontSize: 11 }}
              interval={Math.max(Math.floor(buckets.length / 8) - 1, 0)}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              tick={{ fill: "#7b8190", fontSize: 11 }}
              width={42}
            />
            <Tooltip content={<TrafficTooltip />} cursor={{ stroke: "#5b6cff", strokeOpacity: 0.2 }} />
            <Area
              type="monotone"
              dataKey="visitors"
              stroke="#5b6cff"
              strokeWidth={2}
              fill="url(#trafficFill)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="traffic-split">
        <div className="traffic-split-col">
          <div className="traffic-split-title">Top pages</div>
          <ul className="traffic-list">
            {TRAFFIC_TOP_PAGES.map((page) => (
              <li key={page.path} className="traffic-list-row">
                <div className="traffic-list-main">
                  <span className="traffic-list-label">{page.label}</span>
                  <span className="traffic-list-meta">
                    <ExternalLink size={10} strokeWidth={2.2} />
                    {page.path}
                  </span>
                </div>
                <div className="traffic-list-bar">
                  <div
                    className="traffic-list-bar-fill"
                    style={{ width: `${page.share}%` }}
                  />
                </div>
                <span className="traffic-list-value">{page.share}%</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="traffic-split-col">
          <div className="traffic-split-title">Sources</div>
          <ul className="traffic-list">
            {TRAFFIC_SOURCES.map((src) => (
              <li key={src.key} className="traffic-list-row">
                <div className="traffic-list-main">
                  <span className="traffic-list-label">
                    <span
                      className="traffic-list-dot"
                      style={{ background: src.color }}
                    />
                    {src.label}
                  </span>
                </div>
                <div className="traffic-list-bar">
                  <div
                    className="traffic-list-bar-fill"
                    style={{ width: `${src.share}%`, background: src.color }}
                  />
                </div>
                <span className="traffic-list-value">{src.share}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
