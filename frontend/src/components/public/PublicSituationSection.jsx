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
  Sun,
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
  { id: "both", label: "Both" },
];

export default function PublicSituationSection() {
  const [range, setRange] = useState("7d");
  const [layerMode, setLayerMode] = useState("both");
  const [viewMode, setViewMode] = useState("both");
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
            Public signals and response resources across{" "}
            <span className="state-arizona-word">Arizona</span>.
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
          mapStyle="mapbox://styles/mapbox/streets-v12"
        />

        <div className="landing-situation-note">
          {layerMode === "resources"
            ? "Resource mode highlights cooling, hydration, and respite sites without report overlays."
            : layerMode === "both"
              ? "Combined mode overlays report signals with nearby support resources."
              : "Report mode focuses on surveillance points and density trends."}
        </div>

        <div className="landing-situation-legend">
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

      <div className="landing-weather-strip">
        <span
          className={`landing-weather-risk landing-weather-risk--${weather.summary.heatRisk.toLowerCase()}`}
        >
          <Flame size={12} strokeWidth={2.2} />
          {weather.summary.heatRisk} heat risk
        </span>
        <span className="landing-weather-strip-item">
          <ThermometerSun size={13} strokeWidth={2} />
          Statewide{" "}
          <strong>
            {weather.loading || weather.summary.statewideAvgF == null
              ? "—"
              : `${weather.summary.statewideAvgF}°F`}
          </strong>
        </span>
        {weather.summary.hottest && (
          <span className="landing-weather-strip-item">
            <CloudSun size={13} strokeWidth={2} />
            Hotspot {weather.summary.hottest.label}{" "}
            <strong>{weather.summary.hottest.temperatureF}°F</strong>
          </span>
        )}
        <span className="landing-weather-strip-item">
          <ThermometerSun size={13} strokeWidth={2} />
          Feels like{" "}
          <strong>
            {weather.loading || weather.summary.maxFeelsLikeF == null
              ? "—"
              : `${weather.summary.maxFeelsLikeF}°F`}
          </strong>
        </span>
        <span className="landing-weather-strip-item">
          <Sun size={13} strokeWidth={2} />
          UV{" "}
          <strong>
            {weather.loading || weather.summary.maxUv == null
              ? "—"
              : weather.summary.maxUv}
          </strong>
        </span>
        <span className="landing-weather-strip-item">
          <Droplets size={13} strokeWidth={2} />
          Humidity{" "}
          <strong>
            {weather.loading || weather.summary.avgHumidity == null
              ? "—"
              : `${weather.summary.avgHumidity}%`}
          </strong>
        </span>
        <span className="landing-weather-strip-item">
          <Wind size={13} strokeWidth={2} />
          Wind{" "}
          <strong>
            {weather.loading || weather.summary.maxWindMph == null
              ? "—"
              : `${weather.summary.maxWindMph} mph`}
          </strong>
        </span>
        <span className="landing-weather-strip-item">
          <ThermometerSun size={13} strokeWidth={2} />
          Day range{" "}
          <strong>
            {weather.loading ||
            weather.summary.statewideLowF == null ||
            weather.summary.statewideHighF == null
              ? "—"
              : `${weather.summary.statewideLowF}–${weather.summary.statewideHighF}°F`}
          </strong>
        </span>
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
