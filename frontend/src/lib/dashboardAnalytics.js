/*
Program author: epiHack frontend team + OpenAI Codex
Program purpose: Build reusable dashboard chart datasets from the shared
report model so analytics cards stay consistent with filtered report views.
*/

import {
  addDays,
  addHours,
  format,
  startOfDay,
  startOfHour,
  subDays,
  subHours,
} from "date-fns";

export const DASHBOARD_TREND_COLORS = Object.freeze({
  people: "#5b6cff",
  animal: "#00a67e",
  env: "#d4a017",
});

export const DASHBOARD_CATEGORY_COLORS = Object.freeze({
  people: "#2f55d4",
  animal: "#0f9f73",
  env: "#c47b00",
});

export const DASHBOARD_TREND_SERIES = [
  { key: "people", label: "People", color: DASHBOARD_TREND_COLORS.people },
  { key: "animal", label: "Animal", color: DASHBOARD_TREND_COLORS.animal },
  { key: "env", label: "Environment", color: DASHBOARD_TREND_COLORS.env },
];

export const DASHBOARD_CATEGORY_SERIES = [
  { key: "people", label: "People", color: DASHBOARD_CATEGORY_COLORS.people },
  { key: "animal", label: "Animal", color: DASHBOARD_CATEGORY_COLORS.animal },
  { key: "env", label: "Environment", color: DASHBOARD_CATEGORY_COLORS.env },
];

export function buildTrendSeries(reports, range = "All", now = new Date()) {
  const bucketMode = range === "24h" ? "hour" : "day";
  const buckets = createBuckets(reports, range, now, bucketMode);
  const bucketIndex = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  reports.forEach((report) => {
    const submittedAt = new Date(report.submittedAt);
    const key = bucketMode === "hour"
      ? format(startOfHour(submittedAt), "yyyy-MM-dd-HH")
      : format(startOfDay(submittedAt), "yyyy-MM-dd");
    const bucket = bucketIndex.get(key);
    if (!bucket) return;
    bucket[report.categorySlug] += 1;
    bucket.total += 1;
  });

  return buckets;
}

export function buildCategoryBreakdown(reports) {
  const totalImpact = reports.reduce(
    (sum, report) => sum + Number(report.analytics?.impactScore || 0),
    0,
  ) || 1;

  return DASHBOARD_CATEGORY_SERIES
    .map((category) => {
      const scopedReports = reports.filter(
        (report) => report.categorySlug === category.key,
      );
      const count = scopedReports.length;
      const impact = scopedReports.reduce(
        (sum, report) => sum + Number(report.analytics?.impactScore || 0),
        0,
      );

      return {
        ...category,
        count,
        impact,
        share: Math.round((impact / totalImpact) * 100),
      };
    })
    .sort((a, b) => b.impact - a.impact);
}

// Deterministic mock traffic so the demo numbers stay stable across reloads
// but look believable. Numbers grow toward the present and dip on weekends.
export function buildTrafficSeries(days = 30, now = new Date()) {
  const start = startOfDay(subDays(now, days - 1));
  const buckets = [];

  for (let i = 0; i < days; i += 1) {
    const date = addDays(start, i);
    const dow = date.getDay(); // 0 = Sun, 6 = Sat
    const weekend = dow === 0 || dow === 6 ? 0.55 : 1;
    const trend = 0.6 + (i / days) * 0.45; // gentle upward
    const seed = (date.getDate() * 13 + (date.getMonth() + 1) * 31) % 17;
    const noise = 0.78 + (seed / 17) * 0.42;

    const visitors = Math.round(180 * weekend * trend * noise);
    const sessions = Math.round(visitors * (1.22 + (seed % 5) * 0.02));
    const pageviews = Math.round(sessions * (2.4 + (seed % 7) * 0.06));

    buckets.push({
      key: format(date, "yyyy-MM-dd"),
      label: format(date, days <= 7 ? "EEE" : "MMM d"),
      visitors,
      sessions,
      pageviews,
    });
  }

  const visitorsTotal  = buckets.reduce((s, b) => s + b.visitors, 0);
  const sessionsTotal  = buckets.reduce((s, b) => s + b.sessions, 0);
  const pageviewsTotal = buckets.reduce((s, b) => s + b.pageviews, 0);

  // Compare the second half of the window to the first to fake a delta.
  const mid = Math.floor(days / 2);
  const recent = buckets.slice(mid).reduce((s, b) => s + b.visitors, 0);
  const prior  = buckets.slice(0, mid).reduce((s, b) => s + b.visitors, 0) || 1;
  const deltaPct = Math.round(((recent - prior) / prior) * 100);

  return {
    buckets,
    totals: {
      visitors: visitorsTotal,
      sessions: sessionsTotal,
      pageviews: pageviewsTotal,
      avgDaily: Math.round(visitorsTotal / days),
      deltaPct,
    },
  };
}

export const TRAFFIC_TOP_PAGES = Object.freeze([
  { path: "/",              label: "Public landing",   share: 38 },
  { path: "/report",        label: "Submit a report",  share: 26 },
  { path: "/user/login",    label: "User sign-in",     share: 14 },
  { path: "/user/register", label: "Create account",   share: 11 },
  { path: "/login",         label: "Agency sign-in",   share: 7  },
  { path: "/user/dashboard", label: "User dashboard",  share: 4  },
]);

