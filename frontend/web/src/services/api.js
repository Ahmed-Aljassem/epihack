import axios from "axios";
import { tokens } from "../auth/tokens";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach stored Cognito id_token to every request
api.interceptors.request.use((config) => {
  const token = tokens.get();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// On 401, clear the token and send the user to login
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      tokens.clear();
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Surveys ─────────────────────────────────────────────────────
export const surveysAPI = {
  list:         (params)         => api.get("/api/surveys", { params }),
  get:          (id)             => api.get(`/api/surveys/${id}`),
  create:       (data)           => api.post("/api/surveys", data),
  updateStatus: (id, status)     => api.patch(`/api/surveys/${id}/status`, null, { params: { new_status: status } }),
  delete:       (id)             => api.delete(`/api/surveys/${id}`),
};

// ── Responses ────────────────────────────────────────────────────
export const responsesAPI = {
  submit:    (data)               => api.post("/api/responses", data),
  forSurvey: (surveyId, params)   => api.get(`/api/responses/survey/${surveyId}`, { params }),
  mine:      (params)             => api.get("/api/responses/me", { params }),
};

// ── Alerts ───────────────────────────────────────────────────────
export const alertsAPI = {
  list:         (params)         => api.get("/api/alerts", { params }),
  get:          (id)             => api.get(`/api/alerts/${id}`),
  create:       (data)           => api.post("/api/alerts", data),
  updateStatus: (id, status)     => api.patch(`/api/alerts/${id}/status`, null, { params: { new_status: status } }),
};

// ── Dashboard ────────────────────────────────────────────────────
export const dashboardAPI = {
  stats: ()           => api.get("/api/dashboard/stats"),
  trend: (days = 7)   => api.get("/api/dashboard/trend", { params: { days } }),
};

export default api;
