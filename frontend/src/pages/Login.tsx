import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type LoginResponse = {
  access: string;
  refresh: string;
};

export default function Login() {
  const navigate = useNavigate();

  // すでにログイン済みなら / へ
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) navigate("/", { replace: true });
  }, [navigate]);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [okMessage, setOkMessage] = useState("");

  const canSubmit = useMemo(
    () => email.trim().length > 0 && password.length > 0 && !loading,
    [email, password, loading]
  );

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErr("");
    setOkMessage("");

    try {
      setLoading(true);

      const res = await fetch("/api/auth/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(`ログインに失敗しました (${res.status}) ${text}`);
      }

      const json = (await res.json()) as LoginResponse;

      localStorage.setItem("accessToken", json.access);
      localStorage.setItem("refreshToken", json.refresh);

      setOkMessage("ログイン成功");
      setTimeout(() => navigate("/", { replace: true }), 200);
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100svh-64px)] w-full px-4 flex items-center justify-center">
      <div className="w-full max-w-md space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Login</h1>
        </div>

        <form
          onSubmit={onSubmit}
          className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm
                     dark:border-slate-800 dark:bg-slate-900/40"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              placeholder="user@example.com"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-slate-400
                         dark:border-slate-700 dark:bg-slate-950/40 dark:focus:ring-slate-600"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              placeholder="********"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none
                         focus:ring-2 focus:ring-slate-400
                         dark:border-slate-700 dark:bg-slate-950/40 dark:focus:ring-slate-600"
            />
          </div>

          {err && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700
                            dark:border-red-900/40 dark:bg-red-950/40 dark:text-red-200">
              {err}
            </div>
          )}

          {okMessage && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800
                            dark:border-emerald-900/40 dark:bg-emerald-950/40 dark:text-emerald-200">
              {okMessage}
            </div>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white
                       hover:bg-slate-800 disabled:opacity-50
                       dark:bg-slate-700 dark:hover:bg-slate-600"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}