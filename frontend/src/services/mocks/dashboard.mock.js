/*
Mock implementation of the dashboard service.

The real dashboard derives stats from the reports list — these helpers
exist so any UI that calls the `/api/dashboard/stats` endpoint pattern
doesn't break when only the report data is mocked.
*/

import * as reportsMock from "./reports.mock";

const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

export async function stats() {
  await wait();
  const reports = await reportsMock.list();
  const counts = reportsMock.countByStatus(reports);
  const dayMs = 24 * 60 * 60 * 1000;
  const now = Date.now();

  const newToday = reports.filter(
    (r) => now - new Date(r.submittedAt).getTime() <= dayMs
  ).length;

  return {
    active_surveys: 3,
    total_responses_today: newToday,
    total_responses_all_time: counts.total,
    open_alerts: 4,
    critical_alerts: 0,
    responses_by_category: reports.reduce((acc, r) => {
      acc[r.categorySlug] = (acc[r.categorySlug] || 0) + 1;
      return acc;
    }, {}),
    recent_alerts: [],
  };
}

export async function trend(days = 14) {
  await wait();
  const out = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    out.push({
      date: d.toISOString(),
      count: 5 + Math.round(Math.sin(i / 2) * 4 + Math.random() * 3),
    });
  }
  return out;
}
