import { apiFetch } from "./api";
import { ApiError, isRecord } from "./errors";

/**
 * 実行オプション型
 * {path: APIエンドポイント; query: 検索・ソートオプション; filename: ファイル名;}
 */
type ExportCsvOptions = {
  path: string;
  query?: string;
  filename: string;
};

/**
 * CSVダウンロード処理
 * @param opts 実行オプション
 * @returns {blob: CSVデータ; filename: ファイル名}
 */
export async function exportCSV(opts: ExportCsvOptions): Promise<{ blob: Blob; filename: string }> {
  const url = opts.query ? `${opts.path}?${opts.query}` : opts.path;
  const res = await apiFetch(url, { method: "GET" });

  // 成功時
  if (res.ok) {
    const blob = await res.blob();
    const filename = opts.filename;
    return { blob, filename };
  }

  // 失敗時（JSON or text）
  const ct = res.headers.get("content-type") ?? "";
  let data: unknown;
  if (ct.includes("application/json")) data = await res.json();
  else data = await res.text();

  // DRF detail を message に寄せる（errors.ts の parseOrThrow と同等）
  let msg = "Request failed";
  if (typeof data === "string") msg = data;
  else if (isRecord(data)) {
    const detail = data["detail"];
    if (typeof detail === "string") msg = detail;
  }

  throw new ApiError(msg, res.status, data);
}