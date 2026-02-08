import { apiFetch } from "./api";
import { parseOrThrow, isPaginated } from "./errors";

// データ定義
export type Partner = {
  id: number;
  partner_name: string;
  partner_name_kana: string | null;
  partner_type: "customer" | "supplier" | "both";
  contact_name: string | null;
  tel_number: string | null;
  email: string;
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

  // 返していれば使える（返してなくても問題なし）
  tenant_code?: string;
  tenant_name?: string;
};

// 更新処理で許可する項目
export type PartnerUpdatePayload = Partial<
  Pick<
    Partner,
    | "partner_name"
    | "partner_name_kana"
    | "partner_type"
    | "contact_name"
    | "tel_number"
    | "email"
    | "postal_code"
    | "state"
    | "city"
    | "address"
    | "address2"
  >
>;

type ListParams = {
  q?: string;
  partner_type?: Partner["partner_type"];
  include_deleted?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
};

export function buildQuery(params?: ListParams) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.partner_type) sp.set("partner_type", params.partner_type);
  if (params?.include_deleted) sp.set("include_deleted", "1");
  if (params?.ordering) sp.set("ordering", params.ordering);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return sp.toString();
}

export async function listPartners(params?: ListParams): Promise<Partner[]> {
  const qs = buildQuery(params);
  const url = qs ? `/api/partners/?${qs}` : "/api/partners/";
  const res = await apiFetch(url, { method: "GET" });
  return (await parseOrThrow(res)) as Partner[];
}

export async function getPartner(id: number): Promise<Partner> {
  const res = await apiFetch(`/api/partners/${id}/`, { method: "GET" });
  return (await parseOrThrow(res)) as Partner;
}

export async function createPartner(payload: PartnerUpdatePayload): Promise<Partner> {
  const res = await apiFetch(`/api/partners/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (await parseOrThrow(res)) as Partner;
}

export async function updatePartner(id: number, payload: PartnerUpdatePayload): Promise<Partner> {
  const res = await apiFetch(`/api/partners/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return (await parseOrThrow(res)) as Partner;
}

export async function deletePartner(id: number): Promise<void> {
  const res = await apiFetch(`/api/partners/${id}/`, { method: "DELETE" });
  await parseOrThrow(res);
}

export async function restorePartner(id: number): Promise<Partner> {
  const res = await apiFetch(`/api/partners/${id}/restore/`, { method: "POST" });
  return (await parseOrThrow(res)) as Partner;
}

export type Paginated<T> = {
  items: T[];
  count: number;
};

export async function listPartnersPaged(params?: ListParams): Promise<Paginated<Partner>> {
  const qs = buildQuery(params);
  const url = qs ? `/api/partners/?${qs}` : "/api/partners/";
  const res = await apiFetch(url, { method: "GET" });
  const data = await parseOrThrow(res);

  // DRF pagination対応
  if (isPaginated<Partner>(data)) {
    return {
      items: data.results,
      count: data.count ?? data.results.length,
    };
  }

  // フォールバック（未ページング時）
  return {
    items: Array.isArray(data) ? data : [],
    count: Array.isArray(data) ? data.length : 0,
  };
}