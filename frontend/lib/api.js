// Calls stay same-origin; Next.js proxies /api/* to the backend.
const API_URL = "";

export function currentUserId() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("medisafe_user_id");
}

export async function api(path, options = {}) {
  const userId = currentUserId();
  if (path === "/api/prescriptions" && (options.method || "GET") === "GET" && userId) {
    path = `${path}?userId=${encodeURIComponent(userId)}`;
  }
  const headers = { ...(options.body && !(options.body instanceof FormData) ? { "Content-Type": "application/json" } : {}), ...options.headers };
  if (userId) headers["x-user-id"] = userId;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const data = response.status === 204 ? null : await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
  return data;
}

export const json = (method, body) => ({ method, body: JSON.stringify(body) });
