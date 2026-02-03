import { useEffect, useMemo, useState } from "react";
import type { Tenant } from "../../lib/tenants";
import { listTenants, deleteTenant, restoreTenant } from "../../lib/tenants";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";

export default function TenantList() {
  const [q, setQ] = useState("");
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const [rows, setRows] = useState<Tenant[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  async function reload() {
    const data = await listTenants({ q, include_deleted: includeDeleted });
    setRows(data);
    if (selectedId && !data.some((r) => r.id === selectedId)) setSelectedId(null);
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, includeDeleted]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId]
  );

  const totalCount = rows.length;
  const deletedCount = rows.filter((r) => r.is_deleted).length;

  return (
    <div className="h-full flex gap-3">
      {/* Main table area */}
      <div className="flex-1 rounded-xl border border-white/10 bg-[#0b1220] flex flex-col min-w-0">
        {/* Title area */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-base font-semibold text-white/90">テナントマスタ管理</h1>
              <p className="dark:text-slate-400">テナント情報の管理ページ</p>
              <div className="mt-1 text-xs text-white/55">
                {includeDeleted ? (
                  <>
                    表示中: {totalCount} 件（削除 {deletedCount} 件含む）
                  </>
                ) : (
                  <>表示中: {totalCount} 件</>
                )}
              </div>
            </div>

            <button
              className="rounded-lg bg-white/10 hover:bg-white/15 border border-white/10 px-3 py-2 text-sm text-white"
              onClick={() => alert("ここで追加モーダルを開く")}
            >
              + New
            </button>
          </div>
        </div>

        {/* Search area (under title) */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
          <div className="flex-1 min-w-0">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search (name / email / tel)"
              className="w-full rounded-lg bg-black/30 border border-white/10 px-3 py-2 text-sm text-white outline-none"
            />
          </div>

          <label className="text-xs text-white/70 flex items-center gap-2 select-none whitespace-nowrap">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(e) => setIncludeDeleted(e.target.checked)}
            />
            show deleted
          </label>
        </div>

        {/* Table scroll area */}
        <div
          className={[
            "flex-1 overflow-auto",
            // scrollbar を目立たなく（Tailwind arbitrary、プラグイン不要）
            "[scrollbar-width:thin]",
            "[scrollbar-color:rgba(255,255,255,0.20)_transparent]",
            "[&::-webkit-scrollbar]:w-2",
            "[&::-webkit-scrollbar]:h-2",
            "[&::-webkit-scrollbar-track]:bg-transparent",
            "[&::-webkit-scrollbar-thumb]:bg-white/10",
            "[&::-webkit-scrollbar-thumb]:rounded-full",
            "[&::-webkit-scrollbar-thumb:hover]:bg-white/20",
          ].join(" ")}
        >
          <table className="w-full text-sm text-white/85">
            <thead className="sticky top-0 bg-[#0b1220]">
              <tr className="text-xs text-white/55 border-b border-white/10">
                <th className="text-left p-3">Tenant</th>
                <th className="text-left p-3">Representative</th>
                <th className="text-left p-3">Email</th>
                <th className="text-left p-3">Tel</th>
                <th className="text-left p-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              {rows.map((r) => {
                const active = r.id === selectedId;
                return (
                  <tr
                    key={r.id}
                    onClick={() => setSelectedId(r.id)}
                    className={[
                      "border-b border-white/5 cursor-pointer",
                      active ? "bg-white/10" : "hover:bg-white/5",
                      r.is_deleted ? "opacity-60" : "",
                    ].join(" ")}
                  >
                    <td className="p-3">
                      <div className="font-medium">{r.tenant_name}</div>
                    </td>
                    <td className="p-3">{r.representative_name}</td>
                    <td className="p-3">{r.email}</td>
                    <td className="p-3">{r.tel_number ?? ""}</td>

                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          className="h-8 w-8 grid place-items-center rounded-lg bg-white/10 hover:bg-white/15 border border-white/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            alert("編集モーダル");
                          }}
                          title="Edit"
                        >
                          <PencilSquareIcon className="h-4 w-4 text-blue-300" />
                        </button>

                        <button
                          className="h-8 w-8 grid place-items-center rounded-lg bg-white/10 hover:bg-white/15 border border-white/10"
                          onClick={async (e) => {
                            e.stopPropagation();
                            if (r.is_deleted) {
                              await restoreTenant(r.id);
                            } else {
                              await deleteTenant(r.id);
                            }
                            await reload();
                          }}
                          title={r.is_deleted ? "Restore" : "Delete"}
                        >
                          <TrashIcon className="h-4 w-4 text-red-300" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-white/50">
                    No tenants
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail area */}
      <div className="w-[360px] shrink-0 rounded-xl border border-white/10 bg-[#0b1220] p-4">
        {selected ? (
          <div className="space-y-3">
            <div>
              <div className="text-xs text-white/50">Tenant</div>
              <div className="text-lg font-semibold text-white/90">{selected.tenant_name}</div>
              <div className="text-xs text-white/50 break-all">{selected.tenant_code}</div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                <div className="text-[11px] text-white/50">Representative</div>
                <div className="text-sm text-white/85">{selected.representative_name}</div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                <div className="text-[11px] text-white/50">Tel</div>
                <div className="text-sm text-white/85">{selected.tel_number ?? ""}</div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                <div className="text-[11px] text-white/50">Postal</div>
                <div className="text-sm text-white/85">{selected.postal_code ?? ""}</div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                <div className="text-[11px] text-white/50">State</div>
                <div className="text-sm text-white/85">{selected.state ?? ""}</div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                <div className="text-[11px] text-white/50">City</div>
                <div className="text-sm text-white/85">{selected.city ?? ""}</div>
              </div>

              <div className="rounded-lg border border-white/10 bg-black/20 p-2">
                <div className="text-[11px] text-white/50">Address</div>
                <div className="text-sm text-white/85">{selected.address ?? ""}</div>
              </div>

              <div className="col-span-2 rounded-lg border border-white/10 bg-black/20 p-2">
                <div className="text-[11px] text-white/50">Email</div>
                <div className="text-sm text-white/85 break-all">{selected.email}</div>
              </div>
            </div>

            <div className="pt-2 text-xs text-white/45">
              <div>created: {selected.created_at}</div>
              <div>updated: {selected.updated_at}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-white/60">Select a row</div>
        )}
      </div>
    </div>
  );
}