/*
Returns a string like "Updated 12s ago" that re-renders every second
so it stays fresh between data refreshes.
*/

import { useEffect, useState } from "react";

export function useTickingAgo(ts, { compact = false } = {}) {
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (!ts) return compact ? "—" : "Loading…";
  const sec = Math.max(0, Math.round((Date.now() - ts) / 1000));
  if (compact) {
    if (sec < 60) return `${sec}s`;
    const m = Math.round(sec / 60);
    if (m < 60) return `${m}m`;
    return `${Math.round(m / 60)}h`;
  }
  if (sec < 60) return `Updated ${sec}s ago`;
  const m = Math.round(sec / 60);
  if (m < 60) return `Updated ${m}m ago`;
  return `Updated ${Math.round(m / 60)}h ago`;
}
