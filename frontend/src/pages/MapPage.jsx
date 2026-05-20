import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { Download, Layers3, MapPin, Search, ZoomIn } from "lucide-react";
import "mapbox-gl/dist/mapbox-gl.css";
import reportPoints from "../data/reports.json";

const FILTERS = [
  { id: "all", label: "All categories" },
  { id: "people", label: "People" },
  { id: "animal", label: "Animal" },
  { id: "env", label: "Environment" },
  { id: "vector", label: "Vector" },
];

const PRECISION_LEVELS = [
  { id: "coarse", label: "Coarse", radius: 84, maxZoom: 8.5 },
  { id: "balanced", label: "Balanced", radius: 58, maxZoom: 10.5 },
  { id: "detailed", label: "Detailed", radius: 34, maxZoom: 12.5 },
];

const TYPE_META = {
  human: { label: "People", color: "#7c3aed" },
  animal: { label: "Animal", color: "#0f766e" },
  environment: { label: "Environment", color: "#15803d" },
  vector: { label: "Vector", color: "#c2410c" },
};

const SOURCE_ID = "report-points";
const CLUSTER_LAYER_ID = "report-clusters";
const CLUSTER_COUNT_LAYER_ID = "report-cluster-count";
const POINT_LAYER_ID = "report-points-unclustered";
const DEFAULT_CENTER = [-111.5, 34.2];
// Arizona bounding box: [west,south],[east,north]
const ARIZONA_BOUNDS = [
  [-114.8165, 31.3322], // SW
  [-109.0452, 37.0043], // NE
];

function getFilterType(filterId) {
  if (filterId === "people") return "human";
  if (filterId === "env") return "environment";
  return filterId === "all" ? null : filterId;
}

function getRegionLabel([lng, lat]) {
  if (lat >= 35) return lng < -112 ? "Northwest basin" : "Northeast highlands";
  if (lat >= 33.5) return lng < -112 ? "West corridor" : "Central corridor";
  if (lat >= 32)
    return lng < -112 ? "Southwest corridor" : "Southeast corridor";
  return "Southern border";
}

function getDominantType(clusterCounts) {
  return (
    Object.entries(TYPE_META)
      .map(([type, meta]) => ({
        type,
        label: meta.label,
        color: meta.color,
        count: Number(clusterCounts[type] || 0),
      }))
      .sort((left, right) => right.count - left.count)[0] || {
      type: "human",
      label: TYPE_META.human.label,
      color: TYPE_META.human.color,
      count: 0,
    }
  );
}

function toGeoJson(points) {
  return {
    type: "FeatureCollection",
    features: points.map((point) => ({
      type: "Feature",
      properties: {
        id: point.id,
        type: point.type,
        typeLabel: TYPE_META[point.type]?.label || point.type,
      },
      geometry: {
        type: "Point",
        coordinates: [point.longitude, point.latitude],
      },
    })),
  };
}

