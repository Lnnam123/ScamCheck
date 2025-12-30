// ===== Token storage =====
const TOKEN_KEY = "scamcheck_token";
const USER_KEY = "scamcheck_user";

export function setAuth(token, user) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY) || "";
}

export function getUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch {
    return null;
  }
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function requireAuth(redirectTo = "./login.html") {
  const token = getToken();
  if (!token) {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

export function requireAdmin(redirectTo = "./select.html") {
  const user = getUser();
  if (!user || user.role !== "admin") {
    window.location.href = redirectTo;
    return false;
  }
  return true;
}

async function parseJSON(res) {
  const data = await res.json().catch(() => ({}));
  return data;
}

export async function apiFetch(path, { method = "GET", body = null, auth = true } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";

  if (auth) {
    const token = getToken();
    if (token) headers["Authorization"] = "Bearer " + token;
  }

  const res = await fetch(path, {
    method,
    headers,
    body: body ? JSON.stringify(body) : null,
  });

  const data = await parseJSON(res);
  if (!res.ok) {
    const msg = data?.message || data?.error || `Lỗi ${res.status}`;
    throw new Error(msg);
  }
  return data;
}
