import { apiFetch } from "./api";

export type Tenant = {
  id: number;
  tenant_code: string;
  tenant_name: string;
  representative_name: string;
  email: string;
  tel_number: string | null;
  postal_code: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  address2: string | null;
  is_deleted: boolean;
  created_at: string;
  create_user: string;
  updated_at: string;
  update_user: string;
};

type ListParams = {
  q?: string;
  include_deleted?: boolean;
  ordering?: string;
};

function buildQuery(params?: ListParams) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.include_deleted) sp.set("include_deleted", "1");
  if (params?.ordering) sp.set("ordering", params.ordering);
  return sp.toString();
}

async function parseOrThrow(res: Response) {
  // DRFのバリデーションエラー等も拾えるようにしておく
  let data: any = null;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) data = await res.json();
  else data = await res.text();

  if (!res.ok) {
    const msg =
      typeof data === "string"
        ? data
        : data?.detail || "Request failed";
    const err = new Error(msg);
    (err as any).status = res.status;
    (err as any).data = data;
    throw err;
  }
  return data;
}

export async function listTenants(params?: ListParams): Promise<Tenant[]> {
  const qs = buildQuery(params);
  const url = qs ? `/api/tenants/?${qs}` : "/api/tenants/";
  const res = await apiFetch(url, { method: "GET" });
  return (await parseOrThrow(res)) as Tenant[];
}

export async function createTenant(payload: Partial<Tenant>): Promise<Tenant> {
  const res = await apiFetch("/api/tenants/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (await parseOrThrow(res)) as Tenant;
}

export async function updateTenant(id: number, payload: Partial<Tenant>): Promise<Tenant> {
  const res = await apiFetch(`/api/tenants/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return (await parseOrThrow(res)) as Tenant;
}

export async function deleteTenant(id: number): Promise<void> {
  const res = await apiFetch(`/api/tenants/${id}/`, { method: "DELETE" });
  await parseOrThrow(res);
}

export async function restoreTenant(id: number): Promise<Tenant> {
  const res = await apiFetch(`/api/tenants/${id}/restore/`, { method: "POST" });
  return (await parseOrThrow(res)) as Tenant;
}