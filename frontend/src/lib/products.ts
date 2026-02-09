import { apiFetch } from "./api";
import { parseOrThrow } from "./errors";

export type Product = {
  id: number;
  product_code: string;
  product_name: string;
  product_name_kana: string | null;
  product_category: number | null;
  product_category_name: string | null;
  unit_price: string; // DRF Decimalは文字列で来ることが多い
  tax_rate: string;
  remarks: string | null;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductPayload = {
  product_code: string;
  product_name: string;
  product_name_kana?: string | null;
  product_category?: number | null;
  unit_price?: number | null;
  tax_rate?: number | null;
  remarks?: string | null;
};

type ListParams = {
  q?: string;
  product_category?: number | "";
  include_deleted?: boolean;
  ordering?: string;
  page?: number;
  page_size?: number;
};

function buildQuery(params?: ListParams) {
  const sp = new URLSearchParams();
  if (params?.q) sp.set("q", params.q);
  if (params?.product_category) sp.set("product_category", String(params.product_category));
  if (params?.include_deleted) sp.set("include_deleted", "1");
  if (params?.ordering) sp.set("ordering", params.ordering);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.page_size) sp.set("page_size", String(params.page_size));
  return sp.toString();
}

export async function listProductsPaged(params: ListParams) {
  const qs = buildQuery(params);
  const res = await apiFetch(`/api/products/${qs ? `?${qs}` : ""}`);
  const data = (await parseOrThrow(res)) as { count: number; results: Product[] };
  return { count: data.count, items: data.results };
}

export async function createProduct(payload: ProductPayload) {
  const res = await apiFetch(`/api/products/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await parseOrThrow(res)) as Product;
}

export async function updateProduct(id: number, payload: Partial<ProductPayload>) {
  const res = await apiFetch(`/api/products/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await parseOrThrow(res)) as Product;
}

export async function deleteProduct(id: number) {
  const res = await apiFetch(`/api/products/${id}/`, { method: "DELETE" });
  await parseOrThrow(res);
}

export async function restoreProduct(id: number) {
  const res = await apiFetch(`/api/products/${id}/restore/`, { method: "POST" });
  return (await parseOrThrow(res)) as Product;
}