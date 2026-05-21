/*
Mock implementation of the reports service.

Mirrors the API contract documented in `frontend/INTEGRATION.md`:
- list({ category?, status?, q?, range?, ids? }) -> Report[]
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
  let data = snapshot();
  const { category, status, q, range, ids } = params;

  if (ids) {
    const set = new Set(ids);
    data = data.filter((r) => set.has(r.id));
  }

  if (category && category !== "all") {
    data = data.filter((r) => r.categorySlug === category);
  }

  if (status) {
    const label = STATUS_FILTER_TO_LABEL[status];
    if (label) data = data.filter((r) => r.status === label);
  }

  if (range && RANGE_HOURS[range] !== Infinity) {
    const cutoff = Date.now() - RANGE_HOURS[range] * 60 * 60 * 1000;
    data = data.filter((r) => new Date(r.submittedAt).getTime() >= cutoff);
  }

  if (q) {
    const term = q.trim().toLowerCase();
    data = data.filter((r) => {
      const hay = `${r.id} ${r.category} ${r.summary} ${r.location?.coords || ""}`.toLowerCase();
      return hay.includes(term);
    });
  }

  return data;
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
  const { category, status, q, range, ids } = filters;
  const cutoff = range && RANGE_HOURS[range] !== Infinity
    ? Date.now() - RANGE_HOURS[range] * 60 * 60 * 1000
    : -Infinity;
  const term = (q || "").trim().toLowerCase();
  const idSet = ids ? new Set(ids) : null;
  const wantStatus = status && STATUS_FILTER_TO_LABEL[status];

  return reports.filter((r) => {
    if (idSet && !idSet.has(r.id)) return false;
    if (category && category !== "all" && r.categorySlug !== category) return false;
    if (wantStatus && r.status !== wantStatus) return false;
    if (range && new Date(r.submittedAt).getTime() < cutoff) return false;
    if (term) {
      const hay = `${r.id} ${r.category} ${r.summary} ${r.location?.coords || ""}`.toLowerCase();
      if (!hay.includes(term)) return false;
    }
    return true;
  });
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
