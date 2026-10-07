import { api, json } from "./api";

export const authApi = {
  register: (data) => api("/api/auth/register", json("POST", data)),
  login: (data) => api("/api/auth/login", json("POST", data)),
  me: () => api("/api/users/me"),
  update: (data) => api("/api/users/me", json("PUT", data)),
  remove: () => api("/api/users/me", { method: "DELETE" }),
};
export const prescriptionApi = {
  list: () => api("/api/prescriptions"),
  get: (id) => api(`/api/prescriptions/${id}`),
  create: (data) => api("/api/prescriptions", json("POST", data)),
  remove: (id) => api(`/api/prescriptions/${id}`, { method: "DELETE" }),
  medicines: (id) => api(`/api/prescriptions/${id}/medicines`),
  addMedicine: (id, data) => api(`/api/prescriptions/${id}/medicines`, json("POST", data)),
  updateMedicine: (id, medicineId, data) => api(`/api/prescriptions/${id}/medicines/${medicineId}`, json("PUT", data)),
  removeMedicine: (id, medicineId) => api(`/api/prescriptions/${id}/medicines/${medicineId}`, { method: "DELETE" }),
  ocr: (id) => api(`/api/ocr/${id}`),
  saveOcr: (id, data) => api(`/api/ocr/process/${id}`, json("POST", data)),
  updateOcr: (id, data) => api(`/api/ocr/${id}`, json("PUT", data)),
  analyze: (id, data = {}) => api(`/api/analyze/${id}`, json("POST", data)),
  report: (id) => api(`/api/safety-reports/${id}`),
  generateReport: (id) => api(`/api/safety-reports/generate/${id}`, { method: "POST" }),
};
export const doctorApi = {
  recommendations: (id) => api(`/api/doctor/recommendations/${id}`),
  createRecommendation: (data) => api("/api/doctor/recommendations", json("POST", data)),
  updateRecommendation: (id, data) => api(`/api/doctor/recommendations/${id}`, json("PUT", data)),
};
