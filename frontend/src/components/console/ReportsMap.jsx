/*
Interactive Mapbox map for the agency console.

Renders reports as a clustered GeoJSON source on a Mapbox tile layer.
Clicking a cluster zooms in; clicking an unclustered point opens a
popup with the report summary and a link to its detail page.

Requires VITE_MAPBOX_TOKEN. Without it, renders a placeholder card
explaining what's missing.
*/

import { useCallback, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Map, { Layer, Popup, Source } from "react-map-gl/mapbox";
import { ExternalLink, MapPinned, Locate } from "lucide-react";
import { CATEGORY_COLORS } from "../../data/reports";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

// Arizona-fitting initial view
const DEFAULT_VIEW = {
  longitude: -111.8,
  latitude: 34.2,
  zoom: 5.6,
};

const SOURCE_ID = "reports-src";
const CLUSTER_LAYER = "reports-clusters";
const CLUSTER_COUNT_LAYER = "reports-cluster-count";
const POINT_LAYER = "reports-points";

const CLUSTER_LAYER_STYLE = {
  id: CLUSTER_LAYER,
  type: "circle",
  source: SOURCE_ID,
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
  source: SOURCE_ID,
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
  source: SOURCE_ID,
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": [
      "match",
      ["get", "categorySlug"],
      "people", CATEGORY_COLORS.people,
      "animal", CATEGORY_COLORS.animal,
      "env",    CATEGORY_COLORS.env,
      "vector", CATEGORY_COLORS.vector,
      "#cbd5e1",
    ],
    "circle-radius": 8,
    "circle-stroke-width": 2,
    "circle-stroke-color": "rgba(255, 255, 255, 0.95)",
    "circle-opacity": 0.95,
  },
};

function reportsToGeoJSON(reports) {
  return {
    type: "FeatureCollection",
    features: reports.map((r) => ({
      type: "Feature",
      geometry: { type: "Point", coordinates: [r.longitude, r.latitude] },
      properties: {
        id: r.id,
        category: r.category,
        categorySlug: r.categorySlug,
        summary: r.summary,
        status: r.status,
      },
    })),
  };
}

export default function ReportsMap({
  reports,
  height = 420,
  initialView = DEFAULT_VIEW,
  onSelectReport,
  mapStyle = "mapbox://styles/mapbox/light-v11",
}) {
  const mapRef = useRef(null);
  const [popup, setPopup] = useState(null);

  const geojson = useMemo(() => reportsToGeoJSON(reports), [reports]);

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
      const src = map.getSource(SOURCE_ID);
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
        longitude: lng,
        latitude: lat,
        properties: feature.properties,
      });
      onSelectReport?.(feature.properties.id);
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
        interactiveLayerIds={[CLUSTER_LAYER, POINT_LAYER]}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={{ width: "100%", height: "100%" }}
      >
        <Source
          id={SOURCE_ID}
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

        {popup && (
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
            <div className="reports-popup-meta">{popup.properties.id}</div>
            <Link
              to={`/agency/reports/${popup.properties.id}`}
              className="reports-popup-link"
            >
              View detail
              <ExternalLink size={12} strokeWidth={2} />
            </Link>
          </Popup>
        )}
      </Map>
    </div>
  );
}
