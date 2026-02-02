import { useCallback, useEffect, useState } from "react";

type HealthResponse = { status: string };

export default function ApiCheck() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const run = useCallback(async () => {
    try {
      setLoading(true);
      setErr("");
      setData(null);

      const res = await fetch("/api/health/");
      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
      }
      const json = (await res.json()) as HealthResponse;
      setData(json);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    run();
  }, [run]);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">API Check</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Django API（<code className="rounded bg-slate-100 px-1 py-0.5 text-sm dark:bg-slate-800">/api/health/</code>）への疎通確認ページ。
        </p>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={run}
            disabled={loading}
            className="
              inline-flex items-center rounded-md px-4 py-2 text-sm font-semibold
              bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-50
              dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600
            "
          >
            {loading ? "Checking..." : "Re-check"}
          </button>

          <span className="text-sm text-slate-500 dark:text-slate-400">endpoint:</span>
          <code className="rounded bg-slate-100 px-2 py-1 text-sm text-slate-800 dark:bg-slate-800 dark:text-slate-100">
            /api/health/
          </code>
        </div>

        {err && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </div>
        )}

        {data && (
          <pre className="overflow-auto rounded-md bg-slate-950 p-4 text-sm text-slate-100 dark:bg-black/60">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}

        {!loading && !err && !data && (
          <div className="text-sm text-slate-500 dark:text-slate-400">No data</div>
        )}
      </div>
    </div>
  );
}