import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import ApiCheck from "./pages/ApiCheck";
import TenantList from "./pages/Tenant_Mst/TenantList";
import Login from "./pages/Login";
import ProtectedRoute from "./components/ProtectedRoute";

import { clearTokens, getAccessToken } from "./lib/api";

/**
 * サイドバー用リンク
 */
function SideNavLink({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "block rounded-md px-3 py-2 text-sm transition",
          "text-slate-300 hover:bg-slate-800 hover:text-white",
          isActive ? "bg-slate-800 text-white" : "",
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

  /**
   * token の変化検知（別タブログアウト対応）
   */
  useEffect(() => {
    const onStorage = () => setLoggedIn(!!getAccessToken());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const handleLogout = () => {
    clearTokens();
    setLoggedIn(false);
    navigate("/login");
  };

  return (
    /**
     * 画面全体を100vhで固定
     * ここでは絶対にスクロールさせない
     */
    <div className="h-screen w-full overflow-hidden bg-slate-950 text-slate-100">
      <div className="h-full flex flex-col">
        {/* ================= ヘッダ ================= */}
        <header className="shrink-0 border-b border-slate-800 bg-slate-900/40">
          <div className="flex h-14 items-center justify-between px-4">
            <div className="text-sm font-semibold text-slate-200">
              react-django
            </div>

            {loggedIn && (
              <button
                onClick={handleLogout}
                className="rounded-md bg-slate-800 px-3 py-1.5 text-sm text-slate-200 hover:bg-slate-700"
              >
                Logout
              </button>
            )}
          </div>
        </header>

        {/* ================= 本体（サイドバー + メイン） ================= */}
        {/* min-h-0 が超重要。これが無いとスクロールが壊れる */}
        <div className="flex flex-1 min-h-0">
          {/* ---------- サイドバー ---------- */}
          <aside className="w-56 shrink-0 border-r border-slate-800 bg-slate-900/30">
            <div className="flex h-full flex-col px-3 py-4">
              <div className="mb-3 text-xs font-semibold tracking-wide text-slate-400">
                MENU
              </div>

              <nav className="flex flex-col gap-1">
                <SideNavLink to="/" label="Home" />
                <SideNavLink to="/api_check" label="API Check" />
                <SideNavLink to="/tenant_list" label="テナントマスタ" />
              </nav>

              <div className="mt-auto pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                >
                  Logout
                </button>
              </div>
            </div>
          </aside>

          {/* ---------- メインコンテンツ ---------- */}
          {/* ここだけを縦スクロールさせる */}
          <main className="flex-1 min-h-0 overflow-y-auto">
            {/* max-w を外して横いっぱい使う */}
            <div className="h-full px-4 py-4">
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/api_check"
                  element={
                    <ProtectedRoute>
                      <ApiCheck />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/tenant_list"
                  element={
                    <ProtectedRoute>
                      <TenantList />
                    </ProtectedRoute>
                  }
                />
              </Routes>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}