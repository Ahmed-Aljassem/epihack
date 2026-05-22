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

// Color for each symptom — used for map dot markers and panel swatches.
// Chosen from a maximally-distinct categorical palette (well-separated hues +
// a mix of light/dark) so no two symptoms read as the same color.
export const SYMPTOM_COLORS: Record<Symptom, string> = {
  none: '#2E7D32', // forest green
  fever: '#E6194B', // red
  cough: '#F58231', // orange
  breathing: '#4363D8', // blue
  nausea: '#911EB4', // purple
  diarrhea: '#9A6324', // brown
  sore_throat: '#FFD500', // yellow
  rash: '#F032E6', // magenta
  chills: '#42D4F4', // cyan
  muscle_aches: '#800000', // maroon
  red_eyes: '#FF69B4', // pink
  loss_smell_taste: '#469990', // teal
  bleeding: '#000075', // navy
  yellow_skin: '#BFEF45', // lime
  bloody_urine: '#A9A9A9', // grey
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
// NOTE: no exact coords — location granularity is capped at ZIP for privacy.
export type ReportPayload = {
  feeling: string; // 'sick' | 'good'
  category: string[]; // 'people' | 'animals' | 'environment'
  observations?: string[];
  zip_code?: string;
};

// ─── In-memory session store ─────────────────────────────────
const submitted: HeatPoint[] = [];

// Resolved location of the most recently submitted report — drives the
// "your latest report" marker on the map. Set even when the report produces
// no heat points (e.g. feeling good with nothing unusual). `seq` increments
// per report so the map can distinguish a NEW report (auto-pan) from a refocus.
export type LatestReport = { lat: number; lng: number; zip?: string; seq: number };
let latest: LatestReport | null = null;
let seq = 0;

// User reports weigh more than the seeded dummy points so a single submission
// produces a visible hot spot (dummy points stay weight 1; max is 4).
const REPORT_WEIGHT = 4;

export function addReport(points: HeatPoint[]) {
  submitted.push(...points);
}

export function getSubmittedPoints(): HeatPoint[] {
  return submitted;
}

/** Location of the most recent report, or null if none submitted this session. */
export function getLatestReport(): LatestReport | null {
  return latest;
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
  '85701': [32.2217, -110.9265], // Tucson — downtown
  '85719': [32.2319, -110.9501], // Tucson — university
  '85721': [32.2290, -110.9508], // Tucson — University of Arizona (intro fallback ZIP)
  '85705': [32.279, -110.976], // Tucson — north central
  '85710': [32.22, -110.819], // Tucson — east
  '85711': [32.216, -110.881], // Tucson — east central
  '85713': [32.208, -110.992], // Tucson — south central
  '85716': [32.247, -110.909], // Tucson — central east
  '85730': [32.188, -110.779], // Tucson — far east
  '85745': [32.247, -111.029], // Tucson — west
  '86001': [35.1983, -111.6513], // Flagstaff
  '85364': [32.6927, -114.6277], // Yuma
  '86301': [34.54, -112.4685], // Prescott
  '85546': [32.8367, -109.7076], // Safford
  '85936': [34.1242, -109.2865], // Show Low area
  // More metro ZIPs (varied, often sparse)
  '85008': [33.4655, -111.9866], // Phoenix — east
  '85015': [33.5079, -112.1006], // Phoenix — midtown
  '85033': [33.4942, -112.2719], // Phoenix — Maryvale
  '85202': [33.3792, -111.8807], // Mesa — west
  '85284': [33.3392, -111.9166], // Tempe — south
  '85225': [33.3216, -111.8424], // Chandler
  '85304': [33.5897, -112.1741], // Glendale — north
  '85295': [33.3083, -111.7430], // Gilbert
  '85323': [33.4356, -112.3252], // Avondale
  // Northern / rural AZ + tribal-community ZIPs (sparse)
  '86040': [36.9230, -111.4540], // Page
  '86045': [36.1350, -111.2400], // Tuba City (Navajo Nation)
  '86515': [35.6800, -109.0570], // Window Rock (Navajo Nation)
  '86503': [36.1540, -109.5560], // Chinle (Navajo Nation)
  '85634': [32.0129, -111.4358], // Sells area (Tohono Oʼodham Nation)
  '85541': [34.2317, -111.3251], // Payson
  '85607': [31.3460, -109.5460], // Douglas
  '85635': [31.5616, -110.3037], // Sierra Vista
  '85138': [33.0480, -111.3760], // Casa Grande area
  '85365': [32.7060, -114.5290], // Yuma — east
};

/** Centroid [lat, lng] for a known AZ ZIP, or null if unknown. */
export function getZipCentroid(zip: string): [number, number] | null {
  return AZ_ZIP_CENTROIDS[zip] ?? null;
}

function jitter(amount: number) {
  return (Math.random() - 0.5) * 2 * amount;
}

/**
 * Resolve a report's coordinates at ZIP granularity only — for privacy we
 * NEVER use the exact GPS point. Everything snaps to the ZIP centroid plus a
 * small *random* in-ZIP jitter (display-only geographic masking, not derived
 * from the real location). Unknown ZIP → AZ center with wide jitter.
 */
function resolveCoords(payload: ReportPayload): [number, number] {
  const centroid = payload.zip_code && AZ_ZIP_CENTROIDS[payload.zip_code];
  if (centroid) {
    return [centroid[0] + jitter(0.03), centroid[1] + jitter(0.03)];
  }
  return [AZ_CENTER[0] + jitter(1.2), AZ_CENTER[1] + jitter(1.6)];
}

// ─── Report → heat points ────────────────────────────────────
/**
 * Convert a submitted report into heat points (a report can touch multiple layers).
 * Every selected category produces a point: people (healthy or sick, per feeling),
 * animals, and environment. All points use weight 1 — density, not severity,
 * drives heat.
 */
export function reportToHeatPoints(payload: ReportPayload): HeatPoint[] {
  const [lat, lng] = resolveCoords(payload);
  const zip = payload.zip_code;
  latest = { lat, lng, zip, seq: ++seq }; // remember where this report landed
  const points: HeatPoint[] = [];
  const cats = payload.category ?? [];

  // Human layer — sick or healthy depending on how the reporter feels.
  if (cats.includes('people')) {
    const health: Health = payload.feeling === 'sick' ? 'sick' : 'healthy';
    points.push({ type: 'human', health, lat, lng, weight: REPORT_WEIGHT, zip });
  }

  // Animal / Environment layers — counted whenever the category is selected.
  if (cats.includes('animals')) {
    points.push({ type: 'animal', lat, lng, weight: REPORT_WEIGHT, zip });
  }
  if (cats.includes('environment')) {
    points.push({ type: 'environment', lat, lng, weight: REPORT_WEIGHT, zip });
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
  { zip: '85701', n: 45 }, // Tucson — downtown
  { zip: '85719', n: 35 }, // Tucson — university
  { zip: '85705', n: 38 }, // Tucson — north central
  { zip: '85710', n: 33 }, // Tucson — east
  { zip: '85711', n: 30 }, // Tucson — east central
  { zip: '85713', n: 28 }, // Tucson — south central
  { zip: '85716', n: 26 }, // Tucson — central east
  { zip: '85730', n: 22 }, // Tucson — far east
  { zip: '85745', n: 24 }, // Tucson — west
  { zip: '86001', n: 22 }, // Flagstaff
  { zip: '85364', n: 20 }, // Yuma
  { zip: '86301', n: 18 }, // Prescott
  { zip: '85546', n: 14 }, // Safford
  { zip: '85936', n: 12 }, // Show Low
  // More Phoenix-metro ZIPs (moderate)
  { zip: '85008', n: 19 }, // Phoenix — east
  { zip: '85015', n: 17 }, // Phoenix — midtown
  { zip: '85033', n: 21 }, // Phoenix — Maryvale
  { zip: '85202', n: 16 }, // Mesa — west
  { zip: '85284', n: 11 }, // Tempe — south
  { zip: '85225', n: 23 }, // Chandler
  { zip: '85304', n: 13 }, // Glendale — north
  { zip: '85295', n: 18 }, // Gilbert
  { zip: '85323', n: 9 },  // Avondale
  // Rural AZ + tribal-community ZIPs (intentionally sparse)
  { zip: '86040', n: 6 },  // Page
  { zip: '86045', n: 5 },  // Tuba City (Navajo Nation)
  { zip: '86515', n: 7 },  // Window Rock (Navajo Nation)
  { zip: '86503', n: 4 },  // Chinle (Navajo Nation)
  { zip: '85634', n: 5 },  // Sells (Tohono Oʼodham Nation)
  { zip: '85541', n: 8 },  // Payson
  { zip: '85607', n: 3 },  // Douglas
  { zip: '85635', n: 10 }, // Sierra Vista
  { zip: '85138', n: 9 },  // Casa Grande
  { zip: '85365', n: 7 },  // Yuma — east
];

const TYPES: ReportType[] = ['human', 'animal', 'environment'];

// Real symptoms a sick dummy report can carry (everything except 'none').
const SICK_SYMPTOMS: Symptom[] = (Object.keys(SYMPTOM_LABELS) as Symptom[]).filter((s) => s !== 'none');

/** Pick 1–3 distinct symptoms at random (sample without replacement). */
function randomSymptoms(): Symptom[] {
  const pool = [...SICK_SYMPTOMS];
  const count = 1 + Math.floor(Math.random() * 3); // 1..3
  const out: Symptom[] = [];
  for (let i = 0; i < count && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

/** Generate dummy reports clustered by zip across Arizona (~360 points). */
export function generateDummyPoints(): HeatPoint[] {
  const points: HeatPoint[] = [];
  for (const { zip, n } of DUMMY_ZIPS) {
    const center = AZ_ZIP_CENTROIDS[zip];
    for (let i = 0; i < n; i++) {
      const type = TYPES[Math.floor(Math.random() * TYPES.length)];
      const health: Health | undefined =
        type === 'human' ? (Math.random() < 0.55 ? 'sick' : 'healthy') : undefined;
      // Symptoms are human-only: sick → 1–3 real symptoms, healthy → ['none'].
      const symptoms: Symptom[] | undefined =
        type !== 'human' ? undefined : health === 'sick' ? randomSymptoms() : ['none'];
      points.push({
        type,
        health,
        symptoms,
        lat: center[0] + jitter(0.05),
        lng: center[1] + jitter(0.06),
        weight: 1,
        zip,
      });
    }
  }
  return points;
}
