import { apiFetch } from "./api";
import { parseOrThrow } from "./errors";

export type ProductCategory = {
  id: number;
  product_category_name: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
};

type DRFPagedResponse<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export type CategoryChoice = Pick<ProductCategory, "id" | "product_category_name">;

export type ProductCategoryPayload = {
  product_category_name: string;
};

export type Paged<T> = { count: number; items: T[] };

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

// choices（select用）
export async function listProductCategoryChoices(params?: ListParams): Promise<CategoryChoice[]> {
  const qs = buildQuery(params);
  const res = await apiFetch(`/api/products/categories/choices/${qs ? `?${qs}` : ""}`);
  return (await parseOrThrow(res)) as CategoryChoice[];
}

// 一覧（ページング）
export async function listProductCategoriesPaged(params: ListParams): Promise<Paged<ProductCategory>> {
  const qs = buildQuery(params);
  const res = await apiFetch(`/api/products/categories/${qs ? `?${qs}` : ""}`);
  const json = await parseOrThrow(res) as DRFPagedResponse<ProductCategory>;

  return {
    count: Number(json.count ?? 0),
    items: Array.isArray(json.results) ? json.results : [],
  };
}

// 作成
export async function createProductCategory(payload: ProductCategoryPayload): Promise<ProductCategory> {
  const res = await apiFetch(`/api/products/categories/`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return (await parseOrThrow(res)) as ProductCategory;
}

// 更新
export async function updateProductCategory(id: number, payload: ProductCategoryPayload): Promise<ProductCategory> {
  const res = await apiFetch(`/api/products/categories/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return (await parseOrThrow(res)) as ProductCategory;
}

// 論理削除（204想定）
export async function deleteProductCategory(id: number): Promise<void> {
  const res = await apiFetch(`/api/products/categories/${id}/`, { method: "DELETE" });
  // 失敗時だけ ApiError を投げたいので parseOrThrow に通す
  if (!res.ok) await parseOrThrow(res);
}

// 復元
export async function restoreProductCategory(id: number): Promise<ProductCategory> {
  const res = await apiFetch(`/api/products/categories/${id}/restore/`, { method: "POST" });
  return (await parseOrThrow(res)) as ProductCategory;
}