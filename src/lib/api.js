const BASE = "/api";

function getToken() {
  return localStorage.getItem("sentinel_token");
}

function authHeaders() {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: authHeaders(),
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const api = {
  login: (email, password) =>
    request("POST", "/auth/login", { email, password }),

  register: (email, password, full_name, role = "analyst") =>
    request("POST", "/auth/register", { email, password, full_name, role }),

  me: () => request("GET", "/auth/me"),

  invite: (data) => request("POST", "/auth/invite", data),

  alerts: (params = {}) => {
    const qs = new URLSearchParams(
      Object.fromEntries(Object.entries(params).filter(([, v]) => v != null))
    ).toString();
    return request("GET", `/alerts${qs ? `?${qs}` : ""}`);
  },

  alert: (id) => request("GET", `/alerts/${id}`),

  updateAlert: (id, data) => request("PATCH", `/alerts/${id}`, data),

  addNote: (id, content) =>
    request("POST", `/alerts/${id}/notes`, { content }),

  assets: () => request("GET", "/assets"),

  agentStatus: () => request("GET", "/agent/status"),

  logs: () => request("GET", "/agent/logs"),

  clearLogs: () => request("DELETE", "/agent/logs"),

  overview: () => request("GET", "/agent/overview"),

  auditLogs: () => request("GET", "/audit"),
};

export function saveSession(token, user) {
  localStorage.setItem("sentinel_token", token);
  localStorage.setItem("sentinel_user", JSON.stringify(user));
}

export function getSession() {
  const token = localStorage.getItem("sentinel_token");
  const raw = localStorage.getItem("sentinel_user");
  if (!token || !raw) return null;
  return { token, user: JSON.parse(raw) };
}

export function clearSession() {
  localStorage.removeItem("sentinel_token");
  localStorage.removeItem("sentinel_user");
}

export function openAlertSocket(onMessage) {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  const ws = new WebSocket(`${protocol}//${window.location.host}/ws/alerts`);
  ws.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onMessage(data);
    } catch {}
  };
  ws.onerror = () => {};
  ws.onclose = () => {};
  return ws;
}
