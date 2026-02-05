export type FieldErrors = Record<string, string[]>;

function isRecord(v: unknown): v is Record<string, unknown> {
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