// ─── Leaflet + OpenStreetMap heatmap document ────────────────
// Returns a full HTML page rendered inside react-native-webview.
// React Native ⇄ WebView protocol (messages are JSON strings):
//   RN → Web:  { kind: 'SET_DATA', points: HeatPoint[], markers: MarkerData[] }
//              { kind: 'TOGGLE', layer: ToggleKey, on: boolean }
//              { kind: 'INIT_VIEW', center: [lat, lng], intro: boolean }
//              { kind: 'SEARCH_ZIP', zip: string | null, center: [lat,lng] | null }
//              { kind: 'SET_VIEW', view: 'reports' | 'resources' }
//              { kind: 'SET_LATEST', point: { lat, lng, zip? } | null, focus?: boolean }
//              { kind: 'SET_RESOURCES', group: ResourceGroup, points: ResourceMarker[] }
//              { kind: 'TOGGLE_RESOURCE', group: ResourceGroup, on: boolean }
//   Web → RN:  { kind: 'READY' }
// Four colored heat layers, now with FOUR independent toggles —
// humanSick / humanHealthy / animal / environment map 1:1 to a sub-layer.
// The report and resource views are mutually exclusive: SET_VIEW flips
// between showing report heat layers + ZIP markers (reports) and the
// resource pin layers (resources), hiding the other set entirely.
// Resource groups (cooling/hydration/respite) render as separate, toggleable
// pin-marker layers, each styled by RESOURCE_GROUPS color + glyph.
// Leaflet + Leaflet.heat are loaded from the unpkg CDN (needs network).

import { RESOURCE_GROUPS } from './resources';

