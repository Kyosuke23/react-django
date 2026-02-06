export class ApiError extends Error {
  status?: number;
  data?: unknown;

  constructor(message: string, status?: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

export type FieldErrors = Record<string, string[]>;

export function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function isStringArray(v: unknown): v is string[] {
  return Array.isArray(v) && v.every((x) => typeof x === "string");
}

/** 例: { email: ["必須です"], tel_number: ["形式が不正です"] } */
export function isFieldErrors(v: unknown): v is FieldErrors {
  if (!isRecord(v)) return false;
  const values = Object.values(v);
  if (values.length === 0) return false;
  return values.every(isStringArray);
}

export type NormalizedApiError = {
  message: string;
  fieldErrors: FieldErrors | null;
  raw: unknown;
};

export function normalizeApiError(e: unknown): NormalizedApiError {
  // 通常の Error
  if (e instanceof Error) {
    return { message: e.message || "エラーが発生しました", fieldErrors: null, raw: e };
  }

  // apiFetch 等で { message, data } が付くケース（or DRFレスポンスを包んでるケース）
  if (isRecord(e)) {
    const msgVal = e["message"];
    const dataVal = e["data"];

    const message = typeof msgVal === "string" ? msgVal : "エラーが発生しました";

    // data が FieldErrors
    if (isFieldErrors(dataVal)) {
      return { message: "入力項目に誤りがあります", fieldErrors: dataVal, raw: e };
    }

    // DRF: { detail: "..." }
    if (isRecord(dataVal)) {
      const detail = dataVal["detail"];
      if (typeof detail === "string") {
        return { message: detail, fieldErrors: null, raw: e };
      }

      // DRF: { non_field_errors: ["..."] }
      const nfe = dataVal["non_field_errors"];
      if (isStringArray(nfe)) {
        return { message: nfe.join("\n"), fieldErrors: null, raw: e };
      }
    }

    // 何も取れなければ message だけ
    return { message, fieldErrors: null, raw: e };
  }

  // その他（string とか）
  return { message: "エラーが発生しました", fieldErrors: null, raw: e };
}

export async function parseOrThrow(res: Response): Promise<unknown> {
  // DRFのバリデーションエラー等も拾えるようにしておく
  const ct = res.headers.get("content-type") ?? "";

  let data: unknown;
  if (ct.includes("application/json")) data = await res.json();
  else data = await res.text();

  if (!res.ok) {
    // message をできるだけ良い形で拾う
    let msg = "Request failed";
    if (typeof data === "string") {
      msg = data;
    } else if (isRecord(data)) {
      const detail = data["detail"];
      if (typeof detail === "string") msg = detail;
    }

    throw new ApiError(msg, res.status, data);
  }

  return data;
}

/**
 * DRF pagination 形式かどうかを判定する型ガード
 */
export function isPaginated<T>(v: unknown, isItem?: (x: unknown) => x is T): v is { results: T[]; count?: number } {
  if (!isRecord(v)) return false;

  const results = v["results"];
  if (!Array.isArray(results)) return false;

  // 中身チェックが渡されていれば使う
  if (isItem) return results.every(isItem);

  // 中身は信用する
  return true;
}