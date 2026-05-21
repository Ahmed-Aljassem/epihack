/*
Author: OpenAI Codex pair-programming support
Purpose: Normalize report locations to Arizona ZIPs while preserving exact
coordinates when the source provides them.
*/

const DEG = Math.PI / 180;
const EARTH_MI = 3958.8;

// Coarse Arizona bounds used to reject obviously out-of-state coordinates
// before snapping them to the nearest supported ZIP centroid.
const ARIZONA_BOUNDS = {
  minLatitude: 31.2,
  maxLatitude: 37.1,
  minLongitude: -114.9,
  maxLongitude: -109.0,
};

export const ARIZONA_ZIP_CENTROIDS = {
  "85003": { zip: "85003", city: "Phoenix", county: "Maricopa Co.", latitude: 33.451, longitude: -112.073 },
  "85201": { zip: "85201", city: "Mesa", county: "Maricopa Co.", latitude: 33.415, longitude: -111.831 },
  "85251": { zip: "85251", city: "Scottsdale", county: "Maricopa Co.", latitude: 33.494, longitude: -111.926 },
  "85301": { zip: "85301", city: "Glendale", county: "Maricopa Co.", latitude: 33.535, longitude: -112.185 },
  "85323": { zip: "85323", city: "Avondale", county: "Maricopa Co.", latitude: 33.435, longitude: -112.349 },
  "85337": { zip: "85337", city: "Gila Bend", county: "Maricopa Co.", latitude: 32.947, longitude: -112.717 },
  "85344": { zip: "85344", city: "Parker", county: "La Paz Co.", latitude: 34.15, longitude: -114.289 },
  "85346": { zip: "85346", city: "Quartzsite", county: "La Paz Co.", latitude: 33.664, longitude: -114.229 },
  "85350": { zip: "85350", city: "Somerton", county: "Yuma Co.", latitude: 32.597, longitude: -114.708 },
  "85356": { zip: "85356", city: "Wellton", county: "Yuma Co.", latitude: 32.693, longitude: -114.146 },
  "85364": { zip: "85364", city: "Yuma", county: "Yuma Co.", latitude: 32.693, longitude: -114.627 },
  "85390": { zip: "85390", city: "Wickenburg", county: "Maricopa Co.", latitude: 33.968, longitude: -112.729 },
  "85501": { zip: "85501", city: "Globe", county: "Gila Co.", latitude: 33.394, longitude: -110.786 },
  "85541": { zip: "85541", city: "Payson", county: "Gila Co.", latitude: 34.23, longitude: -111.326 },
  "85602": { zip: "85602", city: "Benson", county: "Cochise Co.", latitude: 31.968, longitude: -110.294 },
  "85603": { zip: "85603", city: "Bisbee", county: "Cochise Co.", latitude: 31.448, longitude: -109.928 },
  "85614": { zip: "85614", city: "Green Valley", county: "Pima Co.", latitude: 31.854, longitude: -111.0 },
  "85621": { zip: "85621", city: "Nogales", county: "Santa Cruz Co.", latitude: 31.34, longitude: -110.934 },
  "85631": { zip: "85631", city: "Douglas", county: "Cochise Co.", latitude: 31.344, longitude: -109.545 },
  "85635": { zip: "85635", city: "Sierra Vista", county: "Cochise Co.", latitude: 31.555, longitude: -110.303 },
  "85643": { zip: "85643", city: "Willcox", county: "Cochise Co.", latitude: 32.253, longitude: -109.832 },
  "85646": { zip: "85646", city: "Rio Rico", county: "Santa Cruz Co.", latitude: 31.481, longitude: -111.005 },
  "85653": { zip: "85653", city: "Marana", county: "Pima Co.", latitude: 32.437, longitude: -111.222 },
  "85701": { zip: "85701", city: "Tucson", county: "Pima Co.", latitude: 32.222, longitude: -110.974 },
  "85705": { zip: "85705", city: "Tucson", county: "Pima Co.", latitude: 32.286, longitude: -111.012 },
  "85719": { zip: "85719", city: "Tucson", county: "Pima Co.", latitude: 32.233, longitude: -110.95 },
  "85735": { zip: "85735", city: "Tucson", county: "Pima Co.", latitude: 32.129, longitude: -111.175 },
  "85901": { zip: "85901", city: "Show Low", county: "Navajo Co.", latitude: 34.254, longitude: -110.03 },
  "85925": { zip: "85925", city: "Eagar", county: "Apache Co.", latitude: 34.111, longitude: -109.291 },
  "85935": { zip: "85935", city: "Pinetop-Lakeside", county: "Navajo Co.", latitude: 34.121, longitude: -109.96 },
  "85936": { zip: "85936", city: "St. Johns", county: "Apache Co.", latitude: 34.505, longitude: -109.36 },
  "86001": { zip: "86001", city: "Flagstaff", county: "Coconino Co.", latitude: 35.198, longitude: -111.651 },
  "86021": { zip: "86021", city: "Colorado City", county: "Mohave Co.", latitude: 36.995, longitude: -112.975 },
  "86022": { zip: "86022", city: "Fredonia", county: "Coconino Co.", latitude: 36.946, longitude: -112.526 },
  "86025": { zip: "86025", city: "Holbrook", county: "Navajo Co.", latitude: 34.902, longitude: -110.158 },
  "86033": { zip: "86033", city: "Kayenta", county: "Navajo Co.", latitude: 36.728, longitude: -110.254 },
  "86040": { zip: "86040", city: "Page", county: "Coconino Co.", latitude: 36.918, longitude: -111.455 },
  "86045": { zip: "86045", city: "Tuba City", county: "Coconino Co.", latitude: 36.134, longitude: -111.239 },
  "86046": { zip: "86046", city: "Williams", county: "Coconino Co.", latitude: 35.25, longitude: -112.191 },
  "86047": { zip: "86047", city: "Winslow", county: "Navajo Co.", latitude: 35.024, longitude: -110.697 },
  "86301": { zip: "86301", city: "Prescott", county: "Yavapai Co.", latitude: 34.54, longitude: -112.468 },
  "86314": { zip: "86314", city: "Prescott Valley", county: "Yavapai Co.", latitude: 34.601, longitude: -112.325 },
  "86326": { zip: "86326", city: "Cottonwood", county: "Yavapai Co.", latitude: 34.739, longitude: -112.009 },
  "86336": { zip: "86336", city: "Sedona", county: "Yavapai Co.", latitude: 34.87, longitude: -111.76 },
  "86401": { zip: "86401", city: "Kingman", county: "Mohave Co.", latitude: 35.189, longitude: -114.053 },
  "86403": { zip: "86403", city: "Lake Havasu City", county: "Mohave Co.", latitude: 34.483, longitude: -114.322 },
  "86426": { zip: "86426", city: "Fort Mohave", county: "Mohave Co.", latitude: 35.005, longitude: -114.597 },
  "86442": { zip: "86442", city: "Bullhead City", county: "Mohave Co.", latitude: 35.135, longitude: -114.528 },
  "86503": { zip: "86503", city: "Chinle", county: "Apache Co.", latitude: 36.154, longitude: -109.552 },
  "86505": { zip: "86505", city: "Ganado", county: "Apache Co.", latitude: 35.711, longitude: -109.542 },
  "86515": { zip: "86515", city: "Window Rock", county: "Apache Co.", latitude: 35.68, longitude: -109.052 },
};

