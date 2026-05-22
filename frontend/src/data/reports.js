/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Normalize raw demo reports into the shared UI model used by
the dashboard, map, and detail pages, including Arizona location cleanup and
top-level report-path classification.
*/

import RAW from "./reports.json";
import { resolveArizonaLocation } from "./arizonaZips";
import {
  resolveVectorPathway,
  synthesizeReportProfile,
} from "./reportSynthesis";

// ── Category mapping ────────────────────────────────────────────────
// Raw non-vector report types map directly into the three main pathways.
export const CATEGORY_LABEL = {
  human:       "People",
  animal:      "Animal",
  environment: "Environment",
};

export const CATEGORY_SLUG = {
  human:       "people",
  animal:      "animal",
  environment: "env",
};

export const CATEGORY_COLORS = {
  people: "#a5b4fc",
  animal: "#34d399",
  env:    "#86efac",
};

// One canonical "anchor" Date so submittedAt is deterministic across
// reloads (otherwise polling shows shifting timestamps for static data).
// Anchored to late afternoon "today" in the user's local timezone so
// charts can still show same-day activity without becoming non-deterministic.
const ANCHOR = (() => {
  const d = new Date();
  d.setHours(18, 0, 0, 0);
  return d.getTime();
})();

function enrich(raw) {
  const normalizedLocation = resolveArizonaLocation(raw);
  const vectorPathway = raw.type === "vector"
    ? resolveVectorPathway(raw, normalizedLocation)
    : null;
  const slug = vectorPathway?.topLevelSlug || CATEGORY_SLUG[raw.type] || "people";
  const label = vectorPathway?.topLevelLabel || CATEGORY_LABEL[raw.type] || "People";
  const reportId = `RPT-${1000 + raw.id}`;
  const synthetic = synthesizeReportProfile({
    raw,
    categorySlug: slug,
    categoryLabel: label,
    location: normalizedLocation,
    anchorMs: ANCHOR,
    sourceType: raw.type,
    vectorPathway,
  });

  return {
    // Original fields preserved
    id: reportId,
    rawId: raw.id,
    type: raw.type,
    sourceType: raw.type,
    sourceTypeLabel: raw.type === "vector" ? "Vector-linked" : label,
    signalPath: vectorPathway?.pathwayLabel || null,
    signalDomain: vectorPathway?.vectorType || null,
    zip: normalizedLocation.zip,
    county: normalizedLocation.county,
    city: normalizedLocation.city,
    longitude: normalizedLocation.longitude,
    latitude: normalizedLocation.latitude,

    // Derived UI fields
    category: label,
    categorySlug: slug,
    color: CATEGORY_COLORS[slug],
    status: synthetic.status,
    summary: synthetic.summary,
    submittedAt: synthetic.submittedAtDate.toISOString(),
    submittedShort: synthetic.submittedAtDate.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" }),
    analytics: synthetic.analytics,

    // User-facing location keeps both the mapped Arizona ZIP and the exact
    // coordinates when the source provided them.
    location: {
      zip: normalizedLocation.zip,
      county: normalizedLocation.county,
      city: normalizedLocation.city,
      coords: normalizedLocation.coords,
      hasExactCoordinates: normalizedLocation.hasExactCoordinates,
      precision: normalizedLocation.precision,
    },
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
    location: { zip: "85719", county: "Pima Co.", city: "Tucson" },
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
    location: { zip: "85735", county: "Pima Co.", city: "Tucson" },
    submittedLabel: "Today · 1:48 PM",
    submittedShort: "1:48 PM",
    tags: ["People · fever", "Self-reported"],
  },
  "RPT-1022": {
    summary: "Vector-linked activity increase",
    location: { zip: "85705", county: "Pima Co.", city: "Tucson" },
    submittedLabel: "Today · 12:31 PM",
    submittedShort: "12:31 PM",
    tags: ["Vector-linked", "Pattern · rising"],
  },
};

function withResolvedLocation(report) {
  const normalizedLocation = resolveArizonaLocation({
    zip: report.location?.zip || report.zip,
    latitude: report.latitude,
    longitude: report.longitude,
  });

  return {
    ...report,
    zip: normalizedLocation.zip,
    county: normalizedLocation.county,
    city: normalizedLocation.city,
    longitude: normalizedLocation.longitude,
    latitude: normalizedLocation.latitude,
    location: {
      zip: normalizedLocation.zip,
      county: normalizedLocation.county,
      city: normalizedLocation.city,
      coords: normalizedLocation.coords,
      hasExactCoordinates: normalizedLocation.hasExactCoordinates,
      precision: normalizedLocation.precision,
    },
  };
}

// Lookup that merges the enriched record + any rich detail overlay.
export function getReport(id) {
  const base = REPORTS.find((r) => r.id === id);
  if (!base) {
    // Fall back to the first record so the detail page never 404s in demos.
    const fallback = REPORTS[0];
    return withResolvedLocation({ ...fallback, ...(RICH_DETAILS[fallback.id] || {}) });
  }
  return withResolvedLocation({ ...base, ...(RICH_DETAILS[id] || {}) });
}
