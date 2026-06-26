import api from "./client";

export const authApi = {
  login: (identifier, password) =>
    api.post("/api/auth/login", { identifier, password }).then((r) => r.data),
  me: () => api.get("/api/auth/me").then((r) => r.data),
};

export const hospitalApi = {
  list: () => api.get("/api/hospitals").then((r) => r.data),
};

export const bookingApi = {
  list: () => api.get("/api/bookings").then((r) => r.data),
  create: (payload) => api.post("/api/bookings", payload).then((r) => r.data),
  reschedule: (id, payload) =>
    api.put(`/api/bookings/${id}/reschedule`, payload).then((r) => r.data),
  cancel: (id) => api.post(`/api/bookings/${id}/cancel`).then((r) => r.data),
};

export const auditApi = {
  list: () => api.get("/api/audit-logs").then((r) => r.data),
};
