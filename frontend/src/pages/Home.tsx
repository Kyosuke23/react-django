import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiFetch, clearTokens } from "../lib/api";

type Me = { id: number; username: string; email: string };

export default function Home() {
  const navigate = useNavigate();
  const [me, setMe] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  useEffect(() => {
    (async () => {
      try {
        setErr("");
        setLoading(true);

        const res = await apiFetch("/api/me/");
        if (!res.ok) {
          const text = await res.text().catch(() => "");
          throw new Error(`HTTP ${res.status} ${res.statusText} ${text}`);
        }
        const json = (await res.json()) as Me;
        setMe(json);
      } catch (e) {
        setErr(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Home</h1>
          <p className="text-slate-600 dark:text-slate-400">ログイン状態の確認</p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900/40">
        {loading && <p className="text-slate-600 dark:text-slate-400">Loading /api/me/ ...</p>}

        {err && (
          <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
            {err}
          </div>
        )}

        {me && (
          <pre className="overflow-auto rounded-md bg-slate-950 p-4 text-sm text-slate-100 dark:bg-black/60">
            {JSON.stringify(me, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}