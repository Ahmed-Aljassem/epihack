// ─── Heat-relief resources → map markers ─────────────────────
// Community heat-relief resources (cooling centers, hydration stations,
// respite centers) shown on the map as toggleable marker groups.
//
// Data is aggregated across Arizona from three complementary public ArcGIS
// services, each with its own schema. The two metros that run their own Heat
// Relief Networks own their counties; the statewide service fills in the rest:
//   • Maricopa — AZMAG HRN_Public_view: ONE layer, categorized by a
//     `HeatRelief_Type` field (one type per record).
//   • Pima — PCHD Heat Relief Network Survey123 results: ONE layer where each
//     record carries overlapping yes/no flags (`cooling` + `cooling_type`,
//     `hydration`), so a single site can belong to several groups. (Pima keeps
//     its own data current here; in the statewide service below nearly all Pima
//     records are marked Inactive, so we source Pima from this dedicated layer.)
//   • Rest of Arizona — AZDHS Statewide Heat Preparedness Network (layer 19),
//     categorized by `HydrationActivities`. We take only Active locations and
//     exclude Maricopa + Pima (owned above) to avoid duplication. Covers Yuma,
//     Yavapai, Gila, Pinal, La Paz, etc.
// Per-group results are merged across sources; if every source errors/empties
// out we fall back to a small bundled snapshot. Fetched lazily by the map when
// a group's toggle is first enabled.

export type ResourceGroup = 'coolingCenters' | 'hydrationStations' | 'respiteCenters';

export type ResourceMarker = {
  lat: number;
  lng: number;
  name: string;
  address?: string;
  city?: string;
  hours?: string;
  org?: string;
  county?: string; // e.g. 'Maricopa', 'Pima', 'Pinal' — shown in the marker popup
};

// One entry per group. `color` + `glyph` drive both the native panel swatch
// and the in-WebView marker style. Iteration order = display order in the panel.
export const RESOURCE_GROUPS = {
  coolingCenters: { label: 'Cooling Centers', color: '#1677ff', glyph: '❄' },
  hydrationStations: { label: 'Hydration Stations', color: '#13c2c2', glyph: '💧' },
  respiteCenters: { label: 'Respite Centers', color: '#722ed1', glyph: '🛌' },
} as const;

const FETCH_TIMEOUT_MS = 8000;

// ─── ArcGIS GeoJSON fetch helper ─────────────────────────────
type GeoFeature = {
  geometry?: { type?: string; coordinates?: [number, number] } | null;
  properties?: Record<string, unknown> | null;
};

async function fetchGeoJSON(url: string): Promise<GeoFeature[]> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = (await res.json()) as { features?: GeoFeature[]; error?: unknown };
    if (json.error) throw new Error('ArcGIS query error');
    return json.features ?? [];
  } finally {
    clearTimeout(timer);
  }
}

function str(v: unknown): string | undefined {
  if (v == null) return undefined;
  const s = String(v).trim();
  return s.length ? s : undefined;
}

function validMarker(m: ResourceMarker | null): m is ResourceMarker {
  return m !== null;
}

function toMarker(f: GeoFeature, build: (p: Record<string, unknown>) => Omit<ResourceMarker, 'lat' | 'lng'>): ResourceMarker | null {
  const coords = f.geometry?.coordinates;
  if (!coords || coords.length < 2) return null;
  const [lng, lat] = coords;
  if (typeof lat !== 'number' || typeof lng !== 'number' || Number.isNaN(lat) || Number.isNaN(lng)) return null;
  return { lat, lng, ...build(f.properties ?? {}) };
}

// ─── Maricopa County (AZMAG HRN_Public_view) ─────────────────
const MARICOPA_URL =
  'https://services1.arcgis.com/MdyCMZnX1raZ7TS3/arcgis/rest/services/HRN_Public_view/FeatureServer/0';
const MARICOPA_TYPE: Record<ResourceGroup, string> = {
  coolingCenters: 'Cooling Center',
  hydrationStations: 'Hydration Station',
  respiteCenters: 'Respite Center',
};

async function fetchMaricopa(group: ResourceGroup): Promise<ResourceMarker[]> {
  const params = new URLSearchParams({
    where: `HeatRelief_Type='${MARICOPA_TYPE[group]}'`,
    outFields: 'Location,Organization,Address,City,Hours',
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '2000',
    f: 'geojson',
  });
  const feats = await fetchGeoJSON(`${MARICOPA_URL}/query?${params.toString()}`);
  return feats
    .map((f) =>
      toMarker(f, (p) => ({
        name: str(p.Location) ?? str(p.Organization) ?? 'Heat-relief site',
        address: str(p.Address),
        city: str(p.City),
        hours: str(p.Hours),
        org: str(p.Organization),
        county: 'Maricopa',
      }))
    )
    .filter(validMarker);
}