export const TRAFFIC_SOURCES = Object.freeze([
  { key: "direct",   label: "Direct",      share: 42, color: "#5b6cff" },
  { key: "search",   label: "Search",      share: 28, color: "#00a67e" },
  { key: "social",   label: "Social",      share: 16, color: "#d4a017" },
  { key: "referral", label: "Referral",    share: 9,  color: "#9d7bea" },
  { key: "email",    label: "Email / SMS", share: 5,  color: "#e76f51" },
]);

export function buildSignalBreakdown(reports, limit = 8) {
  const tags = new Map();
  const totalReports = Math.max(reports.length, 1);

  reports.forEach((report) => {
    const seen = new Set(deriveSignalTags(report));
    seen.forEach((tag) => {
      const current = tags.get(tag) || {
        key: slugify(tag),
        label: tag,
        count: 0,
        impact: 0,
        categories: {
          people: 0,
          animal: 0,
          env: 0,
        },
      };

      current.count += 1;
      current.impact += Number(report.analytics?.impactScore || 0);
      current.categories[report.categorySlug] += 1;
      tags.set(tag, current);
    });
  });

  return [...tags.values()]
    .map((entry) => {
      const dominantCategory = dominantCategoryKey(entry.categories);
      return {
        key: entry.key,
        label: entry.label,
        count: entry.count,
        impact: entry.impact,
        share: Math.round((entry.count / totalReports) * 100),
        categorySlug: dominantCategory,
        categoryLabel: DASHBOARD_CATEGORY_SERIES.find((series) => series.key === dominantCategory)?.label || "People",
        color: DASHBOARD_CATEGORY_COLORS[dominantCategory] || DASHBOARD_CATEGORY_COLORS.people,
      };
    })
    .sort((a, b) => b.count - a.count || b.impact - a.impact || a.label.localeCompare(b.label))
    .slice(0, limit);
}

function deriveSignalTags(report) {
  const analytics = report.analytics || {};
  const explicit = analytics.signalTags || [];
  if (explicit.length) {
    return explicit.filter(Boolean);
  }

  const fallback = [
    ...(analytics.symptoms || []),
    ...(analytics.severeSignals || []),
    ...(analytics.clinicalSigns || []),
    analytics.signalType,
    analytics.vectorType ? `${analytics.vectorType} activity` : null,
    analytics.unusualIncrease ? "Unusual vector increase" : null,
    analytics.numAnimalsDead > 0 ? "Animal deaths" : null,
    analytics.biteReports > 0 ? "Bite reports" : null,
    analytics.severityLevel === "High" ? "High-priority hazard" : null,
  ].filter(Boolean);

  if (fallback.length) {
    return [...new Set(fallback)];
  }

  const summarySeed = String(report.summary || "").split(/[,.]/)[0]?.trim();
  if (summarySeed) {
    return [summarySeed];
  }

  return ["Field signal"];
}

function createBuckets(reports, range, now, bucketMode) {
  const isHourly = bucketMode === "hour";
  const fixedCount = range === "24h" ? 24 : range === "7d" ? 7 : range === "30d" ? 30 : null;
  const step = isHourly ? addHours : addDays;
  const start = fixedCount
    ? isHourly
      ? startOfHour(subHours(now, fixedCount - 1))
      : startOfDay(subDays(now, fixedCount - 1))
    : deriveAllRangeStart(reports, isHourly);
  const count = fixedCount || deriveAllRangeCount(start, now, isHourly);

  return Array.from({ length: count }, (_, index) => {
    const bucketDate = step(start, index);
    const key = isHourly
      ? format(bucketDate, "yyyy-MM-dd-HH")
      : format(bucketDate, "yyyy-MM-dd");
    const label = isHourly
      ? format(bucketDate, "ha")
      : range === "7d"
        ? format(bucketDate, "EEE")
        : format(bucketDate, "MMM d");

    return {
      key,
      label,
      total: 0,
      people: 0,
      animal: 0,
      env: 0,
    };
  });
}

function deriveAllRangeStart(reports, isHourly) {
  if (!reports.length) {
    return isHourly ? startOfHour(new Date()) : startOfDay(subDays(new Date(), 6));
  }

  const timestamps = reports.map((report) => new Date(report.submittedAt).getTime());
  const minTimestamp = Math.min(...timestamps);
  return isHourly
    ? startOfHour(new Date(minTimestamp))
    : startOfDay(new Date(minTimestamp));
}

function deriveAllRangeCount(start, now, isHourly) {
  const startTime = start.getTime();
  const nowTime = now.getTime();
  const diffMs = Math.max(nowTime - startTime, 0);
  const bucketMs = isHourly ? 60 * 60 * 1000 : 24 * 60 * 60 * 1000;
  return Math.max(Math.ceil(diffMs / bucketMs) + 1, 1);
}

function dominantCategoryKey(categories) {
  return Object.entries(categories)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))[0]?.[0] || "people";
}

function slugify(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
