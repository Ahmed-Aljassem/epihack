/*
Interactive Mapbox map for the agency console.

Renders reports as clustered points, a density heatmap, or both.
Optional heat-relief resource markers can be overlaid separately.
Clicking a cluster zooms in; clicking a point or resource opens a
popup with more detail.

Requires VITE_MAPBOX_TOKEN. Without it, renders a placeholder card
explaining what's missing.
*/

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Map, {
  Layer,
  NavigationControl,
  Popup,
  ScaleControl,
  Source,
} from "react-map-gl/mapbox";
import { ExternalLink, MapPinned, Locate } from "lucide-react";
import { CATEGORY_COLORS } from "../../data/reports";
import { RESOURCE_GROUPS } from "../../data/heatReliefResources";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Arizona-fitting initial view
const DEFAULT_VIEW = {
  longitude: -111.8,
  latitude: 34.2,
  zoom: 5.6,
};

const EARTH_MI = 3958.8;
const DEG = Math.PI / 180;
const HEAT_RADIUS_MI = 120;

const CLUSTERED_SOURCE_ID = "reports-src";
const HEATMAP_SOURCE_ID = "reports-heat-src";
const CLUSTER_LAYER = "reports-clusters";
const CLUSTER_COUNT_LAYER = "reports-cluster-count";
const POINT_LAYER = "reports-points";
const HEATMAP_LAYER = "reports-heatmap";
const RESOURCE_SOURCE_ID = "resources-src";
const RESOURCE_CLUSTER_LAYER = "resources-clusters";
const RESOURCE_CLUSTER_COUNT_LAYER = "resources-cluster-count";
const RESOURCE_POINT_LAYER = "resources-points";
const RESOURCE_POINT_LABEL_LAYER = "resources-point-labels";

const CLUSTER_LAYER_STYLE = {
  id: CLUSTER_LAYER,
  type: "circle",
  source: CLUSTERED_SOURCE_ID,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#2f6f5a", // 1-9
      10, "#245544", // 10-24
      25, "#1e4f60", // 25+
    ],
    "circle-radius": [
      "step",
      ["get", "point_count"],
      18,
      10, 22,
      25, 28,
    ],
    "circle-stroke-width": 3,
    "circle-stroke-color": "rgba(255, 255, 255, 0.9)",
    "circle-opacity": 0.92,
  },
};

const CLUSTER_COUNT_LAYER_STYLE = {
  id: CLUSTER_COUNT_LAYER,
  type: "symbol",
  source: CLUSTERED_SOURCE_ID,
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 13,
  },
  paint: {
    "text-color": "#ffffff",
  },
};

const POINT_LAYER_STYLE = {
  id: POINT_LAYER,
  type: "circle",
  source: CLUSTERED_SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": [
      "match",
      ["get", "categorySlug"],
      "people", CATEGORY_COLORS.people,
      "animal", CATEGORY_COLORS.animal,
      "env",    CATEGORY_COLORS.env,
      "#cbd5e1",
    ],
    "circle-radius": 8,
    "circle-stroke-width": 2,
    "circle-stroke-color": "rgba(255, 255, 255, 0.95)",
    "circle-opacity": 0.95,
  },
};

const RESOURCE_CLUSTER_LAYER_STYLE = {
  id: RESOURCE_CLUSTER_LAYER,
  type: "circle",
  source: RESOURCE_SOURCE_ID,
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "rgba(15, 23, 42, 0.86)",
      8, "rgba(30, 41, 59, 0.9)",
      20, "rgba(51, 65, 85, 0.94)",
    ],
    "circle-radius": [
      "step",
      ["get", "point_count"],
      15,
      8, 19,
      20, 24,
    ],
    "circle-stroke-width": 2,
    "circle-stroke-color": "rgba(255, 255, 255, 0.94)",
  },
};

const RESOURCE_CLUSTER_COUNT_LAYER_STYLE = {
  id: RESOURCE_CLUSTER_COUNT_LAYER,
  type: "symbol",
  source: RESOURCE_SOURCE_ID,
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 12,
  },
  paint: {
    "text-color": "#ffffff",
  },
};

