/*
Mock implementation of the reports service.

Mirrors the API contract documented in `frontend/INTEGRATION.md`:
- list({ category?, status?, county?, zip?, q?, range?, ids? }) -> Report[]
- get(id) -> Report
- patchStatus(id, status) -> Report
- addNote(id, body, author) -> Report
- reassign(id, assignee) -> Report

Mutations are session-scoped (in-memory). Network latency is faked with
a small delay so the UI loading states are exercised.
*/

import {
  REPORTS as BASE_REPORTS,
  RICH_DETAILS,
} from "../../data/reports";

const overrides = new Map(); // id -> { status?, notes: [], assignee? }
const listeners = new Set();

const LATENCY_MS = 120;
const wait = (ms = LATENCY_MS) => new Promise((r) => setTimeout(r, ms));

function applyOverride(base) {
  const o = overrides.get(base.id);
  if (!o) return base;
  return {
    ...base,
    status: o.status ?? base.status,
    notes: o.notes ?? [],
    assignee: o.assignee ?? base.assignee ?? null,
  };
}

function snapshot() {
  return BASE_REPORTS.map(applyOverride);
}

function emit() {
  listeners.forEach((fn) => fn());
}

// ── Public API ──────────────────────────────────────────────────────

export async function list(params = {}) {
  await wait();
  return snapshot().filter((report) => matchesReportFilters(report, params));
}

export async function get(id) {
  await wait();
  const base = BASE_REPORTS.find((r) => r.id === id) || BASE_REPORTS[0];
  const merged = { ...applyOverride(base), ...(RICH_DETAILS[base.id] || {}) };
  return merged;
}

export async function patchStatus(id, status) {
  await wait(80);
  const prev = overrides.get(id) || {};
  overrides.set(id, { ...prev, status });
  emit();
  return get(id);
}

export async function addNote(id, body, author = "L. Romero") {
  await wait(80);
  const prev = overrides.get(id) || {};
  const notes = prev.notes ? [...prev.notes] : [];
  notes.push({ author, body, time: new Date().toISOString() });
  overrides.set(id, { ...prev, notes });
  emit();
  return get(id);
}

export async function reassign(id, assignee) {
  await wait(80);
  const prev = overrides.get(id) || {};
  overrides.set(id, { ...prev, assignee });
  emit();
  return get(id);
}

// ── Subscription so the hook can refresh on mutation ────────────────
export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ── Local filtering helpers (kept here so the hook can do client-side
// filtering between polls without a network call) ───────────────────
const RANGE_HOURS = { "24h": 24, "7d": 24 * 7, "30d": 24 * 30, All: Infinity };

const STATUS_FILTER_TO_LABEL = {
  new: "New",
  review: "In review",
  routed: "Routed",
  resolved: "Resolved",
};

export function filterClient(reports, filters = {}) {
  return reports.filter((report) => matchesReportFilters(report, filters));
}

export function countByStatus(reports) {
  const acc = { new: 0, review: 0, routed: 0, resolved: 0, total: reports.length };
  reports.forEach((r) => {
    if (r.status === "New")            acc.new += 1;
    else if (r.status === "In review") acc.review += 1;
    else if (r.status === "Routed")    acc.routed += 1;
    else if (r.status === "Resolved")  acc.resolved += 1;
  });
  return acc;
}

function matchesReportFilters(report, filters = {}) {
  const { category, status, county, zip, q, range, ids } = filters;
  const cutoff = range && RANGE_HOURS[range] !== Infinity
    ? Date.now() - RANGE_HOURS[range] * 60 * 60 * 1000
    : -Infinity;
  const term = (q || "").trim().toLowerCase();
  const idSet = ids ? new Set(ids) : null;
  const wantStatus = status && STATUS_FILTER_TO_LABEL[status];
  const reportCounty = report.location?.county || report.county || "";
  const reportZip = report.location?.zip || report.zip || "";

  if (idSet && !idSet.has(report.id)) return false;
  if (category && category !== "all" && report.categorySlug !== category) return false;
  if (wantStatus && report.status !== wantStatus) return false;
  if (county && reportCounty.toLowerCase() !== county.toLowerCase()) return false;
  if (zip && reportZip !== zip) return false;
  if (range && new Date(report.submittedAt).getTime() < cutoff) return false;
  if (term && !buildReportSearchHaystack(report).includes(term)) return false;
  return true;
}

function buildReportSearchHaystack(report) {
  return [
    report.id,
    report.category,
    report.summary,
    report.sourceTypeLabel || "",
    report.signalPath || "",
    report.analytics?.reportClass || "",
    report.analytics?.vectorType || "",
    ...(report.analytics?.signalTags || []),
    report.location?.city || report.city || "",
    report.location?.zip || report.zip || "",
    report.location?.county || report.county || "",
    report.location?.coords || "",
  ]
    .join(" ")
    .toLowerCase();
}
