/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Keep report-filter defaults, option builders, and counters
shared across the dashboard, reports list, and map pages.
*/

export const REPORT_CATEGORY_FILTERS = [
  { id: "all", label: "All categories" },
  { id: "people", label: "People" },
  { id: "animal", label: "Animal" },
  { id: "env", label: "Environment" },
  { id: "vector", label: "Vector" },
];

export const REPORT_RANGE_FILTERS = ["24h", "7d", "30d", "All"];

export const REPORT_STATUS_FILTERS = [
  { id: "", label: "All stages" },
  { id: "new", label: "New" },
  { id: "review", label: "In review" },
  { id: "routed", label: "Routed" },
  { id: "resolved", label: "Resolved" },
];

export const DEFAULT_REPORT_FILTERS = Object.freeze({
  category: "all",
  range: "All",
  status: "",
  county: "",
  zip: "",
  q: "",
});

export function normalizeReportFilters(filters = {}) {
  return {
    ...DEFAULT_REPORT_FILTERS,
    ...filters,
  };
}

export function omitReportFilters(filters, keys = []) {
  const next = normalizeReportFilters(filters);
  keys.forEach((key) => {
    if (Object.hasOwn(DEFAULT_REPORT_FILTERS, key)) {
      next[key] = DEFAULT_REPORT_FILTERS[key];
    }
  });
  return next;
}

export function hasActiveReportFilters(
  filters,
  { includeStatus = true, includeSearch = true } = {},
) {
  const current = normalizeReportFilters(filters);

  return Object.entries(DEFAULT_REPORT_FILTERS).some(([key, defaultValue]) => {
    if (!includeStatus && key === "status") return false;
    if (!includeSearch && key === "q") return false;
    return current[key] !== defaultValue;
  });
}

export function countReportsByCategory(reports = []) {
  const counts = {
    all: reports.length,
    people: 0,
    animal: 0,
    env: 0,
    vector: 0,
  };

  reports.forEach((report) => {
    if (counts[report.categorySlug] !== undefined) {
      counts[report.categorySlug] += 1;
    }
  });

  return counts;
}

export function getReportFilterOptions(reports = []) {
  const countySet = new Set();
  const zipSet = new Set();

  reports.forEach((report) => {
    if (report.location?.county) countySet.add(report.location.county);
    if (report.location?.zip) zipSet.add(report.location.zip);
  });

  return {
    counties: [...countySet].sort((a, b) => a.localeCompare(b)),
    zips: [...zipSet].sort((a, b) => a.localeCompare(b, undefined, { numeric: true })),
  };
}
