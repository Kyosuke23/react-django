import { apiFetch } from "./api";
import { parseOrThrow } from "./errors";

export type ProductCategory = {
  id: number;
  product_category_name: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

export type ProductCategoryPayload = {
  product_category_name: string;
};

export type CategoryChoice = {
  id: number;
  product_category_name: string;
};

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

export async function listProductCategoriesPaged(params: ListParams) {
  const qs = buildQuery(params);
  const res = await apiFetch(`/api/product-categories/${qs ? `?${qs}` : ""}`);
  const data = (await parseOrThrow(res)) as { count: number; results: ProductCategory[] };
  return { count: data.count, items: data.results };
}

export async function createProductCategory(payload: ProductCategoryPayload) {
  const res = await apiFetch(`/api/product-categories/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await parseOrThrow(res)) as ProductCategory;
}

export async function updateProductCategory(id: number, payload: Partial<ProductCategoryPayload>) {
  const res = await apiFetch(`/api/product-categories/${id}/`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  return (await parseOrThrow(res)) as ProductCategory;
}

export async function deleteProductCategory(id: number) {
  const res = await apiFetch(`/api/product-categories/${id}/`, { method: "DELETE" });
  await parseOrThrow(res);
}

export async function restoreProductCategory(id: number) {
  const res = await apiFetch(`/api/product-categories/${id}/restore/`, { method: "POST" });
  return (await parseOrThrow(res)) as ProductCategory;
}

export async function listProductCategoryChoices() {
  const res = await apiFetch(`/api/product-categories/choices/`);
  return (await parseOrThrow(res)) as CategoryChoice[];
}