import { NavLink, Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import ApiCheck from "./pages/ApiCheck";
import Login from "./pages/Login";

function NavItem({ to, label }: { to: string; label: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        [
          "rounded-md px-3 py-2 text-sm font-medium transition",
          "text-slate-700 hover:bg-slate-100",
          "dark:text-slate-200 dark:hover:bg-slate-800",
          isActive ? "bg-slate-900 text-white dark:bg-slate-200 dark:text-slate-900" : "",
        ].join(" ")
      }
    >
      {label}
    </NavLink>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900/40">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="font-semibold tracking-tight">react-django</div>
          <nav className="flex gap-2">
            <NavItem to="/" label="Home" />
            <NavItem to="/api-check" label="API Check" />
            <NavItem to="/login" label="Login" /> {/* 追加 */}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/api-check" element={<ApiCheck />} />
          <Route path="/login" element={<Login />} /> {/* 追加 */}
        </Routes>
      </main>
    </div>
  );
}