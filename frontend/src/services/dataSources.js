/*
Centralized data-source dispatcher.

Every console resource (reports, alerts, surveys, ...) reads from either
a local mock implementation or the live axios-backed API based on the
flags below. When a backend endpoint goes live, flip its flag from
"mock" to "api" and verify — no other file needs to change.

The mock implementations live in `./mocks/*.js`. The API implementations
re-use the existing axios clients from `./api.js`.
*/

import {
  alertsAPI as apiAlerts,
  surveysAPI as apiSurveys,
  responsesAPI as apiResponses,
  dashboardAPI as apiDashboard,
} from "./api";

import * as mockReports from "./mocks/reports.mock";
import * as mockAlerts from "./mocks/alerts.mock";
import * as mockSurveys from "./mocks/surveys.mock";
import * as mockResponses from "./mocks/responses.mock";
import * as mockDashboard from "./mocks/dashboard.mock";

// ── Source flags ────────────────────────────────────────────────────
// Flip to "api" once the backend endpoint lands and matches the contract
// documented in `INTEGRATION.md`.
const SOURCES = {
  reports:   "mock", // No backend endpoint yet
  alerts:    "mock", // Backend exists but contract not validated
  surveys:   "mock",
  responses: "mock",
  dashboard: "mock",
};

// ── Reports ─────────────────────────────────────────────────────────
export const reportsService = SOURCES.reports === "api"
  ? {
      // TODO: implement once /api/reports exists.
      list:   (params) => { throw new Error("reports API not yet implemented"); },
      get:    (id)     => { throw new Error("reports API not yet implemented"); },
      patchStatus: (id, status) => { throw new Error("reports API not yet implemented"); },
      addNote: (id, body)       => { throw new Error("reports API not yet implemented"); },
      reassign: (id, assignee)  => { throw new Error("reports API not yet implemented"); },
    }
  : mockReports;

// ── Alerts ──────────────────────────────────────────────────────────
export const alertsService = SOURCES.alerts === "api"
  ? {
      list: (params) => apiAlerts.list(params).then((r) => r.data),
      get:  (id)     => apiAlerts.get(id).then((r) => r.data),
      create: (data) => apiAlerts.create(data).then((r) => r.data),
      updateStatus: (id, status) => apiAlerts.updateStatus(id, status).then((r) => r.data),
    }
  : mockAlerts;

// ── Surveys ─────────────────────────────────────────────────────────
export const surveysService = SOURCES.surveys === "api"
  ? {
      list:   (params) => apiSurveys.list(params).then((r) => r.data),
      get:    (id)     => apiSurveys.get(id).then((r) => r.data),
      create: (data)   => apiSurveys.create(data).then((r) => r.data),
      updateStatus: (id, status) => apiSurveys.updateStatus(id, status).then((r) => r.data),
      delete: (id)     => apiSurveys.delete(id).then((r) => r.data),
    }
  : mockSurveys;

// ── Responses ───────────────────────────────────────────────────────
export const responsesService = SOURCES.responses === "api"
  ? {
      submit: (data) => apiResponses.submit(data).then((r) => r.data),
      forSurvey: (id, params) => apiResponses.forSurvey(id, params).then((r) => r.data),
      mine: (params) => apiResponses.mine(params).then((r) => r.data),
    }
  : mockResponses;

// ── Dashboard ───────────────────────────────────────────────────────
export const dashboardService = SOURCES.dashboard === "api"
  ? {
      stats: () => apiDashboard.stats().then((r) => r.data),
      trend: (days) => apiDashboard.trend(days).then((r) => r.data),
    }
  : mockDashboard;

// Exposed for debugging / dev tools.
export const _SOURCES = SOURCES;
