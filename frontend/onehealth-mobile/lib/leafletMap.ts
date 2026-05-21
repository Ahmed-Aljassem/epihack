// ─── Leaflet + OpenStreetMap heatmap document ────────────────
// Returns a full HTML page rendered inside react-native-webview.
// React Native ⇄ WebView protocol (messages are JSON strings):
//   RN → Web:  { kind: 'SET_DATA', points: HeatPoint[], markers: MarkerData[] }
//              { kind: 'TOGGLE', layer: ToggleKey, on: boolean }
//              { kind: 'SET_RESOURCES', group: ResourceGroup, points: ResourceMarker[] }
//              { kind: 'TOGGLE_RESOURCE', group: ResourceGroup, on: boolean }
//   Web → RN:  { kind: 'READY' }
// Four colored heat layers (sick/healthy/animal/environment) but THREE
// toggles — the Human toggle drives both human (sick + healthy) layers.
// Resource groups (cooling/hydration/respite) render as separate, toggleable
// pin-marker layers, each styled by RESOURCE_GROUPS color + glyph.
// Leaflet + Leaflet.heat are loaded from the unpkg CDN (needs network).

import type { ReportType } from './reports';
import { RESOURCE_GROUPS } from './resources';

// The 3 panel toggles and the sub-layers each one controls.
export type ToggleKey = ReportType; // 'human' | 'animal' | 'environment'

// Distinct gradient per sub-layer so categories are visually distinguishable.
export const SUB_GRADIENTS = {
  humanSick: { 0.4: '#ffd24d', 0.7: '#ff8c00', 1: '#e02020' }, // red/orange
  humanHealthy: { 0.4: '#d9f7be', 0.7: '#95de64', 1: '#52c41a' }, // green
  animal: { 0.4: '#d3adf7', 0.7: '#9254de', 1: '#7b2ff7' }, // purple
  environment: { 0.4: '#bae0ff', 0.7: '#69b1ff', 1: '#1677ff' }, // blue
} as const;

// Peak color of each sub-gradient — reused by the native legend swatches.
export const SUB_COLOR = {
  humanSick: '#e02020',
  humanHealthy: '#52c41a',
  animal: '#7b2ff7',
  environment: '#1677ff',
} as const;