export default function MapPage() {
  const [filter, setFilter] = useState("all");
  const [precision, setPrecision] = useState("balanced");
  const [search, setSearch] = useState("");
  const [clusterSummaries, setClusterSummaries] = useState([]);
  const [viewportStats, setViewportStats] = useState({
    clusters: 0,
    points: 0,
    zoom: 0,
  });
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const popupRef = useRef(null);

  const activePrecision =
    PRECISION_LEVELS.find((preset) => preset.id === precision) ||
    PRECISION_LEVELS[1];
  const activeType = getFilterType(filter);
  const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN;

  const filteredPoints = useMemo(() => {
    const query = search.trim().toLowerCase();

    return reportPoints.filter((point) => {
      const matchesFilter = !activeType || point.type === activeType;
      const matchesQuery =
        !query ||
        `${point.id} ${point.type} ${point.latitude} ${point.longitude}`
          .toLowerCase()
          .includes(query);

      return matchesFilter && matchesQuery;
    });
  }, [activeType, search]);

  const geojson = useMemo(() => toGeoJson(filteredPoints), [filteredPoints]);

  const datasetCounts = useMemo(() => {
    return filteredPoints.reduce(
      (accumulator, point) => {
        accumulator.total += 1;
        accumulator[point.type] = (accumulator[point.type] || 0) + 1;
        return accumulator;
      },
      { total: 0, human: 0, animal: 0, environment: 0, vector: 0 },
    );
  }, [filteredPoints]);

  const refreshViewportStats = () => {
    const map = mapRef.current;

    if (
      !map ||
      !map.getLayer(CLUSTER_LAYER_ID) ||
      !map.getLayer(POINT_LAYER_ID)
    ) {
      return;
    }

    const clusterFeatures = map.queryRenderedFeatures({
      layers: [CLUSTER_LAYER_ID],
    });
    const pointFeatures = map.queryRenderedFeatures({
      layers: [POINT_LAYER_ID],
    });
    const uniqueClusters = new Map();

    clusterFeatures.forEach((feature) => {
      const clusterId = feature.properties?.cluster_id;
      if (clusterId != null && !uniqueClusters.has(clusterId)) {
        uniqueClusters.set(clusterId, {
          clusterId,
          count: Number(feature.properties?.point_count || 0),
          center: feature.geometry?.coordinates || DEFAULT_CENTER,
          counts: {
            human: Number(feature.properties?.human || 0),
            animal: Number(feature.properties?.animal || 0),
            environment: Number(feature.properties?.environment || 0),
            vector: Number(feature.properties?.vector || 0),
          },
        });
      }
    });

    setClusterSummaries(
      Array.from(uniqueClusters.values())
        .map((cluster) => ({
          ...cluster,
          label: getRegionLabel(cluster.center),
          dominant: getDominantType(cluster.counts),
        }))
        .sort((left, right) => right.count - left.count)
        .slice(0, 4),
    );

    setViewportStats({
      clusters: uniqueClusters.size,
      points: pointFeatures.length,
      zoom: Number(map.getZoom().toFixed(1)),
    });
  };

  useEffect(() => {
    if (!mapboxToken || !mapContainerRef.current) {
      return undefined;
    }

    mapboxgl.accessToken = mapboxToken;

    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/light-v11",
      center: DEFAULT_CENTER,
      zoom: 6.1,
      pitch: 18,
      bearing: -10,
      cooperativeGestures: true,
    });

    map.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      "top-right",
    );

    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: geojson,
        cluster: true,
        clusterRadius: activePrecision.radius,
        clusterMaxZoom: activePrecision.maxZoom,
        clusterProperties: {
          human: ["+", ["case", ["==", ["get", "type"], "human"], 1, 0]],
          animal: ["+", ["case", ["==", ["get", "type"], "animal"], 1, 0]],
          environment: [
            "+",
            ["case", ["==", ["get", "type"], "environment"], 1, 0],
          ],
          vector: ["+", ["case", ["==", ["get", "type"], "vector"], 1, 0]],
        },
      });

      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#c7d2fe",
            10,
            "#86efac",
            24,
            "#fbbf24",
            50,
            "#fb7185",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            10,
            24,
            24,
            30,
            50,
            36,
          ],
          "circle-opacity": 0.88,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });

      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 13,
        },
        paint: {
          "text-color": "#0f172a",
        },
      });

      map.addLayer({
        id: POINT_LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": [
            "match",
            ["get", "type"],
            "human",
            TYPE_META.human.color,
            "animal",
            TYPE_META.animal.color,
            "environment",
            TYPE_META.environment.color,
            "vector",
            TYPE_META.vector.color,
            "#0f766e",
          ],
          "circle-radius": 6,
          "circle-stroke-width": 1.5,
          "circle-stroke-color": "#ffffff",
          "circle-opacity": 0.9,
        },
      });

      // ensure initial view shows Arizona state bounds
      try {
        map.fitBounds(ARIZONA_BOUNDS, { padding: 40, maxZoom: 7, duration: 0 });
      } catch (err) {
        // fallback to default center if fitBounds fails
        map.setCenter(DEFAULT_CENTER);
        map.setZoom(6.1);
      }

      map.on("mouseenter", CLUSTER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", CLUSTER_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("mouseenter", POINT_LAYER_ID, () => {
        map.getCanvas().style.cursor = "pointer";
      });

      map.on("mouseleave", POINT_LAYER_ID, () => {
        map.getCanvas().style.cursor = "";
      });

      map.on("click", CLUSTER_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        const clusterId = feature?.properties?.cluster_id;
        const source = map.getSource(SOURCE_ID);

        if (
          !clusterId ||
          !source ||
          typeof source.getClusterExpansionZoom !== "function"
        ) {
          return;
        }

        source.getClusterExpansionZoom(clusterId, (error, zoom) => {
          if (error) return;

          map.easeTo({
            center: feature.geometry.coordinates,
            zoom: Math.min(zoom + 0.35, 14),
            duration: 700,
          });
        });
      });

      map.on("click", POINT_LAYER_ID, (event) => {
        const feature = event.features?.[0];
        if (!feature?.geometry?.coordinates) return;

        popupRef.current?.remove();
        popupRef.current = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: true,
          offset: 14,
        })
          .setLngLat(feature.geometry.coordinates)
          .setHTML(
            `<div style="font: 13px/1.4 -apple-system,BlinkMacSystemFont,\"SF Pro Text\",sans-serif; color:#111827;">
              <div style="font-weight:600; margin-bottom:4px;">Report ${feature.properties?.id}</div>
              <div style="color:#4b5563; text-transform:capitalize;">${feature.properties?.typeLabel || feature.properties?.type}</div>
            </div>`,
          )
          .addTo(map);
      });

      map.on("moveend", refreshViewportStats);
      map.on("zoomend", refreshViewportStats);
      refreshViewportStats();
    });

    mapRef.current = map;

    return () => {
      popupRef.current?.remove();
      map.remove();
      mapRef.current = null;
    };
  }, [activePrecision.maxZoom, activePrecision.radius, mapboxToken]);

  useEffect(() => {
    const map = mapRef.current;
    const source = map?.getSource(SOURCE_ID);

    if (source && typeof source.setData === "function") {
      source.setData(geojson);
      refreshViewportStats();
    }
  }, [geojson]);

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(geojson, null, 2)], {
      type: "application/geo+json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "reports-map.geojson";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div className="console-header">
        <div>
          <h1 className="console-title">Map</h1>
          <p className="console-subtitle">
            Interactive Mapbox clusters for geo-coded report points across the
            service area
          </p>
        </div>
        <div className="console-actions">
          <div className="search-wrap">
            <Search size={14} />
            <input
              type="text"
              className="search-input"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search IDs, types, or coordinates…"
            />
          </div>
          <button className="btn btn-ghost" onClick={handleExport}>
            <Download size={14} />
            Export
          </button>
        </div>
      </div>

      <div className="filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            className={`filter-chip ${filter === f.id ? "is-active" : ""}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
        <span className="filter-bar-spacer" />
        <div className="range-tabs">
          {PRECISION_LEVELS.map((level) => (
            <button
              key={level.id}
              className={`range-tab ${precision === level.id ? "is-active" : ""}`}
              onClick={() => setPrecision(level.id)}
            >
              {level.label}
            </button>
          ))}
        </div>
      </div>

      <div className="map-metrics-row">
        <div className="stat-card map-metric-card">
          <div className="stat-label">Filtered points</div>
          <div className="stat-value">{datasetCounts.total}</div>
          <div className="stat-delta">
            {activePrecision.label.toLowerCase()} precision
          </div>
        </div>
        <div className="stat-card map-metric-card">
          <div className="stat-label">Visible clusters</div>
          <div className="stat-value">{viewportStats.clusters}</div>
          <div className="stat-delta">Zoom {viewportStats.zoom || "—"}</div>
        </div>
        <div className="stat-card map-metric-card">
          <div className="stat-label">Visible points</div>
          <div className="stat-value">{viewportStats.points}</div>
          <div className="stat-delta">
            Mapbox renders cluster leaves at this zoom
          </div>
        </div>
      </div>

      <div className="console-grid-2 map-grid">
        <div className="card map-card map-panel">
          <div className="map-card-header">
            <div>
              <div className="map-card-title">Clustered report map</div>
              <div className="map-card-subtitle">
                Clusters collapse as you zoom out and expand into point-level
                detail when you zoom in.
              </div>
            </div>
            <div className="map-header-badge">
              <Layers3 size={14} />
              Approximate precision
            </div>
          </div>

          <div className="mapbox-stage">
            {mapboxToken ? (
              <div ref={mapContainerRef} className="mapbox-canvas" />
            ) : (
              <div className="mapbox-fallback">
                <MapPin size={20} />
                <div>
                  <div className="mapbox-fallback-title">
                    Mapbox token missing
                  </div>
                  <p>
                    Set <strong>VITE_MAPBOX_TOKEN</strong> in{" "}
                    <code>frontend/.env</code> to enable the live map.
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="map-legend">
            {Object.entries(TYPE_META).map(([type, meta]) => (
              <span key={type} className="map-legend-item">
                <span
                  className="map-legend-dot"
                  style={{ background: meta.color }}
                />
                {meta.label} · {datasetCounts[type] || 0}
              </span>
            ))}
          </div>
        </div>

        <div className="card queue-card map-panel">
          <div className="queue-header">
            <div>
              <div className="map-card-title">Visible regions</div>
              <div className="map-card-subtitle">
                Clustered by the current zoom level and filtered dataset.
              </div>
            </div>
            <span className="preview-meta">
              {clusterSummaries.length} regions
            </span>
          </div>

          <div className="cluster-list">
            {clusterSummaries.length ? (
              clusterSummaries.map((cluster) => (
                <button
                  key={cluster.clusterId}
                  type="button"
                  className="cluster-card"
                  onClick={() => {
                    const map = mapRef.current;
                    const source = map?.getSource(SOURCE_ID);

                    if (
                      !map ||
                      !source ||
                      typeof source.getClusterExpansionZoom !== "function"
                    ) {
                      return;
                    }

                    source.getClusterExpansionZoom(
                      cluster.clusterId,
                      (error, zoom) => {
                        if (error) return;

                        map.easeTo({
                          center: cluster.center,
                          zoom: Math.min(zoom + 0.35, 14),
                          duration: 700,
                        });
                      },
                    );
                  }}
                >
                  <div className="cluster-card-head">
                    <div>
                      <div className="cluster-region">{cluster.label}</div>
                      <div className="cluster-meta">
                        Cluster #{cluster.clusterId} · {cluster.count} points
                      </div>
                    </div>
                    <div className="cluster-count">{cluster.count}</div>
                  </div>

                  <div className="cluster-tags">
                    <span className="cluster-tag cluster-tag--dominant">
                      <span
                        className="cluster-tag-swatch"
                        style={{ background: cluster.dominant.color }}
                      />
                      {cluster.dominant.label} · {cluster.dominant.count}
                    </span>
                    {Object.entries(cluster.counts).map(([type, count]) => (
                      <span key={type} className="cluster-tag">
                        <span
                          className="cluster-tag-swatch"
                          style={{ background: TYPE_META[type].color }}
                        />
                        {TYPE_META[type].label} · {count}
                      </span>
                    ))}
                  </div>
                </button>
              ))
            ) : (
              <div className="cluster-empty">
                <ZoomIn size={18} />
                <div>
                  <div className="cluster-empty-title">No clusters in view</div>
                  <p>
                    Pan or zoom the map, or relax the filters to surface more
                    regions.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