const ARIZONA_ZIP_LIST = Object.values(ARIZONA_ZIP_CENTROIDS);

function formatCoordinates(latitude, longitude) {
  return `${Number(latitude).toFixed(3)}, ${Number(longitude).toFixed(3)}`;
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

function normalizeZip(zip) {
  return String(zip || "").trim();
}

function hasFiniteCoordinates(location) {
  return Number.isFinite(location?.latitude) && Number.isFinite(location?.longitude);
}

export function isArizonaZip(zip) {
  return Boolean(ARIZONA_ZIP_CENTROIDS[normalizeZip(zip)]);
}

export function coordinatesLookLikeArizona(location) {
  if (!hasFiniteCoordinates(location)) return false;
  return (
    location.latitude >= ARIZONA_BOUNDS.minLatitude &&
    location.latitude <= ARIZONA_BOUNDS.maxLatitude &&
    location.longitude >= ARIZONA_BOUNDS.minLongitude &&
    location.longitude <= ARIZONA_BOUNDS.maxLongitude
  );
}

export function lookupArizonaZip(zip) {
  return ARIZONA_ZIP_CENTROIDS[normalizeZip(zip)] || null;
}

export function nearestArizonaZipForCoordinates(location) {
  if (!coordinatesLookLikeArizona(location)) {
    return null;
  }

  let best = null;
  for (const candidate of ARIZONA_ZIP_LIST) {
    const miles = haversineMi(location, candidate);
    if (!best || miles < best.miles) {
      best = { ...candidate, miles };
    }
  }
  return best;
}

export function resolveArizonaLocation(location) {
  if (hasFiniteCoordinates(location)) {
    const byCoordinates = nearestArizonaZipForCoordinates(location);
    if (!byCoordinates) {
      throw new Error(
        `Out-of-state coordinates are not allowed: ${location.latitude}, ${location.longitude}`
      );
    }
    return {
      zip: byCoordinates.zip,
      city: byCoordinates.city,
      county: byCoordinates.county,
      latitude: location.latitude,
      longitude: location.longitude,
      centroidLatitude: byCoordinates.latitude,
      centroidLongitude: byCoordinates.longitude,
      precision: "coordinates",
      hasExactCoordinates: true,
      mappedZipDistanceMi: byCoordinates.miles,
      coords: formatCoordinates(location.latitude, location.longitude),
    };
  }

  const byZip = lookupArizonaZip(location?.zip);
  if (byZip) {
    return {
      zip: byZip.zip,
      city: byZip.city,
      county: byZip.county,
      latitude: byZip.latitude,
      longitude: byZip.longitude,
      centroidLatitude: byZip.latitude,
      centroidLongitude: byZip.longitude,
      precision: "zip",
      hasExactCoordinates: false,
      mappedZipDistanceMi: 0,
      coords: formatCoordinates(byZip.latitude, byZip.longitude),
    };
  }

  throw new Error("Reports must include an Arizona ZIP or Arizona coordinates.");
}
