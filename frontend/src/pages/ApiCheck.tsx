import { useCallback, useEffect, useState } from "react";

type HealthResponse = {
  status: string;
};

export default function ApiCheck() {
  const [data, setData] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string>("");

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
    <div>
      <h1>API Check</h1>

      <div style={{ display: "flex", gap: 12, marginBottom: 12 }}>
        <button onClick={run} disabled={loading}>
          {loading ? "Checking..." : "Re-check"}
        </button>
        <code>/api/health/</code>
      </div>

      {err && <p style={{ color: "crimson" }}>Error: {err}</p>}

      {data && (
        <pre
          style={{
            padding: 12,
            borderRadius: 8,
            background: "#111",
            color: "#0f0",
            overflow: "auto",
          }}
        >
          {JSON.stringify(data, null, 2)}
        </pre>
      )}

      {!loading && !err && !data && <p>No data</p>}
    </div>
  );
}