const RESOURCE_POINT_LAYER_STYLE = {
  id: RESOURCE_POINT_LAYER,
  type: "circle",
  source: RESOURCE_SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": [
      "match",
      ["get", "group"],
      "coolingCenters", RESOURCE_GROUPS.coolingCenters.color,
      "hydrationStations", RESOURCE_GROUPS.hydrationStations.color,
      "respiteCenters", RESOURCE_GROUPS.respiteCenters.color,
      "#475569",
    ],
    "circle-radius": [
      "interpolate",
      ["linear"],
      ["zoom"],
      5, 6,
      9, 8,
      12, 10,
    ],
    "circle-stroke-width": 2,
    "circle-stroke-color": "rgba(255, 255, 255, 0.96)",
    "circle-opacity": 0.92,
  },
};

const RESOURCE_POINT_LABEL_LAYER_STYLE = {
  id: RESOURCE_POINT_LABEL_LAYER,
  type: "symbol",
  source: RESOURCE_SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  layout: {
    "text-field": ["get", "markerLabel"],
    "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
    "text-size": 9,
  },
  paint: {
    "text-color": "#ffffff",
  },
};

function interactiveLayersForMode(viewMode, showResources) {
  const layers = viewMode === "heatmap" ? [] : [CLUSTER_LAYER, POINT_LAYER];
  if (showResources) {
    layers.push(RESOURCE_CLUSTER_LAYER, RESOURCE_POINT_LAYER);
  }
  return layers;
}

function haversineMi(a, b) {
  const dLat = (b.latitude - a.latitude) * DEG;
  const dLng = (b.longitude - a.longitude) * DEG;
  const lat1 = a.latitude * DEG;
  const lat2 = b.latitude * DEG;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return 2 * EARTH_MI * Math.asin(Math.min(1, Math.sqrt(h)));
}

function densityContribution(distanceMi) {
  if (distanceMi > HEAT_RADIUS_MI) return 0;
  const normalized = 1 - distanceMi / HEAT_RADIUS_MI;
  return 0.12 + normalized ** 2 * 0.88;
}

function buildHeatScore(report, reports) {
  return reports.reduce((score, candidate) => {
    return score + densityContribution(haversineMi(report, candidate));
  }, 0);
}

function buildHeatmapLayerStyle(showPointLayers) {
  return {
    id: HEATMAP_LAYER,
    type: "heatmap",
    source: HEATMAP_SOURCE_ID,
    maxzoom: 12,
    paint: {
      // Weight by nearby report concentration so statewide scatter
      // doesn't read like a uniform haze.
      "heatmap-weight": [
        "interpolate",
        ["linear"],
        ["get", "heatScore"],
        1, 0.03,
        4, 0.16,
        8, 0.48,
        12, 0.82,
        16, 1,
      ],
      "heatmap-intensity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        4, 0.85,
        7, 1.05,
        10, 1.25,
        12, 1.35,
      ],
      "heatmap-color": [
        "interpolate",
        ["linear"],
        ["heatmap-density"],
        0, "rgba(255, 237, 160, 0)",
        0.12, "rgba(254, 217, 118, 0.18)",
        0.28, "rgba(253, 174, 97, 0.42)",
        0.48, "rgba(244, 109, 67, 0.62)",
        0.68, "rgba(215, 48, 39, 0.78)",
        0.85, "rgba(165, 15, 21, 0.9)",
        1, "rgba(103, 0, 13, 0.96)",
      ],
      "heatmap-radius": [
        "interpolate",
        ["linear"],
        ["zoom"],
        4, 20,
        7, 30,
        10, 42,
        12, 54,
      ],
      "heatmap-opacity": [
        "interpolate",
        ["linear"],
        ["zoom"],
        4, showPointLayers ? 0.42 : 0.68,
        8, showPointLayers ? 0.5 : 0.78,
        12, showPointLayers ? 0.34 : 0.55,
      ],
    },
  };
}

function reportsToGeoJSON(reports) {
  return {
    type: "FeatureCollection",
    features: reports.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
      properties: {
        id: r.id,
        zip: r.location?.zip || r.zip || "",
        coords: r.location?.coords || "",
        category: r.category,
        categorySlug: r.categorySlug,
        sourceType: r.sourceType,
        sourceTypeLabel: r.sourceTypeLabel || "",
        summary: r.summary,
        status: r.status,
        heatScore: Number(buildHeatScore(r, reports).toFixed(2)),
      },
    })),
  };
}

