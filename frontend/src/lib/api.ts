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

  const isFormData =
    typeof FormData !== "undefined" && init.body instanceof FormData;

  // body がある時に JSON と決め打ちしない（FormData を壊す）
  if (!isFormData) {
    const isFormData = init.body instanceof FormData;
    if (!headers.has("Content-Type") && init.body && !isFormData) {
      headers.set("Content-Type", "application/json");
    }
  } else {
    // FormData のときは boundary をブラウザに任せるので触らない
    headers.delete("Content-Type");
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

    const isFormDataRetry =
      typeof FormData !== "undefined" && init.body instanceof FormData;

    if (!isFormDataRetry) {
      if (!retryHeaders.has("Content-Type") && init.body) {
        retryHeaders.set("Content-Type", "application/json");
      }
    } else {
      retryHeaders.delete("Content-Type");
    }

    res = await fetch(input, { ...init, headers: retryHeaders });
  }

  return res;
}

/**
 * YYYYMMDDHHMMSS形式の日付を生成する
 * @param d 指定の日付（デフォルト: 現在時刻）
 * @returns フォーマットされた日付（YYYYMMDDHHMMSS形式）
 */
export function getYMDHMS(d = new Date()) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}