// ─── OneHealth report → heatmap data ─────────────────────────
// Reports aren't persisted anywhere yet, so this module doubles as a
// tiny in-memory store that carries reports submitted during the session
// over to the map page, alongside generated dummy data for Arizona.
//
// Heat intensity is driven by REPORT DENSITY (every point weighs 1), not
// severity — the more reports cluster in an area, the hotter it reads.

export type ReportType = 'human' | 'animal' | 'environment';
export type Health = 'healthy' | 'sick';

export type Symptom =
  | 'none' | 'fever' | 'cough' | 'breathing' | 'nausea' | 'diarrhea'
  | 'sore_throat' | 'rash' | 'chills' | 'muscle_aches' | 'red_eyes'
  | 'loss_smell_taste' | 'bleeding' | 'yellow_skin' | 'bloody_urine';

export const SYMPTOM_LABELS: Record<Symptom, string> = {
  none: 'No symptoms',
  fever: 'Fever',
  cough: 'Cough / congestion',
  breathing: 'Difficulty breathing',
  nausea: 'Nausea / vomiting',
  diarrhea: 'Diarrhea',
  sore_throat: 'Sore throat',
  rash: 'Rash',
  chills: 'Chills',
  muscle_aches: 'Muscle / body aches',
  red_eyes: 'Red eyes',
  loss_smell_taste: 'Loss of smell / taste',
  bleeding: 'Bleeding from body openings',
  yellow_skin: 'Yellow skin / eyes',
  bloody_urine: 'Discolored / bloody urine',
};

// Color for each symptom — used for map dot markers and panel swatches
export const SYMPTOM_COLORS: Record<Symptom, string> = {
  none: '#52c41a',
  fever: '#e02020',
  cough: '#ff8c00',
  breathing: '#c0392b',
  nausea: '#e67e22',
  diarrhea: '#d35400',
  sore_throat: '#f39c12',
  rash: '#8e44ad',
  chills: '#2980b9',
  muscle_aches: '#e74c3c',
  red_eyes: '#FF6B6B',
  loss_smell_taste: '#16a085',
  bleeding: '#922b21',
  yellow_skin: '#d4ac0d',
  bloody_urine: '#a93226',
};
// Sub-categories used for coloring + marker breakdown.
// (Humans split into healthy/sick; animals & environment stay single.)
export type SubType = 'humanHealthy' | 'humanSick' | 'animal' | 'environment';

export type HeatPoint = {
  type: ReportType;
  lat: number;
  lng: number;
  weight: number; // 0..1 — uniform (1) so density drives heat
  zip?: string;
  health?: Health; // only meaningful when type === 'human'
  symptoms?: Symptom[]; // only for type === 'human'
};

export type MarkerData = {
  zip: string;
  lat: number;
  lng: number;
  counts: Record<SubType, number>;
};

// Shape produced by ReportFlow's submit() (only the fields we use here).
export type ReportPayload = {
  feeling: string; // 'sick' | 'good'
  category: string[]; // 'people' | 'animals' | 'environment'
  observations?: string[];
  zip_code?: string;
  coords?: { lat: number; lng: number } | null;
};

// ─── In-memory session store ─────────────────────────────────
const submitted: HeatPoint[] = [];

export function addReport(points: HeatPoint[]) {
  submitted.push(...points);
}

export function getSubmittedPoints(): HeatPoint[] {
  return submitted;
}

// ─── Geography ───────────────────────────────────────────────
// Arizona bounding box (roughly): lat 31.3–37.0, lng −114.8 to −109.0.
const AZ_CENTER: [number, number] = [34.0, -111.5];

// Approximate centroids for common AZ zip codes. Unknown zips fall back
// to the AZ center with jitter.
const AZ_ZIP_CENTROIDS: Record<string, [number, number]> = {
  '85001': [33.4484, -112.074], // Phoenix
  '85201': [33.4152, -111.8315], // Mesa
  '85281': [33.4255, -111.94], // Tempe
  '85301': [33.5387, -112.186], // Glendale
  '85251': [33.4942, -111.9261], // Scottsdale
  '85338': [33.4353, -112.3577], // Goodyear
  '85701': [32.2217, -110.9265], // Tucson
  '86001': [35.1983, -111.6513], // Flagstaff
  '85364': [32.6927, -114.6277], // Yuma
  '86301': [34.54, -112.4685], // Prescott
  '85546': [32.8367, -109.7076], // Safford
  '85936': [34.1242, -109.2865], // Show Low area
};

function jitter(amount: number) {
  return (Math.random() - 0.5) * 2 * amount;
}

