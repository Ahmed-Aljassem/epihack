import initialAlerts from "../data/alerts.json";

const STORAGE_KEY = "demo-alerts";

// Initialize localStorage with default alerts if empty
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEY)) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(initialAlerts));
  }
}

export const alertsService = {
  getAll() {
    initializeStorage();
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : initialAlerts;
  },

  getNextId() {
    const alerts = this.getAll();
    return Math.max(...alerts.map((a) => a.id), 0) + 1;
  },

  add(alertData) {
    const alerts = this.getAll();
    const newAlert = {
      id: this.getNextId(),
      ...alertData,
      createdAt: new Date().toISOString(),
    };
    alerts.unshift(newAlert); // Add to front
    localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    return newAlert;
  },

  updateStatus(id, newStatus) {
    const alerts = this.getAll();
    const alert = alerts.find((a) => a.id === id);
    if (alert) {
      alert.status = newStatus;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
    }
    return alert;
  },

  getById(id) {
    const alerts = this.getAll();
    return alerts.find((a) => a.id === id);
  },

  update(id, alertData) {
    const alerts = this.getAll();
    const index = alerts.findIndex((a) => a.id === id);
    if (index !== -1) {
      alerts[index] = {
        ...alerts[index],
        ...alertData,
        id, // ensure id doesn't change
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(alerts));
      return alerts[index];
    }
    return null;
  },

  reset() {
    localStorage.removeItem(STORAGE_KEY);
    initializeStorage();
    return this.getAll();
  },
};
