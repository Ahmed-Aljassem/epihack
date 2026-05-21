/*
Enriches the bare {id, type, longitude, latitude} mock dataset into the
shape the UI needs (category label, status, submittedAt, summary, etc.).

Three rich records (RPT-1024 / 1023 / 1022) are kept for the detail page,
which expects description / activity / routing / facts.
*/

import RAW from "./reports.json";

// ── Category mapping ────────────────────────────────────────────────
// `type` from mock data -> display label + UI slug
export const CATEGORY_LABEL = {
  human:       "People",
  animal:      "Animal",
  environment: "Environment",
  vector:      "Vector",
};

// Stable ID -> filter slug used by chips ("people" / "animal" / ...).
export const CATEGORY_SLUG = {
  human:       "people",
  animal:      "animal",
  environment: "env",
  vector:      "vector",
};

export const CATEGORY_COLORS = {
  people: "#a5b4fc",
  animal: "#34d399",
  env:    "#86efac",
  vector: "#fdba74",
};

const STATUSES = ["New", "In review", "Routed", "Resolved"];

// One canonical "anchor" Date so submittedAt is deterministic across
// reloads (otherwise polling shows shifting timestamps for static data).
// Anchored to the start of "today" in the user's local timezone.
const ANCHOR = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
})();

const SUMMARY_TEMPLATES = {
  human:       (id) => `Community health signal #${id}`,
  animal:      (id) => `Animal observation #${id}`,
  environment: (id) => `Environmental concern #${id}`,
  vector:      (id) => `Vector activity #${id}`,
};

function enrich(raw) {
  const slug = CATEGORY_SLUG[raw.type] || "people";
  const label = CATEGORY_LABEL[raw.type] || "People";

  // Deterministic status — `id % 4` distributes evenly across statuses.
  const status = STATUSES[(raw.id - 1) % STATUSES.length];

  // Deterministic timestamp spread over the past 7 days.
  // Multiplier mixes id to avoid the "every 4th id has identical minute" pattern.
  const minutesAgo = (raw.id * 137) % (7 * 24 * 60);
  const submittedAtDate = new Date(Date.now() - minutesAgo * 60_000);

  const reportId = `RPT-${1000 + raw.id}`;
  const coords = `${raw.latitude.toFixed(3)}, ${raw.longitude.toFixed(3)}`;

  return {
    // Original fields preserved
    id: reportId,
    rawId: raw.id,
    type: raw.type,
    longitude: raw.longitude,
    latitude: raw.latitude,

    // Derived UI fields
    category: label,
    categorySlug: slug,
    color: CATEGORY_COLORS[slug],
    status,
    summary: SUMMARY_TEMPLATES[raw.type](raw.id),
    submittedAt: submittedAtDate.toISOString(),
    submittedShort: submittedAtDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),

    // Back-compat shape for existing pages
    location: { zip: "—", county: "Arizona", coords },
  };
}

export const REPORTS = RAW.map(enrich);

// ── Rich detail records (used by ReportDetailPage) ──────────────────
// These supplement the basic enriched record with description, activity,
// routing, facts, photo metadata. Keyed by report ID.
export const RICH_DETAILS = {
  "RPT-1024": {
    summary: "Coyote, unsteady in pasture",
    subcategory: "sick",
    location: { zip: "85719", county: "Pima Co.", coords: "32.286, -110.987" },
    submittedLabel: "Today · 2:14 PM",
    submittedShort: "2:14 PM",
    tags: ["Animal · sick", "Anonymous", "Opted-in SMS"],
    description:
      "A coyote in our pasture, acting unsteady. Stayed close for ~20 minutes. Two horses in the same field but no contact. No people approached.",
    facts: {
      signs: "Unsteady · lethargic",
      affected: "1 animal",
      danger: "No (livestock nearby)",
      observed: "Today · 2:14 PM",
      reporter: "Anonymous · SMS",
      photo: "1 attached",
    },
    photo: { name: "coyote.jpg", size: "2.1 MB" },
    routing: {
      title: "Auto-routed",
      rule: "Rule matched",
      destination: "AZ Game & Fish · Rabies surveillance · Pima Animal Care & Control",
    },
    activity: [
      { kind: "check",  title: "Submitted via mobile app", meta: "Category Animal · sick · keywords: unsteady, pasture", time: "2:14 PM" },
      { kind: "routed", title: "Routed to AZGF",           meta: "Rule: animal × unsteady × rural ZIP",                  time: "2:14 PM" },
      { kind: "note",   title: "Note · L. Romero",         meta: "Calling reporter to confirm photo metadata.",          time: "2:21 PM" },
    ],
  },
  "RPT-1023": {
    summary: "Fever cluster · 3 households",
    location: { zip: "85735", county: "Pima Co.", coords: "—" },
    submittedLabel: "Today · 1:48 PM",
    submittedShort: "1:48 PM",
    tags: ["People · fever", "Self-reported"],
  },
  "RPT-1022": {
    summary: "Mosquito activity ↑",
    location: { zip: "85705", county: "Pima Co.", coords: "—" },
    submittedLabel: "Today · 12:31 PM",
    submittedShort: "12:31 PM",
    tags: ["Vector", "Pattern · rising"],
  },
};

// Lookup that merges the enriched record + any rich detail overlay.
export function getReport(id) {
  const base = REPORTS.find((r) => r.id === id);
  if (!base) {
    // Fall back to the first record so the detail page never 404s in demos.
    const fallback = REPORTS[0];
    return { ...fallback, ...(RICH_DETAILS[fallback.id] || {}) };
  }
  return { ...base, ...(RICH_DETAILS[id] || {}) };
}