/** Resolve a report's coordinates: GPS coords → zip centroid → AZ center, all with light jitter. */
function resolveCoords(payload: ReportPayload): [number, number] {
  if (payload.coords) {
    return [payload.coords.lat, payload.coords.lng];
  }
  const centroid = payload.zip_code && AZ_ZIP_CENTROIDS[payload.zip_code];
  if (centroid) {
    return [centroid[0] + jitter(0.03), centroid[1] + jitter(0.03)];
  }
  return [AZ_CENTER[0] + jitter(1.2), AZ_CENTER[1] + jitter(1.6)];
}

// ─── Report → heat points ────────────────────────────────────
/**
 * Convert a submitted report into heat points (a report can touch multiple layers).
 * Live flow only produces sick-human points; healthy/sick variety lives in the
 * dummy data. All points use weight 1 — density, not severity, drives heat.
 */
export function reportToHeatPoints(payload: ReportPayload): HeatPoint[] {
  const [lat, lng] = resolveCoords(payload);
  const zip = payload.zip_code;
  const points: HeatPoint[] = [];
  const cats = payload.category ?? [];

  // Human layer — reporting on people while feeling sick.
  if (payload.feeling === 'sick' && cats.includes('people')) {
    points.push({ type: 'human', health: 'sick', lat, lng, weight: 1, zip });
  }

  // Animal / Environment layers — actual observations only.
  const observations = payload.observations ?? [];
  const hasRealObservation =
    observations.length > 0 &&
    !observations.every((o) => o.toLowerCase() === 'nothing unusual');

  if (cats.includes('animals') && hasRealObservation) {
    points.push({ type: 'animal', lat, lng, weight: 1, zip });
  }
  if (cats.includes('environment') && hasRealObservation) {
    points.push({ type: 'environment', lat, lng, weight: 1, zip });
  }

  return points;
}

// ─── Marker aggregation ──────────────────────────────────────
function subTypeOf(p: HeatPoint): SubType {
  if (p.type === 'human') return p.health === 'healthy' ? 'humanHealthy' : 'humanSick';
  return p.type; // 'animal' | 'environment'
}

/** Group points by zip into per-sub-type counts, anchored at the zip centroid. */
export function aggregateMarkers(points: HeatPoint[]): MarkerData[] {
  const byZip = new Map<string, { sum: [number, number]; n: number; counts: Record<SubType, number> }>();

  for (const p of points) {
    if (!p.zip) continue;
    let entry = byZip.get(p.zip);
    if (!entry) {
      entry = { sum: [0, 0], n: 0, counts: { humanHealthy: 0, humanSick: 0, animal: 0, environment: 0 } };
      byZip.set(p.zip, entry);
    }
    entry.sum[0] += p.lat;
    entry.sum[1] += p.lng;
    entry.n += 1;
    entry.counts[subTypeOf(p)] += 1;
  }

  const markers: MarkerData[] = [];
  for (const [zip, entry] of byZip) {
    const centroid = AZ_ZIP_CENTROIDS[zip];
    const [lat, lng] = centroid ?? [entry.sum[0] / entry.n, entry.sum[1] / entry.n];
    markers.push({ zip, lat, lng, counts: entry.counts });
  }
  return markers;
}

// ─── Dummy data ──────────────────────────────────────────────
// Per-zip report volumes — denser metros read hotter on the map.
const DUMMY_ZIPS: { zip: string; n: number }[] = [
  { zip: '85001', n: 50 }, // Phoenix
  { zip: '85201', n: 42 }, // Mesa
  { zip: '85281', n: 38 }, // Tempe
  { zip: '85301', n: 35 }, // Glendale
  { zip: '85251', n: 40 }, // Scottsdale
  { zip: '85338', n: 24 }, // Goodyear
  { zip: '85701', n: 45 }, // Tucson
  { zip: '86001', n: 22 }, // Flagstaff
  { zip: '85364', n: 20 }, // Yuma
  { zip: '86301', n: 18 }, // Prescott
  { zip: '85546', n: 14 }, // Safford
  { zip: '85936', n: 12 }, // Show Low
];

const TYPES: ReportType[] = ['human', 'animal', 'environment'];

/** Generate dummy reports clustered by zip across Arizona (~360 points). */
export function generateDummyPoints(): HeatPoint[] {
  const points: HeatPoint[] = [];
  for (const { zip, n } of DUMMY_ZIPS) {
    const center = AZ_ZIP_CENTROIDS[zip];
    for (let i = 0; i < n; i++) {
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      const health: Health | undefined =
        type === 'human' ? (Math.random() < 0.55 ? 'sick' : 'healthy') : undefined;
      points.push({
        type,
        health,
        lat: center[0] + jitter(0.05),
        lng: center[1] + jitter(0.06),
        weight: 1,
        zip,
      });
    }
  }
  return points;
}
