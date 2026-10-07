import axios from "axios";

const TOKEN_KEY = "medisafe_token";
export function getToken() {
  if (typeof window === "undefined") return null;
  return window.sessionStorage.getItem(TOKEN_KEY);
}
export function subscribeSession(callback) {
  window.addEventListener("medisafe-session", callback);
  return () => window.removeEventListener("medisafe-session", callback);
}
export function saveSession(token) {
  window.sessionStorage.setItem(TOKEN_KEY, token);
  // Retire the old user-ID-only login.
  window.localStorage.removeItem("medisafe_user_id");
  window.localStorage.removeItem("medisafe_user_name");
  window.dispatchEvent(new Event("medisafe-session"));
}
export function clearSession() {
  if (typeof window === "undefined") return;
  window.sessionStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem("medisafe_user_id");
  window.localStorage.removeItem("medisafe_user_name");
  window.dispatchEvent(new Event("medisafe-session"));
}
function expireSession() {
  clearSession();
  if (typeof window !== "undefined" && !["/login", "/signup"].includes(window.location.pathname)) {
    window.location.replace("/login?reason=expired");
  }
}

// Empty baseURL uses the existing Next.js same-origin proxy.
// A NEXT_PUBLIC_API_URL origin can be configured for a separate API deployment.
export const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "",
  timeout: 45000,
  headers: { Accept: "application/json" },
});
client.interceptors.request.use((config) => {
  const publicRequest = /^\/api\/auth\/(login|register)$/.test(config.url || "") || config.url === "/api-health";
  if (!publicRequest) {
    const token = getToken();
    if (!token) {
      expireSession();
      return Promise.reject(new Error("Please log in to continue."));
    }
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});
client.interceptors.response.use((response) => response, (error) => {
  if (axios.isCancel(error)) return Promise.reject(error);
  const status = error.response?.status;
  const sentToken = error.config?.headers?.Authorization;
  if (status === 401 && sentToken && sentToken === "Bearer " + getToken()) expireSession();
  const message = typeof error.response?.data?.message === "string"
    ? error.response.data.message
    : error.code === "ECONNABORTED" ? "The request timed out. Please try again."
    : !error.response ? "Cannot reach MediSafe. Check your connection and try again."
    : "The request could not be completed. Please try again.";
  const failure = new Error(message);
  failure.status = status;
  return Promise.reject(failure);
});

// Compatibility with the existing screens, all transported through Axios.
export async function api(path, options = {}) {
  const { body, ...config } = options;
  const data = body === undefined ? config.data : typeof body === "string" ? JSON.parse(body) : body;
  return (await client.request({ ...config, url: path, data })).data;
}
export const json = (method, data) => ({ method, data });