// The 4 panel toggles — one per heat sub-layer.
export type ToggleKey = 'humanSick' | 'humanHealthy' | 'animal' | 'environment';

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
  <link rel="stylesheet" href="https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script src="https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js"></script>
  <script src="https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js"></script>
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
    /* Resource cluster bubble — colored circle with the merged location count. */
    .oh-rcluster { background: none; border: none; }
    .oh-rcluster > div {
      width: 36px; height: 36px; border-radius: 18px;
      color: #fff; font-weight: 700; font-size: 13px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 1px 4px rgba(0,0,0,0.35); border: 2px solid #fff;
      font-family: -apple-system, system-ui, sans-serif;
    }
    /* "Your latest report" pin — green teardrop with a star, pulsing ring. */
    .oh-latest { background: none; border: none; }
    .oh-latest > div {
      width: 30px; height: 30px;
      border-radius: 50% 50% 50% 0; transform: rotate(-45deg);
      background: #0B6623; border: 3px solid #fff;
      box-shadow: 0 0 0 5px rgba(11,102,35,0.30), 0 2px 6px rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center;
    }
    .oh-latest > div > span { transform: rotate(45deg); color: #fff; font-size: 15px; line-height: 1; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var GRADIENTS = ${gradients};
    var SUBS = ['humanSick', 'humanHealthy', 'animal', 'environment'];

    // Each toggle now controls exactly one sub-layer (1:1).
    var TOGGLE_LAYERS = {
      humanSick: ['humanSick'],
      humanHealthy: ['humanHealthy'],
      animal: ['animal'],
      environment: ['environment']
    };
    // Reverse: which toggle owns a given sub-layer (identity now).
    var SUB_TOGGLE = { humanSick: 'humanSick', humanHealthy: 'humanHealthy', animal: 'animal', environment: 'environment' };

    var enabled = { humanSick: true, humanHealthy: true, animal: true, environment: true };
    var markerData = [];

    // "Your latest report" marker — shown only in the reports view.
    var latestData = null;   // { lat, lng, zip? } | null
    var latestMarker = null; // L.marker | null

    // Active view — reports and resources are mutually exclusive.
    var currentView = 'reports';

    // Heat-relief resource groups (cooling/hydration/respite).
    var RESOURCE_STYLE = ${resourceStyle}; // { group: { color, glyph }, ... }
    var resourceLayers = {};  // group -> L.layerGroup (added to map only when enabled + resources view)
    var resourceData = {};    // group -> ResourceMarker[]
    var resourceEnabled = {}; // group -> boolean (user's checkbox state)

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
        radius: 30,
        blur: 18,
        max: 4,            // ~4 overlapping reports reach peak color — hotter/brighter
        maxZoom: 12,
        minOpacity: 0.45,  // raise the floor so even sparse points read brighter
        gradient: GRADIENTS[sub]
      }).addTo(map);
    });

    // Merged report pins show the SUMMED report total of their children,
    // not the child-marker count — match the green .oh-badge look.
    function clusterReportIcon(cluster) {
      var total = 0;
      cluster.getAllChildMarkers().forEach(function (m) { total += (m.options.count || 0); });
      var size = total >= 100 ? 44 : total >= 25 ? 40 : 34;
      return L.divIcon({
        className: 'oh-badge',
        html: '<div style="width:' + size + 'px;height:' + size + 'px;border-radius:' + (size / 2) + 'px">' + total + '</div>',
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2]
      });
    }

    // Fall back to a plain layer group if the markercluster plugin failed to
    // load (e.g. CDN blocked) — otherwise the whole script would throw here and
    // no markers/heat would render at all.
    function makeMarkerGroup(opts) {
      return (typeof L.markerClusterGroup === 'function') ? L.markerClusterGroup(opts) : L.layerGroup();
    }

    var markersLayer = makeMarkerGroup({
      maxClusterRadius: 60,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: false,
      animate: false, // avoid markercluster's zoom-anim crash on flyTo after toggles
      iconCreateFunction: clusterReportIcon
    }).addTo(map);
    var symptomMarkersLayer = L.layerGroup().addTo(map);
    var symptomFilter = null; // null = show all, or array of symptom keys
    var allPoints = []; // full point list, for re-rendering on filter change
    var SYMPTOM_COLORS_MAP = {}; // populated from RN via SET_SYMPTOM_FILTER
    var zipFilter = null; // null = all ZIPs, or a single ZIP string (search)
    var zipCenter = null; // [lat,lng] of the searched ZIP (for proximity filters)

    function subTypeOf(p) {
      if (p.type === 'human') return p.health === 'healthy' ? 'humanHealthy' : 'humanSick';
      return p.type;
    }

    function setData(points, markers) {
      markerData = markers || [];
      allPoints = points || [];
      applyHeat();
      renderSymptomDots();
      renderMarkers();
    }

    // (Re)populate the heat layers from allPoints, honoring the ZIP search filter.
    function applyHeat() {
      var src = zipFilter ? allPoints.filter(function (p) { return p.zip === zipFilter; }) : allPoints;
      var buckets = { humanSick: [], humanHealthy: [], animal: [], environment: [] };
      src.forEach(function (p) {
        var sub = subTypeOf(p);
        if (buckets[sub]) buckets[sub].push([p.lat, p.lng, p.weight]);
      });
      SUBS.forEach(function (sub) { layers[sub].setLatLngs(buckets[sub]); });
    }

    // Search only ZOOMS to a ZIP — the full heatmap (all colors), badges, dots
    // and resources stay visible; nothing is filtered/hidden. center [lat,lng]
    // comes from RN's ZIP table (falls back to a report marker for that ZIP).
    function searchZip(zip, center) {
      var c = (center && center.length === 2) ? center : null;
      if (!c && zip) {
        var m = (markerData || []).filter(function (x) { return x.zip === zip; })[0];
        if (m) c = [m.lat, m.lng];
      }
      if (c) {
        try { map.stop(); } catch (e) {}
        try { map.flyTo(c, 14, { duration: 1.0 }); }
        catch (e) { map.setView(c, 14, { animate: false }); }
      }
    }

    function renderSymptomDots() {
      symptomMarkersLayer.clearLayers();
      if (!symptomFilter || symptomFilter.length === 0) return;
      // Human points only; respect either human toggle being on.
      var humanOn = enabled.humanSick || enabled.humanHealthy;
      allPoints.forEach(function (p) {
        if (p.type !== 'human' || !humanOn) return;
        if (zipFilter && p.zip !== zipFilter) return;
        var syms = p.symptoms || [];
        // Color by the SELECTED symptom that matched (so the dot matches the
        // key swatch you checked), not the report's first symptom.
        var matchedSym = symptomFilter.find(function (s) { return syms.indexOf(s) >= 0; });
        if (!matchedSym) return;
        var color = SYMPTOM_COLORS_MAP[matchedSym] || '#e02020';
        var dot = L.circleMarker([p.lat, p.lng], {
          radius: 5, fillColor: color, color: '#fff',
          weight: 1.5, opacity: 1, fillOpacity: 0.85
        });
        symptomMarkersLayer.addLayer(dot);
      });
    }

    function renderMarkers() {
      markersLayer.clearLayers();
      markerData.forEach(function (m) {
        if (zipFilter && m.zip !== zipFilter) return; // ZIP search filter
        var c = m.counts || {};
        // Badge total = sum of sub-counts whose owning toggle is enabled.
        // (Always the full count — the symptom filter only drives the dots.)
        var total = 0;
        SUBS.forEach(function (sub) {
          if (enabled[SUB_TOGGLE[sub]]) total += (c[sub] || 0);
        });
        if (total <= 0) return;

        var marker = L.marker([m.lat, m.lng], {
          count: total, // summed by clusterReportIcon when this badge merges
          icon: L.divIcon({
            className: 'oh-badge',
            html: '<div>' + total + '</div>',
            iconSize: [34, 34],
            iconAnchor: [17, 17]
          })
        });

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

    // Total reports at a ZIP, summing only the sub-types whose toggle is on.
    function countForZip(zip) {
      var total = 0;
      (markerData || []).forEach(function (m) {
        if (m.zip !== zip) return;
        var c = m.counts || {};
        SUBS.forEach(function (sub) {
          if (enabled[SUB_TOGGLE[sub]]) total += (c[sub] || 0);
        });
      });
      return total;
    }

    // (Re)draw the "your latest report" pin. Only visible in the reports view.
    function renderLatest() {
      if (latestMarker) { map.removeLayer(latestMarker); latestMarker = null; }
      if (!latestData || currentView !== 'reports') return;
      latestMarker = L.marker([latestData.lat, latestData.lng], {
        zIndexOffset: 1000, // float above cluster badges
        icon: L.divIcon({
          className: 'oh-latest',
          html: '<div><span>★</span></div>',
          iconSize: [30, 30],
          iconAnchor: [15, 30],
          popupAnchor: [0, -28]
        })
      });
      // The badge for this ZIP can be hidden behind the pin, so surface the
      // up-to-date count right here in the latest-report popup.
      var n = latestData.zip ? countForZip(latestData.zip) : 0;
      latestMarker.bindPopup('<div class="oh-pop"><b>Your latest report</b>' +
        (latestData.zip ? '<br/>ZIP ' + esc(latestData.zip) : '') +
        (n > 0 ? '<br/>' + n + ' report' + (n === 1 ? '' : 's') + ' in this area' : '') +
        '</div>');
      latestMarker.addTo(map);
    }

    function setLatest(p, focus) {
      latestData = p || null;
      renderLatest();
      // Only fly to the report when it's newly submitted (focus), not on every
      // data refresh — and force the reports view so the pin is visible.
      if (focus && latestData) {
        if (currentView !== 'reports') setView('reports');
        map.flyTo([latestData.lat, latestData.lng], 11, { duration: 1.2 });
        if (latestMarker) latestMarker.openPopup(); // confirm the count immediately
      }
    }

    function toggle(key, on) {
      if (!TOGGLE_LAYERS[key]) return;
      enabled[key] = on;
      // Only touch the map while reports are the active view; otherwise just
      // record the state so setView('reports') can apply it later.
      if (currentView === 'reports') {
        TOGGLE_LAYERS[key].forEach(function (sub) {
          if (on) { map.addLayer(layers[sub]); }
          else { map.removeLayer(layers[sub]); }
        });
        renderMarkers();
        renderSymptomDots();
      }
    }

    // Flip between the mutually-exclusive report and resource views.
    function setView(view) {
      currentView = view;
      if (view === 'resources') {
        // Hide all report heat layers + ZIP markers + symptom dots.
        SUBS.forEach(function (sub) { map.removeLayer(layers[sub]); });
        map.removeLayer(markersLayer);
        map.removeLayer(symptomMarkersLayer);
        // Show each enabled resource group.
        Object.keys(resourceLayers).forEach(function (group) {
          var lg = resourceLayers[group];
          if (resourceEnabled[group]) { map.addLayer(lg); }
          else { map.removeLayer(lg); }
        });
      } else {
        // Hide all resource layers.
        Object.keys(resourceLayers).forEach(function (group) {
          map.removeLayer(resourceLayers[group]);
        });
        // Restore enabled report layers + markers + symptom dots.
        SUBS.forEach(function (sub) {
          if (enabled[SUB_TOGGLE[sub]]) { map.addLayer(layers[sub]); }
          else { map.removeLayer(layers[sub]); }
        });
        map.addLayer(markersLayer);
        map.addLayer(symptomMarkersLayer);
        renderMarkers();
        renderSymptomDots();
      }
      renderLatest(); // add in reports view, remove in resources view
    }

    function esc(s) {
      return String(s == null ? '' : s).replace(/[&<>]/g, function (c) {
        return c === '&' ? '&amp;' : c === '<' ? '&lt;' : '&gt;';
      });
    }

    // Center on the user's location. With intro, start at neighborhood zoom and
    // animate out to a regional view; otherwise jump straight to regional.
    function initView(center, intro) {
      if (!center) return;
      if (intro) {
        // Open on a wide Tucson-city view, then zoom IN and settle on the target.
        map.setView(center, 11);
        setTimeout(function () { map.flyTo(center, 14, { duration: 2.0 }); }, 650);
      } else {
        map.setView(center, 13);
      }
    }

    // Cluster bubble for a resource group — colored circle (group color) with
    // the number of merged locations.
    function makeResourceClusterIcon(style) {
      return function (cluster) {
        var n = cluster.getChildCount();
        return L.divIcon({
          className: 'oh-rcluster',
          html: '<div style="background:' + style.color + '">' + n + '</div>',
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });
      };
    }

    // (Re)build a resource group's cluster layer from its stored points,
    // honoring the ZIP search (proximity to the searched ZIP centroid).
    function buildResourceLayer(group) {
      var style = RESOURCE_STYLE[group];
      if (!style) return;

      var wasOn = resourceLayers[group] && map.hasLayer(resourceLayers[group]);
      if (resourceLayers[group]) map.removeLayer(resourceLayers[group]);

      var data = resourceData[group] || [];
      if (zipFilter && zipCenter) {
        var R = 0.06; // ~6.5 km box around the ZIP centroid
        data = data.filter(function (r) {
          return Math.abs(r.lat - zipCenter[0]) < R && Math.abs(r.lng - zipCenter[1]) < R;
        });
      }

      var lg = makeMarkerGroup({
        maxClusterRadius: 60,
        showCoverageOnHover: false,
        animate: false, // avoid markercluster's zoom-anim crash on flyTo after toggles
        iconCreateFunction: makeResourceClusterIcon(style)
      });
      data.forEach(function (r) {
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
      // Re-show only if still enabled AND resources is the active view.
      if (wasOn && resourceEnabled[group] && currentView === 'resources') map.addLayer(lg);
    }

    // Store a group's fetched points, then (re)build its layer.
    function setResources(group, points) {
      if (!RESOURCE_STYLE[group]) return;
      resourceData[group] = points || [];
      buildResourceLayer(group);
    }

    function toggleResource(group, on) {
      resourceEnabled[group] = on;
      var lg = resourceLayers[group];
      if (!lg) return;
      // Only affect the map in the resources view; reports view keeps it hidden.
      if (on && currentView === 'resources') { map.addLayer(lg); }
      else { map.removeLayer(lg); }
    }

    function handleMessage(raw) {
      try {
        var msg = JSON.parse(raw);
        if (msg.kind === 'SET_DATA') setData(msg.points, msg.markers);
        else if (msg.kind === 'TOGGLE') toggle(msg.layer, msg.on);
        else if (msg.kind === 'INIT_VIEW') initView(msg.center, msg.intro);
        else if (msg.kind === 'SEARCH_ZIP') searchZip(msg.zip, msg.center);
        else if (msg.kind === 'SET_VIEW') setView(msg.view);
        else if (msg.kind === 'SET_LATEST') setLatest(msg.point, msg.focus);
        else if (msg.kind === 'SET_RESOURCES') setResources(msg.group, msg.points);
        else if (msg.kind === 'TOGGLE_RESOURCE') toggleResource(msg.group, msg.on);
        else if (msg.kind === 'SET_SYMPTOM_FILTER') {
            symptomFilter = msg.symptoms; // array of symptom keys, or null
            SYMPTOM_COLORS_MAP = msg.colors || {};
            renderSymptomDots();  // filter drives only the colored dots
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
