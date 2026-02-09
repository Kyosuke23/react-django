import { apiFetch } from "./api";
import { parseOrThrow } from "./errors";

// データ定義
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

// 更新処理で許可する項目
export type TenantUpdatePayload = Partial<
  Pick<
    Tenant,
    | "tenant_code"
    | "tenant_name"
    | "representative_name"
    | "email"
    | "tel_number"
    | "postal_code"
    | "state"
    | "city"
    | "address"
    | "address2"
  >
>;

type ListParams = {
  q?: string;
  include_deleted?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
};

function buildQuery(params?: ListParams) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.include_deleted) sp.set("include_deleted", "1");
  if (params?.ordering) sp.set("ordering", params.ordering);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return sp.toString();
}

export async function listTenants(params?: ListParams): Promise<Tenant[]> {
  const qs = buildQuery(params);
  const url = qs ? `/api/tenants/?${qs}` : "/api/tenants/";
  const res = await apiFetch(url, { method: "GET" });
  return (await parseOrThrow(res)) as Tenant[];
}

export async function updateTenant(id: number, payload: TenantUpdatePayload): Promise<Tenant> {
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

export type Paginated<T> = {
  items: T[];
  count: number;
};

export async function getTenant(id: number): Promise<Tenant> {
  const res = await apiFetch(`/api/tenants/${id}/`, { method: "GET" });
  return (await parseOrThrow(res)) as Tenant;
}

export async function listTenantsPaged(params?: ListParams): Promise<Paginated<Tenant>> {
  const qs = buildQuery(params);
  const res = await apiFetch(`/api/tenants/${qs ? `?${qs}` : ""}`);
  const data = (await parseOrThrow(res)) as { count: number; results: Tenant[] };
  return { count: data.count, items: data.results };
}