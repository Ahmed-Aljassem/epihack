import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Attach token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

// ── Auth ────────────────────────────────────────────────────────
export const authAPI = {
  register: (data) => api.post("/api/auth/register", data),
  login: (email, password) =>
    api.post(
      "/api/auth/login",
      new URLSearchParams({ username: email, password }),
      { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    ),
  me: () => api.get("/api/auth/me"),
};

// ── Surveys ─────────────────────────────────────────────────────
export const surveysAPI = {
  list: (params) => api.get("/api/surveys", { params }),
  get: (id) => api.get(`/api/surveys/${id}`),
  create: (data) => api.post("/api/surveys", data),
  updateStatus: (id, status) =>
    api.patch(`/api/surveys/${id}/status`, null, { params: { new_status: status } }),
  delete: (id) => api.delete(`/api/surveys/${id}`),
};

// ── Responses ────────────────────────────────────────────────────
export const responsesAPI = {
  submit: (data) => api.post("/api/responses", data),
  forSurvey: (surveyId, params) =>
    api.get(`/api/responses/survey/${surveyId}`, { params }),
  mine: (params) => api.get("/api/responses/me", { params }),
};

// ── Alerts ───────────────────────────────────────────────────────
export const alertsAPI = {
  list: (params) => api.get("/api/alerts", { params }),
  get: (id) => api.get(`/api/alerts/${id}`),
  create: (data) => api.post("/api/alerts", data),
  updateStatus: (id, status) =>
    api.patch(`/api/alerts/${id}/status`, null, { params: { new_status: status } }),
};

// ── Dashboard ────────────────────────────────────────────────────
export const dashboardAPI = {
  stats: () => api.get("/api/dashboard/stats"),
  trend: (days = 7) => api.get("/api/dashboard/trend", { params: { days } }),
};

export default api;