// ─── Pima County (PCHD Heat Relief Network Survey123) ────────
// Single small layer; one record can be cooling/respite/hydration at once, so
// we fetch the whole layer once (cached) and bucket records per group.
const PIMA_URL =
  'https://services2.arcgis.com/UTBp78iglGpbqp1B/arcgis/rest/services/survey123_2f140227a14b48c9bf738f218304db84_results/FeatureServer/0';

let pimaCache: Promise<GeoFeature[]> | null = null;

function fetchPimaAll(): Promise<GeoFeature[]> {
  if (!pimaCache) {
    const params = new URLSearchParams({
      where: '1=1',
      outFields: 'loc_name,org_name,loc_building,loc_zip,cooling,cooling_type,hydration,all_day,same_hours,all_open,all_close',
      returnGeometry: 'true',
      outSR: '4326',
      resultRecordCount: '2000',
      f: 'geojson',
    });
    // Reset the cache on failure so a later toggle can retry.
    pimaCache = fetchGeoJSON(`${PIMA_URL}/query?${params.toString()}`).catch((e) => {
      pimaCache = null;
      throw e;
    });
  }
  return pimaCache;
}

// Membership: cooling_type === 'respite' counts as respite (not cooling), to
// mirror Maricopa's mutually-exclusive cooling vs respite split.
function pimaInGroup(p: Record<string, unknown>, group: ResourceGroup): boolean {
  const cooling = String(p.cooling ?? '').toLowerCase() === 'yes';
  const ctype = String(p.cooling_type ?? '').toLowerCase();
  const hydration = String(p.hydration ?? '').toLowerCase() === 'yes';
  if (group === 'hydrationStations') return hydration;
  if (group === 'respiteCenters') return cooling && ctype.includes('respite');
  return cooling && !ctype.includes('respite'); // coolingCenters
}

function pimaHours(p: Record<string, unknown>): string | undefined {
  if (String(p.all_day ?? '').toLowerCase() === 'yes') return 'Open 24/7';
  const open = str(p.all_open);
  const close = str(p.all_close);
  if (open && close) return `${open}–${close}`;
  return undefined; // per-day hours are largely unpopulated in the source
}

async function fetchPima(group: ResourceGroup): Promise<ResourceMarker[]> {
  const feats = await fetchPimaAll();
  return feats
    .filter((f) => pimaInGroup(f.properties ?? {}, group))
    .map((f) =>
      toMarker(f, (p) => ({
        name: str(p.loc_name) ?? str(p.org_name) ?? 'Heat-relief site',
        address: str(p.loc_building),
        city: str(p.loc_zip),
        hours: pimaHours(p),
        org: str(p.org_name),
        county: 'Pima',
      }))
    )
    .filter(validMarker);
}

// ─── Rest of Arizona (AZDHS Statewide Heat Preparedness Network) ──
// Single layer (id 19), categorized by `HydrationActivities`. We request only
// Active locations, excluding Maricopa + Pima (owned by their dedicated
// services above). Hours live in per-day fields (e.g. `8_00_AM`).
const STATEWIDE_URL =
  'https://services1.arcgis.com/mpVYz37anSdrK4d8/arcgis/rest/services/Public_Statewide_Heat_Preparedness_Network_Locations/FeatureServer/19';
const STATEWIDE_TYPE: Record<ResourceGroup, string> = {
  coolingCenters: 'Cooling_Center',
  hydrationStations: 'Hydration_Station',
  respiteCenters: 'Respite_Center',
};
const STATEWIDE_DAYS: [string, string][] = [
  ['Monday', 'Mon'], ['Tuesday', 'Tue'], ['Wednesday', 'Wed'], ['Thursday', 'Thu'],
  ['Friday', 'Fri'], ['Saturday', 'Sat'], ['Sunday', 'Sun'],
];
const STATEWIDE_HOURS_FIELDS = STATEWIDE_DAYS.flatMap(([d]) => [`${d}Open`, `${d}Close`]).join(',');

// '8_00_AM' → '8:00 AM'
function humanTime(v?: string): string | undefined {
  return v ? v.replace('_', ':').replace('_', ' ') : undefined;
}

// Drop the trailing " County" so the popup's "<county> County" reads cleanly.
function countyName(c?: string): string | undefined {
  return c ? c.replace(/\s+County$/i, '') : undefined;
}

// Build a compact schedule, grouping consecutive same-hours days into ranges
// (e.g. "Mon–Fri 8:00 AM–5:00 PM, Sat 9:00 AM–5:00 PM").
function statewideHours(p: Record<string, unknown>): string | undefined {
  if (String(p.Open24seven ?? '').toLowerCase() === 'yes') return 'Open 24/7';
  const keyed = STATEWIDE_DAYS.map(([full, abbr]) => {
    const o = humanTime(str(p[`${full}Open`]));
    const c = humanTime(str(p[`${full}Close`]));
    return { abbr, key: o && c ? `${o}–${c}` : null };
  });
  const segments: string[] = [];
  for (let i = 0; i < keyed.length; ) {
    if (!keyed[i].key) { i++; continue; }
    let j = i;
    while (j + 1 < keyed.length && keyed[j + 1].key === keyed[i].key) j++;
    const label = i === j ? keyed[i].abbr : `${keyed[i].abbr}–${keyed[j].abbr}`;
    segments.push(`${label} ${keyed[i].key}`);
    i = j + 1;
  }
  return segments.length ? segments.join(', ') : undefined;
}

