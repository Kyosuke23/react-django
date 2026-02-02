export function getAccessToken() {
  return localStorage.getItem("accessToken");
}

export function getRefreshToken() {
  return localStorage.getItem("refreshToken");
}

export function setTokens(access: string, refresh?: string) {
  localStorage.setItem("accessToken", access);
  if (refresh) localStorage.setItem("refreshToken", refresh);
}

export function clearTokens() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
}

async function refreshAccessToken(): Promise<string | null> {
  const refresh = getRefreshToken();
  if (!refresh) return null;

  const res = await fetch("/api/auth/refresh/", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh }),
  });

  if (!res.ok) return null;

  const json = await res.json();
  setTokens(json.access);
  return json.access;
}

export async function apiFetch(
  input: RequestInfo | URL,
  init: RequestInit = {}
): Promise<Response> {
  const token = getAccessToken();

  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  let res = await fetch(input, { ...init, headers });

  // access 期限切れ → refresh → 再試行
  if (res.status === 401) {
    const newAccess = await refreshAccessToken();
    if (!newAccess) {
      clearTokens();
      return res;
    }

    const retryHeaders = new Headers(init.headers ?? {});
    retryHeaders.set("Authorization", `Bearer ${newAccess}`);
    if (!retryHeaders.has("Content-Type") && init.body) {
      retryHeaders.set("Content-Type", "application/json");
    }

    res = await fetch(input, { ...init, headers: retryHeaders });
  }

  return res;
}