/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Render a public-facing Arizona situation panel that combines
report map layers, resource overlays, and useful weather context.
*/

import { useMemo, useState } from "react";
import {
  CloudSun,
  Droplets,
  Flame,
  ThermometerSun,
  Wind,
} from "lucide-react";
import ReportsMap from "../console/ReportsMap";
import { CATEGORY_COLORS, REPORTS } from "../../data/reports";
import {
  RESOURCE_GROUPS,
  RESOURCE_GROUP_ORDER,
} from "../../data/heatReliefResources";
import { useHeatReliefResources } from "../../hooks/useHeatReliefResources";
import { useArizonaWeather } from "../../hooks/useArizonaWeather";
import { countReportsByCategory } from "../../lib/reportFilters";

const RANGE_OPTIONS = ["7d", "30d", "All"];
const LAYER_OPTIONS = [
  { id: "reports", label: "Reports" },
  { id: "both", label: "Combined" },
  { id: "resources", label: "Resources" },
];
const VIEW_OPTIONS = [
  { id: "points", label: "Points" },
  { id: "heatmap", label: "Heatmap" },
  { id: "choropleth", label: "By ZIP" },
];

export default function PublicSituationSection() {
  const [range, setRange] = useState("7d");
  const [layerMode, setLayerMode] = useState("reports");
  const [viewMode, setViewMode] = useState("points");
  const {
    markers: resourceMarkers,
    totalEnabledCount: totalResourceCount,
  } = useHeatReliefResources(RESOURCE_GROUP_ORDER);
  const weather = useArizonaWeather();

  const mapReports = useMemo(() => {
    return filterReportsByRange(REPORTS, range);
  }, [range]);
  const reportCounts = useMemo(() => {
    return countReportsByCategory(mapReports);
  }, [mapReports]);
  const resourceCounts = useMemo(() => {
    return resourceMarkers.reduce((acc, marker) => {
      acc[marker.group] = (acc[marker.group] || 0) + 1;
      return acc;
    }, {});
  }, [resourceMarkers]);

  const showReports = layerMode !== "resources";
  const showResources = layerMode !== "reports";

  return (
    <section id="situation" className="landing-situation">
      <div className="landing-section-eyebrow">Live statewide view</div>
      <div className="landing-situation-head">
        <div>
          <h2 className="landing-section-title landing-situation-title">
            Public signals and response resources across Arizona.
          </h2>
          <p className="landing-situation-copy">
            Explore recent report patterns with optional heat-relief resources,
            plus weather context that helps interpret potential heat stress.
          </p>
        </div>
        <div className="landing-situation-summary">
          <span className="badge badge-accent">{mapReports.length} reports</span>
          <span className="badge">{totalResourceCount} resource sites</span>
        </div>
      </div>

      <div className="landing-situation-map-card">
        <div className="landing-situation-controls">
          <div className="range-tabs" aria-label="Public map range">
            {RANGE_OPTIONS.map((option) => (
              <button
                key={option}
                type="button"
                className={`range-tab ${range === option ? "is-active" : ""}`}
                onClick={() => setRange(option)}
              >
                {option}
              </button>
            ))}
          </div>
          <div className="range-tabs" aria-label="Public map layer mode">
            {LAYER_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`range-tab ${layerMode === option.id ? "is-active" : ""}`}
                onClick={() => setLayerMode(option.id)}
              >
                {option.label}
              </button>
            ))}
          </div>
          {showReports && (
            <div className="range-tabs" aria-label="Public map render mode">
              {VIEW_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  className={`range-tab ${viewMode === option.id ? "is-active" : ""}`}
                  onClick={() => setViewMode(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <ReportsMap
          reports={mapReports}
          resourceMarkers={resourceMarkers}
          showReports={showReports}
          showResources={showResources}
          viewMode={viewMode}
          height={440}
          showReportLink={false}
          mapStyle="mapbox://styles/mapbox/light-v11"
        />

        <div className="landing-situation-note">
          {layerMode === "resources"
            ? "Resource mode highlights cooling, hydration, and respite sites without report overlays."
            : viewMode === "choropleth"
              ? "ZIP view shades each ZIP code area by how many reports fall within it."
              : layerMode === "both"
                ? "Combined mode overlays report signals with nearby support resources."
                : "Report mode focuses on surveillance points and density trends."}
        </div>

        <div className="landing-situation-legend">
          {viewMode === "choropleth" ? (
            <>
              {[
                { label: "0", color: "rgba(209, 233, 222, 0.5)" },
                { label: "1–2", color: "#b2dfdb" },
                { label: "3–4", color: "#4db6ac" },
                { label: "5–9", color: "#26a69a" },
                { label: "10–19", color: "#00897b" },
                { label: "20+", color: "#00695c" },
              ].map((step) => (
                <span key={step.label} className="landing-situation-legend-item">
                  <span className="map-legend-dot" style={{ background: step.color }} />
                  {step.label}
                </span>
              ))}
              <span className="landing-situation-legend-item" style={{ opacity: 0.7 }}>
                reports per ZIP
              </span>
            </>
          ) : (
            <>
              <span className="landing-situation-legend-item">
                <span
                  className="map-legend-dot"
                  style={{ background: CATEGORY_COLORS.people }}
                />
                People · {reportCounts.people}
              </span>
              <span className="landing-situation-legend-item">
                <span
                  className="map-legend-dot"
                  style={{ background: CATEGORY_COLORS.animal }}
                />
                Animal · {reportCounts.animal}
              </span>
              <span className="landing-situation-legend-item">
                <span
                  className="map-legend-dot"
                  style={{ background: CATEGORY_COLORS.env }}
                />
                Environment · {reportCounts.env}
              </span>
            </>
          )}
          {RESOURCE_GROUP_ORDER.map((group) => (
            <span key={group} className="landing-situation-legend-item">
              <span
                className="map-legend-dot"
                style={{ background: RESOURCE_GROUPS[group].color }}
              />
              {RESOURCE_GROUPS[group].label} · {resourceCounts[group] || 0}
            </span>
          ))}
        </div>
      </div>

      <div className="landing-weather-card">
        <div className="landing-weather-header">
          <div className="landing-weather-title">
            <CloudSun size={16} strokeWidth={2.2} />
            Arizona weather watch
          </div>
          <span
            className={`landing-weather-risk landing-weather-risk--${weather.summary.heatRisk.toLowerCase()}`}
          >
            <Flame size={12} strokeWidth={2.2} />
            {weather.summary.heatRisk} heat risk
          </span>
        </div>
        <p className="landing-weather-copy">{weather.summary.guidance}</p>

        <div className="landing-weather-kpis">
          <div className="landing-weather-kpi">
            <ThermometerSun size={14} strokeWidth={2} />
            <span>Statewide avg</span>
            <strong>
              {weather.loading || weather.summary.statewideAvgF == null
                ? "..."
                : `${weather.summary.statewideAvgF}°F`}
            </strong>
          </div>
          <div className="landing-weather-kpi">
            <Flame size={14} strokeWidth={2} />
            <span>Warmest city</span>
            <strong>
              {weather.summary.hottest
                ? `${weather.summary.hottest.label} ${weather.summary.hottest.temperatureF}°F`
                : "—"}
            </strong>
          </div>
          <div className="landing-weather-kpi">
            <Droplets size={14} strokeWidth={2} />
            <span>Peak UV</span>
            <strong>
              {weather.loading || weather.summary.maxUv == null
                ? "..."
                : weather.summary.maxUv}
            </strong>
          </div>
        </div>

        <div className="landing-weather-grid">
          {weather.observations.map((station) => (
            <article key={station.id} className="landing-weather-station">
              <div className="landing-weather-station-head">
                <div className="landing-weather-city">{station.label}</div>
                <div className="landing-weather-county">{station.county} Co.</div>
              </div>
              <div className="landing-weather-main">
                <strong>{station.temperatureF}°F</strong>
                <span>{station.condition}</span>
              </div>
              <div className="landing-weather-meta">
                <span>
                  <ThermometerSun size={12} strokeWidth={2} />
                  Feels {station.feelsLikeF}°
                </span>
                <span>
                  <Wind size={12} strokeWidth={2} />
                  {station.windMph} mph
                </span>
                <span>
                  <Droplets size={12} strokeWidth={2} />
                  {station.humidity}% RH
                </span>
              </div>
              <div className="landing-weather-range">
                H {station.highF}° · L {station.lowF}°
              </div>
            </article>
          ))}
        </div>

        <div className="landing-weather-foot">
          <span>{formatWeatherUpdated(weather.updatedAt)}</span>
          <span>
            {weather.error
              ? "Live weather unavailable · using fallback snapshot"
              : weather.usingFallback
                ? "Fallback demo weather snapshot"
                : "Live weather via Open-Meteo"}
          </span>
        </div>
      </div>
    </section>
  );
}

function filterReportsByRange(reports, range) {
  if (range === "All") return reports;
  const hours = range === "30d" ? 30 * 24 : 7 * 24;
  const cutoff = Date.now() - hours * 60 * 60 * 1000;
  return reports.filter((report) => new Date(report.submittedAt).getTime() >= cutoff);
}

function formatWeatherUpdated(updatedAt) {
  if (!updatedAt) return "Updating weather…";
  if (typeof updatedAt === "string") return updatedAt;
  return `Updated ${updatedAt.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  })}`;
}