async function fetchStatewide(group: ResourceGroup): Promise<ResourceMarker[]> {
  const params = new URLSearchParams({
    where: `HydrationActivities='${STATEWIDE_TYPE[group]}' AND SeasonStatus='Active' AND County NOT IN ('Maricopa County','Pima County')`,
    outFields: `Facility,Address,City,County,${STATEWIDE_HOURS_FIELDS}`,
    returnGeometry: 'true',
    outSR: '4326',
    resultRecordCount: '2000',
    f: 'geojson',
  });
  const feats = await fetchGeoJSON(`${STATEWIDE_URL}/query?${params.toString()}`);
  return feats
    .map((f) =>
      toMarker(f, (p) => ({
        name: str(p.Facility) ?? str(p.Address) ?? 'Heat-relief site',
        address: str(p.Address),
        city: str(p.City),
        hours: statewideHours(p),
        county: countyName(str(p.County)),
      }))
    )
    .filter(validMarker);
}

// ─── Aggregate across sources ────────────────────────────────
const SOURCES = [fetchMaricopa, fetchPima, fetchStatewide];

/**
 * Fetch a resource group's locations across all configured sources.
 * Sources are fetched independently (one failing doesn't drop the others);
 * only if every source errors/empties do we return the bundled fallback.
 */
export async function fetchResources(group: ResourceGroup): Promise<ResourceMarker[]> {
  const settled = await Promise.allSettled(SOURCES.map((fetchSource) => fetchSource(group)));
  const markers = settled.flatMap((s) => (s.status === 'fulfilled' ? s.value : []));
  return markers.length ? markers : FALLBACK[group];
}

// ─── Bundled fallback snapshot ───────────────────────────────
// A few real locations per group (Maricopa via AZMAG + other counties via the
// AZDHS statewide service), used only when every live source fails. Not
// exhaustive — just enough to keep the map useful offline.
export const FALLBACK: Record<ResourceGroup, ResourceMarker[]> = {
  coolingCenters: [
    { name: 'Peoria Community Center', address: '8335 W. Jefferson St. Peoria AZ 85345', city: 'Peoria', hours: 'Mo-Th 8am-9pm, Fr 8am-5pm, Sa 8am-3pm', lat: 33.579132, lng: -112.238699, county: 'Maricopa' },
    { name: 'Terros Health - HIV Prevention', address: '333 E. Indian School Rd. Phoenix AZ 85012', city: 'Phoenix', hours: 'Mo-Fr 8am-5pm', lat: 33.49454, lng: -112.06823, county: 'Maricopa' },
    { name: '12307 Kennedy Dr', address: '12307 Kennedy Dr', city: 'Parker', hours: 'Mon–Fri 8:00 AM–5:00 PM', lat: 34.147553, lng: -114.302166, county: 'La Paz' },
    { name: 'Wellton', address: '28790 San Jose Ave', city: 'Wellton', hours: 'Tue–Thu 9:00 AM–6:00 PM, Fri–Sat 9:00 AM–5:00 PM', lat: 32.672016, lng: -114.144638, county: 'Yuma' },
    { name: 'Quincie Douglas Library', address: '1585 E 36th St', city: '85713', lat: 32.18543, lng: -110.96669, county: 'Pima' },
  ],
  hydrationStations: [
    { name: 'Freestone Recreation Center', address: '1144 E. Guadalupe Rd. Gilbert AZ 85234', city: 'Gilbert', hours: 'Mo-Fr 5:30am-10pm, Sa 7am-9pm, Su 10am-5pm', lat: 33.364, lng: -111.766, county: 'Maricopa' },
    { name: "A New Leaf - East Valley Men's Center", address: '2345 N. Country Club Dr. Mesa AZ 85201', city: 'Mesa', hours: 'Mo-Su 8am-4pm', lat: 33.458, lng: -111.839, county: 'Maricopa' },
    { name: 'Miller- Golf Links Library', address: '9640 E. Golf Links Rd.', city: '85730', lat: 32.20718, lng: -110.79466, county: 'Pima' },
  ],
  respiteCenters: [
    { name: 'Redemption Church Gilbert', address: '1820 W. Elliot Rd. Gilbert AZ 85233', city: 'Gilbert', hours: 'Mo-Th 9am-4pm', lat: 33.351, lng: -111.829, county: 'Maricopa' },
    { name: "Men's Shelter", address: '200 E. Benson Hwy', city: '85713', hours: '12:00–16:00', lat: 32.18543, lng: -110.96669, county: 'Pima' },
  ],
};
