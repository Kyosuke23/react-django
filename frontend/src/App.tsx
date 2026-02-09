import { NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import Home from "./pages/Home";
import ApiCheck from "./pages/ApiCheck";
import TenantMst from "./pages/TenantMst/TenantMst";
import PartnerMst from "./pages/PartnerMst/PartnerMst";
import ProductMst from "./pages/ProductMst/ProductMst";
import Login from "./pages/Login";
import ProtectedRoute from "./pages/common/components/ProtectedRoute";

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
  const [isNavOpen, setIsNavOpen] = useState(false);

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
            {loggedIn && (
              <button
                className="mr-2 inline-flex items-center justify-center rounded-md p-2 text-slate-200 hover:bg-slate-800 md:hidden"
                onClick={() => setIsNavOpen(true)}
                aria-label="Open menu"
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <div className="text-sm font-semibold text-slate-200">
              react-django
            </div>
          </div>
        </header>

        {/* ================= 本体（サイドバー + メイン） ================= */}
        <div className="flex flex-1 min-h-0">
          {/* ---------- サイドバー ---------- */}
          <aside className="hidden md:block w-56 shrink-0 border-r border-slate-800 bg-slate-900/30">
            <div className="flex h-full flex-col px-3 py-4">
              <div className="mb-3 text-xs font-semibold tracking-wide text-slate-400">
                MENU
              </div>

              <nav className="flex flex-col gap-1">
                <SideNavLink to="/" label="Home" />
                <SideNavLink to="/api_check" label="API Check" />
                <SideNavLink to="/tenant_mst" label="テナントマスタ" />
                <SideNavLink to="/partner_mst" label="取引先マスタ" />
                <SideNavLink to="/product_mst" label="商品マスタ" />
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

          {/* ---------- Mobile drawer ---------- */}
          {loggedIn && (
            <>
              <div
                className={[
                  "fixed inset-0 z-40 bg-black/40 transition-opacity md:hidden",
                  isNavOpen ? "opacity-100" : "opacity-0 pointer-events-none",
                ].join(" ")}
                onClick={() => setIsNavOpen(false)}
              />

              <aside
                className={[
                  "fixed left-0 top-0 z-50 h-dvh w-72 border-r border-slate-800 bg-slate-950/95 backdrop-blur md:hidden",
                  "transition-transform duration-200 ease-out",
                  isNavOpen ? "translate-x-0" : "-translate-x-full",
                ].join(" ")}
                aria-hidden={!isNavOpen}
              >
                <div className="flex h-14 items-center justify-between px-4 border-b border-slate-800">
                  <div className="text-sm font-semibold text-slate-200">MENU</div>
                  <button
                    className="rounded-md p-2 text-slate-200 hover:bg-slate-800"
                    onClick={() => setIsNavOpen(false)}
                    aria-label="Close menu"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="flex h-[calc(100dvh-56px)] flex-col px-3 py-4">
                  <nav className="flex flex-col gap-1">
                    <SideNavLink to="/" label="Home" />
                    <SideNavLink to="/api_check" label="API Check" />
                    <SideNavLink to="/tenant_mst" label="テナントマスタ" />
                    <SideNavLink to="/partner_mst" label="取引先マスタ" />
                    <SideNavLink to="/product_mst" label="商品マスタ" />
                  </nav>

                  <div className="mt-auto pt-4">
                    <button
                      onClick={() => {
                        setIsNavOpen(false);
                        handleLogout();
                      }}
                      className="w-full rounded-md bg-slate-800 px-3 py-2 text-sm text-slate-200 hover:bg-slate-700"
                    >
                      Logout
                    </button>
                  </div>
                </div>
              </aside>
            </>
          )}
          {/* ---------- メインコンテンツ ---------- */}
          {/* ここだけを縦スクロールさせる */}
          <main className="flex-1 min-h-0 py-2 overflow-y-auto">
            <div className="h-full px-3 py-2 sm:px-4 sm:py-4">
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
                  path="/tenant_mst"
                  element={
                    <ProtectedRoute>
                      <TenantMst />
                    </ProtectedRoute>
                  }
                />

                <Route
                  path="/partner_mst"
                  element={
                    <ProtectedRoute>
                      <PartnerMst />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/product_mst"
                  element={
                    <ProtectedRoute>
                      <ProductMst />
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