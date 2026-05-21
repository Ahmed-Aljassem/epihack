/*
Domain hooks for surveys / responses / alerts / dashboard.

All hooks talk to `services/dataSources` so the live-vs-mock decision
is centralized. When backend endpoints land, flip the flags in
`dataSources.js` — no changes here.
*/

import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  alertsService, surveysService, responsesService, dashboardService,
} from "../services/dataSources";

// ── Generic fetch hook ────────────────────────────────────────────
export function useFetch(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchFn();
      setData(res);
      setError(null);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [load]);
  return { data, loading, error, refetch: load };
}

// ── Domain hooks ─────────────────────────────────────────────────
export function useDashboardStats() {
  return useFetch(() => dashboardService.stats());
}

export function useTrend(days = 7) {
  return useFetch(() => dashboardService.trend(days), [days]);
}

export function useSurveys(params = {}) {
  return useFetch(() => surveysService.list(params), [JSON.stringify(params)]);
}

export function useSurvey(id) {
  return useFetch(() => surveysService.get(id), [id]);
}

export function useAlerts(params = {}) {
  return useFetch(() => alertsService.list(params), [JSON.stringify(params)]);
}

export function useMyResponses() {
  return useFetch(() => responsesService.mine());
}

// ── Mutation helper ───────────────────────────────────────────────
export function useMutation(mutFn, { onSuccess, successMessage } = {}) {
  const [loading, setLoading] = useState(false);

  const mutate = async (...args) => {
    setLoading(true);
    try {
      const res = await mutFn(...args);
      if (successMessage) toast.success(successMessage);
      onSuccess?.(res);
      return res;
    } catch (err) {
      const msg = err.response?.data?.detail || err.message || "Something went wrong";
      toast.error(typeof msg === "string" ? msg : JSON.stringify(msg));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { mutate, loading };
}
