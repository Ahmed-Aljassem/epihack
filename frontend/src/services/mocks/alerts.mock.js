/*
Mock implementation of the alerts service.
*/

const SEED = [
  {
    id: "alert-24",
    title: "Mosquito activity rising — drain standing water",
    description: "Mosquito activity is up across NW Pima. Standing-water reports trending +28% week-over-week.",
    severity: "high",
    category: "vector",
    status: "open",
    anomaly_score: 2.84,
    created_at: "2026-05-19T14:48:00Z",
    channels: ["Web", "SMS", "Email"],
    target: "85719 · 85705 · 85745",
    message:
      "Mosquito activity is rising in NW Pima. Drain standing water around your home. Use repellent at dawn and dusk. If a household member has fever + rash, contact your provider.",
    linked_reports: ["RPT-1022", "RPT-1014", "RPT-1009"],
  },
  {
    id: "alert-23",
    title: "Fever cluster · 3 households · 85735",
    description: "Linked reports from 3 households within 24 hours. Awaiting routing decision.",
    severity: "medium",
    category: "people",
    status: "investigating",
    anomaly_score: 1.91,
    created_at: "2026-05-19T13:12:00Z",
    channels: ["Web", "Email"],
    target: "85735",
    message: "",
    linked_reports: ["RPT-1023"],
  },
  {
    id: "alert-22",
    title: "Unsteady coyote · pasture · 85719",
    description: "Single-source animal report routed to AZGF rabies surveillance.",
    severity: "high",
    category: "animal",
    status: "open",
    anomaly_score: 2.41,
    created_at: "2026-05-19T12:14:00Z",
    channels: ["SMS"],
    target: "85719",
    message: "",
    linked_reports: ["RPT-1024"],
  },
  {
    id: "alert-21",
    title: "Heat advisory · Pima, Pinal, Santa Cruz",
    description: "NWS heat advisory in effect through Friday. Reissue cooling-center reminder.",
    severity: "medium",
    category: "env",
    status: "open",
    anomaly_score: null,
    created_at: "2026-05-19T08:00:00Z",
    channels: ["Web", "SMS", "Email"],
    target: "85701..85777",
    message: "",
    linked_reports: [],
  },
  {
    id: "alert-20",
    title: "Resolved: water sampling · Marana",
    description: "ADEQ sampling cleared the standing-water concern reported on Friday.",
    severity: "low",
    category: "env",
    status: "resolved",
    anomaly_score: null,
    created_at: "2026-05-17T09:30:00Z",
    channels: ["Web"],
    target: "Marana",
    message: "",
    linked_reports: [],
  },
];

const overrides = new Map();
const created = [];

const wait = (ms = 120) => new Promise((r) => setTimeout(r, ms));

function applyOverride(alert) {
  const o = overrides.get(alert.id);
  return o ? { ...alert, ...o } : alert;
}

function snapshot() {
  return [...created, ...SEED].map(applyOverride);
}

export async function list(params = {}) {
  await wait();
  let data = snapshot();
  if (params.severity) data = data.filter((a) => a.severity === params.severity);
  if (params.alert_status) data = data.filter((a) => a.status === params.alert_status);
  return data;
}

export async function get(id) {
  await wait();
  return snapshot().find((a) => a.id === id) || null;
}

export async function create(data) {
  await wait(180);
  const next = {
    id: `alert-${Date.now()}`,
    status: "open",
    anomaly_score: null,
    created_at: new Date().toISOString(),
    linked_reports: [],
    channels: ["Web"],
    ...data,
  };
  created.unshift(next);
  return next;
}

export async function updateStatus(id, status) {
  await wait(80);
  const prev = overrides.get(id) || {};
  overrides.set(id, { ...prev, status });
  return snapshot().find((a) => a.id === id);
}
