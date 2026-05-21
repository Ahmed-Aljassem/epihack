/*
React hook layer over `reportsService` (mock or live API based on the
`SOURCES` flag in `services/dataSources.js`).

`useReports({ filters })` -> { reports, allReports, counts, lastUpdatedAt,
loading, error, refresh, mutate*() }

`useReport(id)` -> { report, loading, error, refresh }

Polling, client-side filtering, and mutation broadcasting happen here
so the consuming pages stay simple.
*/

import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { reportsService } from "../services/dataSources";
import { filterClient, countByStatus, subscribe } from "../services/mocks/reports.mock";

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

  const reports = useMemo(() => filterClient(all, filters), [all, filters]);
  const counts = useMemo(() => countByStatus(all), [all]);

  return {
    reports,
    allReports: all,
    counts,
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

export function filtersFromSearchParams(searchParams) {
  return {
    category: searchParams.get("category") || "all",
    range:    searchParams.get("range")    || "All",
    status:   searchParams.get("status")   || "",
    q:        searchParams.get("q")        || "",
  };
}

export function filtersToSearchParams(filters) {
  const params = new URLSearchParams();
  if (filters.category && filters.category !== "all") params.set("category", filters.category);
  if (filters.range    && filters.range    !== "All") params.set("range",    filters.range);
  if (filters.status)                                 params.set("status",   filters.status);
  if (filters.q)                                      params.set("q",        filters.q);
  return params;
}
