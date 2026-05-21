/*
Lightweight client-side cluster detection.

For each category, group reports within `radiusMi` of each other inside
a `windowDays` window. Returns clusters of >= `minSize`, sorted by size.

For our ~100-record mock dataset this is fast enough as a per-render
useMemo. At higher scale we'd push this server-side.
*/

const EARTH_MI = 3958.8;
const DEG = Math.PI / 180;

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

function centroid(reports) {
  const n = reports.length;
  if (!n) return { latitude: 0, longitude: 0 };
  const sum = reports.reduce(
    (acc, r) => {
      acc.lat += r.latitude;
      acc.lng += r.longitude;
      return acc;
    },
    { lat: 0, lng: 0 }
  );
  return { latitude: sum.lat / n, longitude: sum.lng / n };
}

export function detectClusters(reports, {
  radiusMi = 60,
  windowDays = 7,
  minSize = 3,
} = {}) {
  const cutoff = Date.now() - windowDays * 24 * 60 * 60 * 1000;
  const inWindow = reports.filter(
    (r) => new Date(r.submittedAt).getTime() >= cutoff
  );

  const byCat = inWindow.reduce((acc, r) => {
    (acc[r.categorySlug] = acc[r.categorySlug] || []).push(r);
    return acc;
  }, {});

  const clusters = [];

  for (const [slug, members] of Object.entries(byCat)) {
    // Simple greedy clustering. Sort by id for determinism, then
    // for each unassigned report seed a new cluster and absorb
    // anything within `radiusMi`.
    const assigned = new Set();
    const sorted = [...members].sort((a, b) => a.rawId - b.rawId);

    for (const seed of sorted) {
      if (assigned.has(seed.id)) continue;
      const group = [seed];
      assigned.add(seed.id);

      for (const candidate of sorted) {
        if (assigned.has(candidate.id)) continue;
        if (haversineMi(seed, candidate) <= radiusMi) {
          group.push(candidate);
          assigned.add(candidate.id);
        }
      }

      if (group.length >= minSize) {
        clusters.push({
          id: `${slug}-${seed.id}`,
          categorySlug: slug,
          category: seed.category,
          count: group.length,
          memberIds: group.map((r) => r.id),
          centroid: centroid(group),
          windowDays,
          radiusMi,
        });
      }
    }
  }

  clusters.sort((a, b) => b.count - a.count);
  return clusters;
}
