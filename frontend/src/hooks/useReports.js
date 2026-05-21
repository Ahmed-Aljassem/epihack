/*
React hook layer over `reportsService` (mock or live API based on the
`SOURCES` flag in `services/dataSources.js`).

`useReports({ filters })` -> { reports, allReports, counts, scopedCounts,
allCounts, lastUpdatedAt, loading, error, refresh, mutate*() }

`useReport(id)` -> { report, loading, error, refresh }

Polling, client-side filtering, and mutation broadcasting happen here
so the consuming pages stay simple.
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { reportsService } from "../services/dataSources";
import { filterClient, countByStatus, subscribe } from "../services/mocks/reports.mock";
import { normalizeReportFilters, omitReportFilters } from "../lib/reportFilters";

const POLL_MS = 30_000;

// ── List hook ───────────────────────────────────────────────────────

export function useReports({ filters = {} } = {}) {
  const [all, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState(null);

  const refresh = useCallback(async () => {
    setError(null);
    try {
      const data = await reportsService.list();
      setAll(data);
      setLastUpdatedAt(Date.now());
    } catch (err) {
      setError(err);
      toast.error("Couldn't load reports — using last-known data");
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll every 30s
  useEffect(() => {
    const t = setInterval(refresh, POLL_MS);
    return () => clearInterval(t);
  }, [refresh]);

  // Subscribe to mock-store mutations so we can refresh between polls
  useEffect(() => {
    if (typeof subscribe !== "function") return undefined;
    return subscribe(refresh);
  }, [refresh]);

  const normalizedFilters = useMemo(
    () => normalizeReportFilters(filters),
    [filters],
  );
  const reports = useMemo(
    () => filterClient(all, normalizedFilters),
    [all, normalizedFilters],
  );
  const scopedReports = useMemo(
    () => filterClient(all, omitReportFilters(normalizedFilters, ["status"])),
    [all, normalizedFilters],
  );
  const counts = useMemo(() => countByStatus(reports), [reports]);
  const scopedCounts = useMemo(() => countByStatus(scopedReports), [scopedReports]);
  const allCounts = useMemo(() => countByStatus(all), [all]);

  return {
    reports,
    allReports: all,
    counts,
    scopedCounts,
    allCounts,
    loading,
    error,
    lastUpdatedAt,
    refresh,
  };
}

// ── Detail hook ─────────────────────────────────────────────────────

export function useReport(id) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    if (!id) return;
    setError(null);
    try {
      const data = await reportsService.get(id);
      setReport(data);
    } catch (err) {
      setError(err);
      toast.error("Couldn't load this report");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (typeof subscribe !== "function") return undefined;
    return subscribe(refresh);
  }, [refresh]);

  return { report, loading, error, refresh };
}

// ── Mutations (toast-wrapped, broadcast via the service) ────────────

export async function updateStatus(id, status) {
  try {
    await reportsService.patchStatus(id, status);
    toast.success(`Status → ${status}`);
  } catch (err) {
    toast.error("Couldn't update status");
    throw err;
  }
}

export async function addNote(id, body, author = "L. Romero") {
  try {
    await reportsService.addNote(id, body, author);
    toast.success("Note added");
  } catch (err) {
    toast.error("Couldn't post the note");
    throw err;
  }
}

export async function reassign(id, assignee) {
  try {
    await reportsService.reassign(id, assignee);
    toast.success(`Reassigned to ${assignee}`);
  } catch (err) {
    toast.error("Couldn't reassign");
    throw err;
  }
}

// ── URL-sync helpers (used by ReportsListPage / MapPage) ────────────

export function filtersFromSearchParams(searchParams, defaults = {}) {
  return normalizeReportFilters({
    ...defaults,
    category: searchParams.get("category") || defaults.category,
    range: searchParams.get("range") || defaults.range,
    status: searchParams.get("status") || defaults.status,
    county: searchParams.get("county") || defaults.county,
    zip: searchParams.get("zip") || defaults.zip,
    q: searchParams.get("q") || defaults.q,
  });
}

export function filtersToSearchParams(filters) {
  const current = normalizeReportFilters(filters);
  const params = new URLSearchParams();
  if (current.category && current.category !== "all") params.set("category", current.category);
  if (current.range && current.range !== "All") params.set("range", current.range);
  if (current.status) params.set("status", current.status);
  if (current.county) params.set("county", current.county);
  if (current.zip) params.set("zip", current.zip);
  if (current.q) params.set("q", current.q);
  return params;
}
