import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Home from "./pages/Home";
import ApiCheck from "./pages/ApiCheck";
import Login from "./pages/Login";
import TenantList from "./pages/TenantList";
import ProtectedRoute from "./components/ProtectedRoute";
import { clearTokens, getAccessToken } from "./lib/api";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded-md px-3 py-2 text-sm font-medium transition",
          "text-slate-700 hover:bg-slate-100",
          "dark:text-slate-200 dark:hover:bg-slate-800",
          isActive
            ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900"
            : "",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function App() {
  const navigate = useNavigate();
  const [loggedIn, setLoggedIn] = useState<boolean>(() => !!getAccessToken());

  // token の増減を追従（別タブ/ログアウト/リフレッシュ等）
  useEffect(() => {
    const onStorage = () => setLoggedIn(!!getAccessToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // 同一タブ内で localStorage を変えたときも反映したいので、
  // 画面遷移のたびに一応同期（軽い保険）
  useEffect(() => {
    setLoggedIn(!!getAccessToken());
  });

  const logout = () => {
    clearTokens();
    setLoggedIn(false);
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight">react-django</div>

          <nav className="flex items-center gap-2">
            {loggedIn && (
              <>
                <NavItem to="/" label="Home" />
                <NavItem to="/api_check" label="API Check" />
                <NavItem to="/tenant_list" label="テナントマスタ" />
                <button
                  onClick={logout}
                  className="rounded-md px-3 py-2 text-sm font-semibold
                            text-slate-700 hover:bg-slate-100
                            dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Home />} />
            <Route path="/api_check" element={<ApiCheck />} />
            <Route path="/tenant_list" element={<TenantList />} />
          </Route>
        </Routes>
      </main>
    </div>
  );
}