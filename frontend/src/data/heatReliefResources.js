/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Provide demo Arizona heat-relief resource groups and markers
for the shared map until live ArcGIS-backed resource ingestion is wired in.
*/

export const RESOURCE_GROUPS = Object.freeze({
  coolingCenters: {
    label: "Cooling Centers",
    color: "#1677ff",
    markerLabel: "C",
    descriptor: "Indoor cooling",
    hint: "Indoor cooling and air-conditioned relief sites",
  },
  hydrationStations: {
    label: "Hydration Stations",
    color: "#13c2c2",
    markerLabel: "H",
    descriptor: "Water access",
    hint: "Water access, refill points, and outreach stops",
  },
  respiteCenters: {
    label: "Respite Centers",
    color: "#722ed1",
    markerLabel: "R",
    descriptor: "Short-stay rest",
    hint: "Short-stay rest, shade, and recovery support",
  },
});

export const RESOURCE_GROUP_ORDER = Object.keys(RESOURCE_GROUPS);

export const DEMO_HEAT_RELIEF_RESOURCES = Object.freeze({
  coolingCenters: [
    {
      name: "Peoria Community Center",
      address: "8335 W. Jefferson St.",
      city: "Peoria",
      hours: "Mon-Thu 8:00 AM-9:00 PM, Fri 8:00 AM-5:00 PM, Sat 8:00 AM-3:00 PM",
      lat: 33.579132,
      lng: -112.238699,
      county: "Maricopa",
    },
    {
      name: "Terros Health - HIV Prevention",
      address: "333 E. Indian School Rd.",
      city: "Phoenix",
      hours: "Mon-Fri 8:00 AM-5:00 PM",
      lat: 33.49454,
      lng: -112.06823,
      county: "Maricopa",
    },
    {
      name: "Kennedy Drive Cooling Center",
      address: "12307 Kennedy Dr",
      city: "Parker",
      hours: "Mon-Fri 8:00 AM-5:00 PM",
      lat: 34.147553,
      lng: -114.302166,
      county: "La Paz",
    },
    {
      name: "Wellton Cooling Center",
      address: "28790 San Jose Ave",
      city: "Wellton",
      hours: "Tue-Thu 9:00 AM-6:00 PM, Fri-Sat 9:00 AM-5:00 PM",
      lat: 32.672016,
      lng: -114.144638,
      county: "Yuma",
    },
    {
      name: "Quincie Douglas Library",
      address: "1585 E 36th St",
      city: "Tucson",
      lat: 32.18543,
      lng: -110.96669,
      county: "Pima",
    },
  ],
  hydrationStations: [
    {
      name: "Freestone Recreation Center",
      address: "1144 E. Guadalupe Rd.",
      city: "Gilbert",
      hours: "Mon-Fri 5:30 AM-10:00 PM, Sat 7:00 AM-9:00 PM, Sun 10:00 AM-5:00 PM",
      lat: 33.364,
      lng: -111.766,
      county: "Maricopa",
    },
    {
      name: "A New Leaf - East Valley Men's Center",
      address: "2345 N. Country Club Dr.",
      city: "Mesa",
      hours: "Mon-Sun 8:00 AM-4:00 PM",
      lat: 33.458,
      lng: -111.839,
      county: "Maricopa",
    },
    {
      name: "Miller-Golf Links Library",
      address: "9640 E. Golf Links Rd.",
      city: "Tucson",
      lat: 32.20718,
      lng: -110.79466,
      county: "Pima",
    },
  ],
  respiteCenters: [
    {
      name: "Redemption Church Gilbert",
      address: "1820 W. Elliot Rd.",
      city: "Gilbert",
      hours: "Mon-Thu 9:00 AM-4:00 PM",
      lat: 33.351,
      lng: -111.829,
      county: "Maricopa",
    },
    {
      name: "Men's Shelter",
      address: "200 E. Benson Hwy",
      city: "Tucson",
      hours: "12:00 PM-4:00 PM",
      lat: 32.18543,
      lng: -110.96669,
      county: "Pima",
    },
  ],
});

export async function fetchResources(group) {
  return DEMO_HEAT_RELIEF_RESOURCES[group] || [];
}

export function getResourceCount(group) {
  return DEMO_HEAT_RELIEF_RESOURCES[group]?.length || 0;
}