export function buildMapHTML(): string {
  const gradients = JSON.stringify(SUB_GRADIENTS);
  // group -> { color, glyph } for the in-WebView resource markers.
  const resourceStyle = JSON.stringify(
    Object.fromEntries(
      Object.entries(RESOURCE_GROUPS).map(([k, v]) => [k, { color: v.color, glyph: v.glyph }])
    )
  );

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
  <style>
    html, body, #map { height: 100%; width: 100%; margin: 0; padding: 0; background: #FAFAFA; }
    .leaflet-control-attribution { font-size: 9px; }
    .oh-badge { background: none; border: none; }
    .oh-badge > div {
      width: 34px; height: 34px; border-radius: 17px;
      background: #0B6623; color: #fff; font-weight: 700; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35); border: 2px solid #fff;
      font-family: -apple-system, system-ui, sans-serif;
    }
    .oh-pop { font-family: -apple-system, system-ui, sans-serif; font-size: 12px; line-height: 1.5; }
    .oh-pop b { font-size: 13px; }
    .oh-resource { background: none; border: none; }
    .oh-resource > div {
      width: 30px; height: 30px; border-radius: 15px 15px 15px 2px;
      transform: rotate(-45deg);
      color: #fff; font-size: 15px; line-height: 1;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.4); border: 2px solid #fff;
    }
    .oh-resource > div > span { transform: rotate(45deg); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var GRADIENTS = ${gradients};
    var SUBS = ['humanSick', 'humanHealthy', 'animal', 'environment'];

    // Which sub-layers each panel toggle controls.
    var TOGGLE_LAYERS = {
      human: ['humanSick', 'humanHealthy'],
      animal: ['animal'],
      environment: ['environment']
    };
    // Reverse: which toggle owns a given sub-layer.
    var SUB_TOGGLE = { humanSick: 'human', humanHealthy: 'human', animal: 'animal', environment: 'environment' };

    var enabled = { human: true, animal: true, environment: true };
    var markerData = [];

    // Heat-relief resource groups (cooling/hydration/respite).
    var RESOURCE_STYLE = ${resourceStyle}; // { group: { color, glyph }, ... }
    var resourceLayers = {};  // group -> L.layerGroup (added to map only when enabled)
    var resourceData = {};    // group -> ResourceMarker[]

    var map = L.map('map', { zoomControl: true, attributionControl: true })
      .setView([34.2, -111.6], 6);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // One heat layer per sub-type; all start on the map.
    var layers = {};
    SUBS.forEach(function (sub) {
      layers[sub] = L.heatLayer([], {
        radius: 28,
        blur: 20,
        max: 6,            // ~6 overlapping reports reach peak color (density)
        maxZoom: 12,
        minOpacity: 0.3,
        gradient: GRADIENTS[sub]
      }).addTo(map);
    });

    var markersLayer = L.layerGroup().addTo(map);
    var symptomMarkersLayer = L.layerGroup().addTo(map);
    var symptomFilter = null; // null = show all, or Set of symptom keys
    var allPoints = []; // store full point list for re-rendering on filter change

    function subTypeOf(p) {
      if (p.type === 'human') return p.health === 'healthy' ? 'humanHealthy' : 'humanSick';
      return p.type;
    }

    function setData(points, markers) {
      var buckets = { humanSick: [], humanHealthy: [], animal: [], environment: [] };
      (points || []).forEach(function (p) {
        var sub = subTypeOf(p);
        if (buckets[sub]) buckets[sub].push([p.lat, p.lng, p.weight]);
      });
      SUBS.forEach(function (sub) { layers[sub].setLatLngs(buckets[sub]); });
      markerData = markers || [];
      allPoints = points || [];
      renderSymptomDots();
      renderMarkers();
      var SYMPTOM_COLORS_MAP = {}; // populated from RN via SET_SYMPTOM_FILTER

function renderSymptomDots() {
  symptomMarkersLayer.clearLayers();
  if (!symptomFilter || symptomFilter.length === 0) return;
  allPoints.forEach(function(p) {
    if (p.type !== 'human' || !enabled.human) return;
    var syms = p.symptoms || [];
    var match = symptomFilter.some(function(s) { return syms.indexOf(s) >= 0; });
    if (!match) return;
    var color = SYMPTOM_COLORS_MAP[syms[0]] || '#e02020';
    var dot = L.circleMarker([p.lat, p.lng], {
      radius: 5, fillColor: color, color: '#fff',
      weight: 1.5, opacity: 1, fillOpacity: 0.85
    });
    symptomMarkersLayer.addLayer(dot);
  });
}
    }

    function renderMarkers() {
      markersLayer.clearLayers();
      markerData.forEach(function (m) {
        var c = m.counts || {};
        // Badge total = sum of sub-counts whose owning toggle is enabled.
        var total = 0;
        SUBS.forEach(function (sub) {
          if (enabled[SUB_TOGGLE[sub]]) total += (c[sub] || 0);
        });
        if (total <= 0) return;

        var marker = L.marker([m.lat, m.lng], {
          icon: L.divIcon({
            className: 'oh-badge',
            html: '<div>' + total + '</div>',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          })
        });

        var humanTotal = (c.humanHealthy || 0) + (c.humanSick || 0);
        var html = '<div class="oh-pop"><b>ZIP ' + m.zip + '</b> — ' + total + ' report' + (total === 1 ? '' : 's') +
          '<br/>Healthy ' + (c.humanHealthy || 0) +
          ' &middot; Sick ' + (c.humanSick || 0) +
          '<br/>Animal ' + (c.animal || 0) +
          ' &middot; Environment ' + (c.environment || 0) + '</div>';
        marker.bindPopup(html);
        marker.on('mouseover', function () { this.openPopup(); });
        marker.on('mouseout', function () { this.closePopup(); });
        markersLayer.addLayer(marker);
      });
    }

    function toggle(key, on) {
      if (!TOGGLE_LAYERS[key]) return;
      enabled[key] = on;
      TOGGLE_LAYERS[key].forEach(function (sub) {
        if (on) { map.addLayer(layers[sub]); }
        else { map.removeLayer(layers[sub]); }
      });
      renderMarkers();
      renderSymptomDots();
    }

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
        return c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;';
      });
    }

    // (Re)build a resource group's marker layer from its points. Stores the
    // group as a detached L.layerGroup; toggleResource adds/removes it from map.
    function setResources(group, points) {
      var style = RESOURCE_STYLE[group];
      if (!style) return;
      resourceData[group] = points || [];

      var wasOn = resourceLayers[group] && map.hasLayer(resourceLayers[group]);
      if (resourceLayers[group]) map.removeLayer(resourceLayers[group]);

      var lg = L.layerGroup();
      resourceData[group].forEach(function (r) {
        var marker = L.marker([r.lat, r.lng], {
          icon: L.divIcon({
            className: 'oh-resource',
            html: '<div style="background:' + style.color + '"><span>' + style.glyph + '</span></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 28],
            popupAnchor: [0, -26]
          })
        });
        var html = '<div class="oh-pop"><b>' + esc(r.name) + '</b>' +
          (r.address ? '<br/>' + esc(r.address) : '') +
          (r.city ? '<br/>' + esc(r.city) : '') +
          (r.hours ? '<br/>Hours: ' + esc(r.hours) : '') +
          (r.county ? '<br/><span style="opacity:.55">' + esc(r.county) + ' County</span>' : '') + '</div>';
        marker.bindPopup(html);
        lg.addLayer(marker);
      });

      resourceLayers[group] = lg;
      if (wasOn) map.addLayer(lg); // preserve visibility across data refresh
    }

    function toggleResource(group, on) {
      var lg = resourceLayers[group];
      if (!lg) return;
      if (on) { map.addLayer(lg); } else { map.removeLayer(lg); }
    }

    function handleMessage(raw) {
      try {
        var msg = JSON.parse(raw);
        if (msg.kind === 'SET_DATA') setData(msg.points, msg.markers);
        else if (msg.kind === 'TOGGLE') toggle(msg.layer, msg.on);
        else if (msg.kind === 'SET_RESOURCES') setResources(msg.group, msg.points);
        else if (msg.kind === 'TOGGLE_RESOURCE') toggleResource(msg.group, msg.on);
        else if (msg.kind === 'SET_SYMPTOM_FILTER') {
            symptomFilter = msg.symptoms; // array of symptom keys, or null
            SYMPTOM_COLORS_MAP = msg.colors || {};
            renderSymptomDots();
            }
      } catch (e) {}
    }

    // Android delivers messages on document, iOS on window.
    document.addEventListener('message', function (e) { handleMessage(e.data); });
    window.addEventListener('message', function (e) { handleMessage(e.data); });

    // Tell RN we're ready to receive data.
    function notifyReady() {
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ kind: 'READY' }));
      }
    }
    notifyReady();
  </script>
</body>
</html>`;
}
