import { apiFetch } from "./api";
import { ApiError, isRecord } from "./errors";
type ImportCsvSuccess = { count: number };

/**
 * 実行オプション型
 * {path: APIエンドポイント; query: 検索・ソートオプション; filename: ファイル名;}
 */
type ExportCsvOptions = {
  path: string;
  query?: string;
  filename: string;
};

/** CSVダウンロード処理 */
export async function exportCSV(opts: ExportCsvOptions): Promise<{ blob: Blob; filename: string }> {
  const url = opts.query ? `${opts.path}?${opts.query}` : opts.path;
  const res = await apiFetch(url, { method: "GET" });

  if (res.ok) {
    const blob = await res.blob();
    return { blob, filename: opts.filename };
  }

  // 失敗時（JSON or text）
  const ct = res.headers.get("content-type") ?? "";
  let data: unknown;
  if (ct.includes("application/json")) data = await res.json();
  else data = await res.text();

  let msg = "Request failed";
  if (typeof data === "string") msg = data;
  else if (isRecord(data)) {
    const detail = data["detail"];
    if (typeof detail === "string") msg = detail;
  }

  throw new ApiError(msg, res.status, data);
}

export function getFilenameFromContentDisposition(header: string | null): string | null {
  if (!header) return null;

  // RFC5987: filename*=UTF-8''xxx を優先
  const m1 = /filename\*\s*=\s*(?:UTF-8'')?([^;]+)/i.exec(header);
  if (m1?.[1]) {
    const raw = m1[1].trim().replace(/^"+|"+$/g, "");
    try {
      return decodeURIComponent(raw);
    } catch {
      return raw;
    }
  }

  // 通常: filename="xxx"
  const m2 = /filename\s*=\s*([^;]+)/i.exec(header);
  if (m2?.[1]) return m2[1].trim().replace(/^"+|"+$/g, "");

  return null;
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

type ImportCsvOptions = {
  path: string;
  file: File;
  fieldName?: string;
  errorFilename?: string;
};

export type ImportCsvResult =
  | { ok: true; json: unknown }
  | { ok: false; blob: Blob; filename: string };

export async function importCSV(opts: ImportCsvOptions): Promise<ImportCsvResult> {
  const fieldName = opts.fieldName ?? "file";

  const fd = new FormData();
  fd.append(fieldName, opts.file);

  const res = await apiFetch(opts.path, {
    method: "POST",
    body: fd,
  });

  const ct = (res.headers.get("content-type") ?? "").toLowerCase();

  // ---- 成功(2xx)でも「エラーCSV」を返すケースを拾う ----
  if (res.ok && ct.includes("text/csv")) {
    const blob = await res.blob();
    const cd = res.headers.get("content-disposition");
    const filename =
      getFilenameFromContentDisposition(cd) ??
      opts.errorFilename ??
      "import_errors.csv";
    return { ok: false, blob, filename };
  }

  // ---- 通常成功：JSONがあれば読む（無ければ null）----
  if (res.ok) {
    if (ct.includes("application/json")) {
      return { ok: true, json: await res.json() };
    }
    return { ok: true, json: null };
  }

  // ---- 失敗：JSON or text（exportCSVと同じ）----
  let data: unknown;
  if (ct.includes("application/json")) data = await res.json();
  else data = await res.text();

  let msg = "Request failed";
  if (typeof data === "string") msg = data;
  else if (isRecord(data)) {
    const detail = data["detail"];
    if (typeof detail === "string") msg = detail;
  }

  throw new ApiError(msg, res.status, data);
}

export function isImportCsvSuccess(v: unknown): v is ImportCsvSuccess {
  return (
    typeof v === "object" &&
    v !== null &&
    "count" in v &&
    typeof (v as Record<string, unknown>).count === "number"
  );
}

type ImportCsvErrorFile = {
  blob: Blob;
  filename?: string;
};

export function isImportCsvErrorFile(v: unknown): v is ImportCsvErrorFile {
  if (typeof v !== "object" || v === null) return false;

  const r = v as Record<string, unknown>;
  if (!(r.blob instanceof Blob)) return false;

  const fn = r.filename;
  return fn === undefined || typeof fn === "string";
}