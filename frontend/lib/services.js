import { api, json } from "./api";

export const authApi = {
  me: () => api("/api/users/me"),
  update: (data) => api("/api/users/me", json("PUT", data)),
};
export const prescriptionApi = {
  create: (data) => api("/api/prescriptions", json("POST", data)),
  medicines: (id) => api(`/api/prescriptions/${id}/medicines`),
  addMedicine: (id, data) => api(`/api/prescriptions/${id}/medicines`, json("POST", data)),
  updateMedicine: (id, medicineId, data) => api(`/api/prescriptions/${id}/medicines/${medicineId}`, json("PUT", data)),
  saveOcr: (id, data) => api(`/api/ocr/process/${id}`, json("POST", data)),
  updateOcr: (id, data) => api(`/api/ocr/${id}`, json("PUT", data)),
  analyze: (id, data = {}) => api(`/api/analyze/${id}`, json("POST", data)),
};
export const doctorApi = {
  recommendations: (id) => api(`/api/doctor/recommendations/${id}`),
  createRecommendation: (data) => api("/api/doctor/recommendations", json("POST", data)),
  updateRecommendation: (id, data) => api(`/api/doctor/recommendations/${id}`, json("PUT", data)),
};