function resourcesToGeoJSON(resourceMarkers) {
  return {
    type: "FeatureCollection",
    features: resourceMarkers.map((resource, index) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [resource.lng, resource.lat] },
      properties: {
        id: `${resource.group}-${resource.name}-${index}`,
        group: resource.group,
        groupLabel: RESOURCE_GROUPS[resource.group]?.label || "Resource",
        markerLabel: RESOURCE_GROUPS[resource.group]?.markerLabel || "R",
        name: resource.name,
        address: resource.address || "",
        city: resource.city || "",
        hours: resource.hours || "",
        org: resource.org || "",
        county: resource.county || "",
      },
    })),
  };
}

export default function ReportsMap({
  reports,
  resourceMarkers = [],
  showReports = true,
  showResources = true,
  height = 420,
  initialView = DEFAULT_VIEW,
  onSelectReport,
  mapStyle = "mapbox://styles/mapbox/light-v11",
  viewMode = "points",
  showReportLink = true,
}) {
  const mapRef = useRef(null);
  const [popup, setPopup] = useState(null);

  const geojson = useMemo(() => reportsToGeoJSON(reports), [reports]);
  const resourceGeojson = useMemo(
    () => resourcesToGeoJSON(resourceMarkers),
    [resourceMarkers],
  );
  const showHeatmap = showReports && (viewMode === "heatmap" || viewMode === "both");
  const showPointLayers = showReports && (viewMode === "points" || viewMode === "both");
  const heatmapLayerStyle = useMemo(
    () => buildHeatmapLayerStyle(showPointLayers),
    [showPointLayers],
  );
  const interactiveLayerIds = useMemo(
    () => interactiveLayersForMode(showReports ? viewMode : "heatmap", showResources),
    [showReports, showResources, viewMode],
  );

  useEffect(() => {
    if (!showPointLayers && popup?.kind === "report") {
      setPopup(null);
    }
  }, [popup?.kind, showPointLayers]);

  useEffect(() => {
    if (!showResources && popup?.kind === "resource") {
      setPopup(null);
    }
  }, [popup?.kind, showResources]);

  // Click handler: zoom into clusters, open popup for points.
  const onClick = useCallback((event) => {
    const feature = event.features?.[0];
    if (!feature) {
      setPopup(null);
      return;
    }
    const map = mapRef.current?.getMap();
    if (!map) return;

    if (feature.layer.id === CLUSTER_LAYER) {
      const clusterId = feature.properties.cluster_id;
      const src = map.getSource(CLUSTERED_SOURCE_ID);
      src.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({
          center: feature.geometry.coordinates,
          zoom,
          duration: 600,
        });
      });
      return;
    }

    if (feature.layer.id === POINT_LAYER) {
      const [lng, lat] = feature.geometry.coordinates;
      setPopup({
        kind: "report",
        longitude: lng,
        latitude: lat,
        properties: feature.properties,
      });
      onSelectReport?.(feature.properties.id);
      return;
    }

    if (feature.layer.id === RESOURCE_CLUSTER_LAYER) {
      const clusterId = feature.properties.cluster_id;
      const src = map.getSource(RESOURCE_SOURCE_ID);
      src.getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;
        map.easeTo({
          center: feature.geometry.coordinates,
          zoom,
          duration: 600,
        });
      });
      return;
    }

    if (feature.layer.id === RESOURCE_POINT_LAYER) {
      const [lng, lat] = feature.geometry.coordinates;
      setPopup({
        kind: "resource",
        longitude: lng,
        latitude: lat,
        resource: {
          ...feature.properties,
          color: RESOURCE_GROUPS[feature.properties.group]?.color,
        },
      });
    }
  }, [onSelectReport]);

  const onMouseEnter = useCallback((event) => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    if (event.features?.length) map.getCanvas().style.cursor = "pointer";
  }, []);

  const onMouseLeave = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.getCanvas().style.cursor = "";
  }, []);

  const recenter = useCallback(() => {
    const map = mapRef.current?.getMap();
    if (!map) return;
    map.easeTo({
      center: [initialView.longitude, initialView.latitude],
      zoom: initialView.zoom,
      duration: 600,
    });
  }, [initialView]);

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className="map-placeholder"
        style={{ height }}
      >
        <MapPinned size={28} strokeWidth={1.6} />
        <div className="map-placeholder-title">Add a Mapbox token to enable the map</div>
        <div className="map-placeholder-copy">
          Set <code>VITE_MAPBOX_TOKEN</code> in <code>frontend/.env</code> and restart the dev server.
        </div>
      </div>
    );
  }

  return (
    <div className="reports-map" style={{ height }}>
      <button
        type="button"
        className="map-recenter"
        onClick={recenter}
        title="Recenter on Arizona"
        aria-label="Recenter on Arizona"
      >
        <Locate size={14} strokeWidth={2.2} />
      </button>
      <Map
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={initialView}
        mapStyle={mapStyle}
        interactiveLayerIds={interactiveLayerIds}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ width: "100%", height: "100%" }}
      >
        <NavigationControl position="top-left" showCompass={false} />
        <ScaleControl position="bottom-left" unit="imperial" />
        {showHeatmap && (
          <Source
            id={HEATMAP_SOURCE_ID}
            type="geojson"
            data={geojson}
          >
            <Layer {...heatmapLayerStyle} />
          </Source>
        )}

        {showPointLayers && (
          <Source
            id={CLUSTERED_SOURCE_ID}
            type="geojson"
            data={geojson}
            cluster
            clusterRadius={50}
            clusterMaxZoom={12}
          >
            <Layer {...CLUSTER_LAYER_STYLE} />
            <Layer {...CLUSTER_COUNT_LAYER_STYLE} />
            <Layer {...POINT_LAYER_STYLE} />
          </Source>
        )}

        {showResources && (
          <Source
            id={RESOURCE_SOURCE_ID}
            type="geojson"
            data={resourceGeojson}
            cluster
            clusterRadius={42}
            clusterMaxZoom={12}
          >
            <Layer {...RESOURCE_CLUSTER_LAYER_STYLE} />
            <Layer {...RESOURCE_CLUSTER_COUNT_LAYER_STYLE} />
            <Layer {...RESOURCE_POINT_LAYER_STYLE} />
            <Layer {...RESOURCE_POINT_LABEL_LAYER_STYLE} />
          </Source>
        )}

        {popup?.kind === "report" && (
          <Popup
            longitude={popup.longitude}
            latitude={popup.latitude}
            anchor="bottom"
            offset={14}
            closeButton
            closeOnClick={false}
            onClose={() => setPopup(null)}
            className="reports-popup"
          >
            <div className="reports-popup-head">
              <span className={`badge badge-${popup.properties.categorySlug}`}>
                {popup.properties.category}
              </span>
              <span className={`queue-status ${popup.properties.status === "New" ? "queue-status--new" : ""}`}>
                {popup.properties.status}
              </span>
            </div>
            <div className="reports-popup-title">{popup.properties.summary}</div>
            <div className="reports-popup-meta">
              {popup.properties.id}
              {popup.properties.zip ? ` · ZIP ${popup.properties.zip}` : ""}
              {popup.properties.coords ? ` · ${popup.properties.coords}` : ""}
              {popup.properties.sourceType === "vector" ? ` · ${popup.properties.sourceTypeLabel}` : ""}
            </div>
            {showReportLink && (
              <Link
                to={`/agency/reports/${popup.properties.id}`}
                className="reports-popup-link"
              >
                View detail
                <ExternalLink size={12} strokeWidth={2} />
              </Link>
            )}
          </Popup>
        )}

        {popup?.kind === "resource" && (
          <Popup
            longitude={popup.longitude}
            latitude={popup.latitude}
            anchor="bottom"
            offset={18}
            closeButton
            closeOnClick={false}
            onClose={() => setPopup(null)}
            className="reports-popup resources-popup"
          >
            <div className="reports-popup-head">
              <span
                className="resource-popup-badge"
                style={{
                  "--resource-color": popup.resource.color,
                }}
              >
                {popup.resource.groupLabel}
              </span>
            </div>
            <div className="reports-popup-title">{popup.resource.name}</div>
            <div className="resource-popup-details">
              {popup.resource.county && (
                <div>{popup.resource.county} County</div>
              )}
              {popup.resource.address && (
                <div>{popup.resource.address}</div>
              )}
              {popup.resource.city && (
                <div>{popup.resource.city}</div>
              )}
              {popup.resource.hours && (
                <div>Hours: {popup.resource.hours}</div>
              )}
              {popup.resource.org && (
                <div>Org: {popup.resource.org}</div>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
